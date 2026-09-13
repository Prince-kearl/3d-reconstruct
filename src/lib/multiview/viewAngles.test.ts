import { describe, expect, it } from "vitest";
import { ANGLE_DEGREES, anglesForCoverage, EXTENDED_ANGLES, STANDARD_ANGLES } from "./viewAngles";

describe("viewAngles", () => {
  it("standard coverage is exactly the conservative ±30°/±45° set", () => {
    expect(STANDARD_ANGLES).toEqual(["left30", "right30", "left45", "right45"]);
  });

  it("extended coverage adds ±60° on top of standard", () => {
    const extended = anglesForCoverage("extended");
    expect(extended).toEqual([...STANDARD_ANGLES, ...EXTENDED_ANGLES]);
  });

  it("standard coverage never includes ±60°", () => {
    const standard = anglesForCoverage("standard");
    expect(standard).not.toContain("left60");
    expect(standard).not.toContain("right60");
  });

  it("angle degrees are signed correctly", () => {
    expect(ANGLE_DEGREES.left30).toBe(-30);
    expect(ANGLE_DEGREES.right30).toBe(30);
    expect(ANGLE_DEGREES.left45).toBe(-45);
    expect(ANGLE_DEGREES.right45).toBe(45);
  });
});
