export interface SegmentationResult {
  width: number;
  height: number;
  /** Per-pixel foreground alpha, 0 (background) .. 1 (subject). */
  data: Float32Array;
}

/**
 * Swappable background-removal backend. Mirrors the DepthEstimator pattern in
 * src/lib/depth — the rest of the pipeline only depends on this interface.
 */
export interface BackgroundRemover {
  readonly id: string;
  readonly label: string;
  removeBackground(imageUrl: string): Promise<SegmentationResult>;
}
