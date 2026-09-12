import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const TABS = ["Console", "Logs", "Jobs"] as const;

function ProgressRing({ value, state }: { value: number; state: "idle" | "running" | "done" }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const label = state === "done" ? "Completed" : state === "running" ? "Running" : "Idle";
  return (
    <div className="relative size-[94px]">
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
        <span className="text-[21px] font-semibold leading-none text-txt">{value}%</span>
        <span className="mt-[3px] text-[9.5px] text-txt-muted">{label}</span>
      </div>
    </div>
  );
}

export function ConsolePanel({
  lines,
  progress,
  completedSteps,
  steps,
  statusLabel,
  ringState,
}: {
  lines: string[];
  progress: number;
  completedSteps: number;
  steps: readonly string[];
  statusLabel: string;
  ringState: "idle" | "running" | "done";
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Console");

  return (
    <div className="flex shrink-0 flex-col gap-[8px] xl:h-[195px] xl:flex-row">
      <section className="flex h-[160px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel xl:h-auto xl:flex-1">
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
              {lines.length ? lines.join("\n") : "No output yet."}
            </pre>
          ) : tab === "Logs" ? (
            <pre className="font-mono text-[10.5px] leading-[17.5px] text-txt-dim">
              {lines.length ? lines.join("\n") : "No logs yet."}
            </pre>
          ) : (
            <pre className="font-mono text-[10.5px] leading-[17.5px] text-txt-dim">
              {`job#1 reconstruct — ${statusLabel}`}
            </pre>
          )}
        </div>
      </section>

      <section className="flex shrink-0 gap-[8px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px] xl:w-[292px]">
        <div className="min-w-0 flex-1 pt-[1px]">
          <h2 className="text-[12px] font-semibold text-txt">Reconstruction Progress</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {steps.map((step, i) => {
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
        <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-[10px] pb-[2px]">
          <ProgressRing value={progress} state={ringState} />
          <span className="max-w-full truncate px-[4px] text-[11px] text-txt-muted">
            {statusLabel}
          </span>
        </div>
      </section>
    </div>
  );
}
