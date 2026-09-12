import type { DepthEstimationResult } from "./types";

/** Renders a grayscale depth map to a canvas for display — real derived data, not a fake preview. */
export function renderDepthPreview(depth: DepthEstimationResult): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = depth.width;
  canvas.height = depth.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(depth.width, depth.height);
  for (let i = 0; i < depth.data.length; i++) {
    const v = Math.round((depth.data[i] ?? 0) * 255);
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Same encoding as renderDepthPreview, as a PNG blob for storage upload. */
export function encodeDepthMapBlob(depth: DepthEstimationResult): Promise<Blob> {
  const canvas = renderDepthPreview(depth);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode depth map"))),
      "image/png",
    );
  });
}
