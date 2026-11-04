import path from "node:path";
import { defineConfig } from "vitest/config";

// Scoped to deterministic client-independent engine and utility tests.
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
      "src/lib/mesh/buildDepthGeometry.test.ts",
      "src/lib/texture/**/*.test.ts",
    ],
  },
});
