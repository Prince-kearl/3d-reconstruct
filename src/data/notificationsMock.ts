export type NoteKind = "success" | "warning" | "error" | "info" | "processing";

export const NOTIFICATIONS: {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  time: string;
  category: "Processing" | "System" | "Exports";
  unread: boolean;
}[] = [
  {
    id: "n1",
    kind: "success",
    title: "Export complete",
    body: "portrait-project.obj written — 148.2 MB",
    time: "10:44",
    category: "Exports",
    unread: true,
  },
  {
    id: "n2",
    kind: "processing",
    title: "Texture bake running",
    body: "Studio Bust 04 — 41% complete",
    time: "10:39",
    category: "Processing",
    unread: true,
  },
  {
    id: "n3",
    kind: "warning",
    title: "VRAM approaching limit",
    body: "10.8 / 12 GB in use — consider Low VRAM preset",
    time: "10:28",
    category: "System",
    unread: true,
  },
  {
    id: "n4",
    kind: "error",
    title: "Reconstruction failed",
    body: "Client Test 22 — no subject detected in source image",
    time: "09:58",
    category: "Processing",
    unread: false,
  },
  {
    id: "n5",
    kind: "info",
    title: "Autosave created",
    body: "Revision v1.4 stored locally",
    time: "09:41",
    category: "System",
    unread: false,
  },
  {
    id: "n6",
    kind: "success",
    title: "Laser queue accepted job",
    body: "Wedding Duo — position 2 in queue",
    time: "09:12",
    category: "Exports",
    unread: false,
  },
];

export const NOTE_TABS = ["All", "Processing", "System", "Exports"] as const;

export const TOAST_SAMPLES: {
  kind: NoteKind;
  title: string;
  body: string;
  action?: string;
}[] = [
  { kind: "success", title: "Refinement applied", body: "Mesh updated — 1.19M verts", action: "View" },
  { kind: "warning", title: "Non-manifold edges", body: "12 edges need attention", action: "Inspect" },
  { kind: "error", title: "Export failed", body: "Disk full on D:/", action: "Retry" },
  { kind: "processing", title: "Reconstructing", body: "Stage 3 of 5 — 72%" },
  { kind: "info", title: "Autosave enabled", body: "Every 5 minutes" },
];