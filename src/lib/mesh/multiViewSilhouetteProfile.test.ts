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
