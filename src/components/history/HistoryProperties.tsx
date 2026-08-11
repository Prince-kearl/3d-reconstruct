import { GitBranch, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CollapsibleSection, FieldLabel, Select, SliderControl, ToggleSwitch } from "@/components/studio/primitives";
import { DIFF_STATS, VERSIONS } from "@/data/historyMock";
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
  const current = VERSIONS.find((v) => v.id === s.compareId) ?? VERSIONS[4]!;
  const ids = VERSIONS.map((v) => v.id);

  return (
    <aside className="flex w-[352px] shrink-0 flex-col border-l border-line bg-panel">
      <div role="tablist" className="flex h-[44px] shrink-0 items-center border-b border-line px-[8px]">
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
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Version Info">
            <dl className="space-y-[9px]">
              <Row label="Version" value={current.id} />
              <Row label="Name" value={current.name} />
              <Row label="Stage" value={current.stage} />
              <Row label="Created" value={current.time} />
              <Row label="Vertices" value={current.verts} />
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Comparison">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">Before</FieldLabel>
                <Select label="Before version" value={s.baseId} options={ids} onChange={s.setBaseId} className="flex-1" />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">After</FieldLabel>
                <Select label="After version" value={s.compareId} options={ids} onChange={s.setCompareId} className="flex-1" />
              </div>
              <SliderControl inline label="Split" value={s.split} onChange={s.setSplit} labelWidth={70} />
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Highlight changes</FieldLabel>
                <ToggleSwitch label="Highlight changes" checked={s.showDiff} onChange={s.setShowDiff} />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Diff Stats">
            <dl className="space-y-[9px]">
              {DIFF_STATS.map((d) => (
                <Row key={d.label} label={d.label} value={d.value} />
              ))}
            </dl>
          </CollapsibleSection>

          <div className="mt-auto space-y-[8px] p-[14px]">
            <button
              type="button"
              onClick={() => toast.success(`Branched from ${current.id}`)}
              className="flex h-[34px] w-full items-center justify-center gap-[8px] rounded-[5px] border border-line bg-surface-2 text-[12px] text-txt hover:border-line-strong"
            >
              <GitBranch className="size-[14px]" />
              Branch from Version
            </button>
            <button
              type="button"
              onClick={() => {
                s.setStatusLabel("Ready");
                toast.success("Version restored", { description: `${current.id} — ${current.name}` });
              }}
              style={{ background: "var(--gradient-lime)" }}
              className="flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
            >
              <RotateCcw className="size-[15px]" />
              Restore Version
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}