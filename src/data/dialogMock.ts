export const IMPORT_QUEUE: {
  file: string;
  type: string;
  size: string;
  status: "Valid" | "Duplicate" | "Error";
  note: string;
}[] = [
  { file: "portrait-front.jpg", type: "JPEG Image", size: "4.2 MB", status: "Valid", note: "3024 × 4032" },
  { file: "portrait-side.jpg", type: "JPEG Image", size: "3.8 MB", status: "Valid", note: "3024 × 4032" },
  { file: "bust-scan.obj", type: "Wavefront OBJ", size: "148.2 MB", status: "Valid", note: "1.19M verts" },
  { file: "bust-scan.mtl", type: "Material Library", size: "2 KB", status: "Valid", note: "1 material" },
  { file: "skin-diffuse.png", type: "PNG Texture", size: "18.4 MB", status: "Duplicate", note: "Already in project" },
  { file: "crystal-base.stl", type: "Stereolithography", size: "6.1 MB", status: "Valid", note: "Watertight" },
  { file: "reference.heic", type: "HEIC Image", size: "5.5 MB", status: "Error", note: "Unsupported codec" },
  { file: "notes.txt", type: "Plain Text", size: "1 KB", status: "Error", note: "Not an asset type" },
];

export const IMPORT_SETTINGS = [
  { label: "Copy files into project folder", value: true },
  { label: "Generate preview thumbnails", value: true },
  { label: "Auto-detect subject in photos", value: true },
  { label: "Validate mesh on import", value: false },
];

export const DUPLICATE_MODES = ["Skip", "Replace", "Keep Both"] as const;

export const EXPORT_SUMMARY: [string, string][] = [
  ["File name", "portrait-project.obj"],
  ["Format", "Wavefront OBJ + MTL"],
  ["Quality", "High (Laser Ready)"],
  ["Polycount", "2,496,980 tris"],
  ["File size", "148.2 MB"],
  ["Output path", "D:/dxf2obj/portrait-project/export"],
  ["Duration", "31.4 s"],
];

export const EXPORT_VALIDATION = [
  { name: "Mesh integrity", ok: true },
  { name: "Watertight surface", ok: true },
  { name: "Normals consistent", ok: true },
  { name: "Within crystal bounds", ok: true },
  { name: "Point cloud density", ok: true },
];

export const CRYSTAL_PRODUCTION: [string, string][] = [
  ["Crystal size", "14.8 × 20.0 × 11.6 cm"],
  ["Engraving points", "1,186,420"],
  ["Estimated laser time", "18 min 40 s"],
  ["Machine profile", "Vitrolux V3"],
];

export const PROCESS_STAGES = [
  "Preprocessing",
  "Human Detection",
  "Mesh Generation",
  "Refinement",
  "Post Processing",
] as const;

export const PROCESS_LOG = [
  "[10:31:02] Session started — Balanced mode",
  "[10:31:08] Source image normalised (1024 × 1280)",
  "[10:31:15] Human detection: 1 person detected",
  "[10:31:29] Background matte generated",
  "[10:31:44] Base mesh generated — 812,344 verts",
  "[10:32:01] Refining geometry (pass 2 of 3)...",
];