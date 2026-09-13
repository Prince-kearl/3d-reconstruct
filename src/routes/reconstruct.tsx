import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { AppShell } from "@/components/studio/AppShell";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { PropertiesPanel } from "@/components/studio/PropertiesPanel";
import { ReconstructionPanel } from "@/components/studio/ReconstructionPanel";
import { OrthographicViewport, PerspectiveViewport } from "@/components/studio/Viewports";
import { WorkspaceToolbar } from "@/components/studio/WorkspaceToolbar";
import {
  RECONSTRUCTION_STEPS,
  ReconstructProvider,
  useReconstruct,
  type ReconstructStatus,
} from "@/stores/reconstructStore";

export const Route = createFileRoute("/reconstruct")({
  validateSearch: z.object({
    project: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Portrait Project Workspace" },
      {
        name: "description",
        content:
          "Turn a photo into a rotatable pseudo-3D depth relief: real client-side depth estimation, a live mesh preview and OBJ/GLB export.",
      },
      { property: "og:title", content: "DXF2OBJ — Portrait Project Workspace" },
      {
        property: "og:description",
        content:
          "Photo-to-depth workspace with a real rotatable mesh preview, live console output and OBJ/GLB export.",
      },
    ],
  }),
  component: () => (
    <ReconstructProvider>
      <ReconstructPage />
    </ReconstructProvider>
  ),
});

const STATUS_LABEL: Record<ReconstructStatus, string> = {
  idle: "Waiting for a photo",
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

function ReconstructPage() {
  const { project } = Route.useSearch();
  const {
    logLines,
    progress,
    completedSteps,
    status,
    projectId,
    loadProject,
    sourceFileName,
    resetTransform,
    multiViewStatus,
    multiViewViews,
  } = useReconstruct();

  useEffect(() => {
    if (project && project !== projectId) {
      void loadProject(project);
    }
  }, [project, projectId, loadProject]);

  return (
    <AppShell
      toolbar={<WorkspaceToolbar />}
      properties={<PropertiesPanel />}
      projectName={sourceFileName?.replace(/\.[^.]+$/, "")}
      projectId={projectId}
      onResetTransform={status === "ready" ? resetTransform : undefined}
      workspace={
        <>
          <ReconstructionPanel />
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
                  <OrthographicViewport
                    name={multiViewViews.length > 0 ? "Multi-View" : "Wireframe"}
                  />
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
              title={multiViewStatus === "generating" ? "Multi-View Progress" : undefined}
            />
          </div>
        </>
      }
    />
  );
}
