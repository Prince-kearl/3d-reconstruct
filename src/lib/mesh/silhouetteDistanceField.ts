import type { SegmentationResult } from "@/lib/segmentation/types";

const FOREGROUND_THRESHOLD = 0.5;
const DIAGONAL = Math.SQRT2;
const INF = 1e9;

/**
 * Approximate Euclidean distance (in pixels) from each foreground pixel to
 * the nearest background pixel, via a two-pass chamfer transform. Used to
 * taper the mesh smoothly toward the silhouette edge instead of at the image
 * border, and to derive the volumetric shell's thickness (see
 * buildDepthGeometry.ts) — both driven by the real subject shape rather than
 * a fixed border margin.
 */
export function computeSilhouetteDistanceField(mask: SegmentationResult): Float32Array {
  const { width, height, data } = mask;
  const dist = new Float32Array(width * height);
  for (let i = 0; i < dist.length; i++) {
    dist[i] = (data[i] ?? 0) >= FOREGROUND_THRESHOLD ? INF : 0;
  }

  // Forward pass: top-left to bottom-right.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let best = dist[i]!;
      if (x > 0) best = Math.min(best, dist[i - 1]! + 1);
      if (y > 0) best = Math.min(best, dist[i - width]! + 1);
      if (x > 0 && y > 0) best = Math.min(best, dist[i - width - 1]! + DIAGONAL);
      if (x < width - 1 && y > 0) best = Math.min(best, dist[i - width + 1]! + DIAGONAL);
      dist[i] = best;
    }
  }

  // Backward pass: bottom-right to top-left.
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let best = dist[i]!;
      if (x < width - 1) best = Math.min(best, dist[i + 1]! + 1);
      if (y < height - 1) best = Math.min(best, dist[i + width]! + 1);
      if (x < width - 1 && y < height - 1) best = Math.min(best, dist[i + width + 1]! + DIAGONAL);
      if (x > 0 && y < height - 1) best = Math.min(best, dist[i + width - 1]! + DIAGONAL);
      dist[i] = best;
    }
  }

  return dist;
}
