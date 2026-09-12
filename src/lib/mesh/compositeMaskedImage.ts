import type { SegmentationResult } from "@/lib/segmentation";

/**
 * Draws `img` at full resolution onto a canvas and applies `mask` as the
 * alpha channel (nearest-neighbor upsampled from the mask's resolution),
 * producing a real RGBA cutout of the subject with a transparent background.
 */
export function compositeMaskedImage(
  img: HTMLImageElement,
  mask: SegmentationResult,
): HTMLCanvasElement {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;

  for (let y = 0; y < height; y++) {
    const my = Math.min(mask.height - 1, Math.round((y / height) * mask.height));
    for (let x = 0; x < width; x++) {
      const mx = Math.min(mask.width - 1, Math.round((x / width) * mask.width));
      const alpha = mask.data[my * mask.width + mx]!;
      data[(y * width + x) * 4 + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}
