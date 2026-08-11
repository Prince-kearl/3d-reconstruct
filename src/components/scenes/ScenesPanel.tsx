import { Box, Camera, Eye, EyeOff, Gem, Layers, Lightbulb, Plus, Square } from "lucide-react";

import {
  FieldLabel,
  PanelSectionTitle,
  SegmentedControl,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { GIZMO_MODES, LIGHT_PRESETS, SAVED_SCENES, SCENE_TREE } from "@/data/scenesMock";
import { cn } from "@/lib/utils";
import { useScenes } from "@/stores/scenesStore";

const TYPE_ICONS = {
  Mesh: Box,
  Volume: Gem,
  Base: Square,
  Ground: Layers,
  Light: Lightbulb,
  Camera: Camera,
} as const;

export function ScenesPanel() {
  const s = useScenes();

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col gap-[14px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px]">
      <div>
        <div className="flex items-center justify-between">
          <PanelSectionTitle>Scene Manager</PanelSectionTitle>
          <button
            type="button"
            aria-label="Add object"
            title="Add object"
            className="flex size-[22px] items-center justify-center rounded-[4px] text-txt-dim hover:bg-surface-2 hover:text-txt"
          >
            <Plus className="size-[14px]" />
          </button>
        </div>
        <ul className="mt-[10px] space-y-[2px]">
          {SCENE_TREE.map((node) => {
            const Icon = TYPE_ICONS[node.type];
            const selected = s.selectedId === node.id;
            const isHidden = s.hidden.includes(node.id);
            return (
              <li key={node.id}>
                <div
                  className={cn(
                    "flex items-center gap-[7px] rounded-[4px] px-[7px] py-[5px] transition-colors",
                    selected ? "bg-accent/15" : "hover:bg-surface-2/70",
                  )}
                  style={{ paddingLeft: 7 + node.depth * 14 }}
                >
                  <button
                    type="button"
                    onClick={() => s.setSelectedId(node.id)}
                    className="flex min-w-0 flex-1 items-center gap-[7px] text-left"
                  >
                    <Icon
                      className={cn("size-[13px]", selected ? "text-accent-2" : "text-txt-dim")}
                    />
                    <span
                      className={cn(
                        "truncate text-[11.5px]",
                        selected ? "text-txt" : isHidden ? "text-txt-dim/60" : "text-txt-muted",
                      )}
                    >
                      {node.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`${isHidden ? "Show" : "Hide"} ${node.name}`}
                    title={isHidden ? "Show" : "Hide"}
                    onClick={() => s.toggleHidden(node.id)}
                    className="text-txt-dim hover:text-txt"
                  >
                    {isHidden ? (
                      <EyeOff className="size-[12px]" />
                    ) : (
                      <Eye className="size-[12px]" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-[10px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Transform Gizmo</PanelSectionTitle>
        <SegmentedControl options={GIZMO_MODES} value={s.gizmo} onChange={s.setGizmo} />
        <SliderControl
          inline
          label="Rotate Y"
          min={-180}
          max={180}
          value={s.rotY}
          onChange={s.setRotY}
          format={(v) => `${v}°`}
        />
        <SliderControl
          inline
          label="Scale"
          min={20}
          max={200}
          value={s.scale}
          onChange={s.setScale}
        />
        <div className="flex items-center justify-between">
          <FieldLabel className="text-[11.5px]">Show grid</FieldLabel>
          <ToggleSwitch label="Show grid" checked={s.showGrid} onChange={s.setShowGrid} />
        </div>
      </div>

      <div className="space-y-[10px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Lighting</PanelSectionTitle>
        <Select
          label="Light preset"
          value={s.lightPreset}
          options={LIGHT_PRESETS}
          onChange={s.setLightPreset}
        />
        <SliderControl
          inline
          label="Intensity"
          value={s.intensity}
          onChange={s.setIntensity}
        />
        <SliderControl inline label="Ambient" value={s.ambient} onChange={s.setAmbient} />
        <div className="flex items-center justify-between">
          <FieldLabel className="text-[11.5px]">Shadows</FieldLabel>
          <ToggleSwitch label="Shadows" checked={s.shadows} onChange={s.setShadows} />
        </div>
      </div>

      <div className="space-y-[8px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Saved Scenes</PanelSectionTitle>
        <div className="grid grid-cols-2 gap-[7px]">
          {SAVED_SCENES.map((sc) => {
            const selected = s.activeScene === sc.name;
            return (
              <button
                key={sc.name}
                type="button"
                onClick={() => s.setActiveScene(sc.name)}
                className={cn(
                  "flex h-[62px] flex-col items-start justify-end gap-[2px] rounded-[5px] border p-[8px] text-left transition-colors",
                  selected
                    ? "border-accent/70 bg-accent/15"
                    : "border-line bg-surface hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    selected ? "text-accent-2" : "text-txt-muted",
                  )}
                >
                  {sc.name}
                </span>
                <span className="text-[9.5px] text-txt-dim">{sc.meta}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => s.setStatusLabel("Scene saved")}
        style={{ background: "var(--gradient-accent)" }}
        className="mt-auto flex h-[38px] shrink-0 items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-white shadow-[0_6px_18px_-8px_var(--accent)]"
      >
        <Layers className="size-[15px]" />
        Save Scene
      </button>
    </aside>
  );
}