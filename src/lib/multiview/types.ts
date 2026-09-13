import type { SegmentationResult } from "@/lib/segmentation/types";

/**
 * The angles we ask a multi-view model to fill in. "front" is never
 * generated — it's the real source photo, always ground truth. Extended
 * coverage (±60°) is a future/advanced option, deliberately not part of the
 * standard set (see viewAngles.ts).
 */
export type ViewAngle = "left30" | "right30" | "left45" | "right45" | "left60" | "right60";

export type GeneratedViewStatus = "ok" | "failed";

/**
 * One generated (or attempted) view. Plain data only, mirrors the
 * DepthEstimationResult / SegmentationResult convention used elsewhere in
 * this codebase — no class instances, safe to persist/serialize.
 */
export interface GeneratedView {
  angle: ViewAngle;
  /** Signed URL or object URL for the generated image, once uploaded/available. Null if generation failed. */
  imageUrl: string | null;
  /** Derived foreground mask for this view, once background is removed from it. Null if not yet computed or generation failed. */
  mask: SegmentationResult | null;
  width: number;
  height: number;
  /** 0-1. Lower than the original photo's implicit 1.0 — generated views are always lower-confidence. */
  confidence: number;
  status: GeneratedViewStatus;
  /** Present when status is "failed". */
  failureReason?: string | undefined;
  provider: string;
  model: string;
  generatedAt: number;
}

export interface MultiViewInput {
  projectId: string;
  /** The real, unmodified source photo — always sent, never replaced. */
  sourceImageUrl: string;
  /** The current effective mask (automatic or manually edited), used to crop/normalize before sending. */
  mask: SegmentationResult;
  angles: ViewAngle[];
  /** Data URL of the preprocessed (cropped/normalized, background-removed) subject — see preprocess.ts. */
  preparedImageDataUrl: string;
}

export interface MultiViewResult {
  views: GeneratedView[];
}

export type MultiViewErrorCode =
  | "MULTIVIEW_PROVIDER_NOT_CONFIGURED"
  | "MULTIVIEW_JOB_FAILED"
  | "MULTIVIEW_TIMEOUT"
  | "MULTIVIEW_INVALID_OUTPUT"
  | "MULTIVIEW_STORAGE_FAILED"
  | "MULTIVIEW_GEOMETRY_FAILED"
  | "MULTIVIEW_CANCELLED";

export class MultiViewError extends Error {
  readonly code: MultiViewErrorCode;
  constructor(code: MultiViewErrorCode, message: string) {
    super(message);
    this.name = "MultiViewError";
    this.code = code;
  }
}

export interface MultiViewJobHandle {
  jobId: string;
  /** Resolves with the final result, or rejects with a MultiViewError. */
  result: Promise<MultiViewResult>;
  /** Aborts the in-flight job (stops polling; best-effort cancels the backend job too). */
  cancel(): void;
}

/**
 * Swappable multi-view generation backend — mirrors DepthEstimator /
 * BackgroundRemover. Unlike those, the real implementation must not run
 * client-side (it would require shipping a provider API key to the
 * browser), so `generateViews` actually calls a server function that owns
 * the real HTTP call; this interface is what the store depends on either way.
 */
export interface MultiViewProvider {
  readonly id: string;
  readonly label: string;
  generateViews(input: MultiViewInput): Promise<MultiViewJobHandle>;
}
