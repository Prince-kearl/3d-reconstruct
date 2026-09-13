import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * The one real backend boundary for AI multi-view generation. Runs
 * server-side only (TanStack Start server function) so MULTIVIEW_API_KEY
 * never reaches the browser bundle — the client only ever calls these
 * functions, never the real inference service directly.
 *
 * Generic HTTP contract this proxies to (define your GPU worker /
 * hosted-inference service to match, or adapt this file to match theirs):
 *
 *   POST {MULTIVIEW_API_URL}/jobs
 *     headers: Authorization: Bearer {MULTIVIEW_API_KEY}
 *     body: { model: string; image: string (data URL); angles: string[] }
 *     -> { jobId: string }
 *
 *   GET {MULTIVIEW_API_URL}/jobs/{jobId}
 *     -> { status: "queued"|"running"|"succeeded"|"failed";
 *          views?: { angle: string; imageUrl: string }[];
 *          error?: string }
 *
 *   POST {MULTIVIEW_API_URL}/jobs/{jobId}/cancel   (best-effort)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isConfigured(): boolean {
  return Boolean(process.env["MULTIVIEW_API_URL"] && process.env["MULTIVIEW_API_KEY"]);
}

/** Verifies the caller actually owns projectId via Supabase RLS (never trust a client-provided id alone). */
async function assertProjectOwnership(accessToken: string, projectId: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (error || !data) {
    throw new Error("Project not found or not owned by the current user");
  }
}

const submitSchema = z.object({
  accessToken: z.string().min(1),
  projectId: z.string().min(1),
  /** Data URL of the preprocessed (cropped/normalized, background-removed) subject image. */
  image: z.string().min(1),
  angles: z.array(z.string()).min(1),
});

export interface SubmitMultiViewJobResult {
  configured: boolean;
  jobId: string | null;
  error: string | null;
}

export const submitMultiViewJob = createServerFn({ method: "POST" })
  .validator(submitSchema)
  .handler(async ({ data }): Promise<SubmitMultiViewJobResult> => {
    if (!isConfigured()) {
      return { configured: false, jobId: null, error: "Multi-view AI provider is not configured." };
    }

    try {
      await assertProjectOwnership(data.accessToken, data.projectId);
    } catch (err) {
      return {
        configured: true,
        jobId: null,
        error: err instanceof Error ? err.message : "Not authorized for this project",
      };
    }

    try {
      const apiUrl = process.env["MULTIVIEW_API_URL"];
      const apiKey = process.env["MULTIVIEW_API_KEY"];
      const model = process.env["MULTIVIEW_MODEL"] ?? "default";

      const res = await fetch(`${apiUrl}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, image: data.image, angles: data.angles }),
      });
      if (!res.ok) {
        return { configured: true, jobId: null, error: `Provider returned HTTP ${res.status}` };
      }
      const body: unknown = await res.json();
      const jobId = (body as { jobId?: unknown }).jobId;
      if (typeof jobId !== "string" || !jobId) {
        return { configured: true, jobId: null, error: "Provider response missing jobId" };
      }
      return { configured: true, jobId, error: null };
    } catch (err) {
      return {
        configured: true,
        jobId: null,
        error: err instanceof Error ? err.message : "Could not reach multi-view provider",
      };
    }
  });

const statusSchema = z.object({
  accessToken: z.string().min(1),
  projectId: z.string().min(1),
  jobId: z.string().min(1),
});

export interface MultiViewJobStatusResult {
  status: "queued" | "running" | "succeeded" | "failed";
  views: { angle: string; imageUrl: string }[];
  error: string | null;
  model: string;
}

export const getMultiViewJobStatus = createServerFn({ method: "POST" })
  .validator(statusSchema)
  .handler(async ({ data }): Promise<MultiViewJobStatusResult> => {
    await assertProjectOwnership(data.accessToken, data.projectId);

    const apiUrl = process.env["MULTIVIEW_API_URL"];
    const apiKey = process.env["MULTIVIEW_API_KEY"];
    const model = process.env["MULTIVIEW_MODEL"] ?? "default";
    if (!apiUrl || !apiKey) {
      return {
        status: "failed",
        views: [],
        error: "Multi-view AI provider is not configured.",
        model,
      };
    }

    try {
      const res = await fetch(`${apiUrl}/jobs/${encodeURIComponent(data.jobId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        return {
          status: "failed",
          views: [],
          error: `Provider returned HTTP ${res.status}`,
          model,
        };
      }
      const body = (await res.json()) as {
        status?: string;
        views?: { angle: string; imageUrl: string }[];
        error?: string;
      };
      const status = body.status;
      if (
        status !== "queued" &&
        status !== "running" &&
        status !== "succeeded" &&
        status !== "failed"
      ) {
        return { status: "failed", views: [], error: "Provider returned an invalid status", model };
      }
      return { status, views: body.views ?? [], error: body.error ?? null, model };
    } catch (err) {
      return {
        status: "failed",
        views: [],
        error: err instanceof Error ? err.message : "Could not reach multi-view provider",
        model,
      };
    }
  });

const cancelSchema = z.object({
  accessToken: z.string().min(1),
  projectId: z.string().min(1),
  jobId: z.string().min(1),
});

export const cancelMultiViewJob = createServerFn({ method: "POST" })
  .validator(cancelSchema)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    await assertProjectOwnership(data.accessToken, data.projectId);

    const apiUrl = process.env["MULTIVIEW_API_URL"];
    const apiKey = process.env["MULTIVIEW_API_KEY"];
    if (!apiUrl || !apiKey) return { ok: true };

    try {
      await fetch(`${apiUrl}/jobs/${encodeURIComponent(data.jobId)}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      // Best-effort — the client stops polling regardless.
    }
    return { ok: true };
  });
