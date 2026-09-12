import type { SegmentationResult } from "./types";

/** Encodes a mask as a grayscale PNG blob for storage — mirrors depth/renderDepthPreview.ts. */
export function encodeMaskBlob(mask: SegmentationResult): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas 2D context unavailable for mask encode"));

  const image = ctx.createImageData(mask.width, mask.height);
  for (let i = 0; i < mask.data.length; i++) {
    const v = Math.round((mask.data[i] ?? 0) * 255);
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode mask"))),
      "image/png",
    );
  });
}

/** Inverse of encodeMaskBlob — decodes a stored mask PNG back into a Float32Array. */
export async function decodeMask(url: string): Promise<SegmentationResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load stored mask"));
    el.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable for mask decode");
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) {
    out[i] = (data[i * 4] ?? 0) / 255;
  }
  return { width, height, data: out };
}
