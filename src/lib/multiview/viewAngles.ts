import type { ViewAngle } from "./types";

/** Practical first-version coverage — see the AI Multi-View plan for why this starts conservative. */
export const STANDARD_ANGLES: ViewAngle[] = ["left30", "right30", "left45", "right45"];

/** Optional advanced coverage. Not exposed by default — see View Coverage setting. */
export const EXTENDED_ANGLES: ViewAngle[] = ["left60", "right60"];

export const ANGLE_DEGREES: Record<ViewAngle, number> = {
  left30: -30,
  right30: 30,
  left45: -45,
  right45: 45,
  left60: -60,
  right60: 60,
};

export const ANGLE_LABELS: Record<ViewAngle, string> = {
  left30: "Left 30°",
  right30: "Right 30°",
  left45: "Left 45°",
  right45: "Right 45°",
  left60: "Left 60°",
  right60: "Right 60°",
};

export type ViewCoverage = "standard" | "extended";

export function anglesForCoverage(coverage: ViewCoverage): ViewAngle[] {
  return coverage === "extended" ? [...STANDARD_ANGLES, ...EXTENDED_ANGLES] : STANDARD_ANGLES;
}
