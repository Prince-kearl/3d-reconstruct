import { Check } from "lucide-react";
import { useState } from "react";

import { OUTPUT_LINES, SESSION_HEALTH } from "@/data/consoleMock";
import { cn } from "@/lib/utils";

const TABS = ["Output", "Problems", "Terminal", "Debug Console"] as const;

function HealthRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[104px]">
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
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="progressbar"
        aria-label="Session health"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="text-[20px] font-semibold text-txt">{value}%</span>
        <span className="text-[10px] text-txt-muted">Healthy</span>
      </div>
    </div>
  );
}

export function ConsoleDock() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Output");

  return (
    <div className="flex h-[196px] shrink-0 gap-[8px]">
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
                "relative flex h-full items-center gap-[6px] px-[12px] text-[11.5px] transition-colors",
                tab === t ? "bg-accent/12 text-accent-2" : "text-txt-muted hover:text-txt",
              )}
            >
              {t}
              {t === "Problems" ? (
                <span className="rounded-[3px] bg-axis-x/25 px-[4px] text-[9px] text-axis-x">2</span>
              ) : null}
              {tab === t ? (
                <span className="absolute inset-x-[6px] -bottom-px h-[2px] rounded-t bg-accent-2" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-[12px] py-[9px] font-mono text-[11px] leading-[19px]">
          {tab === "Output" ? (
            OUTPUT_LINES.map((l) => (
              <p key={l.text} className="flex gap-[14px]">
                <span className="text-txt-dim">{l.time}</span>
                <span
                  className={cn(
                    l.tone === "warn" ? "text-lime" : l.tone === "ok" ? "text-ok" : "text-txt-muted",
                  )}
                >
                  {l.text}
                </span>
              </p>
            ))
          ) : tab === "Problems" ? (
            <p className="text-lime">2 recoverable warnings — AO cache missing, preview timeout</p>
          ) : tab === "Terminal" ? (
            <p className="text-txt-muted">dxf2obj@workstation:~$ _</p>
          ) : (
            <p className="text-txt-dim">Debugger not attached.</p>
          )}
        </div>
      </section>

      <section className="flex w-[372px] shrink-0 gap-[10px] rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-semibold text-txt">Session Health</h2>
          <ul className="mt-[9px] space-y-[6px]">
            {SESSION_HEALTH.map((h) => (
              <li key={h} className="flex items-center gap-[8px] text-[11px] text-txt-muted">
                <Check className="size-[13px] text-ok" strokeWidth={2.4} />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex w-[130px] shrink-0 flex-col items-center justify-center gap-[8px]">
          <HealthRing value={98} />
          <span className="text-[10.5px] text-txt-muted">
            Uptime <span className="font-mono text-txt">01:24:18</span>
          </span>
        </div>
      </section>
    </div>
  );
}