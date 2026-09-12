export interface DepthEstimationResult {
  width: number;
  height: number;
  /** Per-pixel depth, normalized 0..1. Convention: 1 = nearest to camera, 0 = farthest. */
  data: Float32Array;
}

/**
 * Swappable depth-estimation backend. The rest of the pipeline (mesh building,
 * viewer, export) only depends on this interface, so the in-browser
 * transformers.js implementation can later be replaced with a server-hosted
 * model without touching anything downstream.
 */
export interface DepthEstimator {
  readonly id: string;
  readonly label: string;
  estimate(imageUrl: string): Promise<DepthEstimationResult>;
}
