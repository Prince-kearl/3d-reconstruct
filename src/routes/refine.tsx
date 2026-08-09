import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { RefineConsoleDock } from "@/components/refine/RefineConsoleDock";
import { RefineProperties } from "@/components/refine/RefineProperties";
import {
  RefineOrthographicViewport,
  RefinePerspectiveViewport,
} from "@/components/refine/RefineViewports";
import { RefinementPanel } from "@/components/refine/RefinementPanel";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { RefinementProvider, useRefinement } from "@/stores/refinementStore";

export const Route = createFileRoute("/refine")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Refine Mesh Workspace" },
      {
        name: "description",
        content:
          "Refine a reconstructed 3D mesh: sculpt brushes, automatic cleanup, topology repair, multi-view previews and mesh analysis.",
      },
      { property: "og:title", content: "DXF2OBJ — Refine Mesh Workspace" },
      {
        property: "og:description",
        content:
          "Mesh refinement workspace with smoothing brushes, automatic cleanup, topology settings and live refinement progress.",
      },
    ],
  }),
  component: RefinePage,
});

function RefinePage() {
  return (
    <RefinementProvider>
      <RefineWorkspace />
    </RefinementProvider>
  );
}

function RefineWorkspace() {
  const s = useRefinement();
  const [mode, setMode] = useState<ViewportMode>("Solid");

  return (
    <AppShell
      status={s.statusLabel}
      toolbar={
        <WorkspaceToolbar
          modes={["Solid", "Wireframe", "Topology", "Before / After"]}
          mode={mode}
          onModeChange={setMode}
        />
      }
      properties={<RefineProperties />}
      workspace={
        <>
          <RefinementPanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 overflow-hidden rounded-[6px] border border-line bg-panel">
              <RefinePerspectiveViewport mode={mode} />
              <div className="grid w-[39%] shrink-0 grid-rows-[28.5fr_28.5fr_43fr] border-l border-line">
                <RefineOrthographicViewport
                  name="Front"
                  gizmo="front"
                  className="border-b border-line"
                />
                <RefineOrthographicViewport
                  name="Right"
                  gizmo="right"
                  className="border-b border-line"
                />
                <div className="grid grid-cols-2">
                  <RefineOrthographicViewport name="Back" className="border-r border-line" />
                  <RefineOrthographicViewport name="Left" />
                </div>
              </div>
            </div>
            <RefineConsoleDock />
          </div>
        </>
      }
    />
  );
}