import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import { EXPORT_CHECKS, EXPORT_STAGES } from "@/data/exportMock";
import { cn } from "@/lib/utils";
import { useExport } from "@/stores/exportStore";

const TABS = ["Console", "Checks", "Output"] as const;

function ProgressRing({ value, label }: { value: number; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[96px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="4" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--ok-2)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-semibold text-txt">{value}%</span>
        <span className="text-[9.5px] text-txt-dim">{label}</span>
      </div>
    </div>
  );
}

export function ExportConsoleDock() {
  const s = useExport();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Console");

  return (
    <div className="flex h-[195px] shrink-0 gap-[8px]">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
        <div className="flex h-[34px] shrink-0 items-center gap-[2px] border-b border-line px-[6px]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative h-full px-[12px] text-[11.5px] transition-colors",
                tab === t ? "bg-accent/12 text-accent-2" : "text-txt-muted hover:text-txt",
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-[6px] -bottom-px h-[2px] rounded-t bg-accent-2" />
              ) : null}
            </button>
          ))}
          <button
            type="button"
            aria-label="Expand console"
            title="Expand console"
            className="ml-auto text-txt-dim hover:text-txt-muted"
          >
            <Maximize2 className="size-[13px]" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-[12px] py-[9px]">
          {tab === "Console" ? (
            <pre className="font-mono text-[10.5px] leading-[18px] text-txt-muted">
              {s.logs.join("\n")}
            </pre>
          ) : tab === "Checks" ? (
            <ul className="max-w-[380px] space-y-[6px] text-[10.5px]">
              {EXPORT_CHECKS.map((c) => (
                <li key={c.name} className="flex items-center gap-[8px] text-txt-muted">
                  <Check className="size-[13px] text-ok" strokeWidth={2.4} />
                  {c.name}
                </li>
              ))}
            </ul>
          ) : (
            <dl className="grid max-w-[520px] grid-cols-2 gap-x-[24px] gap-y-[7px] text-[10.5px]">
              {[
                ["File", s.fileName],
                ["Format", s.format],
                ["Size", "148.2 MB"],
                ["Vertices", "1,186,420"],
                ["Triangles", "2,372,836"],
                ["Units", s.units],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-txt-dim">{k}</dt>
                  <dd className="text-txt-muted">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="flex w-[292px] shrink-0 gap-[8px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1 pt-[1px]">
          <h2 className="text-[12px] font-semibold text-txt">Export Progress</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {EXPORT_STAGES.map((stage, i) => {
              const done = i < s.stagesDone;
              return (
                <li key={stage} className="flex items-center gap-[8px]">
                  <Check
                    className={cn("size-[13px]", done ? "text-ok" : "text-txt-dim/40")}
                    strokeWidth={2.4}
                  />
                  <span className={cn("text-[11px]", done ? "text-txt-muted" : "text-txt-dim/60")}>
                    {stage}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-[10px] pb-[2px]">
          <ProgressRing value={s.progress} label={s.progress === 100 ? "Exported" : "Working"} />
          <span className="font-mono text-[11px] text-txt-muted">{s.elapsed}</span>
        </div>
      </section>
    </div>
  );
}