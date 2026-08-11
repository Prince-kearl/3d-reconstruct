export type SceneNode = {
  id: string;
  name: string;
  type: "Mesh" | "Volume" | "Base" | "Ground" | "Light" | "Camera";
  depth: number;
};

export const SCENE_TREE: SceneNode[] = [
  { id: "root", name: "Portrait Scene", type: "Volume", depth: 0 },
  { id: "bust", name: "Bust", type: "Mesh", depth: 1 },
  { id: "crystal", name: "Crystal", type: "Volume", depth: 1 },
  { id: "base", name: "Base", type: "Base", depth: 1 },
  { id: "ground", name: "Ground", type: "Ground", depth: 1 },
  { id: "key-light", name: "Key Light", type: "Light", depth: 1 },
  { id: "cam", name: "Camera 01", type: "Camera", depth: 1 },
];

export const SAVED_SCENES = [
  { name: "Studio Neutral", meta: "4 objects • 2 lights" },
  { name: "Crystal Showcase", meta: "5 objects • 3 lights" },
  { name: "Turntable Demo", meta: "4 objects • 1 light" },
  { name: "Print Layout", meta: "6 objects • 2 lights" },
];

export const SCENE_LOGS = [
  "[11:02:04] Scene 'Studio Neutral' loaded",
  "[11:02:07] 4 objects, 2 lights initialised",
  "[11:02:12] Bust transform gizmo attached",
  "[11:02:20] Crystal volume linked to bust bounds",
  "[11:02:28] Camera 01 framed on subject",
  "[11:02:31] Scene ready",
];

export const SCENE_STAGES = [
  "Scene Load",
  "Object Linking",
  "Lighting Setup",
  "Camera Framing",
  "Validation",
] as const;

export const SCENE_CAMERAS = ["Camera 01", "Camera 02", "Turntable", "Top Rig"];

export const SCENE_HISTORY = [
  "11:02:31 — Scene saved",
  "11:02:28 — Camera framed",
  "11:02:20 — Crystal linked",
  "11:02:12 — Bust moved",
  "11:02:04 — Scene loaded",
];

export const LIGHT_PRESETS = ["Studio", "Soft Box", "Rim", "Dramatic", "Flat"];
export const GIZMO_MODES = ["Move", "Rotate", "Scale"] as const;