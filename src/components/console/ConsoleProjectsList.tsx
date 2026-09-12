import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { projectStore, type ProjectStatus } from "@/lib/projects";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  processing: "border-accent/50 bg-accent/15 text-accent-2",
  completed: "border-ok/50 bg-ok/15 text-ok-2",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
};

export function ConsoleProjectsList() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="flex h-[38px] shrink-0 items-center border-b border-line px-[12px]">
        <h2 className="text-[13px] font-medium text-txt">All Projects</h2>
        <span className="ml-[10px] text-[11px] text-txt-dim">{projects.length} total</span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-[10px]">
        {isLoading ? (
          <p className="px-[6px] py-[10px] text-[11px] text-txt-dim">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="px-[6px] py-[10px] text-[11px] text-txt-dim">
            No projects yet — reconstruct a photo first.
          </p>
        ) : (
          <ul className="space-y-[6px]">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  to="/reconstruct"
                  search={{ project: p.id }}
                  className="flex items-center gap-[10px] rounded-[5px] border border-line bg-surface px-[10px] py-[8px] transition-colors hover:bg-surface-2"
                >
                  <div className="size-[36px] shrink-0 overflow-hidden rounded-[4px] border border-line bg-panel">
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] text-txt">{p.name}</p>
                    <p className="text-[10px] text-txt-dim">
                      {new Date(p.updatedAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-[3px] border px-[7px] py-[2px] text-[10px] font-medium",
                      STATUS_STYLE[p.status],
                    )}
                  >
                    {p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
