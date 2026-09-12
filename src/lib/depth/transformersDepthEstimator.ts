import type { DepthEstimationPipeline } from "@huggingface/transformers";

import type { DepthEstimationResult, DepthEstimator } from "./types";

const MODEL_ID = "onnx-community/depth-anything-v2-small";

let pipelinePromise: Promise<DepthEstimationPipeline> | null = null;

// Dynamically imported: this package (plus its WASM/WebGPU backend) is
// multiple MB and must never land in the initial page bundle — it should
// only load once a user actually starts a reconstruction.
function loadPipeline(): Promise<DepthEstimationPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = import("@huggingface/transformers")
      .then(({ pipeline }) => {
        const device = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
        return pipeline("depth-estimation", MODEL_ID, { device });
      })
      .catch((error: unknown) => {
        pipelinePromise = null;
        throw error;
      });
  }
  return pipelinePromise;
}

/** Runs Depth Anything V2 (Small) fully client-side via transformers.js — no server call. */
export const transformersDepthEstimator: DepthEstimator = {
  id: "depth-anything-v2-small-browser",
  label: "Depth Anything V2 Small (in-browser)",
  async estimate(imageUrl: string): Promise<DepthEstimationResult> {
    const estimator = await loadPipeline();
    const { depth } = await estimator(imageUrl);
    const canvas = depth.toCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable for depth map readback");

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const out = new Float32Array(width * height);
    for (let i = 0; i < out.length; i++) {
      out[i] = data[i * 4] / 255;
    }
    return { width, height, data: out };
  },
};
