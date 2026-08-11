import { Box, Save } from "lucide-react";
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
import { SCENE_CAMERAS, SCENE_HISTORY, SCENE_TREE } from "@/data/scenesMock";
import { cn } from "@/lib/utils";
import { useScenes } from "@/stores/scenesStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

export function ScenesProperties() {
  const s = useScenes();
  const [tab, setTab] = useState<"Properties" | "History">("Properties");
  const selected = SCENE_TREE.find((n) => n.id === s.selectedId) ?? SCENE_TREE[1]!;

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
            {SCENE_HISTORY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Scene Info">
            <dl className="space-y-[9px]">
              <Row label="Scene" value={s.activeScene} />
              <Row label="Objects" value={`${SCENE_TREE.length - 1}`} />
              <Row label="Lights" value="2" />
              <Row label="Cameras" value={`${SCENE_CAMERAS.length}`} />
              <Row label="Hidden" value={`${s.hidden.length}`} />
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Selected Object">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[9px] pl-[6px]">
                <Box className="size-[15px] text-accent-2" strokeWidth={1.7} />
                <span className="text-[11.5px] text-txt">{selected.name}</span>
                <span className="ml-auto text-[10.5px] text-txt-dim">{selected.type}</span>
              </div>
              <FieldLabel className="block pl-[6px]">Position</FieldLabel>
              <div className="grid grid-cols-3 gap-[6px]">
                <NumberField label="Position X" prefix="X" value={s.posX} onChange={s.setPosX} />
                <NumberField label="Position Y" prefix="Y" value={s.posY} onChange={s.setPosY} />
                <NumberField label="Position Z" prefix="Z" value={s.posZ} onChange={s.setPosZ} />
              </div>
              <SliderControl
                inline
                label="Rotate Y"
                min={-180}
                max={180}
                value={s.rotY}
                onChange={s.setRotY}
                format={(v) => `${v}°`}
                labelWidth={86}
              />
              <SliderControl
                inline
                label="Scale"
                min={20}
                max={200}
                value={s.scale}
                onChange={s.setScale}
                labelWidth={86}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Camera">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[100px] shrink-0 pl-[6px] text-[11.5px]">
                  Active
                </FieldLabel>
                <Select
                  label="Active camera"
                  value={s.camera}
                  options={SCENE_CAMERAS}
                  onChange={s.setCamera}
                  className="flex-1"
                />
              </div>
              <dl className="space-y-[9px]">
                <Row label="Focal Length" value="50 mm" />
                <Row label="Aperture" value="f/2.8" />
                <Row label="Target" value="Bust" />
              </dl>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Lighting">
            <div className="space-y-[11px]">
              <SliderControl
                inline
                label="Intensity"
                value={s.intensity}
                onChange={s.setIntensity}
                labelWidth={86}
              />
              <SliderControl
                inline
                label="Ambient"
                value={s.ambient}
                onChange={s.setAmbient}
                labelWidth={86}
              />
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Shadows</FieldLabel>
                <ToggleSwitch label="Shadows" checked={s.shadows} onChange={s.setShadows} />
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Show grid</FieldLabel>
                <ToggleSwitch label="Show grid" checked={s.showGrid} onChange={s.setShowGrid} />
              </div>
            </div>
          </CollapsibleSection>

          <div className="mt-auto space-y-[8px] p-[14px]">
            <button
              type="button"
              onClick={() => {
                s.setStatusLabel("Ready");
                toast.success("Scene saved", { description: `${s.activeScene} updated.` });
              }}
              style={{ background: "var(--gradient-lime)" }}
              className="flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
            >
              <Save className="size-[15px]" />
              Apply Scene
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}