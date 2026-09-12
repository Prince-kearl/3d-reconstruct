import { Camera, RotateCw, SquareDashed, Target, ZoomIn } from "lucide-react";
import { useRef, type ComponentType, type SVGProps } from "react";

import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";
import {
  CrystalMeshViewer,
  type CameraViewPreset,
  type CrystalMaterialSettings,
  type CrystalMeshViewerHandle,
  type SceneStagingSettings,
} from "./CrystalMeshViewer";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const VIEW_PRESET_LABELS: { label: string; preset: CameraViewPreset }[] = [
  { label: "Front", preset: "front" },
  { label: "3/4", preset: "three-quarter" },
  { label: "Side", preset: "side" },
  { label: "Top", preset: "top" },
];

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-[18px] text-center text-[11px] text-txt-dim">
      {message}
    </div>
  );
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function CrystalPreview({
  material,
  scene,
  autoRotate,
  onToggleAutoRotate,
}: {
  material: CrystalMaterialSettings;
  scene?: SceneStagingSettings | undefined;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CrystalMeshViewerHandle>(null);
  const { geometry, texture, status } = useReconstruct();
  const ready = status === "ready" && geometry;

  const tools: { label: string; icon: Icon; active?: boolean; run: () => void }[] = [
    {
      label: "Auto Rotate",
      icon: RotateCw,
      active: autoRotate,
      run: onToggleAutoRotate,
    },
    { label: "Reset view", icon: Target, run: () => viewerRef.current?.reset() },
    { label: "Zoom in", icon: ZoomIn, run: () => viewerRef.current?.zoomIn() },
    { label: "Frame model", icon: SquareDashed, run: () => viewerRef.current?.frame() },
    {
      label: "Snapshot",
      icon: Camera,
      run: () => {
        const dataUrl = viewerRef.current?.captureSnapshot();
        if (dataUrl) downloadDataUrl(dataUrl, "dxf2obj-crystal-preview.png");
      },
    },
  ];

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Crystal Preview — drag to rotate 360°
      </span>

      {ready ? (
        <div className="absolute right-[14px] top-[10px] z-10 flex items-center gap-[2px] rounded-[4px] border border-line bg-surface/85 p-[3px] backdrop-blur-sm">
          {VIEW_PRESET_LABELS.map(({ label, preset }) => (
            <button
              key={preset}
              type="button"
              onClick={() => viewerRef.current?.goToView(preset)}
              className="rounded-[3px] px-[8px] py-[3px] text-[10.5px] text-txt-muted transition-colors hover:bg-surface-2 hover:text-txt"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {ready ? (
        <CrystalMeshViewer
          ref={viewerRef}
          geometry={geometry}
          texture={texture}
          material={material}
          scene={scene}
          autoRotate={autoRotate}
          interactive
          className="absolute inset-0"
        />
      ) : (
        <EmptyHint
          message={
            status === "idle"
              ? "Reconstruct a model first to preview it as crystal"
              : status === "error"
                ? "Reconstruction failed — try a different photo"
                : "Generating…"
          }
        />
      )}

      <div className="absolute bottom-[16px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[2px] rounded-[6px] border border-line bg-surface/85 p-[5px] backdrop-blur-sm">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active ?? false}
            onClick={run}
            disabled={!ready}
            className={cn(
              "flex size-[28px] items-center justify-center rounded-[4px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                : "text-txt-dim hover:bg-surface-2/70 hover:text-txt",
            )}
            style={active ? { background: "var(--gradient-accent)" } : undefined}
          >
            <Icon className="size-[15px]" />
          </button>
        ))}
      </div>
    </div>
  );
}
