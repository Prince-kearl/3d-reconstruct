import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import sourcePortrait from "@/assets/source-portrait.jpg";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { TextureConsoleDock } from "@/components/texture/TextureConsoleDock";
import { TexturePanel } from "@/components/texture/TexturePanel";
import { TextureProperties } from "@/components/texture/TextureProperties";
import {
  TextureOrthographicViewport,
  TexturePerspectiveViewport,
} from "@/components/texture/TextureViewports";
import { TextureProvider, useTexture } from "@/stores/textureStore";

export const Route = createFileRoute("/texture")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Texture & Material Workspace" },
      {
        name: "description",
        content:
          "Project the source photo onto the refined mesh: skin texture generation, PBR material maps, colour correction and multi-view texture inspection.",
      },
      { property: "og:title", content: "DXF2OBJ — Texture & Material Workspace" },
      {
        property: "og:description",
        content:
          "Texture workspace with photo projection, PBR map generation, texture paint tools and live generation progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TexturePage,
});

function TexturePage() {
  return (
    <TextureProvider
      defaultSource={{
        src: sourcePortrait,
        label: "portrait-source.jpg",
        meta: "2048 × 2048 • sRGB",
      }}
    >
      <TextureWorkspace />
    </TextureProvider>
  );
}

function TextureWorkspace() {
  const s = useTexture();
  const [mode, setMode] = useState<ViewportMode>("Textured");

  return (
    <AppShell
      status={s.statusLabel}
      toolbar={
        <WorkspaceToolbar
          modes={["Textured", "Material", "UV Map", "Lighting"]}
          mode={mode}
          onModeChange={setMode}
        />
      }
      properties={<TextureProperties />}
      workspace={
        <>
          <TexturePanel />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 overflow-hidden rounded-[6px] border border-line bg-panel">
              <TexturePerspectiveViewport mode={mode} />
              <div className="grid w-[39%] shrink-0 grid-rows-[28.5fr_28.5fr_43fr] border-l border-line">
                <TextureOrthographicViewport
                  name="Front"
                  gizmo="front"
                  className="border-b border-line"
                />
                <TextureOrthographicViewport
                  name="Right"
                  gizmo="right"
                  className="border-b border-line"
                />
                <div className="grid grid-cols-2">
                  <TextureOrthographicViewport name="Back" className="border-r border-line" />
                  <TextureOrthographicViewport name="Left" />
                </div>
              </div>
            </div>
            <TextureConsoleDock />
          </div>
        </>
      }
    />
  );
}