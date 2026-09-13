// TEST-ONLY. Never imported by application code — only by the vitest suite,
// to exercise the store/pipeline plumbing without a real backend. Selecting
// this in production is not possible: nothing in src/lib/multiview/index.ts
// (the real swap point) references this file.
import type {
  GeneratedView,
  MultiViewInput,
  MultiViewJobHandle,
  MultiViewProvider,
} from "../types";

export class MockMultiViewProvider implements MultiViewProvider {
  readonly id = "mock-test-only";
  readonly label = "Mock (testing only)";

  async generateViews(input: MultiViewInput): Promise<MultiViewJobHandle> {
    let cancelled = false;

    const result = new Promise<{ views: GeneratedView[] }>((resolve, reject) => {
      setTimeout(() => {
        if (cancelled) {
          reject(new Error("cancelled"));
          return;
        }
        const views: GeneratedView[] = input.angles.map((angle) => ({
          angle,
          imageUrl: `data:image/png;base64,fixture-${angle}`,
          mask: null,
          width: 512,
          height: 512,
          confidence: 0.5,
          status: "ok",
          provider: this.id,
          model: "fixture",
          generatedAt: Date.now(),
        }));
        resolve({ views });
      }, 10);
    });

    return {
      jobId: "mock-job",
      result,
      cancel: () => {
        cancelled = true;
      },
    };
  }
}

export const mockMultiViewProvider = new MockMultiViewProvider();
