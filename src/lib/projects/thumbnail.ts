/** Downscales an already-loaded image to a small JPEG blob for storage/list rendering. */
export function makeThumbnailBlob(img: HTMLImageElement, maxSize = 240): Promise<Blob> {
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode thumbnail"))),
      "image/jpeg",
      0.82,
    );
  });
}
