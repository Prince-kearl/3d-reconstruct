import path from "node:path";
import { defineConfig } from "vitest/config";

// Scoped to src/lib/multiview's pure-logic modules only — this repo has no
// broader test suite, and this isn't the place to start one.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: [
      "src/lib/multiview/**/*.test.ts",
      "src/lib/mesh/multiViewSilhouetteProfile.test.ts",
      "src/lib/texture/**/*.test.ts",
    ],
  },
});
