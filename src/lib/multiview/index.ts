// Single swap point, mirrors src/lib/depth/index.ts and src/lib/segmentation/index.ts.
//
// Unlike those two, whether a real backend is "configured" is a server-side
// fact (MULTIVIEW_API_URL / MULTIVIEW_API_KEY must never reach the browser),
// so there's one client-side provider — it always calls the server function,
// and the server function itself is what honestly reports
// MULTIVIEW_PROVIDER_NOT_CONFIGURED when nothing real is deployed behind it.
export { httpMultiViewProvider as multiViewProvider } from "./MultiViewProvider";
export { prepareSubjectForGeneration } from "./preprocess";
export { computeMaskFingerprint } from "./maskFingerprint";
export {
  STANDARD_ANGLES,
  EXTENDED_ANGLES,
  ANGLE_DEGREES,
  ANGLE_LABELS,
  anglesForCoverage,
} from "./viewAngles";
export type { ViewCoverage } from "./viewAngles";
export {
  validateGeneratedView,
  isBlankImage,
  hasMinimumForeground,
  isValidDimensions,
} from "./validation";
export {
  MultiViewError,
  type ViewAngle,
  type GeneratedView,
  type GeneratedViewStatus,
  type MultiViewInput,
  type MultiViewResult,
  type MultiViewJobHandle,
  type MultiViewProvider,
  type MultiViewErrorCode,
} from "./types";
