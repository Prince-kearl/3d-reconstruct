import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import { MESH_STATS, REFINE_STAGES } from "@/data/refineMock";
import { cn } from "@/lib/utils";
import { useRefinement } from "@/stores/refinementStore";

const TABS = ["Console", "Changes", "Mesh Analysis"] as const;

function ProgressRing({ value, done }: { value: number; done: boolean }) {
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
        <span className="text-[22px] font-semibold leading-none text-txt">{value}%</span>
        <span className="mt-[3px] text-[9.5px] text-txt-muted">
          {done ? "Refined" : "Refining"}
        </span>
      </div>
    </div>
  );
}

export function RefineConsoleDock() {
  const s = useRefinement();
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
          ) : tab === "Changes" ? (
            <ul className="space-y-[6px] text-[10.5px] text-txt-dim">
              <li>+ 14 surface artifacts removed</li>
              <li>+ Laplacian smoothing pass (strength {s.strength}%)</li>
              <li>+ 0 non-manifold edges remaining</li>
            </ul>
          ) : (
            <dl className="grid max-w-[320px] gap-[6px] text-[10.5px]">
              {MESH_STATS.map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-txt-dim">{label}</dt>
                  <dd className="text-txt-muted">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="flex w-[292px] shrink-0 gap-[8px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1 pt-[1px]">
          <h2 className="text-[12px] font-semibold text-txt">Refinement Progress</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {REFINE_STAGES.map((stage, i) => {
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
          <ProgressRing value={s.progress} done={s.progress === 100} />
          <span className="font-mono text-[11px] text-txt-muted">{s.elapsed}</span>
        </div>
      </section>
    </div>
  );
}