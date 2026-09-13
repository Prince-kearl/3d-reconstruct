import { describe, expect, it } from "vitest";
import {
  angularWeight,
  blendWeights,
  computeViewWeight,
  originalSourceWeight,
  viewAngleConfidence,
  type WeightableView,
} from "./viewWeights";

describe("viewAngleConfidence", () => {
  it("is highest near straight-on and decreases monotonically with angle magnitude", () => {
    const c15 = viewAngleConfidence(15);
    const c30 = viewAngleConfidence(30);
    const c45 = viewAngleConfidence(45);
    const c60 = viewAngleConfidence(60);
    expect(c15).toBeGreaterThan(c30);
    expect(c30).toBeGreaterThan(c45);
    expect(c45).toBeGreaterThan(c60);
  });

  it("is symmetric for left/right angles of the same magnitude", () => {
    expect(viewAngleConfidence(-30)).toBe(viewAngleConfidence(30));
  });

  it("never drops below the floor", () => {
    expect(viewAngleConfidence(180)).toBeGreaterThanOrEqual(0.4);
  });
});

describe("angularWeight", () => {
  it("is maximal (1) when the surface angle exactly matches the view angle", () => {
    expect(angularWeight(30, 30)).toBeCloseTo(1, 5);
  });

  it("is zero for a view more than 90° away", () => {
    expect(angularWeight(0, 120)).toBe(0);
  });

  it("decreases as angular distance grows", () => {
    const near = angularWeight(30, 25);
    const far = angularWeight(30, -25);
    expect(near).toBeGreaterThan(far);
  });
});

describe("computeViewWeight", () => {
  const base: WeightableView = { angleDegrees: 30, confidence: 0.6, maskAlpha: 1 };

  it("is zero when the mask has no foreground here (background pixel)", () => {
    expect(computeViewWeight(30, { ...base, maskAlpha: 0 })).toBe(0);
  });

  it("is zero when confidence is zero", () => {
    expect(computeViewWeight(30, { ...base, confidence: 0 })).toBe(0);
  });

  it("is positive for a well-aligned, confident, unmasked view", () => {
    expect(computeViewWeight(30, base)).toBeGreaterThan(0);
  });
});

describe("originalSourceWeight", () => {
  it("is 1 at full taper (dead-on center) and 0 at the rim", () => {
    expect(originalSourceWeight(1)).toBe(1);
    expect(originalSourceWeight(0)).toBe(0);
  });

  it("is continuous, not a step function", () => {
    const mid = originalSourceWeight(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe("blendWeights — front layer", () => {
  it("original dominates completely at taper=1 (0°, dead-on) even with a matching view available", () => {
    const views: WeightableView[] = [{ angleDegrees: 0, confidence: 1, maskAlpha: 1 }];
    const result = blendWeights(1, 0, views, "front");
    expect(result.originalWeight).toBe(1);
    expect(result.viewWeights[0]).toBe(0);
  });

  it("hands off increasingly to a matching view as taper decreases toward the rim", () => {
    const views: WeightableView[] = [{ angleDegrees: 30, confidence: 1, maskAlpha: 1 }];
    const near = blendWeights(0.9, 30, views, "front");
    const far = blendWeights(0.1, 30, views, "front");
    expect(far.originalWeight).toBeLessThan(near.originalWeight);
    expect(far.viewWeights[0]!).toBeGreaterThan(near.viewWeights[0]!);
  });

  it("falls back fully to original when no view has any weight here", () => {
    const views: WeightableView[] = [{ angleDegrees: 30, confidence: 1, maskAlpha: 0 }];
    const result = blendWeights(0, 30, views, "front");
    expect(result.originalWeight).toBe(1);
  });

  it("weights sum to 1", () => {
    const views: WeightableView[] = [
      { angleDegrees: -30, confidence: 0.8, maskAlpha: 1 },
      { angleDegrees: 30, confidence: 0.8, maskAlpha: 1 },
    ];
    const result = blendWeights(0.3, 20, views, "front");
    const sum = result.originalWeight + result.viewWeights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("blendWeights — back layer", () => {
  it("has no original contribution when at least one view has usable weight", () => {
    const views: WeightableView[] = [{ angleDegrees: 30, confidence: 1, maskAlpha: 1 }];
    const result = blendWeights(0, 30, views, "back");
    expect(result.originalWeight).toBe(0);
    expect(result.viewWeights[0]).toBeCloseTo(1, 5);
  });

  it("falls back to the original as a last resort when no view covers this point", () => {
    const views: WeightableView[] = [{ angleDegrees: 30, confidence: 1, maskAlpha: 0 }];
    const result = blendWeights(0, -80, views, "back");
    expect(result.originalWeight).toBe(1);
  });

  it("redistributes to the remaining view when one view is unusable (missing/invalid view handling)", () => {
    const views: WeightableView[] = [
      { angleDegrees: 45, confidence: 1, maskAlpha: 0 }, // e.g. right45 failed validation
      { angleDegrees: 30, confidence: 1, maskAlpha: 1 },
    ];
    const result = blendWeights(0, 30, views, "back");
    expect(result.viewWeights[0]).toBe(0);
    expect(result.viewWeights[1]).toBeCloseTo(1, 5);
  });

  it("favors the closer-angle view between two available views", () => {
    const views: WeightableView[] = [
      { angleDegrees: 30, confidence: 1, maskAlpha: 1 },
      { angleDegrees: 45, confidence: 1, maskAlpha: 1 },
    ];
    const result = blendWeights(0, 33, views, "back");
    expect(result.viewWeights[0]!).toBeGreaterThan(result.viewWeights[1]!);
  });
});
