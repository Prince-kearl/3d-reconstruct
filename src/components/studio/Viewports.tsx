import {
  Camera,
  Expand,
  Grid3x3,
  Hand,
  Maximize2,
  Move,
  MousePointer2,
  RotateCw,
  Scan,
  SquareDashed,
  Target,
  ZoomIn,
  Crosshair,
} from "lucide-react";
import { useRef, useState, type ComponentType, type SVGProps } from "react";

import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";
import { DepthMeshViewer, type DepthMeshViewerHandle, type DragMode } from "./DepthMeshViewer";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type StripAction = { drag: DragMode } | { toggle: "autoRotate" | "grid" } | { run: string };

const STRIP_TOOLS: { label: string; icon: Icon; action: StripAction }[] = [
  { label: "Orbit", icon: Move, action: { drag: "rotate" } },
  { label: "Pan", icon: Crosshair, action: { drag: "pan" } },
  { label: "Rotate", icon: RotateCw, action: { toggle: "autoRotate" } },
  { label: "Reset centre", icon: Target, action: { run: "reset" } },
  { label: "Zoom", icon: ZoomIn, action: { run: "zoomIn" } },
  { label: "Frame selection", icon: SquareDashed, action: { run: "frame" } },
  { label: "Viewport settings", icon: Scan, action: { toggle: "grid" } },
];

const BOTTOM_TOOLS: { label: string; icon: Icon; action: StripAction }[] = [
  { label: "Select", icon: MousePointer2, action: { drag: "rotate" } },
  { label: "Pan view", icon: Hand, action: { drag: "pan" } },
  { label: "Move model", icon: Move, action: { drag: "pan" } },
  { label: "Focus model", icon: Expand, action: { run: "frame" } },
  { label: "Toggle grid", icon: Grid3x3, action: { toggle: "grid" } },
  { label: "Snapshot", icon: Camera, action: { run: "snapshot" } },
  { label: "Fullscreen", icon: Maximize2, action: { run: "fullscreen" } },
];

function AxisGizmo({ variant }: { variant: "front" | "right" }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className="absolute bottom-[14px] left-[22px] h-[42px] w-[42px]"
      aria-hidden="true"
    >
      <g strokeWidth="1.4" fill="none">
        <line x1="30" y1="42" x2="30" y2="14" stroke="var(--axis-y)" />
        <line
          x1="30"
          y1="42"
          x2={variant === "front" ? "8" : "12"}
          y2={variant === "front" ? "50" : "48"}
          stroke="var(--axis-z)"
        />
        <line x1="30" y1="42" x2="52" y2="48" stroke="var(--axis-x)" />
      </g>
      <circle cx="30" cy="42" r="2.4" fill="oklch(0.85 0.02 265)" />
      <circle cx="30" cy="13" r="1.8" fill="var(--axis-y)" />
      <circle cx="52" cy="48" r="1.8" fill="var(--axis-x)" />
      <circle
        cx={variant === "front" ? 8 : 12}
        cy={variant === "front" ? 50 : 48}
        r="1.8"
        fill="var(--axis-z)"
      />
      <text x="27" y="9" fontSize="7" fill="var(--axis-y)">
        y
      </text>
      <text x="54" y="52" fontSize="7" fill="var(--axis-x)">
        x
      </text>
      <text x="1" y="54" fontSize="7" fill="var(--axis-z)">
        z
      </text>
    </svg>
  );
}

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

export function PerspectiveViewport() {
  const [tool, setTool] = useState(0);
  const [bottomTool, setBottomTool] = useState(0);
  const [dragMode, setDragMode] = useState<DragMode>("rotate");
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DepthMeshViewerHandle>(null);
  const { geometry, texture, status, scale, rotationY } = useReconstruct();
  const ready = status === "ready" && geometry;

  const runAction = (action: StripAction) => {
    if ("drag" in action) {
      setDragMode(action.drag);
      return;
    }
    if ("toggle" in action) {
      if (action.toggle === "autoRotate") setAutoRotate((v) => !v);
      else setShowGrid((v) => !v);
      return;
    }
    switch (action.run) {
      case "reset":
        viewerRef.current?.reset();
        break;
      case "zoomIn":
        viewerRef.current?.zoomIn();
        break;
      case "frame":
        viewerRef.current?.frame();
        break;
      case "snapshot": {
        const dataUrl = viewerRef.current?.captureSnapshot();
        if (dataUrl) downloadDataUrl(dataUrl, "dxf2obj-snapshot.png");
        break;
      }
      case "fullscreen":
        void ref.current?.requestFullscreen?.().catch(() => {});
        break;
    }
  };

  const isActive = (action: StripAction, index: number, selected: number) => {
    if ("toggle" in action) return action.toggle === "autoRotate" ? autoRotate : showGrid;
    if ("drag" in action) return dragMode === action.drag;
    return index === selected;
  };

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      {/* grid floor */}
      {showGrid ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px)",
            backgroundSize: "58px 34px",
            transform: "perspective(340px) rotateX(62deg)",
            transformOrigin: "bottom",
            maskImage: "linear-gradient(to top, oklch(0 0 0) 20%, transparent 95%)",
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-line/50" />
      <div className="pointer-events-none absolute inset-x-0 top-[62%] h-px bg-line/40" />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 40%, oklch(0.12 0.01 265 / 0.85) 100%)",
        }}
      />

      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Perspective
      </span>

      {ready ? (
        <DepthMeshViewer
          ref={viewerRef}
          geometry={geometry}
          texture={texture}
          interactive
          scale={scale}
          rotationYDeg={rotationY}
          dragMode={dragMode}
          autoRotate={autoRotate}
          className="absolute inset-0"
        />
      ) : (
        <EmptyHint
          message={
            status === "idle"
              ? "Upload a photo to generate a rotatable pseudo-3D preview"
              : status === "error"
                ? "Depth estimation failed — try a different photo"
                : "Generating…"
          }
        />
      )}

      <div className="absolute left-[8px] top-[42px] z-10 flex flex-col gap-[6px]">
        {STRIP_TOOLS.map(({ label, icon: Icon, action }, i) => {
          const active = isActive(action, i, tool);
          return (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => {
                setTool(i);
                runAction(action);
              }}
              disabled={!ready && "run" in action}
              className={cn(
                "flex size-[26px] items-center justify-center rounded-[4px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                active
                  ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                  : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
              )}
              style={active ? { background: "var(--gradient-accent)" } : undefined}
            >
              <Icon className="size-[14px]" />
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-[16px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[2px] rounded-[6px] border border-line bg-surface/85 p-[5px] backdrop-blur-sm">
        {BOTTOM_TOOLS.map(({ label, icon: Icon, action }, i) => {
          const active = isActive(action, i, bottomTool);
          return (
            <span key={label} className="flex items-center">
              {i === 4 || i === 6 ? <span className="mx-[4px] h-[16px] w-px bg-line" /> : null}
              <button
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                onClick={() => {
                  setBottomTool(i);
                  runAction(action);
                }}
                disabled={!ready && "run" in action && action.run !== "fullscreen"}
                className={cn(
                  "flex size-[28px] items-center justify-center rounded-[4px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "bg-surface-2 text-txt"
                    : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
                )}
              >
                <Icon className="size-[15px]" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export type OrthoViewName = "Front" | "Three-Quarter" | "Depth Map" | "Wireframe" | "Multi-View";

export function OrthographicViewport({
  name,
  gizmo,
  className,
}: {
  name: OrthoViewName;
  gizmo?: "front" | "right";
  className?: string;
}) {
  const { geometry, texture, depthPreviewUrl, status, multiViewViews } = useReconstruct();
  const ready = status === "ready" && geometry;
  const inspectedView = multiViewViews.find((v) => v.status === "ok" && v.imageUrl);

  return (
    <div className={cn("viewport-surface relative overflow-hidden", className)}>
      <span className="absolute left-[12px] top-[10px] z-10 text-[11.5px] text-txt-muted">
        {name}
      </span>

      {name === "Depth Map" ? (
        depthPreviewUrl ? (
          <img
            src={depthPreviewUrl}
            alt="Estimated depth map"
            className="absolute left-1/2 top-[54%] h-[82%] -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        ) : (
          <EmptyHint message="No depth data yet" />
        )
      ) : name === "Multi-View" ? (
        inspectedView ? (
          <img
            src={inspectedView.imageUrl!}
            alt={`AI-generated ${inspectedView.angle} view`}
            className="absolute left-1/2 top-[54%] h-[82%] -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        ) : (
          <EmptyHint message="No generated views yet" />
        )
      ) : ready ? (
        <DepthMeshViewer
          geometry={geometry}
          texture={texture}
          mode={name === "Wireframe" ? "wireframe" : "solid"}
          azimuthDeg={name === "Three-Quarter" ? 38 : 0}
          className="absolute inset-0"
        />
      ) : (
        <EmptyHint message="No model yet" />
      )}

      {gizmo ? <AxisGizmo variant={gizmo} /> : null}
    </div>
  );
}
