export const EXPORT_FORMATS = [
  { id: "OBJ", desc: "Wavefront" },
  { id: "STL", desc: "Stereolitho" },
  { id: "PLY", desc: "Polygon" },
  { id: "FBX", desc: "Autodesk" },
  { id: "GLB", desc: "glTF Binary" },
  { id: "3MF", desc: "3D Manufact." },
] as const;

export const EXPORT_STAGES = [
  "Geometry Check",
  "Crystal Fitting",
  "Mesh Optimisation",
  "File Writing",
  "Validation",
] as const;

export const EXPORT_LOGS = [
  "[10:44:02] Textured model loaded",
  "[10:44:05] Manifold check passed",
  "[10:44:09] Crystal volume fitted — 14.8 × 20.0 × 11.6 cm",
  "[10:44:18] Mesh decimated to 1,186,420 verts",
  "[10:44:27] Writing portrait-project.obj",
  "[10:44:33] Export complete — 148.2 MB",
];

export const EXPORT_SEQUENCE: {
  status: string;
  progress: number;
  stage: number;
  logs: string[];
}[] = [
  {
    status: "Checking geometry...",
    progress: 18,
    stage: 1,
    logs: ["[10:44:02] Textured model loaded", "[10:44:05] Manifold check passed"],
  },
  {
    status: "Fitting crystal volume...",
    progress: 42,
    stage: 2,
    logs: ["[10:44:09] Crystal volume fitted — 14.8 × 20.0 × 11.6 cm"],
  },
  {
    status: "Optimising mesh...",
    progress: 68,
    stage: 3,
    logs: ["[10:44:18] Mesh decimated to 1,186,420 verts"],
  },
  {
    status: "Writing file...",
    progress: 88,
    stage: 4,
    logs: ["[10:44:27] Writing portrait-project.obj"],
  },
  {
    status: "Validating output...",
    progress: 100,
    stage: 5,
    logs: ["[10:44:33] Export complete — 148.2 MB"],
  },
];

export const EXPORT_CHECKS = [
  { name: "Watertight mesh", ok: true },
  { name: "No self-intersections", ok: true },
  { name: "Normals consistent", ok: true },
  { name: "Fits crystal bounds", ok: true },
  { name: "Laser-ready point cloud", ok: true },
];

export const EXPORT_HISTORY = [
  "10:44:33 — portrait-project.obj exported",
  "10:44:27 — Output path set",
  "10:44:18 — Mesh optimised",
  "10:44:09 — Crystal size changed",
  "10:44:02 — Export session started",
];

export const CRYSTAL_PRESETS = ["Small 10×14×8", "Medium 14.8×20×11.6", "Large 18×24×14", "Custom"];

export const UNITS = ["Millimetres", "Centimetres", "Inches"];