import { LayoutGrid, List, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { RECENT_PROJECTS, type ProjectStatus } from "@/data/launcherMock";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/studio/primitives";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  Ready: "border-ok/50 bg-ok/15 text-ok-2",
  Refining: "border-accent/50 bg-accent/15 text-accent-2",
  Texturing: "border-lime/50 bg-lime/12 text-lime-2",
  Exported: "border-line-strong bg-surface-2 text-txt-muted",
  Error: "border-axis-x/50 bg-axis-x/12 text-axis-x",
};

const FILTERS = ["All", "Ready", "In Progress", "Errors"] as const;

export function RecentProjects({ onNewProject }: { onNewProject: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const items = useMemo(
    () =>
      RECENT_PROJECTS.filter((p) => {
        const q = query.trim().toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.path.toLowerCase().includes(q))
          return false;
        if (filter === "Ready") return p.status === "Ready";
        if (filter === "Errors") return p.status === "Error";
        if (filter === "In Progress") return p.status === "Refining" || p.status === "Texturing";
        return true;
      }),
    [query, filter],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
      <section
        className="relative shrink-0 overflow-hidden rounded-[6px] border border-line bg-panel px-[18px] py-[16px]"
        style={{ backgroundImage: "var(--viewport-bg)" }}
      >
        <div className="flex items-start gap-[16px]">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-accent-2">DXF2OBJ Studio</p>
            <h1 className="mt-[6px] text-[20px] font-semibold tracking-[-0.01em] text-txt">
              Welcome back, Emmanuella
            </h1>
            <p className="mt-[5px] max-w-[520px] text-[11.5px] leading-[18px] text-txt-muted">
              Turn portrait photography into laser-ready 3D crystal engravings. Pick up a recent
              project or start a new reconstruction from a template.
            </p>
            <div className="mt-[12px] flex items-center gap-[8px]">
              <button
                type="button"
                onClick={onNewProject}
                className="flex h-[30px] items-center gap-[7px] rounded-[5px] px-[14px] text-[11.5px] font-medium text-white"
                style={{ background: "var(--gradient-accent)" }}
              >
                <Sparkles className="size-[13px]" /> New Project
              </button>
              <Link
                to="/reconstruct"
                className="flex h-[30px] items-center rounded-[5px] border border-line bg-surface px-[14px] text-[11.5px] text-txt-muted hover:text-txt"
              >
                Continue Portrait Project
              </Link>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-3 gap-[8px]">
            {[
              ["Projects", "6"],
              ["Jobs today", "14"],
              ["Laser queue", "2"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="w-[92px] rounded-[5px] border border-line bg-surface/80 px-[10px] py-[8px]"
              >
                <dt className="text-[9.5px] text-txt-dim">{k}</dt>
                <dd className="mt-[2px] text-[16px] font-semibold text-txt">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
        <div className="flex h-[42px] shrink-0 items-center gap-[8px] border-b border-line px-[12px]">
          <h2 className="text-[12px] font-semibold text-txt">Recent Projects</h2>
          <div className="ml-[6px] flex items-center gap-[3px]">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-[24px] rounded-[4px] px-[10px] text-[11px] transition-colors",
                  filter === f
                    ? "border border-accent/70 bg-accent/15 font-medium text-accent-2"
                    : "text-txt-muted hover:bg-surface-2 hover:text-txt",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex h-[26px] w-[196px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
            <Search className="size-[13px] text-txt-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full min-w-0 bg-transparent text-[11px] text-txt outline-none placeholder:text-txt-dim"
            />
          </div>
          <IconButton label="Grid view" size={26} active={view === "grid"} onClick={() => setView("grid")}>
            <LayoutGrid className="size-[14px]" />
          </IconButton>
          <IconButton label="List view" size={26} active={view === "list"} onClick={() => setView("list")}>
            <List className="size-[14px]" />
          </IconButton>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-[10px]">
          {items.length === 0 ? (
            <p className="py-[40px] text-center text-[11.5px] text-txt-dim">
              No projects match “{query}”.
            </p>
          ) : (
            <div className={cn(view === "grid" ? "grid grid-cols-3 gap-[10px]" : "space-y-[6px]")}>
              {items.map((p) => (
                <article
                  key={p.name}
                  className={cn(
                    "rounded-[6px] border border-line bg-surface p-[11px] transition-colors hover:border-line-strong hover:bg-surface-2/70",
                    view === "list" && "flex items-center gap-[12px]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[8px]">
                      <h3 className="min-w-0 truncate text-[12px] font-medium text-txt">{p.name}</h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-[3px] border px-[6px] py-[1px] text-[9px] font-semibold",
                          STATUS_STYLE[p.status],
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-[4px] truncate font-mono text-[9.5px] text-txt-dim">{p.path}</p>
                    <div className="mt-[9px] h-[3px] w-full rounded-full bg-line-strong">
                      <div
                        className="h-[3px] rounded-full"
                        style={{
                          width: `${p.progress}%`,
                          background:
                            p.status === "Error" ? "var(--axis-x)" : "var(--gradient-accent)",
                        }}
                      />
                    </div>
                    <div className="mt-[7px] flex items-center justify-between text-[10px] text-txt-muted">
                      <span className="truncate">{p.stage}</span>
                      <span className="shrink-0 text-txt-dim">{p.size}</span>
                    </div>
                    <p className="mt-[3px] text-[9.5px] text-txt-dim">Opened {p.opened}</p>
                  </div>
                  <Link
                    to="/reconstruct"
                    className={cn(
                      "mt-[10px] flex h-[26px] items-center justify-center rounded-[4px] border border-line bg-panel text-[11px] text-txt-muted hover:text-txt",
                      view === "list" ? "mt-0 w-[86px] shrink-0" : "w-full",
                    )}
                  >
                    Open
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}