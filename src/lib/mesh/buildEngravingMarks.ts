import * as THREE from "three";

import { RELIEF_BACK_USES_TEXTURE_KEY } from "./reliefSurface";

export interface EngravingMarkOptions {
  /** Scale the longest source-model dimension to this many millimetres. */
  maxDimensionMm: number;
  /** Edge length of each tetrahedral micro-mark, in millimetres. */
  markSizeMm: number;
  /** Nominal sample spacing, in millimetres. Lower values create denser output. */
  spacingMm: number;
  /** Hard memory/file-size bound. The final sample count may be lower due to dark materials. */
  maxMarks?: number;
  /** Seed for reproducible point placement. */
  seed?: number;
}

export interface EngravingMarkResult {
  geometry: THREE.BufferGeometry;
  markCount: number;
  triangleCount: number;
  dimensionsMm: [number, number, number];
  sampledSurfaceAreaMm2: number;
}

interface MeshSource {
  mesh: THREE.Mesh;
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  index: THREE.BufferAttribute | null;
  uvAttributes: Map<number, THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined>;
  color: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
  firstFace: number;
  endFace: number;
}

interface TexturePixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  texture: THREE.Texture;
}

interface RgbSample {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const DEFAULT_MAX_MARKS = 250_000;
const TAU = Math.PI * 2;
const SRGB_TO_LUMA = [0.2126, 0.7152, 0.0722] as const;
const EMPTY_RGB: RgbSample = { red: 1, green: 1, blue: 1, alpha: 1 };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function linearToSrgb(value: number): number {
  const channel = clamp(value, 0, 1);
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function luminance(red: number, green: number, blue: number): number {
  return clamp(red * SRGB_TO_LUMA[0] + green * SRGB_TO_LUMA[1] + blue * SRGB_TO_LUMA[2], 0, 1);
}

function seededRandom(initialSeed: number): () => number {
  let state = initialSeed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function collectMeshes(object: THREE.Object3D): MeshSource[] {
  const sources: MeshSource[] = [];
  object.updateWorldMatrix(true, true);

  object.traverseVisible((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;

    const position = mesh.geometry.getAttribute("position");
    if (!position) return;

    const index = mesh.geometry.index;
    const elementCount = index?.count ?? position.count;
    const drawStart = Math.max(0, Math.floor(mesh.geometry.drawRange.start / 3));
    const requestedEnd = Number.isFinite(mesh.geometry.drawRange.count)
      ? Math.floor((mesh.geometry.drawRange.start + mesh.geometry.drawRange.count) / 3)
      : Math.floor(elementCount / 3);
    const firstFace = Math.min(drawStart, Math.floor(elementCount / 3));
    const endFace = Math.max(firstFace, Math.min(requestedEnd, Math.floor(elementCount / 3)));
    if (endFace <= firstFace) return;

    sources.push({
      mesh,
      position,
      index,
      uvAttributes: new Map(),
      color: mesh.geometry.getAttribute("color"),
      firstFace,
      endFace,
    });
  });

  return sources;
}

function vertexIndex(source: MeshSource, face: number, corner: number): number {
  const elementIndex = face * 3 + corner;
  return source.index ? source.index.getX(elementIndex) : elementIndex;
}

function getMaterialIndex(source: MeshSource, face: number): number {
  const groups = source.mesh.geometry.groups;
  const elementOffset = face * 3;
  for (const group of groups) {
    if (elementOffset >= group.start && elementOffset < group.start + group.count) {
      return group.materialIndex;
    }
  }
  return 0;
}

function getMaterial(source: MeshSource, face: number): THREE.Material | undefined {
  const material = source.mesh.material;
  if (Array.isArray(material)) return material[getMaterialIndex(source, face)];
  return material;
}

function isExcludedSyntheticBack(source: MeshSource, face: number): boolean {
  const geometryData = source.mesh.geometry.userData as Record<string, unknown>;
  if (
    !(RELIEF_BACK_USES_TEXTURE_KEY in geometryData) ||
    geometryData[RELIEF_BACK_USES_TEXTURE_KEY]
  ) {
    return false;
  }
  return getMaterialIndex(source, face) === 1;
}

function readWorldPosition(
  source: MeshSource,
  face: number,
  corner: number,
  target: THREE.Vector3,
): THREE.Vector3 {
  const index = vertexIndex(source, face, corner);
  return target
    .set(source.position.getX(index), source.position.getY(index), source.position.getZ(index))
    .applyMatrix4(source.mesh.matrixWorld);
}

function triangleArea(
  source: MeshSource,
  face: number,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  edge0: THREE.Vector3,
  edge1: THREE.Vector3,
): number {
  readWorldPosition(source, face, 0, p0);
  readWorldPosition(source, face, 1, p1);
  readWorldPosition(source, face, 2, p2);
  return edge0.subVectors(p1, p0).cross(edge1.subVectors(p2, p0)).length() * 0.5;
}

function collectTexturePixels(texture: THREE.Texture): TexturePixels | null {
  const image = texture.image as
    | (CanvasImageSource & {
        width?: number;
        height?: number;
        naturalWidth?: number;
        naturalHeight?: number;
      })
    | null
    | undefined;
  if (!image) return null;

  const imageWidth = image.width || image.naturalWidth || 0;
  const imageHeight = image.height || image.naturalHeight || 0;
  if (imageWidth <= 0 || imageHeight <= 0 || typeof document === "undefined") return null;
  const textureScale = Math.min(1, 2048 / Math.max(imageWidth, imageHeight));
  const width = Math.max(1, Math.round(imageWidth * textureScale));
  const height = Math.max(1, Math.round(imageHeight * textureScale));

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    return { width, height, data: context.getImageData(0, 0, width, height).data, texture };
  } catch {
    // Cross-origin or unsupported image sources fall back to material/vertex color.
    return null;
  }
}

function sampleTexture(pixels: TexturePixels, u: number, v: number): RgbSample {
  const uv = pixels.texture.transformUv(new THREE.Vector2(u, v));
  const x = clamp(Math.floor(uv.x * pixels.width), 0, pixels.width - 1);
  const y = clamp(Math.floor(uv.y * pixels.height), 0, pixels.height - 1);
  const offset = (y * pixels.width + x) * 4;
  return {
    red: (pixels.data[offset] ?? 255) / 255,
    green: (pixels.data[offset + 1] ?? 255) / 255,
    blue: (pixels.data[offset + 2] ?? 255) / 255,
    alpha: (pixels.data[offset + 3] ?? 255) / 255,
  };
}

function readUv(
  source: MeshSource,
  face: number,
  corner: number,
  channel: number,
): THREE.Vector2 | null {
  let uvAttribute = source.uvAttributes.get(channel);
  if (!source.uvAttributes.has(channel)) {
    const attributeName = channel === 0 ? "uv" : `uv${channel}`;
    uvAttribute = source.mesh.geometry.getAttribute(attributeName);
    source.uvAttributes.set(channel, uvAttribute);
  }
  if (!uvAttribute) return null;
  const index = vertexIndex(source, face, corner);
  return new THREE.Vector2(uvAttribute.getX(index), uvAttribute.getY(index));
}

function readVertexColor(source: MeshSource, face: number, corner: number): THREE.Color {
  if (!source.color) return new THREE.Color(1, 1, 1);
  const index = vertexIndex(source, face, corner);
  return new THREE.Color(
    source.color.getX(index),
    source.color.getY(index),
    source.color.getZ(index),
  );
}

function interpolateColor(
  source: MeshSource,
  face: number,
  barycentric: readonly [number, number, number],
): THREE.Color {
  const c0 = readVertexColor(source, face, 0);
  const c1 = readVertexColor(source, face, 1);
  const c2 = readVertexColor(source, face, 2);
  return new THREE.Color(
    c0.r * barycentric[0] + c1.r * barycentric[1] + c2.r * barycentric[2],
    c0.g * barycentric[0] + c1.g * barycentric[1] + c2.g * barycentric[2],
    c0.b * barycentric[0] + c1.b * barycentric[1] + c2.b * barycentric[2],
  );
}

function getToneWeight(
  source: MeshSource,
  face: number,
  material: THREE.Material | undefined,
  barycentric: readonly [number, number, number],
  textureCache: Map<THREE.Texture, TexturePixels | null>,
): number {
  if (material?.visible === false) return 0;

  const colorMaterial = material as
    | (THREE.Material & { color?: THREE.Color; map?: THREE.Texture | null; opacity?: number })
    | undefined;
  const materialColor = colorMaterial?.color ?? new THREE.Color(1, 1, 1);
  let weight = luminance(
    linearToSrgb(materialColor.r),
    linearToSrgb(materialColor.g),
    linearToSrgb(materialColor.b),
  );

  if (colorMaterial?.map) {
    let pixels = textureCache.get(colorMaterial.map);
    if (pixels === undefined) {
      pixels = collectTexturePixels(colorMaterial.map);
      textureCache.set(colorMaterial.map, pixels);
    }
    if (pixels) {
      const channel = colorMaterial.map.channel ?? 0;
      const uv0 = readUv(source, face, 0, channel);
      const uv1 = readUv(source, face, 1, channel);
      const uv2 = readUv(source, face, 2, channel);
      if (uv0 && uv1 && uv2) {
        const u = uv0.x * barycentric[0] + uv1.x * barycentric[1] + uv2.x * barycentric[2];
        const v = uv0.y * barycentric[0] + uv1.y * barycentric[1] + uv2.y * barycentric[2];
        const texel = sampleTexture(pixels, u, v);
        weight *= luminance(texel.red, texel.green, texel.blue) * texel.alpha;
      }
    }
  }

  if (source.color && (colorMaterial as { vertexColors?: boolean } | undefined)?.vertexColors) {
    const vertexColor = interpolateColor(source, face, barycentric);
    weight *= luminance(
      linearToSrgb(vertexColor.r),
      linearToSrgb(vertexColor.g),
      linearToSrgb(vertexColor.b),
    );
  }

  if (colorMaterial?.transparent && colorMaterial.opacity !== undefined) {
    weight *= colorMaterial.opacity;
  }
  return clamp(weight, 0, 1);
}

function pickFace(cumulativeArea: Float64Array, validFaceCount: number, threshold: number): number {
  let low = 0;
  let high = validFaceCount - 1;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if ((cumulativeArea[middle] ?? 0) < threshold) low = middle + 1;
    else high = middle;
  }
  return low;
}

function makeTetrahedronGeometry(
  centers: Float32Array,
  normals: Float32Array,
  tangents: Float32Array,
  markSizeMm: number,
): THREE.BufferGeometry {
  const markCount = centers.length / 3;
  const positions = new Float32Array(markCount * 12);
  const indices = new Uint32Array(markCount * 12);
  const baseRadius = markSizeMm / Math.sqrt(3);
  const apexHeight = markSizeMm * Math.sqrt(2 / 3) * 0.75;
  const baseHeight = -apexHeight / 3;
  const faces: [number, number, number][] = [];

  const localVertices = [
    new THREE.Vector3(0, 0, apexHeight),
    new THREE.Vector3(baseRadius, 0, baseHeight),
    new THREE.Vector3(
      baseRadius * Math.cos((2 * Math.PI) / 3),
      baseRadius * Math.sin((2 * Math.PI) / 3),
      baseHeight,
    ),
    new THREE.Vector3(
      baseRadius * Math.cos((4 * Math.PI) / 3),
      baseRadius * Math.sin((4 * Math.PI) / 3),
      baseHeight,
    ),
  ];
  const candidateFaces: [number, number, number][] = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];
  for (const face of candidateFaces) {
    const a = localVertices[face[0]]!;
    const b = localVertices[face[1]]!;
    const c = localVertices[face[2]]!;
    const faceNormal = b.clone().sub(a).cross(c.clone().sub(a));
    const faceCenter = a
      .clone()
      .add(b)
      .add(c)
      .multiplyScalar(1 / 3);
    if (faceNormal.dot(faceCenter) < 0) faces.push([face[0], face[2], face[1]]);
    else faces.push(face);
  }

  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const center = new THREE.Vector3();
  const local = new THREE.Vector3();
  const worldVertices = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];

  for (let i = 0; i < markCount; i++) {
    const offset3 = i * 3;
    const offset12 = i * 12;
    center.set(centers[offset3]!, centers[offset3 + 1]!, centers[offset3 + 2]!);
    normal.set(normals[offset3]!, normals[offset3 + 1]!, normals[offset3 + 2]!).normalize();
    tangent.set(tangents[offset3]!, tangents[offset3 + 1]!, tangents[offset3 + 2]!);
    tangent.addScaledVector(normal, -tangent.dot(normal)).normalize();
    if (tangent.lengthSq() < 1e-10) {
      tangent.set(Math.abs(normal.x) < 0.8 ? 1 : 0, Math.abs(normal.x) < 0.8 ? 0 : 1, 0);
      tangent.addScaledVector(normal, -tangent.dot(normal)).normalize();
    }
    bitangent.crossVectors(normal, tangent).normalize();

    for (let vertexIndex = 0; vertexIndex < localVertices.length; vertexIndex++) {
      local.copy(localVertices[vertexIndex]!);
      worldVertices[vertexIndex]!.copy(center)
        .addScaledVector(tangent, local.x)
        .addScaledVector(bitangent, local.y)
        .addScaledVector(normal, local.z);
    }

    for (let vertexIndex = 0; vertexIndex < worldVertices.length; vertexIndex++) {
      const vertex = worldVertices[vertexIndex]!;
      const positionOffset = offset12 + vertexIndex * 3;
      positions[positionOffset] = vertex.x;
      positions[positionOffset + 1] = vertex.y;
      positions[positionOffset + 2] = vertex.z;
    }

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
      const indexOffset = offset12 + faceIndex * 3;
      const vertexOffset = i * 4;
      indices[indexOffset] = vertexOffset + faces[faceIndex]![0];
      indices[indexOffset + 1] = vertexOffset + faces[faceIndex]![1];
      indices[indexOffset + 2] = vertexOffset + faces[faceIndex]![2];
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Converts visible mesh surfaces into a binary-STL-friendly cloud of tiny tetrahedral marks.
 * Geometry is scaled into millimetres, samples are density-weighted by material/texture luminance,
 * and sampling is seeded so the same model/settings produce stable output.
 */
export function buildEngravingMarkGeometry(
  object: THREE.Object3D,
  options: EngravingMarkOptions,
): EngravingMarkResult {
  if (
    !Number.isFinite(options.maxDimensionMm) ||
    options.maxDimensionMm < 1 ||
    options.maxDimensionMm > 1000
  ) {
    throw new Error("The longest model dimension must be between 1 and 1000 mm.");
  }
  if (
    !Number.isFinite(options.markSizeMm) ||
    options.markSizeMm < 0.001 ||
    options.markSizeMm > 1
  ) {
    throw new Error("The engraving mark edge size must be between 0.001 and 1 mm.");
  }
  if (!Number.isFinite(options.spacingMm) || options.spacingMm < 0.02 || options.spacingMm > 10) {
    throw new Error("The engraving mark spacing must be between 0.02 and 10 mm.");
  }

  const maxDimensionMm = clamp(options.maxDimensionMm, 1, 1000);
  const markSizeMm = clamp(options.markSizeMm, 0.001, 1);
  const spacingMm = clamp(options.spacingMm, 0.02, 10);
  const maxMarks = Math.floor(clamp(options.maxMarks ?? DEFAULT_MAX_MARKS, 1, 1_000_000));
  const sources = collectMeshes(object);
  if (sources.length === 0)
    throw new Error("This model has no visible triangle surfaces to engrave.");

  const bounds = new THREE.Box3().makeEmpty();
  let totalAreaWorld = 0;
  let possibleFaces = 0;
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const edge0 = new THREE.Vector3();
  const edge1 = new THREE.Vector3();

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
    const source = sources[sourceIndex]!;
    for (let face = source.firstFace; face < source.endFace; face++) {
      if (isExcludedSyntheticBack(source, face)) continue;
      const material = getMaterial(source, face);
      if (material?.visible === false) continue;
      readWorldPosition(source, face, 0, p0);
      readWorldPosition(source, face, 1, p1);
      readWorldPosition(source, face, 2, p2);
      bounds.expandByPoint(p0).expandByPoint(p1).expandByPoint(p2);
      const area = edge0.subVectors(p1, p0).cross(edge1.subVectors(p2, p0)).length() * 0.5;
      if (area <= 1e-14) continue;
      totalAreaWorld += area;
      possibleFaces++;
    }
  }

  if (possibleFaces === 0 || !Number.isFinite(totalAreaWorld) || bounds.isEmpty()) {
    throw new Error("This model has no measurable, visible triangle surfaces to engrave.");
  }

  const sourceSize = bounds.getSize(new THREE.Vector3());
  const sourceLongestDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);
  if (!Number.isFinite(sourceLongestDimension) || sourceLongestDimension <= 0) {
    throw new Error("The model has no measurable dimensions.");
  }
  const scale = maxDimensionMm / sourceLongestDimension;
  const center = bounds.getCenter(new THREE.Vector3());
  const dimensionsMm: [number, number, number] = [
    sourceSize.x * scale,
    sourceSize.y * scale,
    sourceSize.z * scale,
  ];
  const totalAreaMm2 = totalAreaWorld * scale * scale;
  const cellAreaMm2 = (Math.sqrt(3) / 2) * spacingMm * spacingMm;
  const candidateCount = Math.min(maxMarks, Math.max(1, Math.ceil(totalAreaMm2 / cellAreaMm2)));

  const cumulativeArea = new Float64Array(possibleFaces);
  const meshIndices = new Uint32Array(possibleFaces);
  const triangleIndices = new Uint32Array(possibleFaces);
  let validFaceCount = 0;
  let cumulative = 0;

  for (let meshIndex = 0; meshIndex < sources.length; meshIndex++) {
    const source = sources[meshIndex]!;
    for (let face = source.firstFace; face < source.endFace; face++) {
      if (isExcludedSyntheticBack(source, face)) continue;
      const material = getMaterial(source, face);
      if (material?.visible === false) continue;
      const area = triangleArea(source, face, p0, p1, p2, edge0, edge1);
      if (area <= 1e-14) continue;
      cumulative += area;
      cumulativeArea[validFaceCount] = cumulative;
      meshIndices[validFaceCount] = meshIndex;
      triangleIndices[validFaceCount] = face;
      validFaceCount++;
    }
  }

  const centers = new Float32Array(candidateCount * 3);
  const normals = new Float32Array(candidateCount * 3);
  const tangents = new Float32Array(candidateCount * 3);
  const random = seededRandom(options.seed ?? 0xadd05eed);
  const textureCache = new Map<THREE.Texture, TexturePixels | null>();
  const sampleP0 = new THREE.Vector3();
  const sampleP1 = new THREE.Vector3();
  const sampleP2 = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const edge = new THREE.Vector3();
  const point = new THREE.Vector3();
  let markCount = 0;

  for (let candidate = 0; candidate < candidateCount; candidate++) {
    const faceEntry = pickFace(cumulativeArea, validFaceCount, random() * cumulative);
    const source = sources[meshIndices[faceEntry]!]!;
    const face = triangleIndices[faceEntry]!;
    const root = Math.sqrt(random());
    const barycentric: [number, number, number] = [1 - root, root * (1 - random()), 0];
    barycentric[2] = 1 - barycentric[0] - barycentric[1];

    const material = getMaterial(source, face);
    if (random() > getToneWeight(source, face, material, barycentric, textureCache)) continue;

    readWorldPosition(source, face, 0, sampleP0);
    readWorldPosition(source, face, 1, sampleP1);
    readWorldPosition(source, face, 2, sampleP2);
    normal.subVectors(sampleP1, sampleP0).cross(edge.subVectors(sampleP2, sampleP0));
    if (normal.lengthSq() <= 1e-20) continue;
    normal.normalize();
    tangent.subVectors(sampleP1, sampleP0).normalize();
    point
      .copy(sampleP0)
      .multiplyScalar(barycentric[0])
      .addScaledVector(sampleP1, barycentric[1])
      .addScaledVector(sampleP2, barycentric[2])
      .sub(center)
      .multiplyScalar(scale);

    const offset = markCount * 3;
    centers[offset] = point.x;
    centers[offset + 1] = point.y;
    centers[offset + 2] = point.z;
    normals[offset] = normal.x;
    normals[offset + 1] = normal.y;
    normals[offset + 2] = normal.z;
    tangents[offset] = tangent.x;
    tangents[offset + 1] = tangent.y;
    tangents[offset + 2] = tangent.z;
    markCount++;
  }

  if (markCount === 0) {
    throw new Error(
      "No engraving marks were generated. The model may have only dark or transparent surfaces.",
    );
  }

  const usedCenters = centers.subarray(0, markCount * 3);
  const usedNormals = normals.subarray(0, markCount * 3);
  const usedTangents = tangents.subarray(0, markCount * 3);
  const geometry = makeTetrahedronGeometry(usedCenters, usedNormals, usedTangents, markSizeMm);
  geometry.userData.engravingMarkCount = markCount;
  geometry.userData.markSizeMm = markSizeMm;
  geometry.userData.spacingMm = spacingMm;
  geometry.userData.sourceSurfaceAreaMm2 = totalAreaMm2;

  return {
    geometry,
    markCount,
    triangleCount: markCount * 4,
    dimensionsMm,
    sampledSurfaceAreaMm2: totalAreaMm2,
  };
}
