import { Link } from "@tanstack/react-router";
import { FolderOpen, Search } from "lucide-react";

import { PanelSectionTitle } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";

export type LogLevelFilter = "All" | "Info" | "Error";

export function ConsoleExplorer({
  search,
  onSearchChange,
  level,
  onLevelChange,
  infoCount,
  errorCount,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  level: LogLevelFilter;
  onLevelChange: (v: LogLevelFilter) => void;
  infoCount: number;
  errorCount: number;
}) {
  const s = useReconstruct();

  const levels: { label: LogLevelFilter; count: number }[] = [
    { label: "All", count: infoCount + errorCount },
    { label: "Info", count: infoCount },
    { label: "Error", count: errorCount },
  ];

  return (
    <aside className="scroll-thin flex w-full shrink-0 flex-col gap-[14px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px] lg:w-[280px]">
      <div>
        <PanelSectionTitle>1. PROJECT</PanelSectionTitle>
        <div className="mt-[10px] flex gap-[10px]">
          <div className="size-[52px] shrink-0 overflow-hidden rounded-[5px] border border-line bg-surface">
            {s.sourceImageUrl ? (
              <img
                src={s.sourceImageUrl}
                alt="Current project source"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] text-txt">{s.sourceFileName ?? "No project"}</p>
            <p className="mt-[2px] text-[10.5px] text-txt-dim">
              {s.imageWidth ? `${s.imageWidth} × ${s.imageHeight}` : "—"}
            </p>
          </div>
        </div>
        <Link
          to="/reconstruct"
          search={s.projectId ? { project: s.projectId } : {}}
          className="mt-[10px] flex h-[28px] w-full items-center justify-center gap-[6px] rounded-[4px] border border-line bg-surface-2 text-[10.5px] text-txt transition-colors hover:border-line-strong"
        >
          <FolderOpen className="size-[12px]" />
          Open Full Reconstruction
        </Link>
      </div>

      <div className="border-t border-line pt-[12px]">
        <PanelSectionTitle>2. SEARCH</PanelSectionTitle>
        <div className="mt-[9px] flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
          <Search className="size-[13px] shrink-0 text-txt-dim" />
          <input
            aria-label="Search log lines"
            placeholder="Search log lines..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none placeholder:text-txt-dim"
          />
        </div>
      </div>

      <div className="border-t border-line pt-[12px]">
        <PanelSectionTitle>3. LEVEL</PanelSectionTitle>
        <div className="mt-[9px] space-y-[2px]">
          {levels.map((l) => (
            <button
              key={l.label}
              type="button"
              aria-pressed={level === l.label}
              onClick={() => onLevelChange(l.label)}
              className={cn(
                "flex h-[26px] w-full items-center rounded-[4px] px-[7px] text-[11.5px] transition-colors",
                level === l.label
                  ? "bg-accent/15 text-txt"
                  : "text-txt-muted hover:bg-surface-2/70",
              )}
            >
              <span>{l.label}</span>
              <span className="ml-auto text-[10.5px] text-txt-dim">{l.count}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
