import type { SegmentationResult } from "@/lib/segmentation/types";

const MIN_DIMENSION = 32;
const MAX_DIMENSION = 8192;
const MIN_FOREGROUND_FRACTION = 0.02;
/** A near-uniform image (every pixel within this of the mean) is treated as blank. */
const BLANK_STDDEV_THRESHOLD = 2;

export function isValidDimensions(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= MIN_DIMENSION &&
    height >= MIN_DIMENSION &&
    width <= MAX_DIMENSION &&
    height <= MAX_DIMENSION
  );
}

/**
 * Detects a blank/near-solid-color image via pixel standard deviation —
 * a real corrupted/empty generation shows near-zero variance.
 */
export function isBlankImage(pixels: Uint8ClampedArray | Uint8Array): boolean {
  if (pixels.length === 0) return true;
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) sum += pixels[i]!;
  const mean = sum / pixels.length;

  let variance = 0;
  for (let i = 0; i < pixels.length; i++) {
    const d = pixels[i]! - mean;
    variance += d * d;
  }
  variance /= pixels.length;

  return Math.sqrt(variance) < BLANK_STDDEV_THRESHOLD;
}

/** A mask with too little (or too much, i.e. background removal failed entirely) foreground is unusable. */
export function hasMinimumForeground(mask: SegmentationResult): boolean {
  if (mask.data.length === 0) return false;
  let foreground = 0;
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i]! >= 0.5) foreground++;
  }
  const fraction = foreground / mask.data.length;
  return fraction >= MIN_FOREGROUND_FRACTION && fraction <= 1 - MIN_FOREGROUND_FRACTION;
}

export interface ViewValidationInput {
  width: number;
  height: number;
  pixels: Uint8ClampedArray | Uint8Array | null;
  mask: SegmentationResult | null;
}

export interface ViewValidationResult {
  valid: boolean;
  reason?: string;
}

/** The single gate a generated view must pass before it's accepted into the pipeline. */
export function validateGeneratedView(input: ViewValidationInput): ViewValidationResult {
  if (!isValidDimensions(input.width, input.height)) {
    return { valid: false, reason: "Invalid dimensions" };
  }
  if (!input.pixels || isBlankImage(input.pixels)) {
    return { valid: false, reason: "Blank or corrupted output" };
  }
  if (input.mask && !hasMinimumForeground(input.mask)) {
    return { valid: false, reason: "No usable subject detected" };
  }
  return { valid: true };
}
