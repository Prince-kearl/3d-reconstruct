import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import * as THREE from "three";

export type ExportFormat = "obj" | "glb" | "stl";

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Builds the actual generated mesh (geometry + baked texture) as a real exportable file blob. */
export async function buildExportBlob(mesh: THREE.Mesh, format: ExportFormat): Promise<Blob> {
  if (format === "obj") {
    const exporter = new OBJExporter();
    const text = exporter.parse(mesh);
    return new Blob([text], { type: "text/plain" });
  }

  if (format === "stl") {
    const exporter = new STLExporter();
    const result = exporter.parse(mesh, { binary: true });
    return new Blob([result], { type: "model/stl" });
  }

  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(mesh, { binary: true });
  return new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
}

/** Builds and downloads the export in one step. */
export async function exportMesh(
  mesh: THREE.Mesh,
  format: ExportFormat,
  fileName: string,
): Promise<void> {
  const blob = await buildExportBlob(mesh, format);
  downloadBlob(blob, fileName);
}
