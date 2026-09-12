import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

import { PanelSectionTitle, SliderControl, ToggleSwitch } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";
import type { CrystalMaterialSettings } from "./CrystalMeshViewer";

const TINTS: { label: string; color: string }[] = [
  { label: "Clear", color: "#ffffff" },
  { label: "Amber", color: "#ffb066" },
  { label: "Rose", color: "#ff8fa8" },
  { label: "Sapphire", color: "#6fa8ff" },
  { label: "Emerald", color: "#6fffb0" },
];

export function ExportPanel({
  material,
  onMaterialChange,
  autoRotate,
  onAutoRotateChange,
}: {
  material: CrystalMaterialSettings;
  onMaterialChange: (patch: Partial<CrystalMaterialSettings>) => void;
  autoRotate: boolean;
  onAutoRotateChange: (v: boolean) => void;
}) {
  const s = useReconstruct();

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:w-[300px]">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">EXPORT WORKSPACE</h1>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. PROJECT</PanelSectionTitle>
          <div className="mt-[8px] aspect-[16/11] w-full overflow-hidden rounded-[5px] border border-line bg-surface">
            {s.sourceImageUrl ? (
              <img
                src={s.sourceImageUrl}
                alt="Current project source"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-[14px] text-center text-[10.5px] text-txt-dim">
                No project loaded
              </div>
            )}
          </div>
          <p className="mt-[10px] truncate text-[11.5px] text-txt">{s.sourceFileName ?? "—"}</p>
          <p className="mt-[2px] text-[10.5px] text-txt-dim">
            {s.imageWidth ? `${s.imageWidth} × ${s.imageHeight}` : "—"}
          </p>
          <Link
            to="/reconstruct"
            search={s.projectId ? { project: s.projectId } : {}}
            className="mt-[11px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
          >
            <FolderOpen className="size-[13px]" />
            Open Full Reconstruction
          </Link>
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>2. CRYSTAL MATERIAL</PanelSectionTitle>
          <p className="mt-[8px] text-[10.5px] leading-[15px] text-txt-dim">
            Previews the real reconstructed mesh as glass/crystal — rotate the preview 360° to
            inspect the finished piece from every angle.
          </p>

          <div className="mt-[13px]">
            <span className="block text-[11px] text-txt-muted">Tint</span>
            <div className="mt-[8px] flex gap-[8px]">
              {TINTS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={material.color === t.color}
                  onClick={() => onMaterialChange({ color: t.color })}
                  className={cn(
                    "size-[26px] shrink-0 rounded-full border-2 transition-transform",
                    material.color === t.color
                      ? "scale-110 border-accent-2"
                      : "border-line hover:scale-105",
                  )}
                  style={{ background: t.color }}
                />
              ))}
            </div>
          </div>

          <div className="mt-[15px]">
            <SliderControl
              inline
              label="Clarity"
              value={material.clarity}
              onChange={(v) => onMaterialChange({ clarity: v })}
            />
          </div>

          <div className="mt-[13px] flex items-center justify-between">
            <span className="text-[11.5px] text-txt-muted">Auto Rotate</span>
            <ToggleSwitch label="Auto Rotate" checked={autoRotate} onChange={onAutoRotateChange} />
          </div>
        </section>
      </div>
    </aside>
  );
}
