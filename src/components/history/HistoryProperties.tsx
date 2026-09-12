import { useState } from "react";

import {
  CollapsibleSection,
  FieldLabel,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useHistory } from "@/stores/historyStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

export function HistoryProperties() {
  const s = useHistory();
  const [tab, setTab] = useState<"Properties" | "Log">("Properties");
  const current = s.versions.find((v) => v.id === s.compareId) ?? s.versions[s.versions.length - 1];
  const ids = s.versions.map((v) => v.id);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-panel lg:border-l lg:border-line">
      <div
        role="tablist"
        className="flex h-[44px] shrink-0 items-center border-b border-line px-[8px]"
      >
        {(["Properties", "Log"] as const).map((t) => (
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

      {tab === "Log" ? (
        <div className="scroll-thin flex-1 overflow-y-auto px-[16px] py-[14px]">
          <pre className="font-mono text-[10.5px] leading-[18px] text-txt-muted">
            {s.logs.join("\n")}
          </pre>
        </div>
      ) : !current ? (
        <p className="px-[16px] py-[14px] text-[11px] text-txt-dim">
          {s.isLoading ? "Loading history…" : "No events yet."}
        </p>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Version Info">
            <dl className="space-y-[9px]">
              <Row label="Name" value={current.name} />
              <Row label="Stage" value={current.stage} />
              <Row label="Time" value={current.time} />
              <Row label="Vertices" value={current.verts} />
              <Row label="Note" value={current.note} />
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Comparison">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">Before</FieldLabel>
                <Select
                  label="Before version"
                  value={s.baseId}
                  options={ids}
                  onChange={s.setBaseId}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">After</FieldLabel>
                <Select
                  label="After version"
                  value={s.compareId}
                  options={ids}
                  onChange={s.setCompareId}
                  className="flex-1"
                />
              </div>
              <SliderControl
                inline
                label="Split"
                value={s.split}
                onChange={s.setSplit}
                labelWidth={70}
              />
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Highlight changes</FieldLabel>
                <ToggleSwitch
                  label="Highlight changes"
                  checked={s.showDiff}
                  onChange={s.setShowDiff}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Diff Stats">
            <dl className="space-y-[9px]">
              {s.diffStats.map((d) => (
                <Row key={d.label} label={d.label} value={d.value} />
              ))}
            </dl>
          </CollapsibleSection>
        </div>
      )}
    </aside>
  );
}
