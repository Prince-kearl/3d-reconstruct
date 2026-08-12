import { createFileRoute } from "@tanstack/react-router";
import { Download, Filter, LayoutGrid, Pause, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConsoleDock } from "@/components/console/ConsoleDock";
import { ConsoleExplorer } from "@/components/console/ConsoleExplorer";
import { ConsoleJobs } from "@/components/console/ConsoleJobs";
import { ConsoleSystemPanel } from "@/components/console/ConsoleSystemPanel";
import { LiveConsole } from "@/components/console/LiveConsole";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Console Workspace" },
      {
        name: "description",
        content:
          "Live console stream, job queue, throughput graphs and GPU monitoring for the DXF2OBJ portrait pipeline.",
      },
      { property: "og:title", content: "DXF2OBJ — Console Workspace" },
      {
        property: "og:description",
        content: "Stream pipeline logs, watch active jobs and monitor GPU health in one dense console view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConsolePage,
});

const TABS = ["Live Console", "Logs", "Jobs", "Diagnostics"] as const;

function ConsolePage() {
  const [tab, setTab] = useState<string>(TABS[0]);

  return (
    <AppShell
      status="Console Live"
      toolbar={
        <WorkspaceTabsToolbar
          tabs={TABS}
          tab={tab}
          onTabChange={setTab}
          actions={[
            { label: "Pause stream", icon: Pause },
            { label: "Clear buffer", icon: Trash2 },
            { label: "Download logs", icon: Download },
            { label: "Filter events", icon: Filter },
            { label: "Panel layout", icon: LayoutGrid },
          ]}
        />
      }
      properties={<ConsoleSystemPanel />}
      workspace={
        <>
          <ConsoleExplorer />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 gap-[8px]">
              <LiveConsole />
              <ConsoleJobs />
            </div>
            <ConsoleDock />
          </div>
        </>
      }
    />
  );
}