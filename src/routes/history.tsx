import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { HistoryPanel } from "@/components/history/HistoryPanel";
import { HistoryProperties } from "@/components/history/HistoryProperties";
import {
  HistoryComparisonViewport,
  HistoryThumb,
  HistoryTimeline,
} from "@/components/history/HistoryViewports";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { projectStore } from "@/lib/projects";
import { HistoryProvider, useHistory } from "@/stores/historyStore";
import { ReconstructProvider, useReconstruct } from "@/stores/reconstructStore";

export const Route = createFileRoute("/history")({
  validateSearch: z.object({
    project: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Version History Workspace" },
      {
        name: "description",
        content: "Browse the real event history for a project, with an overlay comparison view.",
      },
      { property: "og:title", content: "DXF2OBJ — Version History Workspace" },
      {
        property: "og:description",
        content: "Version explorer with overlay comparison and a real project timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { project } = Route.useSearch();
  const { data: mostRecent, isLoading } = useQuery({
    queryKey: ["most-recent-project"],
    queryFn: () => projectStore.getMostRecent(),
    enabled: !project,
  });

  const projectId = project ?? mostRecent?.id ?? null;

  if (!project && isLoading) {
    return (
      <AppShell
        toolbar={<WorkspaceToolbar modes={["Overlay"]} mode="Overlay" onModeChange={() => {}} />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={<div className="h-[200px] shrink-0 lg:h-auto lg:flex-1" />}
      />
    );
  }

  if (!projectId) {
    return (
      <AppShell
        toolbar={<WorkspaceToolbar modes={["Overlay"]} mode="Overlay" onModeChange={() => {}} />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={
          <div className="flex flex-1 items-center justify-center rounded-[6px] border border-line bg-panel text-[11.5px] text-txt-dim">
            No projects yet — reconstruct a photo first.
          </div>
        }
      />
    );
  }

  return (
    <ReconstructProvider>
      <HistoryProvider projectId={projectId}>
        <HistoryWorkspace projectId={projectId} />
      </HistoryProvider>
    </ReconstructProvider>
  );
}

function HistoryWorkspace({ projectId }: { projectId: string }) {
  const s = useHistory();
  const { projectId: loadedProjectId, loadProject } = useReconstruct();
  const [mode, setMode] = useState<ViewportMode>("Overlay");
  const thumbSlots = s.versions.slice(-4);

  useEffect(() => {
    if (projectId !== loadedProjectId) {
      void loadProject(projectId);
    }
  }, [projectId, loadedProjectId, loadProject]);

  return (
    <AppShell
      status={s.statusLabel}
      projectName={s.projectName}
      projectId={projectId}
      toolbar={
        <WorkspaceToolbar
          modes={["Overlay", "Side by Side", "Difference", "Solid"]}
          mode={mode}
          onModeChange={setMode}
        />
      }
      properties={<HistoryProperties />}
      workspace={
        <>
          <HistoryPanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex h-[420px] shrink-0 lg:h-[560px] flex-col gap-[8px] xl:h-auto xl:min-h-0 xl:flex-1 xl:flex-row">
              <HistoryComparisonViewport />
              <div className="grid h-[260px] shrink-0 lg:h-[320px] grid-cols-2 grid-rows-2 gap-[8px] xl:h-auto xl:w-[300px]">
                {thumbSlots.map((v) => (
                  <HistoryThumb key={v.id} id={v.id} />
                ))}
                {Array.from({ length: Math.max(0, 4 - thumbSlots.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="viewport-surface" aria-hidden="true" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-[8px] xl:flex-row">
              <section className="scroll-thin flex h-[160px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel px-[12px] py-[10px] lg:h-[195px] lg:flex-1">
                <h2 className="text-[12px] font-semibold text-txt">History Console</h2>
                <pre className="scroll-thin mt-[8px] flex-1 overflow-y-auto font-mono text-[10.5px] leading-[18px] text-txt-muted">
                  {s.logs.length ? s.logs.join("\n") : "No output yet."}
                </pre>
              </section>
              <HistoryTimeline />
            </div>
          </div>
        </>
      }
    />
  );
}
