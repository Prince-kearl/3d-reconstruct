import { Bookmark, Check, MoreVertical, PlusCircle, Search } from "lucide-react";
import { useState } from "react";

import { LOG_SOURCES, SAVED_QUERIES, SEVERITIES } from "@/data/consoleMock";
import { cn } from "@/lib/utils";

function CheckRow({
  label,
  count,
  checked,
  onToggle,
  active,
  dot,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  active?: boolean;
  dot?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex h-[26px] w-full items-center gap-[8px] rounded-[4px] px-[6px] text-[11.5px] transition-colors",
        active ? "bg-accent/15 text-txt" : "text-txt-muted hover:bg-surface-2/70",
      )}
    >
      <span
        className={cn(
          "flex size-[13px] shrink-0 items-center justify-center rounded-[3px] border",
          checked ? "border-accent bg-accent text-white" : "border-line-strong",
        )}
      >
        {checked ? <Check className="size-[10px]" strokeWidth={3} /> : null}
      </span>
      <span className="truncate">{label}</span>
      <span className="ml-auto flex items-center gap-[6px] text-[10.5px] text-txt-dim">
        {count}
        {dot ? (
          <span className="size-[6px] rounded-full" style={{ background: dot }} />
        ) : null}
      </span>
    </button>
  );
}

export function ConsoleExplorer() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<string[]>(LOG_SOURCES.map((s) => s.name));
  const [levels, setLevels] = useState<string[]>(SEVERITIES.map((s) => s.name));
  const [saved, setSaved] = useState(SAVED_QUERIES[0]!);

  const toggle = (list: string[], set: (v: string[]) => void, name: string) =>
    set(list.includes(name) ? list.filter((n) => n !== name) : [...list, name]);

  const visible = LOG_SOURCES.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <aside className="scroll-thin flex w-[236px] shrink-0 flex-col gap-[12px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[12px] py-[12px]">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-txt-muted">
        CONSOLE EXPLORER
      </h2>
      <div className="flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
        <Search className="size-[13px] shrink-0 text-txt-dim" />
        <input
          aria-label="Search logs"
          placeholder="Search logs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none placeholder:text-txt-dim"
        />
      </div>

      <div>
        <h3 className="mb-[6px] text-[10.5px] font-semibold tracking-[0.06em] text-txt-dim">
          1. LOG SOURCES
        </h3>
        <div className="space-y-[2px]">
          {visible.map((s, i) => (
            <CheckRow
              key={s.name}
              label={s.name}
              count={s.count}
              checked={sources.includes(s.name)}
              active={i === 0}
              onToggle={() => toggle(sources, setSources, s.name)}
            />
          ))}
          {visible.length === 0 ? (
            <p className="px-[6px] py-[8px] text-[11px] text-txt-dim">No sources match.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mb-[6px] text-[10.5px] font-semibold tracking-[0.06em] text-txt-dim">
          2. SEVERITY
        </h3>
        <div className="space-y-[2px]">
          {SEVERITIES.map((s) => (
            <CheckRow
              key={s.name}
              label={s.name}
              count={s.count}
              dot={s.dot}
              checked={levels.includes(s.name)}
              onToggle={() => toggle(levels, setLevels, s.name)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-[6px] text-[10.5px] font-semibold tracking-[0.06em] text-txt-dim">
          3. SAVED QUERIES
        </h3>
        <div className="space-y-[4px]">
          {SAVED_QUERIES.map((q) => (
            <div
              key={q}
              className={cn(
                "flex h-[30px] items-center gap-[6px] rounded-[4px] border px-[8px] text-[11.5px]",
                saved === q
                  ? "border-accent/60 bg-accent/15 text-txt"
                  : "border-line bg-surface text-txt-muted",
              )}
            >
              <button
                type="button"
                onClick={() => setSaved(q)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {q}
              </button>
              <Bookmark className="size-[12px] shrink-0 text-txt-dim" />
              <MoreVertical className="size-[12px] shrink-0 text-txt-dim" />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        style={{ background: "var(--gradient-accent)" }}
        className="flex h-[34px] shrink-0 items-center justify-center gap-[7px] rounded-[5px] text-[12px] font-semibold text-white"
      >
        <PlusCircle className="size-[14px]" />
        Save Query
      </button>
      <p className="text-center text-[10.5px] text-txt-dim">128 events • Live</p>
    </aside>
  );
}