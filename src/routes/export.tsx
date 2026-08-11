import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ExportConsoleDock } from "@/components/export/ExportConsoleDock";
import { ExportPanel } from "@/components/export/ExportPanel";
import { ExportProperties } from "@/components/export/ExportProperties";
import {
  ExportPerspectiveViewport,
  ExportSecondaryViewport,
} from "@/components/export/ExportViewports";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { ExportProvider, useExport } from "@/stores/exportStore";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Export & Crystal Fitting Workspace" },
      {
        name: "description",
        content:
          "Export the finished portrait mesh to OBJ, STL, PLY, FBX, GLB or 3MF with crystal volume fitting, geometry checks and laser-ready output settings.",
      },
      { property: "og:title", content: "DXF2OBJ — Export & Crystal Fitting Workspace" },
      {
        property: "og:description",
        content:
          "Choose an export format, fit the crystal volume, run geometry checks and write laser-ready output files.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExportPage,
});

function ExportPage() {
  return (
    <ExportProvider>
      <ExportWorkspace />
    </ExportProvider>
  );
}

function ExportWorkspace() {
  const s = useExport();
  const [mode, setMode] = useState<ViewportMode>("Crystal Preview");

  return (
    <AppShell
      status={s.statusLabel}
      toolbar={
        <WorkspaceToolbar
          modes={["Crystal Preview", "Solid", "Wireframe", "Bounds"]}
          mode={mode}
          onModeChange={setMode}
        />
      }
      properties={<ExportProperties />}
      workspace={
        <>
          <ExportPanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 gap-[8px]">
              <ExportPerspectiveViewport mode={mode} />
              <div className="grid w-[300px] shrink-0 grid-cols-2 grid-rows-2 gap-[8px]">
                <ExportSecondaryViewport name="Crystal Preview" />
                <ExportSecondaryViewport name="Mesh Check" />
                <ExportSecondaryViewport name="Bounds" />
                <ExportSecondaryViewport name="Base" />
              </div>
            </div>
            <ExportConsoleDock />
          </div>
        </>
      }
    />
  );
}