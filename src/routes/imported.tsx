import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, FileBox, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { z } from "zod";

import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import { EngravingExportControls } from "@/components/engraving/EngravingExportControls";
import {
  disposeImportedObject,
  loadImportedModel,
  type ImportedFormat,
} from "@/lib/importedAssets/loader";
import { projectStore, type ProjectRecord } from "@/lib/projects";

export const Route = createFileRoute("/imported")({
  validateSearch: z.object({ project: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Imported Project" },
      { name: "description", content: "View and manage an imported CAD or 3D model project." },
    ],
  }),
  component: ImportedProjectPage,
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImportedModelCanvas({ object }: { object: THREE.Group }) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, 4.4], fov: 36, near: 0.01, far: 1000 }}
    >
      <color attach="background" args={["#10131c"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.45} />
      <gridHelper args={[4, 20, "#343b50", "#222838"]} position={[0, -1.12, 0]} />
      <primitive object={object} dispose={null} />
      <OrbitControls makeDefault enableDamping minDistance={1.2} maxDistance={12} />
    </Canvas>
  );
}

function ImportedProjectDetails({
  project,
  model,
}: {
  project: ProjectRecord | null;
  model: THREE.Group | null;
}) {
  const info = project?.importedAsset;
  const primaryFile = info?.files.find((file) => file.name === info.primaryFileName);
  const rows = info
    ? [
        ["Format", info.format.toUpperCase()],
        ["Original file", info.primaryFileName],
        ["File size", formatBytes(info.sizeBytes)],
        ["Bundle files", String(info.files.length)],
        ["Vertices", (project?.vertexCount ?? 0).toLocaleString()],
        ["Faces", (project?.faceCount ?? 0).toLocaleString()],
      ]
    : [];
  let hasTriangleSurface = false;
  model?.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && (mesh.geometry.getAttribute("position")?.count ?? 0) >= 3) {
      hasTriangleSurface = true;
    }
  });

  return (
    <aside className="scroll-thin flex h-full w-full shrink-0 flex-col overflow-y-auto bg-panel lg:border-l lg:border-line">
      <div className="flex h-[40px] items-center gap-[8px] border-b border-line px-[14px] text-[12px] font-semibold text-txt">
        <FileBox className="size-[14px] text-accent-2" /> Imported Asset
      </div>
      {project && info ? (
        <>
          <div className="border-b border-line px-[14px] py-[14px]">
            <h2 className="break-words text-[13px] font-semibold text-txt">{project.name}</h2>
            <p className="mt-[4px] text-[10.5px] text-txt-muted">Saved imported project</p>
          </div>
          <div className="space-y-[10px] px-[14px] py-[14px]">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-[10px] text-[11px]">
                <span className="shrink-0 text-txt-dim">{label}</span>
                <span className="min-w-0 break-all text-right text-txt">{value}</span>
              </div>
            ))}
          </div>
          <EngravingExportControls
            createSource={() => (model ? { object: model } : null)}
            sourceName={info.primaryFileName}
            sourceKind="complete-model"
            disabled={!hasTriangleSurface}
          />
          {info.format.toLowerCase() === "dxf" && !hasTriangleSurface ? (
            <p className="mx-[14px] mt-[10px] rounded-[4px] border border-line bg-surface px-[9px] py-[8px] text-[10px] leading-[15px] text-txt-dim">
              Laser engraving export needs triangle surfaces. This DXF contains linework only;
              import a 3D mesh or a DXF with 3DFACE entities.
            </p>
          ) : null}
          {primaryFile ? (
            <a
              href={primaryFile.url}
              download={info.primaryFileName}
              target="_blank"
              rel="noreferrer"
              className="mobile-hit-target mx-[14px] mt-[4px] flex h-[36px] items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface text-[11px] text-txt transition-colors hover:bg-surface-2"
            >
              <Box className="size-[13px]" /> Open original file
            </a>
          ) : null}
          {info.format.toLowerCase() === "dxf" ? (
            <p className="mx-[14px] mt-[12px] rounded-[4px] border border-line bg-surface px-[9px] py-[8px] text-[10px] leading-[15px] text-txt-dim">
              DXF is shown as a partial preview: supported linework, arcs, circles, splines, and
              3DFACE entities are rendered; blocks, dimensions, and some curve detail may be omitted
              or simplified. This is not a full CAD round-trip.
            </p>
          ) : null}
          <p className="px-[14px] py-[12px] text-[10px] leading-[15px] text-txt-dim">
            Orbit by dragging. Use the wheel or a pinch gesture to zoom, and right-drag to pan.
          </p>
        </>
      ) : (
        <p className="px-[14px] py-[16px] text-[11px] text-txt-dim">
          Imported project details will appear here.
        </p>
      )}
    </aside>
  );
}

function ImportedProjectPage() {
  const { project: projectId } = Route.useSearch();
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => projectStore.get(projectId!),
    enabled: Boolean(projectId),
  });
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !project) return;
    void projectStore.touchOpened(projectId).catch(() => {});
  }, [projectId, project]);

  useEffect(() => {
    if (!project || project.projectKind !== "imported" || !project.importedAsset) {
      setModel(null);
      setModelError(null);
      setModelLoading(false);
      return;
    }

    let cancelled = false;
    let loadedObject: THREE.Group | null = null;
    setModel(null);
    setModelError(null);
    setModelLoading(true);
    void loadImportedModel(
      project.importedAsset.files,
      project.importedAsset.primaryFileName,
      project.importedAsset.format as ImportedFormat,
    )
      .then((result) => {
        loadedObject = result.object;
        if (cancelled) {
          disposeImportedObject(result.object);
          return;
        }
        setModel(result.object);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setModelError(
            loadError instanceof Error ? loadError.message : "Could not render this model.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setModelLoading(false);
      });

    return () => {
      cancelled = true;
      if (loadedObject) disposeImportedObject(loadedObject);
    };
  }, [project]);

  const isImported = project?.projectKind === "imported";
  const status = error
    ? "Could not load project"
    : isLoading
      ? "Loading project…"
      : modelLoading
        ? "Loading model…"
        : modelError
          ? "Model load failed"
          : "Ready";

  return (
    <AppShell
      status={status}
      projectName={isImported ? project.name : null}
      projectId={isImported ? project.id : null}
      toolbar={
        <WorkspaceTabsToolbar
          title={isImported ? project.name : "Imported Project"}
          tabs={["Model"]}
          tab="Model"
          onTabChange={() => {}}
        />
      }
      properties={
        <ImportedProjectDetails
          project={isImported ? project : null}
          model={isImported ? model : null}
        />
      }
      workspace={
        <section className="viewport-surface relative flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
          <div className="absolute left-[14px] top-[12px] z-10 max-w-[70%] truncate rounded-[4px] border border-line bg-panel/90 px-[8px] py-[5px] text-[10.5px] text-txt-muted">
            {isImported ? project.importedAsset?.primaryFileName : "Imported model"}
          </div>
          {model ? <ImportedModelCanvas object={model} /> : null}
          {isLoading || modelLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] text-[11px] text-txt-muted">
              <LoaderCircle className="size-[20px] animate-spin text-accent-2" />
              <span>
                {isLoading ? "Loading saved project…" : "Reading model and companion files…"}
              </span>
            </div>
          ) : null}
          {!isLoading && !modelLoading && (error || modelError || !projectId || !isImported) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] px-[20px] text-center">
              <TriangleAlert className="size-[22px] text-warning" />
              <p className="max-w-[520px] text-[12px] text-txt">
                {error instanceof Error
                  ? error.message
                  : (modelError ??
                    (!projectId
                      ? "No imported project was selected."
                      : !isImported
                        ? "This project is not an imported model. Open it from the project library instead."
                        : "The project could not be loaded."))}
              </p>
              <Link
                to="/"
                className="mobile-hit-target flex h-[36px] items-center rounded-[4px] border border-line bg-surface px-[12px] text-[11px] text-txt hover:bg-surface-2"
              >
                Return to projects
              </Link>
            </div>
          ) : null}
        </section>
      }
    />
  );
}
