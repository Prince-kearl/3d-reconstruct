import { Cpu, Monitor, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";

import { QUICK_PRESETS, SHORTCUTS } from "@/data/settingsMock";
import { cn } from "@/lib/utils";

const ICONS = [Monitor, Sparkles, Cpu, Settings2];

export function SettingsQuickPanel() {
  const [preset, setPreset] = useState(QUICK_PRESETS[0]!.name as string);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="flex w-[236px] shrink-0 flex-col gap-[8px]">
      <section className="rounded-[6px] border border-line bg-panel px-[10px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Quick Presets</h2>
        <div className="mt-[9px] space-y-[6px]">
          {QUICK_PRESETS.map((p, i) => {
            const Icon = ICONS[i]!;
            const active = preset === p.name;
            return (
              <button
                key={p.name}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPreset(p.name)}
                className={cn(
                  "flex w-full items-center gap-[9px] rounded-[5px] border px-[9px] py-[7px] text-left transition-colors",
                  active
                    ? "border-accent/60 bg-accent/15"
                    : "border-line bg-surface hover:bg-surface-2",
                )}
              >
                <Icon className={cn("size-[15px]", active ? "text-accent-2" : "text-txt-dim")} />
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] text-txt">{p.name}</span>
                  <span className="block truncate text-[10px] text-txt-dim">{p.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[6px] border border-line bg-panel px-[10px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Keyboard Shortcuts</h2>
        <ul className="mt-[9px] space-y-[1px]">
          {(showAll ? SHORTCUTS : SHORTCUTS.slice(0, 5)).map(([name, key]) => (
            <li
              key={name}
              className="flex items-center justify-between border-b border-line/70 py-[6px] text-[11px] last:border-0"
            >
              <span className="text-txt-muted">{name}</span>
              <span className="font-mono text-[10.5px] text-txt">{key}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-[8px] h-[30px] w-full rounded-[4px] border border-line bg-surface text-[11.5px] text-txt-muted hover:text-txt"
        >
          {showAll ? "Show Fewer" : "View All Shortcuts"}
        </button>
      </section>

      <div className="flex min-h-0 flex-1 gap-[8px]">
        <section className="min-w-0 flex-1 rounded-[6px] border border-line bg-panel px-[10px] py-[10px]">
          <h2 className="text-[11.5px] font-semibold text-txt">Recent Changes</h2>
          <ul className="mt-[8px] space-y-[7px] text-[10.5px] text-txt-muted">
            {(
              [
                ["UI Scale", "100%"],
                ["Autosave", "2 min"],
                ["Default OBJ", "OBJ"],
              ] as const
            ).map(([k, v]) => (
              <li key={k} className="flex items-center gap-[6px]">
                <span className="size-[5px] rounded-full bg-accent-2" />
                {k}
                <span className="ml-auto text-txt">{v}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="w-[108px] shrink-0 rounded-[6px] border border-line bg-panel px-[10px] py-[10px]">
          <h2 className="text-[11.5px] font-semibold text-txt">Config Status</h2>
          <p className="mt-[8px] flex items-center gap-[6px] text-[11px] text-ok">✓ Valid</p>
          <p className="mt-[7px] text-[10.5px] text-txt-muted">0 conflicts</p>
          <p className="mt-[7px] text-[10.5px] text-txt-dim">Last saved 10:48</p>
        </section>
      </div>
    </div>
  );
}