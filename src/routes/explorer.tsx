import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Box,
  Check,
  FolderClosed,
  Grid2x2,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/studio/AppShell";
import { CollapsibleSection, FieldLabel } from "@/components/studio/primitives";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import { projectStore, type ProjectStatus, type ProjectSummary } from "@/lib/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Project Explorer" },
      {
        name: "description",
        content:
          "Browse the reconstructions you've generated, with real thumbnails, mesh stats and timestamps.",
      },
      { property: "og:title", content: "DXF2OBJ — Project Explorer" },
      {
        property: "og:description",
        content: "Real project library for the photo-to-depth reconstruction pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorerPage,
});

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

const STATUS_STYLE: Record<ProjectStatus, string> = {
  processing: "border-accent/50 bg-accent/15 text-accent-2",
  completed: "border-ok/50 bg-ok/15 text-ok-2",
  failed: "border-destructive/50 bg-destructive/15 text-destructive",
};

function Thumbnail({ project, className }: { project: ProjectSummary; className?: string }) {
  if (!project.thumbnailUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 text-txt-dim", className)}>
        <Box className="size-[18px]" />
      </div>
    );
  }
  return (
    <img
      src={project.thumbnailUrl}
      alt={project.name}
      loading="lazy"
      className={cn("object-cover", className)}
    />
  );
}

function ExplorerPage() {
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  const [folder, setFolder] = useState<"All Projects" | "Recent">("All Projects");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [renaming, setRenaming] = useState<string | null>(null);

  const visible = useMemo(() => {
    const now = Date.now();
    return projects.filter(
      (p) =>
        (folder === "All Projects" || now - p.updatedAt < RECENT_WINDOW_MS) &&
        p.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [projects, folder, query]);

  const active: ProjectSummary | null =
    projects.find((p) => p.id === selectedId) ?? visible[0] ?? null;

  const activity = useMemo(
    () =>
      [...projects]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6)
        .map((p) => ({
          id: p.id,
          text: `${p.createdAt === p.updatedAt ? "Created" : "Updated"} "${p.name}"`,
          time: formatDistanceToNow(p.updatedAt, { addSuffix: true }),
        })),
    [projects],
  );

  const handleDelete = async (id: string, name: string) => {
    await projectStore.remove(id);
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
    if (selectedId === id) setSelectedId(null);
    toast.success(`Deleted "${name}"`);
  };

  const handleRename = async (id: string, name: string) => {
    const trimmed = name.trim();
    setRenaming(null);
    if (!trimmed) return;
    await projectStore.rename(id, trimmed);
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <AppShell
      status={
        isLoading ? "Loading…" : `${projects.length} project${projects.length === 1 ? "" : "s"}`
      }
      toolbar={
        <WorkspaceTabsToolbar
          title="Explorer"
          tabs={["All Projects"]}
          tab="All Projects"
          onTabChange={() => {}}
          actions={[
            { label: "Grid view", icon: Grid2x2, onClick: () => setView("grid") },
            { label: "List view", icon: LayoutGrid, onClick: () => setView("list") },
          ]}
        />
      }
      properties={
        <aside className="scroll-thin flex h-full w-full shrink-0 flex-col overflow-y-auto bg-panel lg:border-l lg:border-line">
          <div className="flex h-[40px] items-center border-b border-line px-[14px] text-[12px] font-semibold text-txt">
            Details
          </div>
          {active ? (
            <>
              <div className="px-[14px] py-[12px]">
                <Thumbnail
                  project={active}
                  className="aspect-[3/4] w-full rounded-[5px] border border-line"
                />
              </div>
              <CollapsibleSection title="Metadata">
                <div className="flex items-center justify-between gap-2 py-[3px] text-[11px]">
                  <FieldLabel>Name</FieldLabel>
                  {renaming === active.id ? (
                    <RenameField
                      initial={active.name}
                      onSave={(name) => void handleRename(active.id, name)}
                      onCancel={() => setRenaming(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRenaming(active.id)}
                      className="flex min-w-0 items-center gap-[6px] truncate text-txt hover:text-accent-2"
                    >
                      <span className="truncate">{active.name}</span>
                      <Pencil className="size-[11px] shrink-0 text-txt-dim" />
                    </button>
                  )}
                </div>
                {(
                  [
                    ["Status", active.status],
                    ["Created", new Date(active.createdAt).toLocaleString()],
                    ["Updated", formatDistanceToNow(active.updatedAt, { addSuffix: true })],
                    ["Resolution", `${active.imageWidth} × ${active.imageHeight}`],
                    ["Vertices", active.vertexCount.toLocaleString()],
                    ["Faces", active.faceCount.toLocaleString()],
                    ["Quality", active.quality],
                  ] as const
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-[10px] py-[3px] text-[11px]"
                  >
                    <FieldLabel>{k}</FieldLabel>
                    <span className="truncate text-txt">{v}</span>
                  </div>
                ))}
                {active.status === "failed" && active.errorMessage ? (
                  <p className="mt-[6px] text-[10.5px] text-destructive">{active.errorMessage}</p>
                ) : null}
              </CollapsibleSection>
              <div className="flex gap-[8px] px-[14px] py-[12px]">
                <Link
                  to="/reconstruct"
                  search={{ project: active.id }}
                  className="flex h-[30px] flex-1 items-center justify-center rounded-[4px] text-[11.5px] font-medium text-white transition-opacity hover:opacity-95"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  Open
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Delete ${active.name}`}
                      className="flex h-[30px] w-[36px] items-center justify-center rounded-[4px] border border-line bg-surface-2 text-txt-muted transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-[14px]" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{active.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the project and its stored photo, depth map, and
                        exported models. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => void handleDelete(active.id, active.name)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <p className="px-[14px] py-[16px] text-[11px] text-txt-dim">No project selected.</p>
          )}
          <CollapsibleSection title="Recent Activity">
            {activity.length ? (
              <ul className="space-y-[7px] text-[10.5px] text-txt-muted">
                {activity.map((a) => (
                  <li key={a.id} className="flex flex-col gap-[1px]">
                    <span>{a.text}</span>
                    <span className="text-txt-dim">{a.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10.5px] text-txt-dim">No activity yet.</p>
            )}
          </CollapsibleSection>
        </aside>
      }
      workspace={
        <>
          <aside className="flex w-full shrink-0 flex-col gap-[10px] rounded-[6px] border border-line bg-panel px-[12px] py-[12px] lg:w-[236px]">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] text-txt-muted">PROJECTS</h2>
            <div className="flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
              <Search className="size-[13px] shrink-0 text-txt-dim" />
              <input
                aria-label="Search projects"
                placeholder="Search projects..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none placeholder:text-txt-dim"
              />
            </div>
            <nav aria-label="Project filters" className="space-y-[2px]">
              {(["All Projects", "Recent"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-current={folder === f ? "true" : undefined}
                  onClick={() => setFolder(f)}
                  className={cn(
                    "flex h-[30px] w-full items-center gap-[8px] rounded-[4px] px-[8px] text-[11.5px] transition-colors",
                    folder === f
                      ? "bg-accent/15 text-txt"
                      : "text-txt-muted hover:bg-surface-2/70 hover:text-txt",
                  )}
                >
                  <FolderClosed className="size-[13px] shrink-0 text-txt-dim" />
                  <span className="truncate">{f}</span>
                </button>
              ))}
            </nav>
            <Link
              to="/reconstruct"
              className="flex h-[30px] w-full items-center justify-center gap-[6px] rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
            >
              <Plus className="size-[13px]" />
              New Reconstruction
            </Link>
          </aside>

          <section className="scroll-thin flex min-w-0 flex-1 flex-col gap-[10px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[12px]">
            <h2 className="text-[13px] font-semibold text-txt">{folder}</h2>
            {isLoading ? (
              <p className="rounded-[6px] border border-dashed border-line-strong px-[14px] py-[26px] text-center text-[11.5px] text-txt-dim">
                Loading projects…
              </p>
            ) : visible.length === 0 ? (
              <div className="rounded-[6px] border border-dashed border-line-strong px-[14px] py-[26px] text-center">
                <p className="text-[11.5px] text-txt-dim">
                  {projects.length === 0
                    ? "No projects yet — reconstruct a photo to create one."
                    : "No projects match this filter."}
                </p>
                {projects.length === 0 ? (
                  <Link
                    to="/reconstruct"
                    className="mt-[12px] inline-flex h-[30px] items-center justify-center rounded-[4px] px-[14px] text-[11.5px] font-medium text-white transition-opacity hover:opacity-95"
                    style={{ background: "var(--gradient-accent)" }}
                  >
                    Start Reconstruction
                  </Link>
                ) : null}
              </div>
            ) : (
              <div
                className={cn(
                  view === "grid"
                    ? "grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-4"
                    : "flex flex-col gap-[6px]",
                )}
              >
                {visible.map((p) => {
                  const sel = active?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "overflow-hidden rounded-[6px] border text-left transition-colors",
                        sel
                          ? "border-accent/70 bg-accent/12"
                          : "border-line bg-surface hover:bg-surface-2",
                        view === "list" && "flex items-center gap-[10px] px-[8px] py-[6px]",
                      )}
                    >
                      <Thumbnail
                        project={p}
                        className={
                          view === "grid" ? "h-[104px] w-full" : "size-[34px] rounded-[4px]"
                        }
                      />
                      <span
                        className={cn(
                          view === "grid" ? "block px-[8px] py-[7px]" : "min-w-0 flex-1",
                        )}
                      >
                        <span className="flex items-center gap-[6px] truncate text-[11px] text-txt">
                          <Box className="size-[12px] text-txt-dim" />
                          {p.name}
                          {p.status !== "completed" ? (
                            <span
                              className={cn(
                                "shrink-0 rounded-[3px] border px-[5px] py-[1px] text-[9px] font-semibold",
                                STATUS_STYLE[p.status],
                              )}
                            >
                              {p.status}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-[2px] block text-[10px] text-txt-dim">
                          {p.vertexCount.toLocaleString()} verts •{" "}
                          {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      }
    />
  );
}

function RenameField({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[4px]">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value);
          if (e.key === "Escape") onCancel();
        }}
        className="h-[22px] min-w-0 flex-1 rounded-[3px] border border-line bg-surface px-[6px] text-[11px] text-txt outline-none focus:border-accent"
      />
      <button
        type="button"
        aria-label="Save name"
        onClick={() => onSave(value)}
        className="text-ok-2 hover:opacity-80"
      >
        <Check className="size-[13px]" />
      </button>
      <button
        type="button"
        aria-label="Cancel rename"
        onClick={onCancel}
        className="text-txt-dim hover:text-txt"
      >
        <X className="size-[13px]" />
      </button>
    </div>
  );
}
