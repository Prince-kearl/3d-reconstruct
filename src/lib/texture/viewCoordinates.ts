import type { NormalizedCropTransform } from "@/lib/multiview/preprocess";

/**
 * Maps a point in one image's own UV space (0-1 fractions of its full
 * width/height) into the shared "normalized square" space every view was
 * aligned to via `prepareSubjectForGeneration` (see §17 of the multi-view
 * spec — all views must use a consistent coordinate convention). Returns
 * null if the point falls outside that image's cropped region.
 */
export function imageUVToNormalizedUV(
  t: NormalizedCropTransform,
  u: number,
  v: number,
): [number, number] | null {
  if (u < t.srcU0 || u > t.srcU1 || v < t.srcV0 || v > t.srcV1) return null;
  const fu = (u - t.srcU0) / (t.srcU1 - t.srcU0 || 1);
  const fv = (v - t.srcV0) / (t.srcV1 - t.srcV0 || 1);
  return [t.destU0 + fu * (t.destU1 - t.destU0), t.destV0 + fv * (t.destV1 - t.destV0)];
}

/** Inverse of `imageUVToNormalizedUV` — maps a normalized-square point into one specific image's own raw UV space. Null if outside that image's crop. */
export function normalizedUVToImageUV(
  t: NormalizedCropTransform,
  nu: number,
  nv: number,
): [number, number] | null {
  if (nu < t.destU0 || nu > t.destU1 || nv < t.destV0 || nv > t.destV1) return null;
  const fu = (nu - t.destU0) / (t.destU1 - t.destU0 || 1);
  const fv = (nv - t.destV0) / (t.destV1 - t.destV0 || 1);
  return [t.srcU0 + fu * (t.srcU1 - t.srcU0), t.srcV0 + fv * (t.srcV1 - t.srcV0)];
}

/**
 * Composes both hops: a point in the front image's UV space -> the shared
 * normalized square -> the equivalent point in a generated view's own raw
 * UV space. Null if either hop falls outside its respective crop.
 */
export function frontUVToViewUV(
  frontTransform: NormalizedCropTransform,
  viewTransform: NormalizedCropTransform,
  u: number,
  v: number,
): [number, number] | null {
  const normalized = imageUVToNormalizedUV(frontTransform, u, v);
  if (!normalized) return null;
  return normalizedUVToImageUV(viewTransform, normalized[0], normalized[1]);
}

/**
 * Surface angle (degrees, matching the sign convention of ViewAngle degrees
 * — negative = left, positive = right) of a lateral position `u` within one
 * row's actual silhouette span `[minU, maxU]`, not the full image width.
 * Treats the row's cross-section as spanning a full ±90° profile sweep from
 * its left edge to its right edge — the same simplifying visual-hull
 * assumption already used by estimateSilhouetteDepthProfile, applied here to
 * texture instead of geometry.
 */
export function surfaceAngleInRow(u: number, minU: number, maxU: number): number {
  const center = (minU + maxU) / 2;
  const halfWidth = Math.max(1e-6, (maxU - minU) / 2);
  const lateral = Math.max(-1, Math.min(1, (u - center) / halfWidth));
  return lateral * 90;
}
