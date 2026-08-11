import { GitCompare, Clock } from "lucide-react";

import { PanelSectionTitle, SliderControl, ToggleSwitch, FieldLabel } from "@/components/studio/primitives";
import { HISTORY_FILTERS, VERSIONS } from "@/data/historyMock";
import { cn } from "@/lib/utils";
import { useHistory } from "@/stores/historyStore";

export function HistoryPanel() {
  const s = useHistory();
  const list = VERSIONS.filter((v) => s.filter === "All" || v.stage === s.filter);

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col gap-[14px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px]">
      <div>
        <PanelSectionTitle>History Explorer</PanelSectionTitle>
        <div className="mt-[10px] flex flex-wrap gap-[5px]">
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={s.filter === f}
              onClick={() => s.setFilter(f)}
              className={cn(
                "h-[24px] rounded-[4px] border px-[9px] text-[10.5px] transition-colors",
                s.filter === f
                  ? "border-accent/70 bg-accent/15 text-accent-2"
                  : "border-line bg-surface text-txt-muted hover:bg-surface-2",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-[6px] border-t border-line pt-[12px]">
        {list.map((v) => {
          const isBase = s.baseId === v.id;
          const isCompare = s.compareId === v.id;
          return (
            <li key={v.id}>
              <div
                className={cn(
                  "rounded-[5px] border px-[9px] py-[8px] transition-colors",
                  isBase || isCompare
                    ? "border-accent/60 bg-accent/12"
                    : "border-line bg-surface hover:bg-surface-2",
                )}
              >
                <div className="flex items-center gap-[6px]">
                  <Clock className="size-[12px] text-txt-dim" />
                  <span className="font-mono text-[10.5px] text-txt-dim">{v.id}</span>
                  <span className="truncate text-[11.5px] text-txt">{v.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-txt-dim">{v.time}</span>
                </div>
                <p className="mt-[4px] text-[10px] text-txt-dim">{v.note}</p>
                <div className="mt-[6px] flex gap-[5px]">
                  <button
                    type="button"
                    onClick={() => s.setBaseId(v.id)}
                    className={cn(
                      "h-[22px] flex-1 rounded-[4px] text-[10px] transition-colors",
                      isBase ? "bg-accent/25 text-accent-2" : "bg-surface-2 text-txt-muted",
                    )}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    onClick={() => s.setCompareId(v.id)}
                    className={cn(
                      "h-[22px] flex-1 rounded-[4px] text-[10px] transition-colors",
                      isCompare ? "bg-accent/25 text-accent-2" : "bg-surface-2 text-txt-muted",
                    )}
                  >
                    After
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-[10px] border-t border-line pt-[12px]">
        <PanelSectionTitle>Comparison</PanelSectionTitle>
        <SliderControl inline label="Split" value={s.split} onChange={s.setSplit} />
        <div className="flex items-center justify-between">
          <FieldLabel className="text-[11.5px]">Highlight changes</FieldLabel>
          <ToggleSwitch label="Highlight changes" checked={s.showDiff} onChange={s.setShowDiff} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => s.setStatusLabel(`Comparing ${s.baseId} → ${s.compareId}`)}
        style={{ background: "var(--gradient-accent)" }}
        className="mt-auto flex h-[38px] shrink-0 items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-white shadow-[0_6px_18px_-8px_var(--accent)]"
      >
        <GitCompare className="size-[15px]" />
        Compare Versions
      </button>
    </aside>
  );
}