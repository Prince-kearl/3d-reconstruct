import { Droplet, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CollapsibleSection,
  FieldLabel,
  NumberField,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { MESH_STATS, REFINE_HISTORY } from "@/data/refineMock";
import { cn } from "@/lib/utils";
import { useRefinement } from "@/stores/refinementStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

export function RefineProperties() {
  const s = useRefinement();
  const [tab, setTab] = useState<"Properties" | "History">("Properties");
  const [applying, setApplying] = useState(false);

  const apply = () => {
    setApplying(true);
    window.setTimeout(() => {
      setApplying(false);
      toast.success("Refinement applied", {
        description: "The refined mesh is ready for texturing.",
      });
    }, 900);
  };

  return (
    <aside className="flex w-[352px] shrink-0 flex-col border-l border-line bg-panel">
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
              tab === t ? "bg-accent/10 text-accent-2" : "text-txt-muted hover:text-txt",
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
          <ul className="space-y-[9px] text-[11px] text-txt-muted">
            {REFINE_HISTORY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Mesh Analysis">
            <dl className="space-y-[9px]">
              {MESH_STATS.map(({ label, value }) => (
                <Row key={label} label={label} value={value} />
              ))}
              <Row label="Mesh Health" value={`${s.meshHealth}%`} />
            </dl>
            <div className="mt-[10px] h-[4px] w-full overflow-hidden rounded-full bg-line-strong">
              <div
                className="h-full rounded-full bg-ok transition-[width]"
                style={{ width: `${s.meshHealth}%` }}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Active Tool">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[9px] pl-[6px]">
                <Droplet className="size-[15px] text-accent-2" strokeWidth={1.7} />
                <span className="text-[11.5px] text-txt">
                  {s.activeTool === "Smooth" ? "Smooth Brush" : `${s.activeTool} Brush`}
                </span>
              </div>
              <dl className="space-y-[9px]">
                <Row label="Size" value={`${s.brushSize} px`} />
                <Row label="Strength" value={`${s.strength}%`} />
                <Row label="Falloff" value={s.falloff} />
              </dl>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Preserve Details</FieldLabel>
                <ToggleSwitch
                  label="Preserve Details"
                  checked={s.preserveDetails}
                  onChange={s.setPreserveDetails}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Topology">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Target Density
                </FieldLabel>
                <Select
                  label="Target Density"
                  value={s.targetDensity}
                  onChange={s.setTargetDensity}
                  options={["Low", "Medium", "High", "Ultra", "Custom"]}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Adaptive Remesh</FieldLabel>
                <ToggleSwitch
                  label="Adaptive Remesh"
                  checked={s.adaptiveRemesh}
                  onChange={s.setAdaptiveRemesh}
                />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Voxel Size
                </FieldLabel>
                <div className="flex-1">
                  <NumberField label="Voxel Size" value={s.voxelSize} onChange={s.setVoxelSize} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Preserve Boundaries</FieldLabel>
                <ToggleSwitch
                  label="Preserve Boundaries"
                  checked={s.preserveBoundaries}
                  onChange={s.setPreserveBoundaries}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Comparison">
            <div className="space-y-[12px]">
              <SliderControl
                inline
                label="Before / After"
                value={s.comparison}
                onChange={s.setComparison}
                labelWidth={92}
              />
              <button
                type="button"
                onClick={() => {
                  s.setComparison(70);
                  toast("View reset");
                }}
                className="h-[32px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
              >
                Reset View
              </button>
            </div>
          </CollapsibleSection>

          <div className="px-[14px] py-[13px]">
            <button
              type="button"
              onClick={apply}
              disabled={applying || s.status === "running"}
              className="flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[13px] font-semibold text-app transition-opacity hover:opacity-95 disabled:opacity-70"
              style={{ background: "var(--gradient-lime)" }}
            >
              <Sparkles className="size-[15px]" />
              {applying ? "Applying refinement..." : "Apply Refinement"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}