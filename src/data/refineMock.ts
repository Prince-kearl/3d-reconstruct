export const REFINE_LOGS = [
  "[10:27:02] Reconstruction mesh loaded",
  "[10:27:04] Mesh analysis completed",
  "[10:27:05] 14 surface artifacts detected",
  "[10:27:18] Smoothing pass applied",
  "[10:27:25] Non-manifold edges repaired",
  "[10:27:29] Refined mesh ready",
];

export const REFINE_STAGES = [
  "Mesh Analysis",
  "Artifact Removal",
  "Surface Smoothing",
  "Topology Repair",
  "Validation",
] as const;

export const REFINE_SEQUENCE: {
  status: string;
  progress: number;
  stage: number;
  logs: string[];
}[] = [
  {
    status: "Analysing mesh...",
    progress: 20,
    stage: 1,
    logs: [
      "[10:27:02] Reconstruction mesh loaded",
      "[10:27:04] Mesh analysis completed",
      "[10:27:05] 14 surface artifacts detected",
    ],
  },
  {
    status: "Removing artifacts...",
    progress: 40,
    stage: 2,
    logs: ["[10:27:11] Surface artifacts removed"],
  },
  {
    status: "Smoothing surface...",
    progress: 65,
    stage: 3,
    logs: ["[10:27:18] Smoothing pass applied"],
  },
  {
    status: "Repairing topology...",
    progress: 85,
    stage: 4,
    logs: ["[10:27:25] Non-manifold edges repaired"],
  },
  {
    status: "Validating mesh...",
    progress: 100,
    stage: 5,
    logs: ["[10:27:29] Refined mesh ready"],
  },
];

export const MESH_STATS: { label: string; value: string }[] = [
  { label: "Vertices", value: "1,186,420" },
  { label: "Faces", value: "2,372,836" },
  { label: "Non-Manifold Edges", value: "0" },
  { label: "Open Holes", value: "0" },
];

export const REFINE_HISTORY = [
  "10:27:29 — Refined mesh ready",
  "10:27:25 — Non-manifold edges repaired",
  "10:27:18 — Smoothing pass applied",
  "10:27:11 — Surface artifacts removed",
  "10:27:04 — Mesh analysis completed",
];