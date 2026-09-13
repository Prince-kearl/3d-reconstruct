import { describe, expect, it } from "vitest";
import type { SegmentationResult } from "@/lib/segmentation/types";
import {
  hasMinimumForeground,
  isBlankImage,
  isValidDimensions,
  validateGeneratedView,
} from "./validation";

function makeMask(width: number, height: number, foregroundFraction: number): SegmentationResult {
  const data = new Float32Array(width * height);
  const foregroundCount = Math.round(data.length * foregroundFraction);
  for (let i = 0; i < foregroundCount; i++) data[i] = 1;
  return { width, height, data };
}

describe("isValidDimensions", () => {
  it("accepts reasonable dimensions", () => {
    expect(isValidDimensions(512, 512)).toBe(true);
  });
  it("rejects too-small dimensions", () => {
    expect(isValidDimensions(4, 4)).toBe(false);
  });
  it("rejects non-finite dimensions", () => {
    expect(isValidDimensions(NaN, 512)).toBe(false);
  });
});

describe("isBlankImage", () => {
  it("detects a uniform (blank) image as blank", () => {
    const pixels = new Uint8ClampedArray(400).fill(128);
    expect(isBlankImage(pixels)).toBe(true);
  });
  it("detects a real varied image as not blank", () => {
    const pixels = new Uint8ClampedArray(400);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 37) % 256;
    expect(isBlankImage(pixels)).toBe(false);
  });
  it("treats an empty array as blank", () => {
    expect(isBlankImage(new Uint8ClampedArray(0))).toBe(true);
  });
});

describe("hasMinimumForeground", () => {
  it("rejects a mask with no foreground", () => {
    expect(hasMinimumForeground(makeMask(32, 32, 0))).toBe(false);
  });
  it("rejects a mask that is entirely foreground (background removal failed)", () => {
    expect(hasMinimumForeground(makeMask(32, 32, 1))).toBe(false);
  });
  it("accepts a mask with a reasonable subject fraction", () => {
    expect(hasMinimumForeground(makeMask(32, 32, 0.4))).toBe(true);
  });
});

describe("validateGeneratedView", () => {
  it("rejects invalid dimensions before checking pixels", () => {
    const result = validateGeneratedView({ width: 1, height: 1, pixels: null, mask: null });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/dimensions/i);
  });

  it("rejects a blank/missing image", () => {
    const result = validateGeneratedView({ width: 512, height: 512, pixels: null, mask: null });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/blank|corrupted/i);
  });

  it("rejects a valid image with an unusable mask", () => {
    const pixels = new Uint8ClampedArray(400);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 53) % 256;
    const result = validateGeneratedView({
      width: 512,
      height: 512,
      pixels,
      mask: makeMask(32, 32, 0),
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a valid image with a usable mask", () => {
    const pixels = new Uint8ClampedArray(400);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 53) % 256;
    const result = validateGeneratedView({
      width: 512,
      height: 512,
      pixels,
      mask: makeMask(32, 32, 0.4),
    });
    expect(result.valid).toBe(true);
  });
});
