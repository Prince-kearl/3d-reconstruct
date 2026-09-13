import { describe, expect, it } from "vitest";
import type { SegmentationResult } from "@/lib/segmentation/types";
import { computeMaskFingerprint } from "./maskFingerprint";

function mask(data: number[], width = data.length, height = 1): SegmentationResult {
  return { width, height, data: new Float32Array(data) };
}

describe("computeMaskFingerprint (staleness detection)", () => {
  it("is identical for the same mask content across calls", () => {
    const m = mask([1, 1, 0, 0, 1]);
    expect(computeMaskFingerprint(m)).toBe(computeMaskFingerprint({ ...m }));
  });

  it("changes when the mask content changes (a real edit)", () => {
    const before = mask([1, 1, 0, 0, 1]);
    const after = mask([1, 1, 1, 0, 1]); // one pixel restored
    expect(computeMaskFingerprint(before)).not.toBe(computeMaskFingerprint(after));
  });

  it("is stable across separate invocations — not session/time based", () => {
    const m = mask([0.2, 0.8, 0.5]);
    const a = computeMaskFingerprint(m);
    const b = computeMaskFingerprint(m);
    expect(a).toBe(b);
  });

  it("differs for different-sized masks even with the same sum", () => {
    const a = computeMaskFingerprint(mask([1, 1], 2, 1));
    const b = computeMaskFingerprint(mask([1, 1, 0], 3, 1));
    expect(a).not.toBe(b);
  });
});
