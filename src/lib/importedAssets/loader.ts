import DxfParser, { type IEntity, type IPoint } from "dxf-parser";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

export const IMPORT_ACCEPT = ".stl,.obj,.glb,.gltf,.ply,.3mf,.dxf,.mtl,.bin,.png,.jpg,.jpeg,.webp";
export const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

export type ImportedFormat = "stl" | "obj" | "glb" | "gltf" | "ply" | "3mf" | "dxf";

export interface ImportedFileSource {
  name: string;
  mimeType?: string;
  size?: number;
  file?: File;
  url?: string;
}

export interface ImportedModel {
  object: THREE.Group;
  vertexCount: number;
  faceCount: number;
}

const MODEL_FORMATS = new Set<ImportedFormat>(["stl", "obj", "glb", "gltf", "ply", "3mf", "dxf"]);
const SUPPORT_FILE_EXTENSIONS = new Set(["mtl", "bin", "png", "jpg", "jpeg", "webp"]);

export function getImportedFormat(fileName: string): ImportedFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && MODEL_FORMATS.has(extension as ImportedFormat)
    ? (extension as ImportedFormat)
    : null;
}

export function validateImportSelection(files: File[]): { primary: File; format: ImportedFormat } {
  if (files.length === 0) throw new Error("Choose a model file to import.");

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_IMPORT_BYTES) {
    throw new Error("The selected files exceed the 200 MB import limit.");
  }

  const primaryFiles = files.filter((file) => getImportedFormat(file.name) !== null);
  if (primaryFiles.length !== 1) {
    throw new Error("Select one model file at a time. Companion files can be selected with it.");
  }

  const names = new Set<string>();
  for (const file of files) {
    const name = file.name.split(/[\\/]/).pop()?.toLowerCase() ?? "";
    const extension = name.split(".").pop() ?? "";
    if (!getImportedFormat(file.name) && !SUPPORT_FILE_EXTENSIONS.has(extension)) {
      throw new Error(`Unsupported companion file: ${file.name}`);
    }
    if (names.has(name)) throw new Error(`More than one selected file is named "${file.name}".`);
    names.add(name);
  }

  return { primary: primaryFiles[0]!, format: getImportedFormat(primaryFiles[0]!.name)! };
}

function basename(value: string): string {
  const path = value.split(/[?#]/, 1)[0] ?? value;
  try {
    return decodeURIComponent(path).split(/[\\/]/).pop()?.toLowerCase() ?? "";
  } catch {
    return path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  }
}

function createLoadingManager(files: ImportedFileSource[]) {
  const manager = new THREE.LoadingManager();
  const urls = new Map<string, string>();
  const objectUrls: string[] = [];
  let resourcesStarted = false;
  let resourcesCompleted = false;
  let resolveResources: (() => void) | null = null;
  const resourcesLoaded = new Promise<void>((resolve) => {
    resolveResources = resolve;
  });

  manager.onStart = () => {
    resourcesStarted = true;
  };
  manager.onLoad = () => {
    resourcesCompleted = true;
    resolveResources?.();
  };

  for (const source of files) {
    const url = source.file ? URL.createObjectURL(source.file) : source.url;
    if (!url) continue;
    if (source.file) objectUrls.push(url);
    urls.set(source.name.split(/[\\/]/).pop()!.toLowerCase(), url);
    urls.set(basename(url), url);
  }

  manager.setURLModifier((requestedUrl) => {
    const match = urls.get(basename(requestedUrl));
    return match ?? requestedUrl;
  });

  return {
    manager,
    waitForResources: async () => {
      if (!resourcesStarted || resourcesCompleted) return;
      await new Promise<void>((resolve) => {
        let settled = false;
        const timer = setTimeout(finish, 15_000);
        function finish() {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve();
        }
        void resourcesLoaded.then(finish);
      });
    },
    dispose: () => objectUrls.forEach((url) => URL.revokeObjectURL(url)),
  };
}

async function readBuffer(source: ImportedFileSource): Promise<ArrayBuffer> {
  if (source.file) return source.file.arrayBuffer();
  if (!source.url) throw new Error(`Missing source data for ${source.name}.`);
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`Could not download ${source.name} (${response.status}).`);
  return response.arrayBuffer();
}

async function readText(source: ImportedFileSource): Promise<string> {
  if (source.file) return source.file.text();
  if (!source.url) throw new Error(`Missing source data for ${source.name}.`);
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`Could not download ${source.name} (${response.status}).`);
  return response.text();
}

function defaultMaterial(vertexColors = false) {
  return new THREE.MeshStandardMaterial({
    color: "#c9d1df",
    roughness: 0.72,
    metalness: 0.08,
    vertexColors,
    side: THREE.DoubleSide,
  });
}

function point3(point: IPoint): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y, point.z ?? 0);
}

function parseDxf(text: string): THREE.Group {
  let drawing: ReturnType<DxfParser["parseSync"]>;
  try {
    drawing = new DxfParser().parseSync(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid DXF data";
    throw new Error(`Could not parse this DXF file: ${detail}`);
  }
  if (!drawing) throw new Error("The DXF file did not contain a readable drawing.");

  const result = new THREE.Group();
  const materialByLayer = new Map<string, THREE.LineBasicMaterial>();
  const materialFor = (entity: IEntity) => {
    const layer = entity.layer || "0";
    let material = materialByLayer.get(layer);
    if (!material) {
      let hash = 0;
      for (const character of layer) hash = (hash * 31 + character.charCodeAt(0)) | 0;
      const hue = (Math.abs(hash) % 360) / 360;
      material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(hue, 0.36, 0.72) });
      materialByLayer.set(layer, material);
    }
    return material;
  };

  const addPath = (points: THREE.Vector3[], closed: boolean, material: THREE.LineBasicMaterial) => {
    if (points.length < 2) return;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    result.add(
      closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material),
    );
  };

  const addArc = (
    center: IPoint,
    radius: number,
    startAngle: number,
    endAngle: number,
    material: THREE.LineBasicMaterial,
  ) => {
    if (!Number.isFinite(radius) || radius <= 0) return;
    let end = endAngle;
    while (end <= startAngle) end += Math.PI * 2;
    const curve = new THREE.EllipseCurve(
      center.x,
      center.y,
      radius,
      radius,
      startAngle,
      end,
      false,
      0,
    );
    addPath(
      curve.getPoints(Math.max(16, Math.ceil(((end - startAngle) / (Math.PI * 2)) * 96))),
      false,
      material,
    );
  };

  for (const entity of drawing.entities) {
    const item = entity as IEntity & {
      vertices?: (IPoint & { position?: IPoint; bulge?: number })[];
      position?: IPoint;
      center?: IPoint;
      radius?: number;
      startAngle?: number;
      endAngle?: number;
      controlPoints?: IPoint[];
      fitPoints?: IPoint[];
      shape?: boolean;
    };
    const material = materialFor(entity);

    if (item.type === "LINE" && item.vertices?.length) {
      addPath(item.vertices.map(point3), false, material);
    } else if (item.type === "LWPOLYLINE" || item.type === "POLYLINE") {
      const vertices = item.vertices ?? [];
      const points = vertices.map((vertex) => point3(vertex.position ?? vertex));
      addPath(points, Boolean(item.shape), material);
    } else if (item.type === "CIRCLE" && item.center && item.radius) {
      const curve = new THREE.EllipseCurve(
        item.center.x,
        item.center.y,
        item.radius,
        item.radius,
        0,
        Math.PI * 2,
      );
      addPath(curve.getPoints(96), true, material);
    } else if (item.type === "ARC" && item.center && item.radius !== undefined) {
      addArc(
        item.center,
        item.radius,
        item.startAngle ?? 0,
        item.endAngle ?? Math.PI * 2,
        material,
      );
    } else if (item.type === "SPLINE") {
      const points = item.fitPoints?.length ? item.fitPoints : (item.controlPoints ?? []);
      addPath(points.map(point3), Boolean(item.shape), material);
    } else if (item.type === "POINT" && item.position) {
      const point = point3(item.position);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        point.clone().add(new THREE.Vector3(-0.006, 0, 0)),
        point.clone().add(new THREE.Vector3(0.006, 0, 0)),
        point.clone().add(new THREE.Vector3(0, -0.006, 0)),
        point.clone().add(new THREE.Vector3(0, 0.006, 0)),
      ]);
      result.add(new THREE.LineSegments(geometry, material));
    } else if (item.type === "3DFACE" && item.vertices?.length) {
      const vertices = item.vertices.map((vertex) => point3(vertex.position ?? vertex));
      if (vertices.length >= 3) {
        const triangleVertices =
          vertices.length >= 4 && vertices[2]!.distanceTo(vertices[3]!) < 1e-8
            ? vertices.slice(0, 3)
            : vertices.slice(0, 4);
        const positions = triangleVertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(triangleVertices.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]);
        geometry.computeVertexNormals();
        result.add(
          new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
              color: material.color,
              side: THREE.DoubleSide,
              roughness: 0.8,
            }),
          ),
        );
      }
    }
  }

  if (result.children.length === 0) {
    throw new Error(
      "This DXF contains no supported visible entities (lines, polylines, arcs, circles, splines, or faces).",
    );
  }
  return result;
}

function normalizeObject(object: THREE.Group) {
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) throw new Error("The selected file does not contain renderable geometry.");
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(largest) || largest <= 0) {
    throw new Error("The selected file has no measurable model bounds.");
  }
  const center = bounds.getCenter(new THREE.Vector3());
  object.position.sub(center);
  object.scale.setScalar(2.2 / largest);
  object.updateMatrixWorld(true);
}

function countGeometry(object: THREE.Object3D) {
  let vertexCount = 0;
  let faceCount = 0;
  object.traverse((child) => {
    const renderable = child as THREE.Mesh | THREE.Line;
    const geometry = renderable.geometry;
    if (!geometry) return;
    const position = geometry.getAttribute("position");
    if (!position) return;
    vertexCount += position.count;
    if ((child as THREE.Mesh).isMesh) {
      faceCount += geometry.index ? geometry.index.count / 3 : position.count / 3;
    }
  });
  return { vertexCount: Math.round(vertexCount), faceCount: Math.round(faceCount) };
}

export async function loadImportedModel(
  files: ImportedFileSource[],
  primaryFileName: string,
  format: ImportedFormat,
): Promise<ImportedModel> {
  const primary = files.find((file) => basename(file.name) === basename(primaryFileName));
  if (!primary) throw new Error(`The main file "${primaryFileName}" is missing.`);

  let object: THREE.Group;
  if (format === "dxf") {
    object = parseDxf(await readText(primary));
  } else {
    const { manager, dispose, waitForResources } = createLoadingManager(files);
    try {
      if (format === "stl") {
        const geometry = new STLLoader(manager).parse(await readBuffer(primary));
        if (!geometry.getAttribute("position")) {
          throw new Error("This STL file contains no triangles.");
        }
        geometry.computeVertexNormals();
        object = new THREE.Group();
        object.add(new THREE.Mesh(geometry, defaultMaterial(geometry.hasAttribute("color"))));
      } else if (format === "ply") {
        const geometry = new PLYLoader(manager).parse(await readBuffer(primary));
        if (!geometry.getAttribute("position")) {
          throw new Error("This PLY file contains no vertices.");
        }
        if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
        object = new THREE.Group();
        object.add(new THREE.Mesh(geometry, defaultMaterial(geometry.hasAttribute("color"))));
      } else if (format === "3mf") {
        object = new ThreeMFLoader(manager).parse(await readBuffer(primary));
      } else if (format === "obj") {
        const objText = await readText(primary);
        const materialName = objText.match(/^\s*mtllib\s+(.+)$/im)?.[1]?.trim();
        const materialFile = materialName
          ? files.find((file) => basename(file.name) === basename(materialName))
          : undefined;
        const loader = new OBJLoader(manager);
        if (materialFile) {
          const materials = new MTLLoader(manager).parse(await readText(materialFile), "");
          materials.preload();
          loader.setMaterials(materials);
        }
        object = loader.parse(objText);
      } else {
        const loader = new GLTFLoader(manager);
        const gltf = await loader.parseAsync(await readBuffer(primary), "");
        object = gltf.scene;
      }
      await waitForResources();
    } finally {
      dispose();
    }
  }

  normalizeObject(object);
  const counts = countGeometry(object);
  if (counts.vertexCount === 0)
    throw new Error("The selected file contains no renderable geometry.");
  return { object, ...counts };
}

export function disposeImportedObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const renderable = child as THREE.Mesh | THREE.Line;
    renderable.geometry?.dispose();
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material
        ? [renderable.material]
        : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}
