import { describe, expect, it } from "vitest";
import type { SegmentationResult } from "@/lib/segmentation/types";
import { estimateSilhouetteDepthProfile, sampleProfileAtV } from "./multiViewSilhouetteProfile";

const WIDTH = 100;
const HEIGHT = 10;

/** A mask where every row's foreground spans columns [start, start+span). */
function bandMask(span: number, start = 0): SegmentationResult {
  const data = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = start; x < start + span && x < WIDTH; x++) {
      data[y * WIDTH + x] = 1;
    }
  }
  return { width: WIDTH, height: HEIGHT, data };
}

/** A mask with no foreground at all in the given row range. */
function emptyMask(): SegmentationResult {
  return { width: WIDTH, height: HEIGHT, data: new Float32Array(WIDTH * HEIGHT) };
}

/** A mask where each row gets its own foreground span — for testing row-to-row noise. */
function rowsMask(spans: number[]): SegmentationResult {
  const height = spans.length;
  const data = new Float32Array(WIDTH * height);
  for (let y = 0; y < height; y++) {
    const span = spans[y]!;
    for (let x = 0; x < span && x < WIDTH; x++) {
      data[y * WIDTH + x] = 1;
    }
  }
  return { width: WIDTH, height, data };
}

describe("estimateSilhouetteDepthProfile (shape-from-silhouette)", () => {
  it("returns a uniform profile of 1s (today's flat taper) when no side views are given", () => {
    const front = bandMask(50, 25);
    const profile = estimateSilhouetteDepthProfile(front, [], 8);
    expect(profile.length).toBe(8);
    expect(Array.from(profile)).toEqual(new Array(8).fill(1));
  });

  it("ignores side views at unusable angles (0° or near-90°)", () => {
    const front = bandMask(50, 25);
    const side = bandMask(70, 15);
    const profile = estimateSilhouetteDepthProfile(front, [{ angleDegrees: 0, mask: side }], 8);
    expect(Array.from(profile)).toEqual(new Array(8).fill(1));
  });

  it("produces a real (non-uniform-fallback) estimate from a usable side view", () => {
    const front = bandMask(50, 25); // 50% width front silhouette
    // Wider than pure cosine-foreshortening alone would predict at 30° —
    // i.e. a real subject with actual depth, not a flat card.
    const side = bandMask(60, 20);
    const profile = estimateSilhouetteDepthProfile(front, [{ angleDegrees: 30, mask: side }], 8);
    // A real estimate was computed (not the untouched fallback of exactly 1).
    expect(Array.from(profile).some((v) => v !== 1)).toBe(true);
  });

  it("always clamps estimates within the documented [0.3, 2.5] range", () => {
    const front = bandMask(50, 25);
    const extremeWideSide = bandMask(99, 0); // implausibly wide side view
    const profile = estimateSilhouetteDepthProfile(
      front,
      [{ angleDegrees: 45, mask: extremeWideSide }],
      8,
    );
    for (const v of profile) {
      expect(v).toBeGreaterThanOrEqual(0.3);
      expect(v).toBeLessThanOrEqual(2.5);
    }
  });

  it("marks rows with no front foreground as zero regardless of side views", () => {
    const front = emptyMask();
    const side = bandMask(50, 25);
    const profile = estimateSilhouetteDepthProfile(front, [{ angleDegrees: 30, mask: side }], 8);
    expect(Array.from(profile)).toEqual(new Array(8).fill(0));
  });

  it("averages multiple usable side views instead of only using the first", () => {
    const front = bandMask(50, 25);
    const sideA = bandMask(40, 30);
    const sideB = bandMask(60, 20);
    const profileOneView = estimateSilhouetteDepthProfile(
      front,
      [{ angleDegrees: 30, mask: sideA }],
      8,
    );
    const profileTwoViews = estimateSilhouetteDepthProfile(
      front,
      [
        { angleDegrees: 30, mask: sideA },
        { angleDegrees: -30, mask: sideB },
      ],
      8,
    );
    // Different inputs should generally produce a different (averaged) result.
    expect(Array.from(profileTwoViews)).not.toEqual(Array.from(profileOneView));
  });

  it("smooths away a single noisy row instead of letting it produce a sharp Z spike", () => {
    // A real segmentation mask is noisy row-to-row (a stray hair strand, a
    // collar wrinkle) in a way a clean test mask never is — this simulates
    // one such outlier row sitting among otherwise-uniform neighbors.
    const spans = new Array(21).fill(50);
    spans[10] = 95; // one wildly outlying row, everything else uniform
    const front = rowsMask(spans);
    const side = bandMask(60, 20);
    const sideViews = [{ angleDegrees: 30, mask: side }];

    const profile = estimateSilhouetteDepthProfile(front, sideViews, 21);
    const uniformNeighborValue = profile[9]!; // untouched neighboring row
    const outlierValue = profile[10]!;

    // The outlier is pulled toward its neighbors, not left as an isolated spike.
    expect(Math.abs(outlierValue - uniformNeighborValue)).toBeLessThan(0.3);
  });

  it("keeps a hard zero at rows with no front foreground even after smoothing (a real silhouette boundary, not noise)", () => {
    // Profile index r samples mask row (height-1-r) — see rowForegroundWidthFraction's
    // v convention — so zeroing mask rows [0,5] makes profile rows [15,20] the empty ones.
    const spans = new Array(21).fill(50);
    for (let i = 0; i <= 5; i++) spans[i] = 0; // subject ends partway down
    const front = rowsMask(spans);
    const side = bandMask(60, 20);
    const profile = estimateSilhouetteDepthProfile(front, [{ angleDegrees: 30, mask: side }], 21);
    for (let i = 15; i < 21; i++) {
      expect(profile[i]).toBe(0);
    }
    // A valid row well away from that boundary is unaffected.
    expect(profile[0]).toBeGreaterThan(0);
  });
});

describe("sampleProfileAtV", () => {
  it("round-trips the same index convention used to build the profile", () => {
    const profile = new Float32Array([0.5, 1, 1.5, 2]);
    expect(sampleProfileAtV(profile, 0)).toBe(0.5);
    expect(sampleProfileAtV(profile, 1)).toBe(2);
  });

  it("clamps out-of-range v", () => {
    const profile = new Float32Array([0.5, 1, 1.5, 2]);
    expect(sampleProfileAtV(profile, -1)).toBe(0.5);
    expect(sampleProfileAtV(profile, 5)).toBe(2);
  });
});
