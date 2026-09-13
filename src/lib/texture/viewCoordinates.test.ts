import { describe, expect, it } from "vitest";
import type { NormalizedCropTransform } from "@/lib/multiview/preprocess";
import {
  frontUVToViewUV,
  imageUVToNormalizedUV,
  normalizedUVToImageUV,
  surfaceAngleInRow,
} from "./viewCoordinates";

const IDENTITY: NormalizedCropTransform = {
  srcU0: 0,
  srcV0: 0,
  srcU1: 1,
  srcV1: 1,
  destU0: 0,
  destV0: 0,
  destU1: 1,
  destV1: 1,
};

const CROPPED: NormalizedCropTransform = {
  srcU0: 0.25,
  srcV0: 0.25,
  srcU1: 0.75,
  srcV1: 0.75,
  destU0: 0,
  destV0: 0.1,
  destU1: 1,
  destV1: 0.9,
};

describe("imageUVToNormalizedUV / normalizedUVToImageUV", () => {
  it("round-trips through an identity transform", () => {
    const n = imageUVToNormalizedUV(IDENTITY, 0.3, 0.7);
    expect(n).not.toBeNull();
    const back = normalizedUVToImageUV(IDENTITY, n![0], n![1]);
    expect(back![0]).toBeCloseTo(0.3, 5);
    expect(back![1]).toBeCloseTo(0.7, 5);
  });

  it("returns null outside the source crop", () => {
    expect(imageUVToNormalizedUV(CROPPED, 0.1, 0.5)).toBeNull();
  });

  it("returns null outside the destination rect", () => {
    expect(normalizedUVToImageUV(CROPPED, 0.5, 0.05)).toBeNull();
  });

  it("maps the center of a crop to the center of its destination rect", () => {
    const n = imageUVToNormalizedUV(CROPPED, 0.5, 0.5)!;
    expect(n[0]).toBeCloseTo(0.5, 5);
    expect(n[1]).toBeCloseTo(0.5, 5);
  });

  it("round-trips through a non-identity (cropped/letterboxed) transform", () => {
    const n = imageUVToNormalizedUV(CROPPED, 0.4, 0.6)!;
    const back = normalizedUVToImageUV(CROPPED, n[0], n[1])!;
    expect(back[0]).toBeCloseTo(0.4, 5);
    expect(back[1]).toBeCloseTo(0.6, 5);
  });
});

describe("frontUVToViewUV", () => {
  it("composes both hops through a shared normalized space", () => {
    const result = frontUVToViewUV(IDENTITY, CROPPED, 0.5, 0.5);
    expect(result).not.toBeNull();
  });

  it("returns null when the front point falls outside the view's own crop", () => {
    // Front is identity (whole image is "cropped"), landing at normalized (0.1, 0.5),
    // which falls outside CROPPED's destination rect (destU0=0..1, destV0=0.1..0.9 — 0.5 is fine,
    // so pick a point that lands outside destV range instead).
    const result = frontUVToViewUV(IDENTITY, CROPPED, 0.5, 0.02);
    expect(result).toBeNull();
  });
});

describe("surfaceAngleInRow", () => {
  it("is 0 at the row's lateral center", () => {
    expect(surfaceAngleInRow(0.5, 0.2, 0.8)).toBeCloseTo(0, 5);
  });

  it("is -90 at the row's left edge and +90 at its right edge", () => {
    expect(surfaceAngleInRow(0.2, 0.2, 0.8)).toBeCloseTo(-90, 5);
    expect(surfaceAngleInRow(0.8, 0.2, 0.8)).toBeCloseTo(90, 5);
  });

  it("clamps beyond the row's span instead of extrapolating past ±90", () => {
    expect(surfaceAngleInRow(1.5, 0.2, 0.8)).toBe(90);
    expect(surfaceAngleInRow(-1, 0.2, 0.8)).toBe(-90);
  });
});
