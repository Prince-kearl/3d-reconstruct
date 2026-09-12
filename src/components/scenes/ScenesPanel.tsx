import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

import { PanelSectionTitle, SliderControl, ToggleSwitch } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";
import type { SceneStagingSettings } from "@/components/export/CrystalMeshViewer";

const BACKDROPS: { label: string; color: string }[] = [
  { label: "Slate", color: "#4a5064" },
  { label: "Charcoal", color: "#26282f" },
  { label: "Midnight", color: "#1c2438" },
  { label: "Warm Grey", color: "#5a5148" },
  { label: "Ivory", color: "#8a8578" },
];

export function ScenesPanel({
  scene,
  onSceneChange,
}: {
  scene: SceneStagingSettings;
  onSceneChange: (patch: Partial<SceneStagingSettings>) => void;
}) {
  const s = useReconstruct();

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:w-[300px]">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">SCENE WORKSPACE</h1>
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

        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>2. SCENE OBJECTS</PanelSectionTitle>
          <div className="mt-[11px] space-y-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-txt-muted">Bust</span>
              <ToggleSwitch
                label="Show bust"
                checked={scene.showBust}
                onChange={(v) => onSceneChange({ showBust: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-txt-muted">Crystal Block</span>
              <ToggleSwitch
                label="Show crystal block"
                checked={scene.showCrystal}
                onChange={(v) => onSceneChange({ showCrystal: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-txt-muted">Pedestal</span>
              <ToggleSwitch
                label="Show pedestal"
                checked={scene.showBase}
                onChange={(v) => onSceneChange({ showBase: v })}
              />
            </div>
          </div>
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>3. LIGHTING</PanelSectionTitle>
          <div className="mt-[13px] space-y-[11px]">
            <SliderControl
              inline
              label="Key Light"
              value={scene.keyLight}
              onChange={(v) => onSceneChange({ keyLight: v })}
            />
            <SliderControl
              inline
              label="Fill Light"
              value={scene.fillLight}
              onChange={(v) => onSceneChange({ fillLight: v })}
            />
            <SliderControl
              inline
              label="Ambient"
              value={scene.ambient}
              onChange={(v) => onSceneChange({ ambient: v })}
            />
          </div>

          <div className="mt-[15px]">
            <span className="block text-[11px] text-txt-muted">Backdrop</span>
            <div className="mt-[8px] flex gap-[8px]">
              {BACKDROPS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  title={b.label}
                  aria-label={b.label}
                  aria-pressed={scene.backdrop === b.color}
                  onClick={() => onSceneChange({ backdrop: b.color })}
                  className={cn(
                    "size-[26px] shrink-0 rounded-full border-2 transition-transform",
                    scene.backdrop === b.color
                      ? "scale-110 border-accent-2"
                      : "border-line hover:scale-105",
                  )}
                  style={{ background: b.color }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
