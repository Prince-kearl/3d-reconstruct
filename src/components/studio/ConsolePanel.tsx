import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import { CONSOLE_LINES, PROGRESS_STEPS } from "@/data/mock";
import { cn } from "@/lib/utils";

const TABS = ["Console", "Logs", "Jobs"] as const;

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[86px]">
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
        <span className="mt-[4px] text-[10px] text-txt-muted">
          {value === 100 ? "Completed" : "Running"}
        </span>
      </div>
    </div>
  );
}

export function ConsolePanel({
  lines,
  progress,
  completedSteps,
}: {
  lines: string[];
  progress: number;
  completedSteps: number;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Console");

  return (
    <div className="flex h-[195px] shrink-0 gap-[8px]">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
        <div className="flex h-[32px] shrink-0 items-center gap-[2px] border-b border-line px-[6px]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative h-full px-[12px] text-[11.5px] transition-colors",
                tab === t ? "text-accent-2" : "text-txt-muted hover:text-txt",
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
            <pre className="font-mono text-[10.5px] leading-[17.5px] text-txt-muted">
              {lines.join("\n")}
            </pre>
          ) : (
            <pre className="font-mono text-[10.5px] leading-[17.5px] text-txt-dim">
              {tab === "Logs"
                ? "[10:24:30] session.start engine=econ device=cuda:0"
                : "[10:24:34] job#4812 reconstruct — completed in 03:47"}
            </pre>
          )}
        </div>
      </section>

      <section className="flex w-[286px] shrink-0 gap-[10px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-semibold text-txt">Reconstruction Progress</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {PROGRESS_STEPS.map((step, i) => {
              const done = i < completedSteps;
              return (
                <li key={step} className="flex items-center gap-[8px]">
                  <Check
                    className={cn("size-[13px]", done ? "text-ok" : "text-txt-dim/40")}
                    strokeWidth={2.4}
                  />
                  <span className={cn("text-[11px]", done ? "text-txt-muted" : "text-txt-dim/60")}>
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center gap-[8px] pb-[4px]">
          <ProgressRing value={progress} />
          <span className="font-mono text-[11px] text-txt-muted">03:47</span>
        </div>
      </section>
    </div>
  );
}