/**
 * Blends a translucent red tint over removed (mask < 0.5) pixels within a
 * rectangular region of `composite`, leaving kept pixels matching `base`.
 * Used by the silhouette brush editor to redraw only the brush-stroke area
 * rather than the whole canvas on every pointer move.
 */
export function paintMaskTint(
  composite: ImageData,
  base: ImageData,
  maskData: Float32Array,
  x0: number,
  y0: number,
  w: number,
  h: number,
): void {
  const width = composite.width;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = y * width + x;
      const o = i * 4;
      const m = maskData[i] ?? 1;
      const r = base.data[o] ?? 0;
      const g = base.data[o + 1] ?? 0;
      const b = base.data[o + 2] ?? 0;
      if (m < 0.5) {
        composite.data[o] = Math.round(r * 0.6 + 255 * 0.4);
        composite.data[o + 1] = Math.round(g * 0.6);
        composite.data[o + 2] = Math.round(b * 0.6);
      } else {
        composite.data[o] = r;
        composite.data[o + 1] = g;
        composite.data[o + 2] = b;
      }
      composite.data[o + 3] = 255;
    }
  }
}
