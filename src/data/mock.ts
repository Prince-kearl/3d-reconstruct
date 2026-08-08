export const MENU_ITEMS = ["File", "Edit", "View", "Workspace", "Tools", "Help"] as const;

export const CONSOLE_LINES = [
  "[10:24:31] Image loaded successfully (1024x1280)",
  "[10:24:32] Human detection: 1 person detected",
  "[10:24:33] Background removal: completed",
  "[10:24:34] Starting ECON reconstruction (Balanced mode)...",
  "[10:25:12] Initial mesh generated",
  "[10:25:28] Refining geometry...",
  "[10:26:05] Hole filling completed",
  "[10:26:18] Final mesh ready",
];

export const PROGRESS_STEPS = [
  "Preprocessing",
  "Human Detection",
  "Mesh Generation",
  "Refinement",
  "Post Processing",
  "Completed",
];

export const MODEL_INFO: { label: string; value: string }[] = [
  { label: "Vertices", value: "1,248,532" },
  { label: "Faces", value: "2,496,980" },
  { label: "Triangles", value: "2,496,980" },
  { label: "Size", value: "18.6 x 24.7 x 18.4 cm" },
];