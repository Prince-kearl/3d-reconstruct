import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as THREE from "three";

import { buildExportBlob, downloadBlob, type ExportFormat } from "@/lib/mesh/exportMesh";
import { projectStore } from "@/lib/projects";
import { cn } from "@/lib/utils";
import {
  QUALITY_SEGMENTS,
  useReconstruct,
  type ReconstructionMode,
} from "@/stores/reconstructStore";
import {
  CollapsibleSection,
  FieldLabel,
  NumberField,
  SegmentedControl,
  Select,
  SliderControl,
} from "./primitives";

const MODE_LABELS: Record<ReconstructionMode, string> = {
  "depth-only": "Depth Only",
  "ai-multi-view": "AI Multi-View",
};

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "glb", label: "GLB (with texture)" },
  { value: "obj", label: "OBJ (geometry only)" },
  { value: "stl", label: "STL (3D printing)" },
];

export function PropertiesPanel() {
  const s = useReconstruct();
  const [tab, setTab] = useState<"Properties" | "History">("Properties");
  const [format, setFormat] = useState<ExportFormat>("glb");
  const [exportScaleCm, setExportScaleCm] = useState("20.0");
  const ready = s.status === "ready" && s.geometry && s.texture;

  const modelInfo = [
    { label: "Vertices", value: s.vertexCount.toLocaleString() },
    { label: "Faces", value: s.faceCount.toLocaleString() },
    { label: "Triangles", value: s.faceCount.toLocaleString() },
    {
      label: "Source Resolution",
      value: s.imageWidth ? `${s.imageWidth} × ${s.imageHeight}` : "—",
    },
    {
      label: "Mesh Grid",
      value: `${QUALITY_SEGMENTS[s.quality]} × ${QUALITY_SEGMENTS[s.quality]}`,
    },
  ];

  const handleExport = async () => {
    if (!s.geometry || !s.texture) return;
    const cm = Number.parseFloat(exportScaleCm) || 20;
    const physicalScale = cm / 20; // 20 world-units-wide baseline maps to the requested cm width
    const geometry = s.geometry.clone();
    geometry.scale(physicalScale, physicalScale, physicalScale);
    const material = new THREE.MeshStandardMaterial({
      map: format === "glb" ? s.texture : null,
      transparent: format === "glb",
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(s.scale);
    mesh.rotation.y = (s.rotationY * Math.PI) / 180;

    try {
      const blob = await buildExportBlob(mesh, format);
      downloadBlob(blob, `${s.sourceFileName?.replace(/\.[^.]+$/, "") ?? "model"}.${format}`);
      toast.success(
        `Exported ${format.toUpperCase()} — ${s.vertexCount.toLocaleString()} vertices`,
      );

      if (s.projectId) {
        try {
          await projectStore.recordExport(s.projectId, { modelBlob: blob, modelFormat: format });
        } catch {
          toast.error("Export downloaded, but couldn't save it to your project");
        }
      }
    } catch {
      toast.error("Export failed");
    } finally {
      geometry.dispose();
      material.dispose();
    }
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-panel lg:border-l lg:border-line">
      <div
        role="tablist"
        className="flex h-[44px] shrink-0 items-center border-b border-line px-[8px]"
      >
        {(["Properties", "History"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative h-full px-[14px] text-[12px] transition-colors",
              tab === t ? "text-accent-2" : "text-txt-muted hover:text-txt",
            )}
          >
            {t}
            {tab === t ? (
              <span className="absolute inset-x-[8px] top-0 h-[2px] rounded-b bg-accent-2" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "History" ? (
        <div className="scroll-thin flex-1 overflow-y-auto px-[16px] py-[14px]">
          {s.logLines.length ? (
            <ul className="space-y-[9px] text-[11px] text-txt-muted">
              {[...s.logLines].reverse().map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-txt-dim">No activity yet — upload a photo to begin.</p>
          )}
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Model Info">
            <dl className="space-y-[9px]">
              {modelInfo.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
                  <dd className="text-[11.5px] text-txt">{value}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Transform">
            <div className="space-y-[9px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">Scale</FieldLabel>
                <NumberField
                  label="Uniform scale"
                  value={s.scale.toFixed(2)}
                  onChange={(v) => {
                    const n = Number.parseFloat(v);
                    if (Number.isFinite(n)) s.setScale(n);
                  }}
                />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">
                  Rotation Y
                </FieldLabel>
                <NumberField
                  label="Rotation around Y axis, degrees"
                  value={`${s.rotationY}°`}
                  onChange={(v) => {
                    const n = Number.parseFloat(v);
                    if (Number.isFinite(n)) s.setRotationY(n);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={s.resetTransform}
                className="mt-[4px] h-[30px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
              >
                Reset Transform
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Reconstruction Mode">
            <div className="space-y-[9px]">
              <SegmentedControl
                options={["Depth Only", "AI Multi-View"] as const}
                value={MODE_LABELS[s.reconstructionMode]}
                onChange={(label) =>
                  s.setReconstructionMode(
                    label === "AI Multi-View" ? "ai-multi-view" : "depth-only",
                  )
                }
              />
              <p className="pl-[6px] text-[10.5px] leading-[15px] text-txt-dim">
                {s.reconstructionMode === "ai-multi-view"
                  ? "Uses AI-generated side views to shape geometry when available — manage generation in Refine."
                  : "Uses only the front photo's depth map — today's default, works everywhere."}
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Depth Shaping">
            <div className="space-y-[11px]">
              <SliderControl
                inline
                label="Edge Feather"
                value={s.edgeFeather}
                onChange={s.setEdgeFeather}
              />
              <SliderControl
                inline
                label="Smoothing"
                value={s.smoothing}
                onChange={s.setSmoothing}
              />
              <SliderControl
                inline
                label="Depth Intensity"
                value={s.detail}
                onChange={s.setDetail}
              />
              <SliderControl inline label="Volume" value={s.volume} onChange={s.setVolume} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Output Settings">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Format
                </FieldLabel>
                <Select
                  label="Format"
                  value={FORMAT_OPTIONS.find((f) => f.value === format)?.label ?? ""}
                  onChange={(label) =>
                    setFormat(FORMAT_OPTIONS.find((f) => f.label === label)?.value ?? "glb")
                  }
                  options={FORMAT_OPTIONS.map((f) => f.label)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Scale (cm)
                </FieldLabel>
                <div className="flex-1">
                  <div className="flex h-[30px] items-center rounded-[4px] border border-line bg-surface px-[10px]">
                    <input
                      aria-label="Physical width in centimetres"
                      value={exportScaleCm}
                      onChange={(e) => setExportScaleCm(e.target.value)}
                      className="w-full bg-transparent text-[11.5px] text-txt outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <div className="px-[14px] py-[13px]">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={!ready}
              className="flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[13px] font-semibold text-app transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gradient-lime)" }}
            >
              <Upload className="size-[15px]" />
              Export Model
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
