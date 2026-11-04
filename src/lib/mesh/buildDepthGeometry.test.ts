import { describe, expect, it } from "vitest";

import type { DepthEstimationResult } from "@/lib/depth/types";
import type { SegmentationResult } from "@/lib/segmentation/types";
import { hasReliefBackSurface, reliefBackUsesTexture } from "./reliefSurface";
import { buildDepthGeometry, type DepthMeshParams } from "./buildDepthGeometry";

const WIDTH = 5;
const HEIGHT = 5;
const DEPTH: DepthEstimationResult = {
  width: WIDTH,
  height: HEIGHT,
  data: new Float32Array(WIDTH * HEIGHT).fill(0.5),
};
const FOREGROUND: SegmentationResult = {
  width: WIDTH,
  height: HEIGHT,
  data: new Float32Array(WIDTH * HEIGHT).fill(1),
};
const PARAMS: DepthMeshParams = {
  detail: 70,
  smoothing: 0,
  edgeFeather: 0,
  volume: 45,
  segments: 2,
};

function getURange(
  geometry: ReturnType<typeof buildDepthGeometry>["geometry"],
  start: number,
  end: number,
) {
  const uv = geometry.getAttribute("uv");
  let min = Infinity;
  let max = -Infinity;
  for (let i = start; i < end; i++) {
    min = Math.min(min, uv.getX(i));
    max = Math.max(max, uv.getX(i));
  }
  return [min, max];
}

describe("buildDepthGeometry relief surfaces", () => {
  it("does not mark the synthetic depth-only rear shell as photo-textured", () => {
    const result = buildDepthGeometry(DEPTH, 1, PARAMS, FOREGROUND);
    const frontIndexCount = result.geometry.groups[0]?.count ?? 0;

    expect(hasReliefBackSurface(result.geometry)).toBe(true);
    expect(reliefBackUsesTexture(result.geometry)).toBe(false);
    expect(result.geometry.groups).toEqual([
      { start: 0, count: frontIndexCount, materialIndex: 0 },
      { start: frontIndexCount, count: frontIndexCount, materialIndex: 1 },
    ]);

    const exportGeometry = result.geometry.clone();
    expect(reliefBackUsesTexture(exportGeometry)).toBe(false);

    exportGeometry.dispose();
    result.geometry.dispose();
  });

  it("maps separate shell groups into their own real multi-view atlas regions", () => {
    const result = buildDepthGeometry(DEPTH, 1, PARAMS, FOREGROUND, null, {
      frontURange: [0, 0.5],
      backURange: [0.5, 1],
    });
    const vertexCount = result.geometry.getAttribute("position").count / 2;

    expect(reliefBackUsesTexture(result.geometry)).toBe(true);
    expect(getURange(result.geometry, 0, vertexCount)).toEqual([0, 0.5]);
    expect(getURange(result.geometry, vertexCount, vertexCount * 2)).toEqual([0.5, 1]);

    result.geometry.dispose();
  });

  it("keeps the single-plane path when volume is disabled or no mask exists", () => {
    const flatResult = buildDepthGeometry(DEPTH, 1, { ...PARAMS, volume: 0 }, FOREGROUND);
    const unmaskedResult = buildDepthGeometry(DEPTH, 1, PARAMS, null);

    expect(hasReliefBackSurface(flatResult.geometry)).toBe(false);
    expect(hasReliefBackSurface(unmaskedResult.geometry)).toBe(false);
    expect(reliefBackUsesTexture(flatResult.geometry)).toBe(false);
    expect(reliefBackUsesTexture(unmaskedResult.geometry)).toBe(false);

    flatResult.geometry.dispose();
    unmaskedResult.geometry.dispose();
  });
});
