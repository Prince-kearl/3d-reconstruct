import { pipeline, type BackgroundRemovalPipeline } from "@huggingface/transformers";

import type { BackgroundRemover, SegmentationResult } from "./types";

// IS-Net (Dichotomous Image Segmentation) — general-purpose salient-object
// background removal, not limited to human portraits (unlike Xenova/modnet,
// which is portrait-matting only and produces weak masks on other subjects).
// This is one of only four architectures this library's background-removal
// pipeline supports (the others being modnet, birefnet, ben).
const MODEL_ID = "onnx-community/ISNet-ONNX";

let pipelinePromise: Promise<BackgroundRemovalPipeline> | null = null;

function loadPipeline(): Promise<BackgroundRemovalPipeline> {
  if (!pipelinePromise) {
    const device = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
    pipelinePromise = pipeline("background-removal", MODEL_ID, { device }).catch(
      (error: unknown) => {
        pipelinePromise = null;
        throw error;
      },
    );
  }
  return pipelinePromise;
}

/** Runs IS-Net fully client-side via transformers.js — no server call. */
export const transformersBackgroundRemover: BackgroundRemover = {
  id: "isnet-browser",
  label: "IS-Net (in-browser)",
  async removeBackground(imageUrl: string): Promise<SegmentationResult> {
    const remover = await loadPipeline();
    const result = await remover(imageUrl);
    const output = Array.isArray(result) ? result[0] : result;
    if (!output) throw new Error("Background removal returned no result");

    const { data, width, height, channels } = output;
    const alpha = new Float32Array(width * height);
    if (channels === 4) {
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = data[i * 4 + 3]! / 255;
      }
    } else {
      // Single-channel mask output (foreground probability) — some model variants
      // return this shape instead of a baked-in RGBA alpha channel.
      const stride = channels;
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = data[i * stride]! / 255;
      }
    }
    return { width, height, data: alpha };
  },
};
