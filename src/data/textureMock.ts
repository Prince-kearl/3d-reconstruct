export const TEXTURE_LOGS = [
  "[10:31:02] Refined mesh loaded",
  "[10:31:04] Source image aligned",
  "[10:31:08] Facial landmarks matched",
  "[10:31:22] Base color projected",
  "[10:31:36] Texture seams blended",
  "[10:31:48] Material maps generated",
  "[10:31:51] Texture ready",
];

export const TEXTURE_STAGES = [
  "Image Alignment",
  "Color Projection",
  "Seam Blending",
  "Map Generation",
  "Validation",
] as const;

export const TEXTURE_SEQUENCE: {
  status: string;
  progress: number;
  stage: number;
  logs: string[];
}[] = [
  {
    status: "Aligning source image...",
    progress: 15,
    stage: 1,
    logs: [
      "[10:31:02] Refined mesh loaded",
      "[10:31:04] Source image aligned",
      "[10:31:08] Facial landmarks matched",
    ],
  },
  {
    status: "Projecting base color...",
    progress: 35,
    stage: 2,
    logs: ["[10:31:22] Base color projected"],
  },
  {
    status: "Blending seams...",
    progress: 60,
    stage: 3,
    logs: ["[10:31:36] Texture seams blended"],
  },
  {
    status: "Generating material maps...",
    progress: 85,
    stage: 4,
    logs: ["[10:31:48] Material maps generated"],
  },
  {
    status: "Validating texture...",
    progress: 100,
    stage: 5,
    logs: ["[10:31:51] Texture ready"],
  },
];

export const TEXTURE_LAYERS = [
  { name: "Base Projection", opacity: "100%" },
  { name: "Skin Correction", opacity: "78%" },
  { name: "Hair Detail", opacity: "64%" },
  { name: "Seam Blending", opacity: "50%" },
  { name: "Manual Adjustments", opacity: "35%" },
];

export const TEXTURE_HISTORY = [
  "10:31:51 — Texture applied",
  "10:31:48 — Material map updated",
  "10:31:36 — Colour adjusted",
  "10:31:22 — Texture generated",
  "10:31:04 — Source aligned",
];

export const SKIN_PRESETS = [
  "Natural Skin",
  "Soft Portrait",
  "High Detail",
  "Studio Neutral",
  "Warm Skin",
  "Custom",
];

export const BLEND_MODES = ["Normal", "Multiply", "Overlay", "Soft Light", "Color", "Add"];

export const SHADERS = [
  "PBR Skin",
  "Standard PBR",
  "Matte",
  "Crystal Preview",
  "Unlit",
  "Custom",
];