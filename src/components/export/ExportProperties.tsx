import { Download, FileBox } from "lucide-react";
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
import { EXPORT_HISTORY, UNITS } from "@/data/exportMock";
import { cn } from "@/lib/utils";
import { useExport } from "@/stores/exportStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

export function ExportProperties() {
  const s = useExport();
  const [tab, setTab] = useState<"Properties" | "History">("Properties");

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
            {EXPORT_HISTORY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Output Info">
            <dl className="space-y-[9px]">
              <Row label="File" value={s.fileName} />
              <Row label="Format" value={s.format} />
              <Row label="Estimated Size" value="148.2 MB" />
              <Row label="Vertices" value="1,186,420" />
              <Row label="Triangles" value="2,372,836" />
            </dl>
            <div className="mt-[10px] h-[4px] w-full overflow-hidden rounded-full bg-line-strong">
              <div
                className="h-full rounded-full bg-ok transition-[width]"
                style={{ width: `${s.progress}%` }}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Crystal Volume">
            <div className="space-y-[10px]">
              <div className="grid grid-cols-3 gap-[6px]">
                <NumberField label="Width" prefix="W" value={s.width} onChange={s.setWidth} />
                <NumberField label="Height" prefix="H" value={s.height} onChange={s.setHeight} />
                <NumberField label="Depth" prefix="D" value={s.depth} onChange={s.setDepth} />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[100px] shrink-0 pl-[6px] text-[11.5px]">Units</FieldLabel>
                <Select
                  label="Units"
                  value={s.units}
                  options={UNITS}
                  onChange={s.setUnits}
                  className="flex-1"
                />
              </div>
              <dl className="space-y-[9px]">
                <Row label="Volume" value="3,433 cm³" />
                <Row label="Fit" value="Optimal" />
              </dl>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Output Settings">
            <div className="space-y-[11px]">
              <SliderControl inline label="Quality" value={s.quality} onChange={s.setQuality} />
              <SliderControl
                inline
                label="Decimation"
                value={s.decimation}
                onChange={s.setDecimation}
              />
              <SliderControl
                inline
                label="Smoothing"
                value={s.smoothing}
                onChange={s.setSmoothing}
              />
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Embed texture</FieldLabel>
                <ToggleSwitch
                  label="Embed texture"
                  checked={s.embedTexture}
                  onChange={s.setEmbedTexture}
                />
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Binary encoding</FieldLabel>
                <ToggleSwitch label="Binary encoding" checked={s.binary} onChange={s.setBinary} />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Destination">
            <div className="space-y-[10px]">
              <NumberField label="File name" value={s.fileName} onChange={s.setFileName} />
              <div className="flex items-center gap-[8px] rounded-[4px] border border-line bg-surface px-[10px] py-[7px] text-[11px] text-txt-muted">
                <FileBox className="size-[14px] text-txt-dim" />
                /projects/portrait/exports
              </div>
            </div>
          </CollapsibleSection>

          <div className="mt-auto space-y-[8px] p-[14px]">
            <button
              type="button"
              onClick={() => {
                s.setStatusLabel("Ready");
                toast.success("Export queued", {
                  description: `${s.fileName} sent to the laser queue.`,
                });
              }}
              style={{ background: "var(--gradient-lime)" }}
              className="flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
            >
              <Download className="size-[15px]" />
              Send to Laser Queue
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}