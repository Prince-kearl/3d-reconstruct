// Single swap point: change this export to move off the in-browser model
// (e.g. to a server-hosted estimator) without touching the rest of the app.
export { transformersDepthEstimator as depthEstimator } from "./transformersDepthEstimator";
export { renderDepthPreview, encodeDepthMapBlob } from "./renderDepthPreview";
export { decodeDepthMap } from "./decodeDepthMap";
export type { DepthEstimationResult, DepthEstimator } from "./types";
