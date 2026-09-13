/**
 * Pure math for view-aware texture blending — no canvas/DOM here, so it's
 * directly unit-testable (see viewWeights.test.ts). The actual pixel
 * blending lives in buildMultiViewTextureAtlas.ts.
 *
 * The core idea: every texel on the mesh has a "surface angle" (how far
 * around the subject it sits, in degrees from straight-on) and, on the
 * front layer, a "taper" (1 = facing the camera dead-on at the center of the
 * silhouette, 0 = right at the silhouette rim, where the surface curves
 * toward the back). Blending is a continuous function of both — never a
 * hard angle cutoff — so the original photograph dominates near 0° and
 * fades smoothly into generated side views only as the surface turns away
 * from the camera.
 */

/** cos(Δangle)^n falloff sharpness — higher = a view's influence is more tightly confined to its own angle. */
const ANGULAR_FALLOFF_POWER = 2;

/** How strongly taper suppresses generated-view influence on the front layer as it approaches 1 (dead-on). */
const ORIGINAL_TAPER_POWER = 2;

/**
 * A generated view further from straight-on is inherently less reliable (the
 * model has less to go on, and errors compound at steeper angles) — this is
 * a continuous decay, not a per-angle lookup table, so intermediate or
 * extended angles (e.g. left60/right60) degrade gracefully instead of
 * falling off a cliff at some hardcoded threshold.
 */
export function viewAngleConfidence(angleDegrees: number): number {
  const abs = Math.abs(angleDegrees);
  return Math.max(0.4, Math.min(1, 1 - (abs - 15) / 90));
}

/** cos(Δangle)^n, clamped to 0 past ±90° (never a negative/wrap-around weight). */
export function angularWeight(surfaceAngleDeg: number, viewAngleDeg: number): number {
  const deltaRad = ((surfaceAngleDeg - viewAngleDeg) * Math.PI) / 180;
  const cos = Math.cos(deltaRad);
  return cos > 0 ? Math.pow(cos, ANGULAR_FALLOFF_POWER) : 0;
}

export interface WeightableView {
  /** Signed degrees from front, e.g. -30, 30, -45, 45. */
  angleDegrees: number;
  /** 0-1, this view's own generation confidence (see GeneratedView.confidence). */
  confidence: number;
  /** 0-1 foreground mask alpha sampled at the exact texel being blended — background pixels must never contribute. */
  maskAlpha: number;
}

/**
 * Un-normalized weight of one view at one surface point: angular proximity ×
 * the view's confidence (both its own generation confidence and an
 * angle-based reliability decay) × real foreground coverage at this texel.
 * Zero whenever any factor is zero — a view with no foreground here, or on
 * the wrong side of the subject entirely, never contributes.
 */
export function computeViewWeight(surfaceAngleDeg: number, view: WeightableView): number {
  if (view.maskAlpha <= 0 || view.confidence <= 0) return 0;
  const angular = angularWeight(surfaceAngleDeg, view.angleDegrees);
  if (angular <= 0) return 0;
  return angular * view.confidence * viewAngleConfidence(view.angleDegrees) * view.maskAlpha;
}

/**
 * How much of a front-layer texel's color should come from the original
 * photograph vs. generated side views, purely as a function of taper. This
 * is what keeps faces, logos, and other frontal detail untouched near the
 * center of the silhouette while smoothly handing off to inferred side
 * information near the rim — a continuous function of real surface
 * geometry, not an arbitrary distance/angle cutoff.
 */
export function originalSourceWeight(taper: number): number {
  const t = Math.max(0, Math.min(1, taper));
  return Math.pow(t, ORIGINAL_TAPER_POWER);
}

export interface BlendResult {
  /** 0-1 weight for the original photograph. */
  originalWeight: number;
  /** Parallel to the input `views` array, sums with originalWeight to 1. */
  viewWeights: number[];
}

/**
 * Normalizes original-vs-generated weighting for one texel.
 *
 * `layer: "front"` — the original photo is the primary source; it gets
 * `originalSourceWeight(taper)`, and whatever's left is distributed across
 * the available views in proportion to their individual weights.
 *
 * `layer: "back"` — there is no original source for unseen geometry, so
 * generated views get everything, UNLESS none of them have any usable
 * weight here (e.g. a spot no generated view's foreground covers), in which
 * case the original is used as a last-resort fallback rather than leaving
 * the texel blank — this is exactly today's stretched-front behavior,
 * gracefully preserved only where genuinely no better information exists.
 */
export function blendWeights(
  taper: number,
  surfaceAngleDeg: number,
  views: WeightableView[],
  layer: "front" | "back",
): BlendResult {
  const raw = views.map((v) => computeViewWeight(surfaceAngleDeg, v));
  const total = raw.reduce((a, b) => a + b, 0);

  if (layer === "front") {
    const originalWeight = originalSourceWeight(taper);
    const remaining = 1 - originalWeight;
    if (total <= 0) return { originalWeight: 1, viewWeights: raw.map(() => 0) };
    return { originalWeight, viewWeights: raw.map((w) => (w / total) * remaining) };
  }

  if (total <= 0) return { originalWeight: 1, viewWeights: raw.map(() => 0) };
  return { originalWeight: 0, viewWeights: raw.map((w) => w / total) };
}
