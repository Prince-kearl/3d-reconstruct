import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { LauncherQuickActions } from "@/components/launcher/LauncherQuickActions";
import { RecentProjects } from "@/components/launcher/RecentProjects";
import { SystemReadiness } from "@/components/launcher/SystemReadiness";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import { projectStore } from "@/lib/projects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Home" },
      {
        name: "description",
        content: "Your DXF2OBJ projects — resume a recent reconstruction or start a new one.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  const goToReconstruct = () => void navigate({ to: "/reconstruct" });

  return (
    <AppShell
      toolbar={
        <WorkspaceTabsToolbar title="Home" tabs={["Home"]} tab="Home" onTabChange={() => {}} />
      }
      properties={<SystemReadiness />}
      workspace={
        <>
          <LauncherQuickActions
            onNewProject={goToReconstruct}
            onImport={() => toast("Importing assets isn't available yet")}
            onRecover={() => toast("Autosave recovery isn't available yet")}
            projectCount={projects.length}
            mostRecentProjectId={projects[0]?.id ?? null}
          />
          <RecentProjects projects={projects} onNewProject={goToReconstruct} />
        </>
      }
    />
  );
}
