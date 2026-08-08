import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/studio/AppHeader";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { NavigationRail } from "@/components/studio/NavigationRail";
import { PropertiesPanel } from "@/components/studio/PropertiesPanel";
import { ReconstructionPanel } from "@/components/studio/ReconstructionPanel";
import { StatusBar } from "@/components/studio/StatusBar";
import { OrthographicViewport, PerspectiveViewport } from "@/components/studio/Viewports";
import { WorkspaceToolbar } from "@/components/studio/WorkspaceToolbar";
import { CONSOLE_LINES, PROGRESS_STEPS } from "@/data/mock";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Portrait Project Workspace" },
      {
        name: "description",
        content:
          "Reconstruct a photo into a watertight 3D mesh: source image input, ECON engine settings, multi-view previews, console output and OBJ export.",
      },
      { property: "og:title", content: "DXF2OBJ — Portrait Project Workspace" },
      {
        property: "og:description",
        content:
          "Photo-to-mesh reconstruction workspace with perspective and orthographic previews, live console and OBJ export settings.",
      },
    ],
  }),
  component: Studio,
});

function Studio() {
  const [lines, setLines] = useState(CONSOLE_LINES);
  const [progress, setProgress] = useState(100);
  const [steps, setSteps] = useState(PROGRESS_STEPS.length);

  const startReconstruction = () => {
    setLines(["[10:31:02] Starting ECON reconstruction (Balanced mode)..."]);
    setProgress(0);
    setSteps(0);
    toast("Reconstruction queued");

    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setProgress(Math.min(100, tick * 17));
      setSteps(Math.min(PROGRESS_STEPS.length, tick));
      setLines((prev) => [...prev, `[10:31:${String(2 + tick * 7).padStart(2, "0")}] ${STAGES[tick - 1] ?? "Final mesh ready"}`]);
      if (tick >= 6) {
        window.clearInterval(timer);
        setProgress(100);
      }
    }, 700);
  };

  return (
    <div className="flex h-screen min-w-[1280px] flex-col overflow-hidden bg-app text-txt">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <NavigationRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceToolbar />
          <div className="flex min-h-0 flex-1 gap-[8px] p-[8px]">
            <ReconstructionPanel onStart={startReconstruction} />
            <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
              <div className="flex min-h-0 flex-1 overflow-hidden rounded-[6px] border border-line bg-panel">
                <PerspectiveViewport />
                <div className="grid w-[39%] shrink-0 grid-rows-[28.5fr_28.5fr_43fr] border-l border-line">
                  <OrthographicViewport name="Front" gizmo="front" className="border-b border-line" />
                  <OrthographicViewport name="Right" gizmo="right" className="border-b border-line" />
                  <div className="grid grid-cols-2">
                    <OrthographicViewport name="Back" className="border-r border-line" />
                    <OrthographicViewport name="Left" />
                  </div>
                </div>
              </div>
              <ConsolePanel lines={lines} progress={progress} completedSteps={steps} />
            </div>
          </div>
        </div>
        <PropertiesPanel />
      </div>
      <StatusBar />
      <Toaster />
    </div>
  );
}

const STAGES = [
  "Preprocessing completed",
  "Human detection: 1 person detected",
  "Initial mesh generated",
  "Refining geometry...",
  "Hole filling completed",
  "Final mesh ready",
];
