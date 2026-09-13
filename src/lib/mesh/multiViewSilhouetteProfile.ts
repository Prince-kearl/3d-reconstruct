import type { SegmentationResult } from "@/lib/segmentation/types";

export interface SideViewSilhouette {
  /** Signed rotation from front, degrees (e.g. -30, 30, -45, 45). */
  angleDegrees: number;
  mask: SegmentationResult;
}

const MIN_USABLE_ANGLE_DEG = 1;
const MAX_USABLE_ANGLE_DEG = 89;
const MIN_RATIO = 0.3;
const MAX_RATIO = 2.5;

/**
 * Rows on each side to average over when smoothing the raw per-row profile.
 * A real segmentation mask is noisy row-to-row (a stray hair strand, a
 * collar wrinkle, jpeg/model artifacts can shift a row's measured min/maxX
 * by several pixels) in a way a clean synthetic test mask never is — without
 * smoothing, that noise turns directly into sharp per-row Z jumps in the
 * back shell, which tears whatever texture is mapped across the resulting
 * near-vertical "steps" into a sheared, duplicated-looking mess. Smoothing
 * is the fix: the profile only needs to vary gradually along the body, not
 * pixel-row by pixel-row.
 */
const PROFILE_SMOOTHING_RADIUS = 5;

/**
 * Foreground column extent (pixel indices, inclusive) of one mask row, or
 * null if the row has no foreground at all. Shared with the texture-blending
 * pipeline (src/lib/texture), which needs each row's actual silhouette span
 * — not just its width — to work out lateral position within the subject.
 */
export function rowForegroundBounds(
  mask: SegmentationResult,
  v: number,
): { minX: number; maxX: number } | null {
  const y = Math.min(mask.height - 1, Math.round((1 - v) * (mask.height - 1)));
  const row = y * mask.width;
  let minX = -1;
  let maxX = -1;
  for (let x = 0; x < mask.width; x++) {
    if (mask.data[row + x]! >= 0.5) {
      if (minX < 0) minX = x;
      maxX = x;
    }
  }
  return minX < 0 ? null : { minX, maxX };
}

function rowForegroundWidthFraction(mask: SegmentationResult, v: number): number {
  const bounds = rowForegroundBounds(mask, v);
  return bounds ? (bounds.maxX - bounds.minX + 1) / mask.width : 0;
}

/**
 * Estimates a per-row thickness multiplier from the front silhouette plus
 * any available generated side-view silhouettes (real shape-from-silhouette
 * / visual-hull technique, deliberately simple — not a learned 3D
 * reconstruction model): treats each horizontal cross-section as an ellipse.
 * The front view's width at that row fixes one axis; a rotated side view's
 * width at the same row lets us solve for the other (depth) axis via
 * `sideWidth ≈ frontWidth·cos(θ) + depth·sin(θ)`. Averaged across all usable
 * side views for robustness.
 *
 * Returns a uniform profile of 1s (i.e. no change from today's flat taper)
 * when no usable side views are given — this is the exact fallback that
 * keeps Depth-Only reconstruction byte-for-byte unchanged.
 */
export function estimateSilhouetteDepthProfile(
  frontMask: SegmentationResult,
  sideViews: SideViewSilhouette[],
  rows: number,
): Float32Array {
  const profile = new Float32Array(rows).fill(1);
  const usable = sideViews.filter(
    (s) =>
      Math.abs(s.angleDegrees) >= MIN_USABLE_ANGLE_DEG &&
      Math.abs(s.angleDegrees) <= MAX_USABLE_ANGLE_DEG,
  );
  if (usable.length === 0) return profile;

  const hasNoFront = new Array<boolean>(rows).fill(false);

  for (let r = 0; r < rows; r++) {
    const v = rows > 1 ? r / (rows - 1) : 0.5;
    const frontWidth = rowForegroundWidthFraction(frontMask, v);
    if (frontWidth <= 0) {
      profile[r] = 0;
      hasNoFront[r] = true;
      continue;
    }

    let sumRatio = 0;
    let count = 0;
    for (const side of usable) {
      const sideWidth = rowForegroundWidthFraction(side.mask, v);
      if (sideWidth <= 0) continue;
      const theta = (Math.abs(side.angleDegrees) * Math.PI) / 180;
      const sin = Math.sin(theta);
      if (sin < 0.05) continue;
      const estimatedDepth = (sideWidth - frontWidth * Math.cos(theta)) / sin;
      const ratio = estimatedDepth / frontWidth;
      if (Number.isFinite(ratio) && ratio > 0) {
        sumRatio += ratio;
        count++;
      }
    }
    profile[r] = count > 0 ? Math.max(MIN_RATIO, Math.min(MAX_RATIO, sumRatio / count)) : 1;
  }

  return smoothProfile(profile, hasNoFront);
}

/**
 * Moving-average smoothing over the valid (has-front-foreground) rows only —
 * rows with no front foreground stay hard-zero (that boundary is real, not
 * noise) rather than being blurred into their neighbors.
 */
function smoothProfile(profile: Float32Array, hasNoFront: boolean[]): Float32Array {
  const out = new Float32Array(profile.length);
  for (let i = 0; i < profile.length; i++) {
    if (hasNoFront[i]) {
      out[i] = 0;
      continue;
    }
    let sum = 0;
    let count = 0;
    for (let d = -PROFILE_SMOOTHING_RADIUS; d <= PROFILE_SMOOTHING_RADIUS; d++) {
      const j = i + d;
      if (j < 0 || j >= profile.length || hasNoFront[j]) continue;
      sum += profile[j]!;
      count++;
    }
    out[i] = count > 0 ? sum / count : profile[i]!;
  }
  return out;
}

/** `v` uses the same convention the profile was built with: index r <-> v = r/(rows-1). */
export function sampleProfileAtV(profile: Float32Array, v: number): number {
  const i = Math.max(0, Math.min(profile.length - 1, Math.round(v * (profile.length - 1))));
  return profile[i] ?? 1;
}
