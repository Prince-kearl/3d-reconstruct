import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";

import { LauncherQuickActions } from "@/components/launcher/LauncherQuickActions";
import { RecentProjects } from "@/components/launcher/RecentProjects";
import { SystemReadiness } from "@/components/launcher/SystemReadiness";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import {
  disposeImportedObject,
  IMPORT_ACCEPT,
  loadImportedModel,
  validateImportSelection,
} from "@/lib/importedAssets/loader";
import { projectStore } from "@/lib/projects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Home" },
      {
        name: "description",
        content: "Your DXF2OBJ projects — resume a reconstruction or import a 3D/CAD model.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  const goToReconstruct = () => void navigate({ to: "/reconstruct" });
  const importFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const toastId = toast.loading("Validating imported model…");
    let object: Awaited<ReturnType<typeof loadImportedModel>>["object"] | null = null;

    try {
      const { primary, format } = validateImportSelection(files);
      const parsed = await loadImportedModel(
        files.map((file) => ({ name: file.name, file, mimeType: file.type, size: file.size })),
        primary.name,
        format,
      );
      object = parsed.object;

      const id = crypto.randomUUID();
      const projectName = primary.name.replace(/\.[^.]+$/, "") || primary.name;
      await projectStore.importAsset({
        id,
        name: projectName,
        primaryFileName: primary.name,
        format,
        files: files.map((file) => ({
          name: file.name,
          file,
          mimeType: file.type || "application/octet-stream",
        })),
        vertexCount: parsed.vertexCount,
        faceCount: parsed.faceCount,
      });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Imported "${primary.name}"`, { id: toastId });
      await navigate({ to: "/imported", search: { project: id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import this file.";
      toast.error(message, { id: toastId });
    } finally {
      if (object) disposeImportedObject(object);
    }
  };

  return (
    <AppShell
      toolbar={
        <WorkspaceTabsToolbar title="Home" tabs={["Home"]} tab="Home" onTabChange={() => {}} />
      }
      properties={<SystemReadiness />}
      workspace={
        <>
          <input
            ref={importInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            multiple
            className="hidden"
            aria-label="Select a model and any companion files to import"
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              void importFiles(files);
            }}
          />
          <LauncherQuickActions
            onNewProject={goToReconstruct}
            onImport={() => importInputRef.current?.click()}
            onRecover={() => toast("Autosave recovery isn't available yet")}
            projectCount={projects.length}
            mostRecentProjectId={projects[0]?.id ?? null}
            mostRecentProjectKind={projects[0]?.projectKind ?? null}
          />
          <RecentProjects projects={projects} onNewProject={goToReconstruct} />
        </>
      }
    />
  );
}
