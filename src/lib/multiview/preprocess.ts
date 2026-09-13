import { compositeMaskedImage } from "@/lib/mesh/compositeMaskedImage";
import type { SegmentationResult } from "@/lib/segmentation/types";

const PADDING_FRACTION = 0.12;
const NORMALIZED_SIZE = 768;

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function maskBoundingBox(mask: SegmentationResult): BBox | null {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[y * mask.width + x]! >= 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < minX ? null : { minX, minY, maxX, maxY };
}

/**
 * Describes exactly how `prepareSubjectForGeneration` mapped one image into
 * normalized-square space, expressed as resolution-independent UV fractions
 * (0..1) of both the source image and the destination square. Exported so
 * texture blending (src/lib/texture) can map a point on one image's normalized
 * square into any other image's raw-pixel space — the whole point of
 * normalizing every view the same way in the first place (see §17 of the
 * multi-view spec: "Generated View Normalization").
 */
export interface NormalizedCropTransform {
  srcU0: number;
  srcV0: number;
  srcU1: number;
  srcV1: number;
  destU0: number;
  destV0: number;
  destU1: number;
  destV1: number;
}

/**
 * Pure geometry: where `prepareSubjectForGeneration` would crop `mask`'s
 * subject from an `imgWidth`×`imgHeight` image, and where that crop lands
 * within the normalized square — as UV fractions, so it doesn't need an
 * actual image/canvas and is directly unit-testable.
 */
export function computeNormalizedCropTransform(
  mask: SegmentationResult,
  imgWidth: number,
  imgHeight: number,
): NormalizedCropTransform | null {
  const bbox = maskBoundingBox(mask);
  if (!bbox || imgWidth <= 0 || imgHeight <= 0) return null;

  const scaleX = imgWidth / mask.width;
  const scaleY = imgHeight / mask.height;
  const boxW = (bbox.maxX - bbox.minX + 1) * scaleX;
  const boxH = (bbox.maxY - bbox.minY + 1) * scaleY;
  const padX = boxW * PADDING_FRACTION;
  const padY = boxH * PADDING_FRACTION;

  const srcX = Math.max(0, bbox.minX * scaleX - padX);
  const srcY = Math.max(0, bbox.minY * scaleY - padY);
  const srcW = Math.min(imgWidth - srcX, boxW + padX * 2);
  const srcH = Math.min(imgHeight - srcY, boxH + padY * 2);
  if (srcW <= 0 || srcH <= 0) return null;

  const fitScale = Math.min(NORMALIZED_SIZE / srcW, NORMALIZED_SIZE / srcH);
  const destW = srcW * fitScale;
  const destH = srcH * fitScale;
  const destX = (NORMALIZED_SIZE - destW) / 2;
  const destY = (NORMALIZED_SIZE - destH) / 2;

  return {
    srcU0: srcX / imgWidth,
    srcV0: srcY / imgHeight,
    srcU1: (srcX + srcW) / imgWidth,
    srcV1: (srcY + srcH) / imgHeight,
    destU0: destX / NORMALIZED_SIZE,
    destV0: destY / NORMALIZED_SIZE,
    destU1: (destX + destW) / NORMALIZED_SIZE,
    destV1: (destY + destH) / NORMALIZED_SIZE,
  };
}

/**
 * Crops the background-removed subject to its bounding box (with padding),
 * normalized to a square canvas, before it's sent to a multi-view generator.
 * Real cropping/scaling logic — not present anywhere else in the codebase —
 * built on top of the existing compositeMaskedImage alpha-cutout helper.
 */
export function prepareSubjectForGeneration(
  img: HTMLImageElement,
  mask: SegmentationResult,
): HTMLCanvasElement {
  const cutout = compositeMaskedImage(img, mask);

  const canvas = document.createElement("canvas");
  canvas.width = NORMALIZED_SIZE;
  canvas.height = NORMALIZED_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const transform = computeNormalizedCropTransform(mask, img.naturalWidth, img.naturalHeight);
  if (!transform) {
    // No detectable subject — return the full cutout scaled to fit, rather
    // than guessing at a crop region.
    ctx.drawImage(cutout, 0, 0, NORMALIZED_SIZE, NORMALIZED_SIZE);
    return canvas;
  }

  const srcX = transform.srcU0 * img.naturalWidth;
  const srcY = transform.srcV0 * img.naturalHeight;
  const srcW = (transform.srcU1 - transform.srcU0) * img.naturalWidth;
  const srcH = (transform.srcV1 - transform.srcV0) * img.naturalHeight;
  const destX = transform.destU0 * NORMALIZED_SIZE;
  const destY = transform.destV0 * NORMALIZED_SIZE;
  const destW = (transform.destU1 - transform.destU0) * NORMALIZED_SIZE;
  const destH = (transform.destV1 - transform.destV0) * NORMALIZED_SIZE;

  ctx.drawImage(cutout, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
  return canvas;
}
