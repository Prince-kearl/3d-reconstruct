import { compositeMaskedImage } from "@/lib/mesh/compositeMaskedImage";
import { rowForegroundBounds } from "@/lib/mesh/multiViewSilhouetteProfile";
import { ANGLE_DEGREES } from "@/lib/multiview/viewAngles";
import {
  computeNormalizedCropTransform,
  type NormalizedCropTransform,
} from "@/lib/multiview/preprocess";
import type { GeneratedView } from "@/lib/multiview/types";
import type { SegmentationResult } from "@/lib/segmentation/types";
import { blendWeights, type WeightableView } from "./viewWeights";
import { frontUVToViewUV, surfaceAngleInRow } from "./viewCoordinates";

/**
 * Computed once per multi-view "ready" state, not per frame — this bakes a
 * single texture atlas (§20/§23 of the multi-view spec: a baked atlas is the
 * approach that stays exportable to both GLB and OBJ, unlike a multi-source
 * shader material). Two side-by-side regions: the left half is the front
 * layer's UV space, the right half the back layer's — buildDepthGeometry
 * remaps each layer's UVs into its own half via `frontURange`/`backURange`.
 */
export interface MultiViewTextureAtlas {
  canvas: HTMLCanvasElement;
  frontURange: [number, number];
  backURange: [number, number];
}

/** Back-region content is computed at a capped resolution and upscaled — the per-pixel angular blend is not cheap enough to justify doing it at full source resolution, and softness there is far less noticeable than on the front. */
const BACK_COMPUTE_MAX_DIM = 384;

interface LoadedView {
  angleDegrees: number;
  confidence: number;
  data: Uint8ClampedArray;
  width: number;
  height: number;
  mask: SegmentationResult;
  transform: NormalizedCropTransform;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load generated view image"));
    img.src = url;
  });
}

function getImageData(canvas: HTMLCanvasElement): ImageData | null {
  const ctx = canvas.getContext("2d");
  return ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
}

function meanForegroundLuma(data: Uint8ClampedArray): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 8) continue;
    sum += 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    count++;
  }
  return count > 0 ? sum / count : 128;
}

/**
 * Gently shifts brightness so a view's foreground mean luma matches the
 * original photo's — a single per-view gain, not a full color-transfer
 * (§24: "do not apply aggressive global color changes").
 */
function matchLumaInPlace(data: Uint8ClampedArray, targetLuma: number): void {
  const current = meanForegroundLuma(data);
  if (current < 4) return;
  const gain = Math.max(0.6, Math.min(1.6, targetLuma / current));
  if (Math.abs(gain - 1) < 0.02) return;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 8) continue;
    data[i] = Math.max(0, Math.min(255, data[i]! * gain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! * gain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! * gain));
  }
}

function sampleRGBA(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  u: number,
  v: number,
): [number, number, number, number] {
  const x = Math.max(0, Math.min(width - 1, Math.round(u * (width - 1))));
  const y = Math.max(0, Math.min(height - 1, Math.round((1 - v) * (height - 1))));
  const i = (y * width + x) * 4;
  return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
}

function sampleMaskAlpha(mask: SegmentationResult, u: number, v: number): number {
  const x = Math.max(0, Math.min(mask.width - 1, Math.round(u * (mask.width - 1))));
  const y = Math.max(0, Math.min(mask.height - 1, Math.round((1 - v) * (mask.height - 1))));
  return mask.data[y * mask.width + x] ?? 0;
}

/** Loads and normalizes every usable generated view once, up front. */
async function loadUsableViews(views: GeneratedView[]): Promise<LoadedView[]> {
  const usable = views.filter((v) => v.status === "ok" && v.imageUrl && v.mask);
  const loaded: LoadedView[] = [];

  for (const view of usable) {
    try {
      const img = await loadImage(view.imageUrl!);
      const cutout = compositeMaskedImage(img, view.mask!);
      const transform = computeNormalizedCropTransform(
        view.mask!,
        img.naturalWidth,
        img.naturalHeight,
      );
      const imageData = getImageData(cutout);
      if (!transform || !imageData) continue;
      loaded.push({
        angleDegrees: ANGLE_DEGREES[view.angle],
        confidence: view.confidence,
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
        mask: view.mask!,
        transform,
      });
    } catch {
      // One view failing to load must not abort the whole blend — it's simply excluded (§16).
    }
  }
  return loaded;
}

/** Builds the back-region raster: for every pixel, blends whichever generated views plausibly see that part of the subject. */
function buildBackRegion(
  outWidth: number,
  outHeight: number,
  frontMask: SegmentationResult,
  frontData: Uint8ClampedArray,
  frontWidth: number,
  frontHeight: number,
  frontTransform: NormalizedCropTransform,
  loadedViews: LoadedView[],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);

  for (let py = 0; py < outHeight; py++) {
    const v = outHeight > 1 ? 1 - py / (outHeight - 1) : 0.5;
    const bounds = rowForegroundBounds(frontMask, v);

    for (let px = 0; px < outWidth; px++) {
      const i = (py * outWidth + px) * 4;
      if (!bounds) continue; // No subject on this row — geometry is trimmed away here regardless.

      const u = outWidth > 1 ? px / (outWidth - 1) : 0.5;
      const minU = bounds.minX / frontMask.width;
      const maxU = (bounds.maxX + 1) / frontMask.width;
      const surfaceAngle = surfaceAngleInRow(u, minU, maxU);

      const weightable: WeightableView[] = [];
      const colors: [number, number, number, number][] = [];
      for (const view of loadedViews) {
        const viewUV = frontUVToViewUV(frontTransform, view.transform, u, v);
        if (!viewUV) {
          weightable.push({
            angleDegrees: view.angleDegrees,
            confidence: view.confidence,
            maskAlpha: 0,
          });
          colors.push([0, 0, 0, 0]);
          continue;
        }
        const alpha = sampleMaskAlpha(view.mask, viewUV[0], viewUV[1]);
        weightable.push({
          angleDegrees: view.angleDegrees,
          confidence: view.confidence,
          maskAlpha: alpha,
        });
        colors.push(sampleRGBA(view.data, view.width, view.height, viewUV[0], viewUV[1]));
      }

      const { originalWeight, viewWeights } = blendWeights(0, surfaceAngle, weightable, "back");

      let r = 0;
      let g = 0;
      let b = 0;
      if (originalWeight > 0) {
        const [fr, fg, fb] = sampleRGBA(frontData, frontWidth, frontHeight, u, v);
        r += fr * originalWeight;
        g += fg * originalWeight;
        b += fb * originalWeight;
      }
      for (let k = 0; k < viewWeights.length; k++) {
        const w = viewWeights[k]!;
        if (w <= 0) continue;
        const [cr, cg, cb] = colors[k]!;
        r += cr * w;
        g += cg * w;
        b += cb * w;
      }

      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  }

  return out;
}

/**
 * Builds a view-aware texture atlas from the original front photo plus
 * whatever generated side views are usable. Returns null (never throws for
 * "no usable input") when there's nothing to blend — callers keep the
 * existing single-texture behavior in that case, unchanged.
 */
export async function buildMultiViewTextureAtlas(
  frontCanvas: HTMLCanvasElement,
  frontMask: SegmentationResult,
  imageWidth: number,
  imageHeight: number,
  views: GeneratedView[],
): Promise<MultiViewTextureAtlas | null> {
  const frontTransform = computeNormalizedCropTransform(frontMask, imageWidth, imageHeight);
  if (!frontTransform) return null;

  const frontImageData = getImageData(frontCanvas);
  if (!frontImageData) return null;

  const loadedViews = await loadUsableViews(views);
  if (loadedViews.length === 0) return null;

  const frontLuma = meanForegroundLuma(frontImageData.data);
  for (const view of loadedViews) matchLumaInPlace(view.data, frontLuma);

  const aspect = frontCanvas.width / frontCanvas.height;
  const backWidth = aspect >= 1 ? BACK_COMPUTE_MAX_DIM : Math.round(BACK_COMPUTE_MAX_DIM * aspect);
  const backHeight = aspect >= 1 ? Math.round(BACK_COMPUTE_MAX_DIM / aspect) : BACK_COMPUTE_MAX_DIM;

  const backData = buildBackRegion(
    backWidth,
    backHeight,
    frontMask,
    frontImageData.data,
    frontImageData.width,
    frontImageData.height,
    frontTransform,
    loadedViews,
  );

  const backSmallCanvas = document.createElement("canvas");
  backSmallCanvas.width = backWidth;
  backSmallCanvas.height = backHeight;
  backSmallCanvas
    .getContext("2d")!
    .putImageData(new ImageData(new Uint8ClampedArray(backData), backWidth, backHeight), 0, 0);

  const atlas = document.createElement("canvas");
  atlas.width = frontCanvas.width * 2;
  atlas.height = frontCanvas.height;
  const actx = atlas.getContext("2d");
  if (!actx) return null;
  actx.drawImage(frontCanvas, 0, 0);
  actx.imageSmoothingEnabled = true;
  actx.drawImage(backSmallCanvas, frontCanvas.width, 0, frontCanvas.width, frontCanvas.height);

  return { canvas: atlas, frontURange: [0, 0.5], backURange: [0.5, 1] };
}
