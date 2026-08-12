import { createFileRoute } from "@tanstack/react-router";
import { Box, FolderClosed, Grid2x2, Image as ImageIcon, LayoutGrid, Search, Upload } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/studio/AppShell";
import { CollapsibleSection, FieldLabel } from "@/components/studio/primitives";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import portrait from "@/assets/source-portrait.jpg";
import bust from "@/assets/bust-perspective.png";
import crystal from "@/assets/crystal-hero.png";
import tex from "@/assets/tex-perspective.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Asset Explorer" },
      {
        name: "description",
        content:
          "Browse project meshes, textures, scenes and source images with metadata, previews and recent activity.",
      },
      { property: "og:title", content: "DXF2OBJ — Asset Explorer" },
      {
        property: "og:description",
        content: "Digital asset manager for the crystal portrait pipeline: meshes, textures, scenes and sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorerPage,
});

const TREE = [
  "Portrait Project",
  "Source Images",
  "Meshes",
  "Textures",
  "Scenes",
  "Exports",
  "Snapshots",
];

const ASSETS = [
  { name: "source_portrait.jpg", kind: "Source", size: "3.4 MB", img: portrait },
  { name: "bust_raw.obj", kind: "Mesh", size: "148.2 MB", img: bust },
  { name: "bust_textured.obj", kind: "Mesh", size: "162.8 MB", img: tex },
  { name: "crystal_scene.scn", kind: "Scene", size: "12.6 MB", img: crystal },
  { name: "albedo_2k.png", kind: "Texture", size: "8.1 MB", img: tex },
  { name: "normal_2k.png", kind: "Texture", size: "9.4 MB", img: bust },
];

const ACTIVITY = [
  ["10:44", "Export validation passed"],
  ["10:38", "Texture maps generated"],
  ["10:21", "Mesh refinement applied"],
  ["10:04", "Source image imported"],
] as const;

const TABS = ["Assets", "Meshes", "Textures", "Scenes"] as const;

function ExplorerPage() {
  const [tab, setTab] = useState<string>(TABS[0]);
  const [folder, setFolder] = useState(TREE[0]!);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(ASSETS[0]!.name);
  const [view, setView] = useState<"grid" | "list">("grid");

  const kindFilter =
    tab === "Meshes" ? "Mesh" : tab === "Textures" ? "Texture" : tab === "Scenes" ? "Scene" : null;
  const visible = ASSETS.filter(
    (a) =>
      (!kindFilter || a.kind === kindFilter) &&
      a.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active = ASSETS.find((a) => a.name === selected) ?? ASSETS[0]!;

  return (
    <AppShell
      status="Assets Indexed"
      toolbar={
        <WorkspaceTabsToolbar
          tabs={TABS}
          tab={tab}
          onTabChange={setTab}
          actions={[
            { label: "Import assets", icon: Upload },
            { label: "Grid view", icon: Grid2x2, onClick: () => setView("grid") },
            { label: "List view", icon: LayoutGrid, onClick: () => setView("list") },
          ]}
        />
      }
      properties={
        <aside className="scroll-thin flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
          <div className="flex h-[40px] items-center border-b border-line px-[14px] text-[12px] font-semibold text-txt">
            Details
          </div>
          <div className="px-[14px] py-[12px]">
            <img
              src={active.img}
              alt={`Preview of ${active.name}`}
              className="aspect-[3/4] w-full rounded-[5px] border border-line object-cover"
            />
          </div>
          <CollapsibleSection title="Metadata">
            {(
              [
                ["Name", active.name],
                ["Type", active.kind],
                ["Size", active.size],
                ["Modified", "Today, 10:44"],
                ["Folder", folder],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-[10px] py-[3px] text-[11px]">
                <FieldLabel>{k}</FieldLabel>
                <span className="truncate text-txt">{v}</span>
              </div>
            ))}
          </CollapsibleSection>
          <CollapsibleSection title="Recent Activity">
            <ul className="space-y-[7px] text-[10.5px] text-txt-muted">
              {ACTIVITY.map(([t, text]) => (
                <li key={t} className="flex gap-[8px]">
                  <span className="font-mono text-txt-dim">{t}</span>
                  {text}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        </aside>
      }
      workspace={
        <>
          <aside className="flex w-[236px] shrink-0 flex-col gap-[10px] rounded-[6px] border border-line bg-panel px-[12px] py-[12px]">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] text-txt-muted">
              PROJECT TREE
            </h2>
            <div className="flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
              <Search className="size-[13px] shrink-0 text-txt-dim" />
              <input
                aria-label="Search assets"
                placeholder="Search assets..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none placeholder:text-txt-dim"
              />
            </div>
            <nav aria-label="Project folders" className="space-y-[2px]">
              {TREE.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  aria-current={folder === f ? "true" : undefined}
                  onClick={() => setFolder(f)}
                  className={cn(
                    "flex h-[30px] w-full items-center gap-[8px] rounded-[4px] px-[8px] text-[11.5px] transition-colors",
                    i > 0 && "pl-[18px]",
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
          </aside>

          <section className="scroll-thin flex min-w-0 flex-1 flex-col gap-[10px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[12px]">
            <h2 className="text-[13px] font-semibold text-txt">{folder}</h2>
            {visible.length === 0 ? (
              <p className="rounded-[6px] border border-dashed border-line-strong px-[14px] py-[26px] text-center text-[11.5px] text-txt-dim">
                No assets match this filter.
              </p>
            ) : (
              <div
                className={cn(
                  view === "grid" ? "grid grid-cols-4 gap-[10px]" : "flex flex-col gap-[6px]",
                )}
              >
                {visible.map((a) => {
                  const sel = selected === a.name;
                  return (
                    <button
                      key={a.name}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setSelected(a.name)}
                      className={cn(
                        "overflow-hidden rounded-[6px] border text-left transition-colors",
                        sel ? "border-accent/70 bg-accent/12" : "border-line bg-surface hover:bg-surface-2",
                        view === "list" && "flex items-center gap-[10px] px-[8px] py-[6px]",
                      )}
                    >
                      <img
                        src={a.img}
                        alt={a.name}
                        loading="lazy"
                        className={cn(
                          "object-cover",
                          view === "grid" ? "h-[104px] w-full" : "size-[34px] rounded-[4px]",
                        )}
                      />
                      <span className={cn(view === "grid" ? "block px-[8px] py-[7px]" : "min-w-0 flex-1")}>
                        <span className="flex items-center gap-[6px] truncate text-[11px] text-txt">
                          {a.kind === "Mesh" ? (
                            <Box className="size-[12px] text-txt-dim" />
                          ) : (
                            <ImageIcon className="size-[12px] text-txt-dim" />
                          )}
                          {a.name}
                        </span>
                        <span className="mt-[2px] block text-[10px] text-txt-dim">
                          {a.kind} • {a.size}
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