export interface ColorGrading {
  /** -100..100. Multiplies pixel brightness. */
  exposure: number;
  /** -100..100. Scales color saturation around perceptual luminance. */
  saturation: number;
  /** -100..100. Shifts red/blue balance — positive is warmer, negative cooler. */
  warmth: number;
  /** -100..100. Scales contrast around mid-gray. */
  contrast: number;
}

export const NEUTRAL_GRADING: ColorGrading = { exposure: 0, saturation: 0, warmth: 0, contrast: 0 };

function isNeutral(g: ColorGrading): boolean {
  return g.exposure === 0 && g.saturation === 0 && g.warmth === 0 && g.contrast === 0;
}

/**
 * Applies real per-pixel color grading to a copy of `source` (alpha
 * untouched), instead of the CSS `filter` used previously — this is the
 * actual texture pixel data used by the mesh material and OBJ/GLB export,
 * not just a preview effect.
 */
export function applyColorGrading(
  source: HTMLCanvasElement,
  grading: ColorGrading,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(source, 0, 0);
  if (isNeutral(grading)) return canvas;

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;

  const exposureMul = 1 + grading.exposure / 100;
  const satMul = 1 + grading.saturation / 100;
  const contrastMul = 1 + grading.contrast / 100;
  const warmShift = (grading.warmth / 100) * 40;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]! * exposureMul;
    let g = data[i + 1]! * exposureMul;
    let b = data[i + 2]! * exposureMul;

    r += warmShift;
    b -= warmShift;

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = luma + (r - luma) * satMul;
    g = luma + (g - luma) * satMul;
    b = luma + (b - luma) * satMul;

    r = 128 + (r - 128) * contrastMul;
    g = 128 + (g - 128) * contrastMul;
    b = 128 + (b - 128) * contrastMul;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}
