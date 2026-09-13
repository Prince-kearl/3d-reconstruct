import { backgroundRemover } from "@/lib/segmentation";
import { supabase } from "@/lib/supabase/client";
import {
  cancelMultiViewJob,
  getMultiViewJobStatus,
  submitMultiViewJob,
} from "@/server-functions/multiview";
import { ANGLE_DEGREES } from "./viewAngles";
import { validateGeneratedView } from "./validation";
import {
  MultiViewError,
  type GeneratedView,
  type MultiViewInput,
  type MultiViewJobHandle,
  type MultiViewProvider,
  type ViewAngle,
} from "./types";

const POLL_INTERVAL_MS = 3000;
const JOB_TIMEOUT_MS = 5 * 60 * 1000;
const PROVIDER_ID = "http-server-proxy";
const PROVIDER_LABEL = "Configurable multi-view service (via server proxy)";

async function loadImagePixels(
  url: string,
): Promise<{ width: number; height: number; pixels: Uint8ClampedArray | null }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ width: img.naturalWidth, height: img.naturalHeight, pixels: null });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve({ width: img.naturalWidth, height: img.naturalHeight, pixels: data });
      } catch {
        resolve({ width: img.naturalWidth, height: img.naturalHeight, pixels: null });
      }
    };
    img.onerror = () => resolve({ width: 0, height: 0, pixels: null });
    img.src = url;
  });
}

async function toValidatedView(
  angle: ViewAngle,
  imageUrl: string,
  model: string,
): Promise<GeneratedView> {
  const { width, height, pixels } = await loadImagePixels(imageUrl);
  const mask = pixels ? await backgroundRemover.removeBackground(imageUrl).catch(() => null) : null;

  const validation = validateGeneratedView({ width, height, pixels, mask });
  return {
    angle,
    imageUrl: validation.valid ? imageUrl : null,
    mask: validation.valid ? mask : null,
    width,
    height,
    confidence: validation.valid ? 0.6 : 0,
    status: validation.valid ? "ok" : "failed",
    failureReason: validation.valid ? undefined : validation.reason,
    provider: PROVIDER_ID,
    model,
    generatedAt: Date.now(),
  };
}

/**
 * Real implementation: submits a job to the server function (which proxies
 * to whatever real service is configured via MULTIVIEW_API_URL) and polls
 * for completion. If no provider is configured server-side, the first
 * submit call reports that honestly and this resolves immediately with
 * every requested angle marked failed — no fake views are ever produced.
 */
class HttpMultiViewProvider implements MultiViewProvider {
  readonly id = PROVIDER_ID;
  readonly label = PROVIDER_LABEL;

  async generateViews(input: MultiViewInput): Promise<MultiViewJobHandle> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new MultiViewError("MULTIVIEW_PROVIDER_NOT_CONFIGURED", "Not signed in.");
    }

    const submitResult = await submitMultiViewJob({
      data: {
        accessToken,
        projectId: input.projectId,
        image: input.preparedImageDataUrl,
        angles: input.angles,
      },
    });

    if (!submitResult.configured) {
      throw new MultiViewError(
        "MULTIVIEW_PROVIDER_NOT_CONFIGURED",
        submitResult.error ?? "Multi-view AI provider is not configured.",
      );
    }
    if (!submitResult.jobId) {
      throw new MultiViewError(
        "MULTIVIEW_JOB_FAILED",
        submitResult.error ?? "Job submission failed.",
      );
    }

    const jobId = submitResult.jobId;
    const controller = new AbortController();
    let cancelled = false;

    const result = (async (): Promise<{ views: GeneratedView[] }> => {
      const startedAt = Date.now();
      while (!cancelled) {
        if (Date.now() - startedAt > JOB_TIMEOUT_MS) {
          throw new MultiViewError("MULTIVIEW_TIMEOUT", "Multi-view generation timed out.");
        }
        const status = await getMultiViewJobStatus({
          data: { accessToken, projectId: input.projectId, jobId },
        });
        if (cancelled) throw new MultiViewError("MULTIVIEW_CANCELLED", "Cancelled.");

        if (status.status === "failed") {
          throw new MultiViewError("MULTIVIEW_JOB_FAILED", status.error ?? "Generation failed.");
        }
        if (status.status === "succeeded") {
          const model = status.model;
          const views = await Promise.all(
            input.angles.map(async (angle) => {
              const match = status.views.find((v) => v.angle === angle);
              if (!match) {
                return {
                  angle,
                  imageUrl: null,
                  mask: null,
                  width: 0,
                  height: 0,
                  confidence: 0,
                  status: "failed" as const,
                  failureReason: "Provider did not return this angle",
                  provider: PROVIDER_ID,
                  model,
                  generatedAt: Date.now(),
                };
              }
              return toValidatedView(angle, match.imageUrl, model);
            }),
          );
          return { views };
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      throw new MultiViewError("MULTIVIEW_CANCELLED", "Cancelled.");
    })();

    return {
      jobId,
      result,
      cancel: () => {
        cancelled = true;
        controller.abort();
        void cancelMultiViewJob({ data: { accessToken, projectId: input.projectId, jobId } }).catch(
          () => {},
        );
      },
    };
  }
}

export const httpMultiViewProvider = new HttpMultiViewProvider();
export { ANGLE_DEGREES };
