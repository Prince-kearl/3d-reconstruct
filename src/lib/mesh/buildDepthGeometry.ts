import * as THREE from "three";

import type { DepthEstimationResult } from "@/lib/depth/types";
import type { SegmentationResult } from "@/lib/segmentation/types";

import {
  estimateSilhouetteDepthProfile,
  sampleProfileAtV,
  type SideViewSilhouette,
} from "./multiViewSilhouetteProfile";
import { computeSilhouetteDistanceField } from "./silhouetteDistanceField";

export type { SideViewSilhouette };

export interface DepthMeshParams {
  /** 0-100. Maps to world-space displacement strength. */
  detail: number;
  /** 0-100. Blur radius applied to the depth map before displacing, softens noise. */
  smoothing: number;
  /** 0-100. Radius of the taper toward the silhouette edge (or image border, without a mask). */
  edgeFeather: number;
  /**
   * 0-100. Builds a back surface tapering to the same silhouette rim as the
   * front, turning the relief into a closed volumetric shell instead of a
   * single displaced plane. 0 keeps the old single-sided plane. Requires a
   * mask — without one there's no silhouette rim to taper the back toward.
   */
  volume: number;
  /** Grid resolution (segments per side). Higher = more geometry detail, slower to build. */
  segments: number;
}

export interface DepthMeshResult {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  faceCount: number;
  widthWorld: number;
  heightWorld: number;
}

/** Below this foreground probability, a triangle is dropped as background. */
const BACKGROUND_TRIANGLE_THRESHOLD = 0.12;

/** Taper radius as a fraction of the mask's shorter side, at edgeFeather 0 and 100. */
const MIN_TAPER_RADIUS_FRAC = 0.02;
const MAX_TAPER_RADIUS_FRAC = 0.14;

/** Back-shell thickness, in world units, at volume 100. */
const MAX_VOLUME_WORLD = 0.45;

/** Separable box blur over a single-channel depth grid. */
function blurDepth(
  data: Float32Array,
  width: number,
  height: number,
  radiusPx: number,
): Float32Array {
  if (radiusPx <= 0) return data;
  const r = Math.max(1, Math.round(radiusPx));

  const horiz = new Float32Array(data.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dx = -r; dx <= r; dx++) {
        const sx = x + dx;
        if (sx < 0 || sx >= width) continue;
        sum += data[row + sx] ?? 0;
        count++;
      }
      horiz[row + x] = sum / count;
    }
  }

  const out = new Float32Array(data.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const sy = y + dy;
        if (sy < 0 || sy >= height) continue;
        sum += horiz[sy * width + x] ?? 0;
        count++;
      }
      out[y * width + x] = sum / count;
    }
  }
  return out;
}

function sampleGrid(
  grid: Float32Array,
  gridWidth: number,
  gridHeight: number,
  u: number,
  v: number,
): number {
  const sx = Math.min(gridWidth - 1, Math.round(u * (gridWidth - 1)));
  const sy = Math.min(gridHeight - 1, Math.round((1 - v) * (gridHeight - 1)));
  return grid[sy * gridWidth + sx] ?? 0;
}

/**
 * Drops triangles that fall in the removed-background region (see
 * src/lib/segmentation) so "no background" is true of the actual exported
 * geometry, not just how it's rendered. Unreferenced vertices are left in
 * the position buffer (harmless — unreferenced vertices are valid and
 * ignored by every mesh format/viewer) rather than fully repacked.
 */
function trimBackgroundTriangles(geometry: THREE.BufferGeometry, mask: SegmentationResult) {
  const index = geometry.index;
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;
  if (!index) return;

  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const alphaA = sampleGrid(mask.data, mask.width, mask.height, uv.getX(a), uv.getY(a));
    const alphaB = sampleGrid(mask.data, mask.width, mask.height, uv.getX(b), uv.getY(b));
    const alphaC = sampleGrid(mask.data, mask.width, mask.height, uv.getX(c), uv.getY(c));
    if (Math.max(alphaA, alphaB, alphaC) >= BACKGROUND_TRIANGLE_THRESHOLD) {
      kept.push(a, b, c);
    }
  }

  const TypedArray = geometry.attributes["position"]!.count > 65535 ? Uint32Array : Uint16Array;
  geometry.setIndex(new THREE.BufferAttribute(new TypedArray(kept), 1));
}

/** Builds a plane grid and displaces each vertex along Z via `zAt(u, v)`. */
function buildDisplacedPlane(
  segments: number,
  planeW: number,
  planeH: number,
  zAt: (u: number, v: number) => number,
  flipWinding: boolean,
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(planeW, planeH, segments, segments);
  const position = geometry.attributes["position"] as THREE.BufferAttribute;
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;

  for (let i = 0; i < position.count; i++) {
    position.setZ(i, zAt(uv.getX(i), uv.getY(i)));
  }
  position.needsUpdate = true;

  if (flipWinding) {
    const index = geometry.index!;
    const arr = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1]!;
      arr[i + 1] = arr[i + 2]!;
      arr[i + 2] = tmp;
    }
    index.needsUpdate = true;
  }

  return geometry;
}

/** Remaps a geometry's existing U range (assumed 0..1) into `[u0, u1]` — used to place a layer into its own half of a shared texture atlas. */
function remapUvURange(geometry: THREE.BufferGeometry, u0: number, u1: number): void {
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  }
  uv.needsUpdate = true;
}

/** Concatenates a front and back layer (already trimmed + normaled) into one geometry. */
function mergeShell(front: THREE.BufferGeometry, back: THREE.BufferGeometry): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();

  const fPos = front.attributes["position"] as THREE.BufferAttribute;
  const bPos = back.attributes["position"] as THREE.BufferAttribute;
  const fUv = front.attributes["uv"] as THREE.BufferAttribute;
  const bUv = back.attributes["uv"] as THREE.BufferAttribute;
  const fNorm = front.attributes["normal"] as THREE.BufferAttribute;
  const bNorm = back.attributes["normal"] as THREE.BufferAttribute;

  const posArr = new Float32Array(fPos.count * 3 + bPos.count * 3);
  posArr.set(fPos.array as Float32Array, 0);
  posArr.set(bPos.array as Float32Array, fPos.count * 3);

  const uvArr = new Float32Array(fUv.count * 2 + bUv.count * 2);
  uvArr.set(fUv.array as Float32Array, 0);
  uvArr.set(bUv.array as Float32Array, fUv.count * 2);

  const normArr = new Float32Array(fNorm.count * 3 + bNorm.count * 3);
  normArr.set(fNorm.array as Float32Array, 0);
  normArr.set(bNorm.array as Float32Array, fNorm.count * 3);

  merged.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
  merged.setAttribute("normal", new THREE.BufferAttribute(normArr, 3));

  const fIndex = front.index!;
  const bIndex = back.index!;
  const offset = fPos.count;
  const IndexArray = fPos.count + bPos.count > 65535 ? Uint32Array : Uint16Array;
  const indexArr = new IndexArray(fIndex.count + bIndex.count);
  for (let i = 0; i < fIndex.count; i++) indexArr[i] = fIndex.getX(i);
  for (let i = 0; i < bIndex.count; i++) indexArr[fIndex.count + i] = bIndex.getX(i) + offset;
  merged.setIndex(new THREE.BufferAttribute(indexArr, 1));

  return merged;
}

/**
 * Builds a depth-displaced relief mesh — a "2.5D" result, not a full
 * reconstruction. With a mask and `volume > 0`, it also builds a back
 * surface tapering to the same silhouette rim as the front, closing the
 * relief into a real volumetric shell (like a stamped medallion) so rotating
 * the model shows actual thickness instead of a flat card. Without a mask,
 * or with volume at 0, it stays a single displaced plane.
 *
 * When `sideViews` (real AI-generated ±30°/±45° silhouettes, see
 * src/lib/multiview) are supplied, the back shell's thickness is no longer
 * uniform — it's shaped per-row by `estimateSilhouetteDepthProfile`, a real
 * shape-from-silhouette estimate instead of a flat taper. Omitting
 * `sideViews` (the default) keeps this function byte-for-byte identical to
 * the depth-only pipeline.
 *
 * When `uvAtlas` is also supplied (see src/lib/texture/buildMultiViewTextureAtlas),
 * the front and back layers are remapped into their own half of that shared
 * atlas texture instead of both sampling the same full-image UV — this is
 * what lets the back layer show real view-aware blended appearance instead
 * of a stretched copy of the front photo. Omitting it keeps both layers on
 * the original shared UV (today's behavior, still the default).
 */
export function buildDepthGeometry(
  depth: DepthEstimationResult,
  imageAspect: number,
  params: DepthMeshParams,
  mask?: SegmentationResult | null,
  sideViews?: SideViewSilhouette[] | null,
  uvAtlas?: { frontURange: [number, number]; backURange: [number, number] } | null,
): DepthMeshResult {
  const planeW = imageAspect >= 1 ? 2 : 2 * imageAspect;
  const planeH = imageAspect >= 1 ? 2 / imageAspect : 2;

  const blurPx = (params.smoothing / 100) * 6;
  const depthData = blurDepth(depth.data, depth.width, depth.height, blurPx);
  const displacement = (params.detail / 100) * 0.6;
  const featherFrac = params.edgeFeather / 100;

  // Taper factor toward the silhouette rim (mask present) or the image
  // border (no mask): 0 right at the edge, ramping to 1 over the taper zone.
  let taperAt: (u: number, v: number) => number;
  if (mask) {
    const distField = computeSilhouetteDistanceField(mask);
    const radiusFrac =
      MIN_TAPER_RADIUS_FRAC + featherFrac * (MAX_TAPER_RADIUS_FRAC - MIN_TAPER_RADIUS_FRAC);
    const radiusPx = Math.max(2, Math.min(mask.width, mask.height) * radiusFrac);
    taperAt = (u, v) => {
      const d = sampleGrid(distField, mask.width, mask.height, u, v);
      return Math.sqrt(Math.min(1, d / radiusPx));
    };
  } else {
    const featherZone = featherFrac * 0.5;
    taperAt = (u, v) => {
      if (featherZone <= 0) return 1;
      const edgeDist = Math.min(u, 1 - u, v, 1 - v);
      return edgeDist < featherZone ? edgeDist / featherZone : 1;
    };
  }

  const frontGeometry = buildDisplacedPlane(
    params.segments,
    planeW,
    planeH,
    (u, v) => sampleGrid(depthData, depth.width, depth.height, u, v) * displacement * taperAt(u, v),
    false,
  );
  if (mask) trimBackgroundTriangles(frontGeometry, mask);
  frontGeometry.computeVertexNormals();

  let shellGeometry: THREE.BufferGeometry = frontGeometry;
  const buildVolume = mask && params.volume > 0;
  if (buildVolume) {
    const volumeStrength = (params.volume / 100) * MAX_VOLUME_WORLD;
    const validSideViews = (sideViews ?? []).filter((s) => s.mask);
    const depthProfile =
      validSideViews.length > 0
        ? estimateSilhouetteDepthProfile(mask, validSideViews, params.segments + 1)
        : null;

    const backGeometry = buildDisplacedPlane(
      params.segments,
      planeW,
      planeH,
      (u, v) =>
        -volumeStrength * taperAt(u, v) * (depthProfile ? sampleProfileAtV(depthProfile, v) : 1),
      true,
    );
    trimBackgroundTriangles(backGeometry, mask);
    backGeometry.computeVertexNormals();

    if (uvAtlas) {
      remapUvURange(frontGeometry, uvAtlas.frontURange[0], uvAtlas.frontURange[1]);
      remapUvURange(backGeometry, uvAtlas.backURange[0], uvAtlas.backURange[1]);
    }

    shellGeometry = mergeShell(frontGeometry, backGeometry);
    frontGeometry.dispose();
    backGeometry.dispose();
  }

  const finalIndex = shellGeometry.index;
  const referencedVertices = new Set<number>();
  if (finalIndex) {
    for (let i = 0; i < finalIndex.count; i++) {
      referencedVertices.add(finalIndex.getX(i));
    }
  }

  return {
    geometry: shellGeometry,
    vertexCount:
      mask && finalIndex ? referencedVertices.size : shellGeometry.attributes["position"]!.count,
    faceCount: finalIndex ? finalIndex.count / 3 : 0,
    widthWorld: planeW,
    heightWorld: planeH,
  };
}
