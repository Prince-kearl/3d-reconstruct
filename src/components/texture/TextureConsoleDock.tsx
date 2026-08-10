import { Check, Maximize2 } from "lucide-react";
import { useState } from "react";

import texFront from "@/assets/tex-front.png";
import { TEXTURE_LAYERS, TEXTURE_STAGES } from "@/data/textureMock";
import { cn } from "@/lib/utils";
import { useTexture } from "@/stores/textureStore";

const TABS = ["Console", "Texture Layers", "Map Preview"] as const;

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
          {done ? "Textured" : "Texturing"}
        </span>
      </div>
    </div>
  );
}

const MAPS = [
  { name: "Base Color", style: undefined as string | undefined },
  { name: "Normal", style: "linear-gradient(135deg,#8b8bff,#5a6dd8)" },
  { name: "Roughness", style: "linear-gradient(135deg,#9a9a9a,#3f3f3f)" },
  { name: "Ambient Occlusion", style: "linear-gradient(135deg,#6a6a6a,#141414)" },
];

export function TextureConsoleDock() {
  const s = useTexture();
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
          ) : tab === "Texture Layers" ? (
            <ul className="max-w-[380px] space-y-[6px] text-[10.5px]">
              {TEXTURE_LAYERS.map((l, i) => (
                <li
                  key={l.name}
                  className={cn(
                    "flex items-center justify-between rounded-[4px] px-[8px] py-[4px]",
                    i === 0 ? "bg-accent/12 text-accent-2" : "text-txt-muted",
                  )}
                >
                  <span>{l.name}</span>
                  <span className="text-txt-dim">{l.opacity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex gap-[14px]">
              {MAPS.map((m) => (
                <div key={m.name} className="space-y-[6px] text-center">
                  <div
                    className="size-[62px] overflow-hidden rounded-[4px] border border-line"
                    style={m.style ? { background: m.style } : undefined}
                  >
                    {m.style ? null : (
                      <img src={texFront} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                  </div>
                  <span className="block text-[10px] text-txt-dim">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex w-[292px] shrink-0 gap-[8px] overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1 pt-[1px]">
          <h2 className="text-[12px] font-semibold text-txt">Texture Progress</h2>
          <ul className="mt-[10px] space-y-[7px]">
            {TEXTURE_STAGES.map((stage, i) => {
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