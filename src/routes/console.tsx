import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Filter, Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { ConsoleDiagnostics } from "@/components/console/ConsoleDiagnostics";
import { ConsoleDock } from "@/components/console/ConsoleDock";
import { ConsoleExplorer, type LogLevelFilter } from "@/components/console/ConsoleExplorer";
import { ConsoleJobs } from "@/components/console/ConsoleJobs";
import { ConsoleLogsTable } from "@/components/console/ConsoleLogsTable";
import { ConsoleProjectsList } from "@/components/console/ConsoleProjectsList";
import { ConsoleSystemPanel } from "@/components/console/ConsoleSystemPanel";
import { LiveConsole } from "@/components/console/LiveConsole";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import { projectStore } from "@/lib/projects";
import {
  ReconstructProvider,
  useReconstruct,
  type ReconstructStatus,
} from "@/stores/reconstructStore";

export const Route = createFileRoute("/console")({
  validateSearch: z.object({
    project: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Console Workspace" },
      {
        name: "description",
        content:
          "Live reconstruction log for the current project, real event history, all your projects and system diagnostics.",
      },
      { property: "og:title", content: "DXF2OBJ — Console Workspace" },
      {
        property: "og:description",
        content: "Real live logs, project history, project list and diagnostics — no fake data.",
      },
    ],
  }),
  component: () => (
    <ReconstructProvider>
      <ConsolePage />
    </ReconstructProvider>
  ),
});

const TABS = ["Live Console", "Logs", "Jobs", "Diagnostics"] as const;

const STATUS_LABEL: Record<ReconstructStatus, string> = {
  idle: "Waiting for a project",
  "loading-model": "Loading models…",
  "removing-background": "Removing background…",
  "estimating-depth": "Estimating depth…",
  "building-mesh": "Building mesh…",
  ready: "Ready",
  error: "Error",
};

function ConsolePage() {
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
        toolbar={<WorkspaceTabsToolbar tabs={TABS} tab={TABS[0]} onTabChange={() => {}} />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={<div className="h-[200px] shrink-0 lg:h-auto lg:flex-1" />}
      />
    );
  }

  if (!projectId) {
    return (
      <AppShell
        toolbar={<WorkspaceTabsToolbar tabs={TABS} tab={TABS[0]} onTabChange={() => {}} />}
        properties={<div className="h-full w-full shrink-0 bg-panel lg:border-l lg:border-line" />}
        workspace={
          <div className="flex flex-1 items-center justify-center rounded-[6px] border border-line bg-panel text-[11.5px] text-txt-dim">
            No projects yet — reconstruct a photo first.
          </div>
        }
      />
    );
  }

  return <ConsoleWorkspace projectId={projectId} />;
}

function ConsoleWorkspace({ projectId }: { projectId: string }) {
  const {
    projectId: loadedProjectId,
    loadProject,
    sourceFileName,
    logLines,
    status,
  } = useReconstruct();

  const [tab, setTab] = useState<(typeof TABS)[number]>("Live Console");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LogLevelFilter>("All");
  const [followTail, setFollowTail] = useState(true);

  useEffect(() => {
    if (projectId !== loadedProjectId) {
      void loadProject(projectId);
    }
  }, [projectId, loadedProjectId, loadProject]);

  const infoCount = logLines.filter((l) => !/error/i.test(l)).length;
  const errorCount = logLines.length - infoCount;

  const clearFilters = () => {
    setSearch("");
    setLevel("All");
  };

  const downloadAllLogs = () => {
    const name = (sourceFileName ?? "console").replace(/\.[^.]+$/, "");
    const blob = new Blob([logLines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-log.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      status={STATUS_LABEL[status]}
      projectName={sourceFileName?.replace(/\.[^.]+$/, "")}
      projectId={loadedProjectId}
      toolbar={
        <WorkspaceTabsToolbar
          tabs={TABS}
          tab={tab}
          onTabChange={(t) => setTab(t as (typeof TABS)[number])}
          actions={[
            {
              label: followTail ? "Pause stream" : "Resume stream",
              icon: followTail ? Pause : Play,
              onClick: () => setFollowTail((v) => !v),
            },
            { label: "Clear filters", icon: Trash2, onClick: clearFilters },
            { label: "Download logs", icon: Download, onClick: downloadAllLogs },
            {
              label: "Cycle level filter",
              icon: Filter,
              onClick: () =>
                setLevel((prev) => (prev === "All" ? "Info" : prev === "Info" ? "Error" : "All")),
            },
          ]}
        />
      }
      properties={
        <ConsoleSystemPanel
          followTail={followTail}
          onToggleFollowTail={setFollowTail}
          onClearFilters={clearFilters}
        />
      }
      workspace={
        <>
          <ConsoleExplorer
            search={search}
            onSearchChange={setSearch}
            level={level}
            onLevelChange={setLevel}
            infoCount={infoCount}
            errorCount={errorCount}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
            <div className="flex min-h-0 flex-1 flex-col gap-[8px] xl:flex-row">
              {tab === "Live Console" ? (
                <>
                  <LiveConsole
                    search={search}
                    level={level}
                    followTail={followTail}
                    onToggleFollowTail={setFollowTail}
                  />
                  <ConsoleJobs />
                </>
              ) : tab === "Logs" ? (
                <ConsoleLogsTable />
              ) : tab === "Jobs" ? (
                <ConsoleProjectsList />
              ) : (
                <ConsoleDiagnostics />
              )}
            </div>
            <ConsoleDock />
          </div>
        </>
      }
    />
  );
}
