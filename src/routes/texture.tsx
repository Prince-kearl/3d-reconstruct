import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { AppShell } from "@/components/studio/AppShell";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { PropertiesPanel } from "@/components/studio/PropertiesPanel";
import { OrthographicViewport, PerspectiveViewport } from "@/components/studio/Viewports";
import { WorkspaceToolbar } from "@/components/studio/WorkspaceToolbar";
import { TexturePanel } from "@/components/texture/TexturePanel";
import { projectStore } from "@/lib/projects";
import {
  RECONSTRUCTION_STEPS,
  ReconstructProvider,
  useReconstruct,
  type ReconstructStatus,
} from "@/stores/reconstructStore";

export const Route = createFileRoute("/texture")({
  validateSearch: z.object({
    project: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Texture Workspace" },
      {
        name: "description",
        content:
          "Color-grade the real photo texture projected onto your reconstructed mesh — exposure, saturation, warmth and contrast, applied to the actual exported pixels.",
      },
      { property: "og:title", content: "DXF2OBJ — Texture Workspace" },
      {
        property: "og:description",
        content: "Texture workspace with real color grading controls for the projected photo.",
      },
    ],
  }),
  component: () => (
    <ReconstructProvider>
      <TexturePage />
    </ReconstructProvider>
  ),
});

const STATUS_LABEL: Record<ReconstructStatus, string> = {
  idle: "Waiting for a project",
  "loading-model": "Loading models…",
  "removing-background": "Removing background…",
  "estimating-depth": "Estimating depth…",
  "building-mesh": "Building mesh…",
  ready: "Ready",
  error: "Error",
};

const RING_STATE: Record<ReconstructStatus, "idle" | "running" | "done"> = {
  idle: "idle",
  "loading-model": "running",
  "removing-background": "running",
  "estimating-depth": "running",
  "building-mesh": "running",
  ready: "done",
  error: "idle",
};

function TexturePage() {
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
        toolbar={<WorkspaceToolbar />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={<div className="h-[200px] shrink-0 lg:h-auto lg:flex-1" />}
      />
    );
  }

  if (!projectId) {
    return (
      <AppShell
        toolbar={<WorkspaceToolbar />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={
          <div className="flex flex-1 items-center justify-center rounded-[6px] border border-line bg-panel text-[11.5px] text-txt-dim">
            No projects yet — reconstruct a photo first.
          </div>
        }
      />
    );
  }

  return <TextureWorkspace projectId={projectId} />;
}

function TextureWorkspace({ projectId }: { projectId: string }) {
  const {
    logLines,
    progress,
    completedSteps,
    status,
    projectId: loadedProjectId,
    loadProject,
    sourceFileName,
    resetTransform,
  } = useReconstruct();

  useEffect(() => {
    if (projectId !== loadedProjectId) {
      void loadProject(projectId);
    }
  }, [projectId, loadedProjectId, loadProject]);

  return (
    <AppShell
      toolbar={<WorkspaceToolbar />}
      properties={<PropertiesPanel />}
      projectName={sourceFileName?.replace(/\.[^.]+$/, "")}
      projectId={loadedProjectId}
      onResetTransform={status === "ready" ? resetTransform : undefined}
      workspace={
        <>
          <TexturePanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex h-[420px] shrink-0 lg:h-[560px] flex-col overflow-hidden rounded-[6px] border border-line bg-panel xl:h-auto xl:min-h-0 xl:flex-1 xl:flex-row">
              <PerspectiveViewport />
              <div className="grid h-[260px] shrink-0 lg:h-[320px] grid-rows-[28.5fr_28.5fr_43fr] border-t border-line xl:h-auto xl:w-[39%] xl:border-l xl:border-t-0">
                <OrthographicViewport name="Front" gizmo="front" className="border-b border-line" />
                <OrthographicViewport
                  name="Three-Quarter"
                  gizmo="right"
                  className="border-b border-line"
                />
                <div className="grid grid-cols-2">
                  <OrthographicViewport name="Depth Map" className="border-r border-line" />
                  <OrthographicViewport name="Wireframe" />
                </div>
              </div>
            </div>
            <ConsolePanel
              lines={logLines}
              progress={progress}
              completedSteps={completedSteps}
              steps={RECONSTRUCTION_STEPS}
              statusLabel={STATUS_LABEL[status]}
              ringState={RING_STATE[status]}
            />
          </div>
        </>
      }
    />
  );
}
