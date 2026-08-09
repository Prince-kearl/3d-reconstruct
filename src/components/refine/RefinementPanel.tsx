import {
  CircleDashed,
  CirclePlus,
  Droplet,
  FoldHorizontal,
  Hand,
  Minimize2,
  RefreshCw,
  Trash2,
  Waves,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import {
  FieldLabel,
  PanelSectionTitle,
  SegmentedControl,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useRefinement, type RefinementTool } from "@/stores/refinementStore";

const TOOLS: { label: RefinementTool; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { label: "Smooth", icon: Droplet },
  { label: "Relax", icon: Waves },
  { label: "Inflate", icon: CirclePlus },
  { label: "Flatten", icon: FoldHorizontal },
  { label: "Pinch", icon: Minimize2 },
  { label: "Grab", icon: Hand },
  { label: "Fill Holes", icon: CircleDashed },
  { label: "Remove Artifacts", icon: Trash2 },
];

export function RefinementPanel() {
  const s = useRefinement();

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">MESH REFINEMENT</h1>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. REFINEMENT TOOLS</PanelSectionTitle>
          <div className="mt-[12px] grid grid-cols-2 gap-[8px]">
            {TOOLS.map(({ label, icon: Icon }) => {
              const selected = s.activeTool === label;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => s.setActiveTool(label)}
                  className={cn(
                    "flex h-[58px] flex-col items-center justify-center gap-[6px] rounded-[5px] border text-[11px] transition-colors",
                    selected
                      ? "border-accent-2/80 bg-accent/22 text-txt shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]"
                      : "border-line bg-surface text-txt-muted hover:border-line-strong hover:text-txt",
                  )}
                >
                  <Icon
                    className={cn("size-[15px]", selected ? "text-accent-2" : "text-txt-dim")}
                    strokeWidth={1.7}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>2. BRUSH SETTINGS</PanelSectionTitle>
          <div className="mt-[13px] space-y-[11px]">
            <SliderControl
              inline
              label="Brush Size"
              min={4}
              max={120}
              value={s.brushSize}
              onChange={s.setBrushSize}
              format={(v) => `${v} px`}
              labelWidth={74}
            />
            <SliderControl
              inline
              label="Strength"
              value={s.strength}
              onChange={s.setStrength}
              labelWidth={74}
            />
            <div className="flex items-center gap-[10px]">
              <FieldLabel className="w-[74px] shrink-0">Falloff</FieldLabel>
              <Select
                label="Falloff"
                value={s.falloff}
                onChange={s.setFalloff}
                options={["Smooth", "Linear", "Sharp", "Constant"]}
                className="flex-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Symmetry X</FieldLabel>
              <ToggleSwitch label="Symmetry X" checked={s.symmetryX} onChange={s.setSymmetryX} />
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Surface Only</FieldLabel>
              <ToggleSwitch
                label="Surface Only"
                checked={s.surfaceOnly}
                onChange={s.setSurfaceOnly}
              />
            </div>
          </div>
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>3. AUTOMATIC CLEANUP</PanelSectionTitle>
          <div className="mt-[13px] space-y-[11px]">
            <div className="flex items-center justify-between">
              <FieldLabel>Remove Spikes</FieldLabel>
              <ToggleSwitch
                label="Remove Spikes"
                checked={s.removeSpikes}
                onChange={s.setRemoveSpikes}
              />
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Fix Non-Manifold</FieldLabel>
              <ToggleSwitch
                label="Fix Non-Manifold"
                checked={s.fixNonManifold}
                onChange={s.setFixNonManifold}
              />
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Close Small Holes</FieldLabel>
              <ToggleSwitch
                label="Close Small Holes"
                checked={s.closeSmallHoles}
                onChange={s.setCloseSmallHoles}
              />
            </div>
            <div className="space-y-[7px]">
              <FieldLabel>Quality</FieldLabel>
              <SegmentedControl
                options={["Fast", "Balanced", "Precise"] as const}
                value={s.quality}
                onChange={s.setQuality}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={s.runAutoRefine}
            disabled={s.status === "running"}
            className="mt-[15px] flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95 disabled:opacity-60"
            style={{ background: "var(--gradient-accent)" }}
          >
            <RefreshCw className={cn("size-[14px]", s.status === "running" && "animate-spin")} />
            {s.status === "running" ? "Refining..." : "Run Auto Refine"}
          </button>
          <p className="mt-[9px] text-center text-[10.5px] text-txt-dim">
            Estimated time: 45–90 sec
          </p>
        </section>
      </div>
    </aside>
  );
}