import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import { SAVED_SCENES, SCENE_STAGES, SCENE_TREE } from "@/data/scenesMock";
import { cn } from "@/lib/utils";
import { useScenes } from "@/stores/scenesStore";

const TABS = ["Console", "Objects", "Cameras"] as const;

export function ScenesConsoleDock() {
  const s = useScenes();
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
          ) : tab === "Objects" ? (
            <ul className="max-w-[420px] space-y-[6px] text-[10.5px]">
              {SCENE_TREE.filter((n) => n.depth > 0).map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-center justify-between rounded-[4px] px-[8px] py-[4px]",
                    s.selectedId === n.id ? "bg-accent/12 text-accent-2" : "text-txt-muted",
                  )}
                >
                  <span>{n.name}</span>
                  <span className="text-txt-dim">{n.type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="max-w-[420px] space-y-[6px] text-[10.5px]">
              {SAVED_SCENES.map((sc) => (
                <li
                  key={sc.name}
                  className="flex items-center justify-between rounded-[4px] px-[8px] py-[4px] text-txt-muted"
                >
                  <span>{sc.name}</span>
                  <span className="text-txt-dim">{sc.meta}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex w-[292px] shrink-0 gap-[8px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1 pt-[1px]">
          <h2 className="text-[12px] font-semibold text-txt">Scene Status</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {SCENE_STAGES.map((stage) => (
              <li key={stage} className="flex items-center gap-[8px]">
                <Check className="size-[13px] text-ok" strokeWidth={2.4} />
                <span className="text-[11px] text-txt-muted">{stage}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-[10px] pb-[2px]">
          <div className="relative size-[96px]">
            <svg viewBox="0 0 80 80" className="size-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth="4"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--ok-2)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[17px] font-semibold text-txt">100%</span>
              <span className="text-[9.5px] text-txt-dim">Loaded</span>
            </div>
          </div>
          <span className="font-mono text-[11px] text-txt-muted">00:27</span>
        </div>
      </section>
    </div>
  );
}