export type Version = {
  id: string;
  name: string;
  stage: "Reconstruct" | "Refine" | "Texture" | "Export";
  time: string;
  verts: string;
  note: string;
};

export const VERSIONS: Version[] = [
  {
    id: "v1.0",
    name: "Initial Reconstruction",
    stage: "Reconstruct",
    time: "10:12",
    verts: "842,110",
    note: "Photogrammetry pass from source portrait",
  },
  {
    id: "v1.1",
    name: "Base Mesh Clean",
    stage: "Refine",
    time: "10:24",
    verts: "914,502",
    note: "Holes filled, normals unified",
  },
  {
    id: "v1.2",
    name: "Refined Mesh",
    stage: "Refine",
    time: "10:31",
    verts: "1,024,880",
    note: "Smoothing and detail recovery",
  },
  {
    id: "v1.3",
    name: "Textured Model",
    stage: "Texture",
    time: "10:38",
    verts: "1,186,420",
    note: "Photo projection, PBR maps generated",
  },
  {
    id: "v1.4",
    name: "Final Scene",
    stage: "Export",
    time: "10:44",
    verts: "1,186,420",
    note: "Crystal fitted, export ready",
  },
];

export const HISTORY_FILTERS = ["All", "Reconstruct", "Refine", "Texture", "Export"] as const;

export const HISTORY_LOGS = [
  "[10:12:08] v1.0 Initial Reconstruction created",
  "[10:24:41] v1.1 Base Mesh Clean created",
  "[10:31:51] v1.2 Refined Mesh created",
  "[10:38:12] v1.3 Textured Model created",
  "[10:44:33] v1.4 Final Scene created",
  "[10:46:02] Comparing v1.1 → v1.4",
];

export const DIFF_STATS = [
  { label: "Vertices added", value: "+271,918" },
  { label: "Triangles added", value: "+543,836" },
  { label: "Texture sets", value: "+4" },
  { label: "Volume change", value: "+2.4%" },
  { label: "Steps between", value: "3" },
];