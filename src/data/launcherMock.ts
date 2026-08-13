export const QUICK_ACTIONS = [
  { label: "New Project", hint: "Ctrl+N", kind: "primary" as const },
  { label: "Open Project", hint: "Ctrl+O", kind: "ghost" as const },
  { label: "Import Assets", hint: "Ctrl+I", kind: "ghost" as const },
  { label: "Open Last Session", hint: "Ctrl+L", kind: "ghost" as const },
  { label: "Recover Autosave", hint: "", kind: "ghost" as const },
];

export type ProjectStatus = "Ready" | "Refining" | "Texturing" | "Exported" | "Error";

export const RECENT_PROJECTS: {
  name: string;
  path: string;
  status: ProjectStatus;
  opened: string;
  size: string;
  stage: string;
  progress: number;
}[] = [
  {
    name: "Portrait Project",
    path: "D:/dxf2obj/portrait-project",
    status: "Ready",
    opened: "2 minutes ago",
    size: "148.2 MB",
    stage: "Export complete",
    progress: 100,
  },
  {
    name: "Family Crystal 3D",
    path: "D:/dxf2obj/family-crystal-3d",
    status: "Refining",
    opened: "1 hour ago",
    size: "96.4 MB",
    stage: "Mesh refinement 68%",
    progress: 68,
  },
  {
    name: "Studio Bust 04",
    path: "D:/dxf2obj/studio-bust-04",
    status: "Texturing",
    opened: "Yesterday, 18:12",
    size: "212.8 MB",
    stage: "Texture bake 41%",
    progress: 41,
  },
  {
    name: "Wedding Duo",
    path: "D:/dxf2obj/wedding-duo",
    status: "Exported",
    opened: "12 Aug, 09:44",
    size: "184.0 MB",
    stage: "Sent to laser queue",
    progress: 100,
  },
  {
    name: "Client Test 22",
    path: "D:/dxf2obj/client-test-22",
    status: "Error",
    opened: "11 Aug, 15:02",
    size: "12.6 MB",
    stage: "Reconstruction failed",
    progress: 24,
  },
  {
    name: "Pet Portrait Trial",
    path: "D:/dxf2obj/pet-portrait-trial",
    status: "Ready",
    opened: "09 Aug, 11:30",
    size: "72.1 MB",
    stage: "Awaiting export",
    progress: 100,
  },
];

export const READINESS_CHECKS = [
  { name: "GPU driver", detail: "566.36 — up to date", ok: true },
  { name: "CUDA runtime", detail: "12.4 available", ok: true },
  { name: "ECON engine", detail: "v1.8 models cached", ok: true },
  { name: "Workspace paths", detail: "D:/dxf2obj writable", ok: true },
  { name: "Autosave service", detail: "Running — 5 min interval", ok: true },
  { name: "Laser queue link", detail: "Connected", ok: true },
];

export const LAUNCHER_TIPS = [
  "Use Crystal Portrait templates to fit laser bounds automatically.",
  "Autosave keeps the last 10 revisions per project.",
  "Press Ctrl+` anywhere to open the live console.",
];

export const PROJECT_TEMPLATES = [
  {
    id: "Single Portrait",
    desc: "One subject, front-facing photo",
    detail: "ECON balanced · 1.2M verts",
  },
  {
    id: "Crystal Portrait",
    desc: "Fitted to crystal block bounds",
    detail: "Crystal 14.8 × 20.0 × 11.6 cm",
  },
  { id: "Group Scene", desc: "Two or more subjects", detail: "Multi-mesh scene graph" },
  { id: "Object Scan", desc: "Non-human object capture", detail: "Photogrammetry preset" },
  { id: "Empty Project", desc: "Start from nothing", detail: "No presets applied" },
];

export const WIZARD_STEPS = [
  "Project Setup",
  "Source Image",
  "Reconstruction",
  "Crystal & Output",
  "Review",
] as const;