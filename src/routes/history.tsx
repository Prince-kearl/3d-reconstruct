import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { HistoryPanel } from "@/components/history/HistoryPanel";
import { HistoryProperties } from "@/components/history/HistoryProperties";
import {
  HistoryComparisonViewport,
  HistoryThumb,
  HistoryTimeline,
} from "@/components/history/HistoryViewports";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceToolbar, type ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { HistoryProvider, useHistory } from "@/stores/historyStore";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Version History Workspace" },
      {
        name: "description",
        content:
          "Browse every saved version of the portrait project, compare two versions with a draggable overlay divider and restore or branch from any step.",
      },
      { property: "og:title", content: "DXF2OBJ — Version History Workspace" },
      {
        property: "og:description",
        content:
          "Version explorer with overlay comparison, diff stats and a project timeline for the crystal portrait pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <HistoryProvider>
      <HistoryWorkspace />
    </HistoryProvider>
  );
}

function HistoryWorkspace() {
  const s = useHistory();
  const [mode, setMode] = useState<ViewportMode>("Overlay");

  return (
    <AppShell
      status={s.statusLabel}
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
            <div className="flex min-h-0 flex-1 gap-[8px]">
              <HistoryComparisonViewport />
              <div className="grid w-[300px] shrink-0 grid-cols-2 grid-rows-2 gap-[8px]">
                <HistoryThumb id="v1.1" />
                <HistoryThumb id="v1.2" />
                <HistoryThumb id="v1.3" />
                <HistoryThumb id="v1.4" />
              </div>
            </div>
            <div className="flex gap-[8px]">
              <section className="scroll-thin flex h-[195px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel px-[12px] py-[10px]">
                <h2 className="text-[12px] font-semibold text-txt">History Console</h2>
                <pre className="scroll-thin mt-[8px] flex-1 overflow-y-auto font-mono text-[10.5px] leading-[18px] text-txt-muted">
                  {s.logs.join("\n")}
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