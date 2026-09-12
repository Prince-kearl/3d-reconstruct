import type { DepthEstimationResult } from "./types";

/** Inverse of renderDepthPreview.ts — decodes a stored depth PNG back into a Float32Array. */
export async function decodeDepthMap(url: string): Promise<DepthEstimationResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load stored depth map"));
    el.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable for depth map decode");
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) {
    out[i] = (data[i * 4] ?? 0) / 255;
  }
  return { width, height, data: out };
}
