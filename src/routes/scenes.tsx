import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ScenesConsoleDock } from "@/components/scenes/ScenesConsoleDock";
import { ScenesPanel } from "@/components/scenes/ScenesPanel";
import { ScenesProperties } from "@/components/scenes/ScenesProperties";
import {
  ScenesCameraViewport,
  ScenesPerspectiveViewport,
} from "@/components/scenes/ScenesViewports";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { ScenesProvider, useScenes } from "@/stores/scenesStore";

export const Route = createFileRoute("/scenes")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Scene Manager Workspace" },
      {
        name: "description",
        content:
          "Arrange the portrait scene: object hierarchy, transform gizmos, camera rigs, lighting presets and saved scene layouts.",
      },
      { property: "og:title", content: "DXF2OBJ — Scene Manager Workspace" },
      {
        property: "og:description",
        content:
          "Object hierarchy, transform gizmo, multi-camera previews and lighting presets for the crystal portrait scene.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScenesPage,
});

function ScenesPage() {
  return (
    <ScenesProvider>
      <ScenesWorkspace />
    </ScenesProvider>
  );
}

function ScenesWorkspace() {
  const s = useScenes();
  const [mode, setMode] = useState<ViewportMode>("Solid");

  return (
    <AppShell
      status={s.statusLabel}
      toolbar={
        <WorkspaceToolbar
          modes={["Solid", "Wireframe", "Lighting", "Gizmo"]}
          mode={mode}
          onModeChange={setMode}
        />
      }
      properties={<ScenesProperties />}
      workspace={
        <>
          <ScenesPanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 gap-[8px]">
              <ScenesPerspectiveViewport mode={mode} />
              <div className="grid w-[300px] shrink-0 grid-cols-2 grid-rows-2 gap-[8px]">
                <ScenesCameraViewport name="Camera 01" />
                <ScenesCameraViewport name="Camera 02" />
                <ScenesCameraViewport name="Turntable" />
                <ScenesCameraViewport name="Top Rig" />
              </div>
            </div>
            <ScenesConsoleDock />
          </div>
        </>
      }
    />
  );
}