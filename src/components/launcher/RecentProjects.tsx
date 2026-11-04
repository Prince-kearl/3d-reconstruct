import { LayoutGrid, List, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import type { ProjectStatus, ProjectSummary } from "@/lib/projects";
import { useAuth } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/studio/primitives";
import { ProjectOpenLink } from "@/components/launcher/ProjectOpenLink";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  processing: "border-accent/50 bg-accent/15 text-accent-2",
  completed: "border-ok/50 bg-ok/15 text-ok-2",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
};

const FILTERS = ["All", "Completed", "Processing", "Failed"] as const;

export function RecentProjects({
  projects,
  onNewProject,
}: {
  projects: ProjectSummary[];
  onNewProject: () => void;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const mostRecent = projects[0];

  const items = useMemo(
    () =>
      projects.filter((p) => {
        const q = query.trim().toLowerCase();
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (filter === "Completed") return p.status === "completed";
        if (filter === "Processing") return p.status === "processing";
        if (filter === "Failed") return p.status === "failed";
        return true;
      }),
    [projects, query, filter],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[8px] lg:min-h-0">
      <section
        className="relative shrink-0 overflow-hidden rounded-[6px] border border-line bg-panel px-[18px] py-[16px]"
        style={{ backgroundImage: "var(--viewport-bg)" }}
      >
        <div className="flex flex-col items-start gap-[16px] sm:flex-row">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-accent-2">
              DXF2OBJ Studio
            </p>
            <h1 className="mt-[6px] break-words text-[20px] font-semibold tracking-[-0.01em] text-txt">
              Welcome back{user?.email ? `, ${user.email}` : ""}
            </h1>
            <p className="mt-[5px] max-w-[520px] text-[11.5px] leading-[18px] text-txt-muted">
              Reconstruct a photo or import STL, OBJ/MTL, GLB/glTF, PLY, 3MF, and DXF drawings.
              Select OBJ/glTF sidecars together; DXF is a supported-linework preview, not a full CAD
              round-trip.
            </p>
            <div className="home-project-actions mt-[12px] flex items-center gap-[8px]">
              <button
                type="button"
                onClick={onNewProject}
                className="flex h-[44px] items-center gap-[7px] rounded-[5px] px-[14px] text-[11.5px] font-medium text-white sm:h-[30px]"
                style={{ background: "var(--gradient-accent)" }}
              >
                <Sparkles className="size-[13px]" /> New Project
              </button>
              {mostRecent ? (
                <ProjectOpenLink
                  project={mostRecent}
                  className="home-continue-link flex h-[44px] min-w-0 items-center rounded-[5px] border border-line bg-surface px-[14px] text-[11.5px] text-txt-muted hover:text-txt sm:h-[30px]"
                >
                  Continue "{mostRecent.name}"
                </ProjectOpenLink>
              ) : null}
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-1 gap-[8px]">
            <div className="w-[92px] rounded-[5px] border border-line bg-surface/80 px-[10px] py-[8px]">
              <dt className="text-[9.5px] text-txt-dim">Projects</dt>
              <dd className="mt-[2px] text-[16px] font-semibold text-txt">{projects.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="home-project-list-panel flex h-[420px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="home-project-toolbar flex h-[42px] shrink-0 items-center gap-[8px] border-b border-line px-[12px]">
          <h2 className="text-[12px] font-semibold text-txt">Recent Projects</h2>
          <div className="home-project-filters ml-[6px] flex items-center gap-[3px]">
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
          <div className="home-project-search ml-auto flex h-[40px] w-[196px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px] sm:h-[26px]">
            <Search className="size-[13px] text-txt-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full min-w-0 bg-transparent text-[16px] text-txt outline-none placeholder:text-txt-dim sm:text-[11px]"
            />
          </div>
          <IconButton
            label="Grid view"
            size={26}
            active={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-[14px]" />
          </IconButton>
          <IconButton
            label="List view"
            size={26}
            active={view === "list"}
            onClick={() => setView("list")}
          >
            <List className="size-[14px]" />
          </IconButton>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-[10px]">
          {items.length === 0 ? (
            <p className="py-[40px] text-center text-[11.5px] text-txt-dim">
              {projects.length === 0
                ? "No projects yet — import a model or start a reconstruction."
                : `No projects match "${query}".`}
            </p>
          ) : (
            <div
              className={cn(
                view === "grid"
                  ? "grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-[6px]",
              )}
            >
              {items.map((p) => (
                <article
                  key={p.id}
                  className={cn(
                    "rounded-[6px] border border-line bg-surface p-[11px] transition-colors hover:border-line-strong hover:bg-surface-2/70",
                    view === "list" && "flex items-center gap-[12px]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[8px]">
                      <h3 className="min-w-0 truncate text-[12px] font-medium text-txt">
                        {p.name}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-[3px] border px-[6px] py-[1px] text-[9px] font-semibold",
                          STATUS_STYLE[p.status],
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-[7px] text-[10px] text-txt-muted">
                      {p.projectKind === "imported"
                        ? `${p.importedAsset?.format.toUpperCase() ?? "Imported"} model`
                        : p.vertexCount
                          ? `${p.vertexCount.toLocaleString()} vertices`
                          : "—"}
                    </p>
                    <p className="mt-[3px] text-[9.5px] text-txt-dim">
                      Updated {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <ProjectOpenLink
                    project={p}
                    className={cn(
                      "mt-[10px] flex h-[26px] items-center justify-center rounded-[4px] border border-line bg-panel text-[11px] text-txt-muted hover:text-txt",
                      view === "list" ? "mt-0 w-[86px] shrink-0" : "w-full",
                    )}
                  >
                    Open
                  </ProjectOpenLink>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
