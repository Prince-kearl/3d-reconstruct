import { Download } from "lucide-react";

import {
  FieldLabel,
  NumberField,
  PanelSectionTitle,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { CRYSTAL_PRESETS, EXPORT_FORMATS, UNITS } from "@/data/exportMock";
import { cn } from "@/lib/utils";
import { useExport } from "@/stores/exportStore";

export function ExportPanel() {
  const s = useExport();

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col gap-[14px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px]">
      <div>
        <PanelSectionTitle>Export Format</PanelSectionTitle>
        <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
          {EXPORT_FORMATS.map((f) => {
            const selected = s.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => s.setFormat(f.id)}
                className={cn(
                  "flex h-[50px] flex-col items-center justify-center gap-[2px] rounded-[5px] border transition-colors",
                  selected
                    ? "border-accent/70 bg-accent/15 text-accent-2"
                    : "border-line bg-surface text-txt-muted hover:bg-surface-2",
                )}
              >
                <span className="text-[12px] font-semibold">{f.id}</span>
                <span className="text-[9px] text-txt-dim">{f.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-[10px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Output Quality</PanelSectionTitle>
        <SliderControl inline label="Quality" value={s.quality} onChange={s.setQuality} />
        <SliderControl
          inline
          label="Decimation"
          value={s.decimation}
          onChange={s.setDecimation}
        />
        <SliderControl inline label="Smoothing" value={s.smoothing} onChange={s.setSmoothing} />
        <div className="flex items-center gap-[8px]">
          <FieldLabel className="w-[86px] shrink-0">Units</FieldLabel>
          <Select
            label="Units"
            value={s.units}
            options={UNITS}
            onChange={s.setUnits}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-[10px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Crystal Dimensions</PanelSectionTitle>
        <Select
          label="Crystal preset"
          value={CRYSTAL_PRESETS[1]}
          options={CRYSTAL_PRESETS}
          onChange={() => {}}
        />
        <div className="grid grid-cols-3 gap-[6px]">
          <NumberField label="Width" prefix="W" value={s.width} onChange={s.setWidth} />
          <NumberField label="Height" prefix="H" value={s.height} onChange={s.setHeight} />
          <NumberField label="Depth" prefix="D" value={s.depth} onChange={s.setDepth} />
        </div>
        <p className="text-[10.5px] text-txt-dim">
          {s.width} × {s.height} × {s.depth} cm — fits laser bed
        </p>
      </div>

      <div className="space-y-[9px] border-t border-line pt-[12px]">
        <PanelSectionTitle>File Options</PanelSectionTitle>
        {(
          [
            ["Hollow interior", s.hollow, s.setHollow],
            ["Include base", s.includeBase, s.setIncludeBase],
            ["Embed texture", s.embedTexture, s.setEmbedTexture],
            ["Binary encoding", s.binary, s.setBinary],
          ] as const
        ).map(([label, checked, onChange]) => (
          <div key={label} className="flex items-center justify-between">
            <FieldLabel className="text-[11.5px]">{label}</FieldLabel>
            <ToggleSwitch label={label} checked={checked} onChange={onChange} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={s.runExport}
        disabled={s.running}
        style={{ background: "var(--gradient-accent)" }}
        className="mt-auto flex h-[38px] shrink-0 items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-white shadow-[0_6px_18px_-8px_var(--accent)] disabled:opacity-60"
      >
        <Download className="size-[15px]" />
        {s.running ? "Exporting..." : "Export Model"}
      </button>
    </aside>
  );
}