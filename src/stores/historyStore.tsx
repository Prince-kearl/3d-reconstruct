import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getProject, listHistoryEvents, type HistoryRow } from "@/lib/supabase/projects";
import { getSignedUrl } from "@/lib/supabase/storage";

export type Version = {
  id: string;
  name: string;
  stage: "Reconstruct" | "Refine" | "Texture" | "Export";
  time: string;
  verts: string;
  note: string;
};

// "Texture" is a valid Version stage but no history event is ever tagged with
// it yet (texture edits are continuous slider adjustments with no discrete
// commit action) — omitted here so the filter never offers a category that
// can't possibly match anything.
export const HISTORY_FILTERS = ["All", "Reconstruct", "Refine", "Export"] as const;

const EVENT_INFO: Record<
  string,
  { name: string; stage: Version["stage"]; note: (m: Record<string, unknown>) => string }
> = {
  project_created: { name: "Project Created", stage: "Reconstruct", note: () => "Project created" },
  image_uploaded: {
    name: "Image Uploaded",
    stage: "Reconstruct",
    note: (m) => `${String(m["width"] ?? "?")}×${String(m["height"] ?? "?")} source photo`,
  },
  reconstruction_started: {
    name: "Reconstruction Started",
    stage: "Reconstruct",
    note: () => "Depth estimation and mesh build started",
  },
  reconstruction_completed: {
    name: "Reconstruction Completed",
    stage: "Reconstruct",
    note: (m) => `${Number(m["vertexCount"] ?? 0).toLocaleString()} vertices generated`,
  },
  reconstruction_failed: {
    name: "Reconstruction Failed",
    stage: "Reconstruct",
    note: (m) => String(m["message"] ?? "Reconstruction failed"),
  },
  project_opened: { name: "Project Opened", stage: "Reconstruct", note: () => "Opened" },
  project_renamed: {
    name: "Project Renamed",
    stage: "Reconstruct",
    note: (m) => `Renamed to "${String(m["name"] ?? "")}"`,
  },
  model_exported: {
    name: "Model Exported",
    stage: "Export",
    note: (m) => `Exported as ${String(m["format"] ?? "?").toUpperCase()}`,
  },
  silhouette_edited: {
    name: "Silhouette Edited",
    stage: "Refine",
    note: () => "Manual mask touch-up saved",
  },
  multiview_generated: {
    name: "Multi-View Generated",
    stage: "Refine",
    note: (m) =>
      `${String(m["status"] ?? "?")} — ${Array.isArray(m["angles"]) ? m["angles"].length : 0} angles`,
  },
};

/** Shared with the Console page's activity feed, so event labels stay consistent. */
export function describeHistoryEvent(row: HistoryRow): {
  name: string;
  stage: Version["stage"];
  note: string;
} {
  const info = EVENT_INFO[row.event_type] ?? {
    name: row.event_type,
    stage: "Reconstruct" as const,
    note: () => "",
  };
  return { name: info.name, stage: info.stage, note: info.note(row.metadata) };
}

function toVersion(row: HistoryRow, index: number): Version {
  const info = EVENT_INFO[row.event_type] ?? {
    name: row.event_type,
    stage: "Reconstruct" as const,
    note: () => "",
  };
  const metadata = row.metadata;
  return {
    id: row.id,
    name: `v1.${index} — ${info.name}`,
    stage: info.stage,
    time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    verts:
      typeof metadata["vertexCount"] === "number" ? metadata["vertexCount"].toLocaleString() : "—",
    note: info.note(metadata),
  };
}

function parseVerts(v: string): number | null {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && v !== "—" ? n : null;
}

type Store = {
  isLoading: boolean;
  projectName: string | null;
  thumbnailUrl: string | null;
  versions: Version[];

  filter: string;
  setFilter: (v: string) => void;
  baseId: string;
  setBaseId: (v: string) => void;
  compareId: string;
  setCompareId: (v: string) => void;
  split: number;
  setSplit: (v: number) => void;
  showDiff: boolean;
  setShowDiff: (v: boolean) => void;
  logs: string[];
  diffStats: { label: string; value: string }[];
  statusLabel: string;
  setStatusLabel: (v: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function HistoryProvider({
  projectId,
  children,
}: {
  projectId: string | null;
  children: ReactNode;
}) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["project_history", projectId],
    queryFn: () => (projectId ? listHistoryEvents(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => (projectId ? getProject(projectId) : Promise.resolve(null)),
    enabled: Boolean(projectId),
  });
  const { data: thumbnailUrl = null } = useQuery({
    queryKey: ["project-thumbnail", project?.thumbnail_path],
    queryFn: () => (project?.thumbnail_path ? getSignedUrl(project.thumbnail_path) : null),
    enabled: Boolean(project?.thumbnail_path),
  });

  const versions = useMemo(() => [...rows].reverse().map((row, i) => toVersion(row, i)), [rows]);

  const [filter, setFilter] = useState("All");
  const [baseId, setBaseId] = useState("");
  const [compareId, setCompareId] = useState("");
  const [split, setSplit] = useState(50);
  const [showDiff, setShowDiff] = useState(true);
  const [statusLabel, setStatusLabel] = useState("Ready");

  useEffect(() => {
    if (!versions.length) return;
    setBaseId((prev) => (prev && versions.some((v) => v.id === prev) ? prev : versions[0]!.id));
    setCompareId((prev) =>
      prev && versions.some((v) => v.id === prev) ? prev : versions[versions.length - 1]!.id,
    );
  }, [versions]);

  const logs = useMemo(
    () =>
      versions.map(
        (v) => `[${v.time}] ${v.name.replace(/^v1\.\d+ — /, "")}${v.note ? ` — ${v.note}` : ""}`,
      ),
    [versions],
  );

  const diffStats = useMemo(() => {
    const base = versions.find((v) => v.id === baseId);
    const compare = versions.find((v) => v.id === compareId);
    const baseIndex = versions.findIndex((v) => v.id === baseId);
    const compareIndex = versions.findIndex((v) => v.id === compareId);
    const baseVerts = base ? parseVerts(base.verts) : null;
    const compareVerts = compare ? parseVerts(compare.verts) : null;

    const stats: { label: string; value: string }[] = [];
    if (baseVerts != null && compareVerts != null) {
      const diff = compareVerts - baseVerts;
      stats.push({ label: "Vertices", value: `${diff >= 0 ? "+" : ""}${diff.toLocaleString()}` });
    } else {
      stats.push({ label: "Vertices", value: "—" });
    }
    stats.push({
      label: "Events between",
      value: String(Math.max(0, Math.abs(compareIndex - baseIndex))),
    });
    return stats;
  }, [versions, baseId, compareId]);

  const value = useMemo<Store>(
    () => ({
      isLoading,
      projectName: project?.name ?? null,
      thumbnailUrl,
      versions,
      filter,
      setFilter,
      baseId,
      setBaseId,
      compareId,
      setCompareId,
      split,
      setSplit,
      showDiff,
      setShowDiff,
      logs,
      diffStats,
      statusLabel,
      setStatusLabel,
    }),
    [
      isLoading,
      project,
      thumbnailUrl,
      versions,
      filter,
      baseId,
      compareId,
      split,
      showDiff,
      logs,
      diffStats,
      statusLabel,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHistory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHistory must be used inside HistoryProvider");
  return ctx;
}
