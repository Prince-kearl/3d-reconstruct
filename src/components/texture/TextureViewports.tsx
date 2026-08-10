import {
  Brush,
  Camera,
  ChevronDown,
  Eraser,
  Grid3x3,
  Maximize2,
  MousePointer2,
  Pipette,
  Scan,
  Stamp,
  Waves,
} from "lucide-react";
import { useRef, type ComponentType, type SVGProps } from "react";

import texBack from "@/assets/tex-back.png";
import texFront from "@/assets/tex-front.png";
import texLeft from "@/assets/tex-left.png";
import texPerspective from "@/assets/tex-perspective.png";
import texRight from "@/assets/tex-right.png";
import { cn } from "@/lib/utils";
import { useTexture, type TextureTool } from "@/stores/textureStore";
import type { ViewportMode } from "@/components/studio/WorkspaceToolbar";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const STRIP_TOOLS: { label: TextureTool; icon: Icon }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Paint", icon: Brush },
  { label: "Erase", icon: Eraser },
  { label: "Clone", icon: Stamp },
  { label: "Smudge", icon: Waves },
  { label: "Mask", icon: Scan },
  { label: "Eyedropper", icon: Pipette },
];

const BOTTOM_TOOLS: { label: string; icon: Icon; tool?: TextureTool }[] = [
  { label: "Select", icon: MousePointer2, tool: "Select" },
  { label: "Paint Brush", icon: Brush, tool: "Paint" },
  { label: "Eraser", icon: Eraser, tool: "Erase" },
  { label: "Clone", icon: Stamp, tool: "Clone" },
  { label: "Mask", icon: Scan, tool: "Mask" },
  { label: "UV grid", icon: Grid3x3 },
  { label: "Snapshot", icon: Camera },
  { label: "Fullscreen", icon: Maximize2 },
];

function AxisGizmo({ variant }: { variant: "front" | "right" }) {
  const flip = variant === "right";
  return (
    <svg
      viewBox="0 0 60 60"
      className="absolute bottom-[10px] left-[10px] h-[42px] w-[42px]"
      aria-hidden="true"
    >
      <g strokeWidth="1.4" fill="none">
        <line x1="30" y1="42" x2="30" y2="14" stroke="var(--axis-y)" />
        <line x1="30" y1="42" x2={flip ? 8 : 52} y2="42" stroke="var(--axis-x)" />
        <line x1="30" y1="42" x2={flip ? 52 : 8} y2="42" stroke="var(--axis-z)" />
      </g>
      <circle cx="30" cy="42" r="2.2" fill="oklch(0.85 0.02 265)" />
      <text x="27" y="10" fontSize="7.5" fill="var(--axis-y)">
        y
      </text>
      <text x={flip ? 2 : 54} y="45" fontSize="7.5" fill="var(--axis-x)">
        x
      </text>
      <text x={flip ? 54 : 2} y="45" fontSize="7.5" fill="var(--axis-z)">
        z
      </text>
    </svg>
  );
}

function BrushCursor({ size }: { size: number }) {
  return (
    <span
      className="pointer-events-none absolute left-[46.5%] top-[41%] flex items-center justify-center rounded-full border border-accent-2 bg-accent/30 shadow-[0_0_18px_var(--accent)]"
      style={{ width: size, height: size, transform: "translate(-50%, -50%)" }}
      aria-hidden="true"
    >
      <span className="size-[3px] rounded-full bg-accent-2" />
    </span>
  );
}

function useModelFilter() {
  const s = useTexture();
  return `brightness(${1 + s.exposure / 10}) saturate(${1 + s.saturation / 100}) contrast(${
    1 + s.contrast / 100
  }) sepia(${Math.max(0, s.warmth) / 100})`;
}

export function TexturePerspectiveViewport({ mode }: { mode: ViewportMode }) {
  const s = useTexture();
  const ref = useRef<HTMLDivElement>(null);
  const filter = useModelFilter();

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] opacity-[0.45]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px)",
          backgroundSize: "58px 34px",
          transform: "perspective(340px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, oklch(0 0 0) 20%, transparent 95%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[62%] h-px bg-line/40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 40%, oklch(0.12 0.01 265 / 0.85) 100%)",
        }}
      />

      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Perspective
      </span>
      <button
        type="button"
        className="absolute right-[14px] top-[10px] z-10 rounded-[4px] border border-line bg-surface/85 px-[10px] py-[4px] text-[11px] text-txt-muted backdrop-blur-sm hover:text-txt"
      >
        Before / After
      </button>

      <div className="absolute inset-0">
        <img
          src={texPerspective}
          alt="Textured 3D bust of the project subject in perspective view"
          className={cn(
            "absolute left-1/2 top-[50%] h-[94%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_20px_40px_oklch(0_0_0/0.55)]",
            mode === "Material" && "saturate-[0.25]",
            mode === "UV Map" && "opacity-70 contrast-125",
            mode === "Lighting" && "brightness-[0.85] contrast-125",
          )}
          style={{ filter }}
        />
        {mode === "UV Map" ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--accent) 1px, transparent 1px), linear-gradient(to bottom, var(--accent) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        ) : null}
        {s.activeTool === "Paint" ? <BrushCursor size={s.brushSize} /> : null}
      </div>

      <div className="absolute left-[8px] top-[46px] flex flex-col gap-[6px]">
        {STRIP_TOOLS.map(({ label, icon: Icon }) => {
          const selected = s.activeTool === label;
          return (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={selected}
              onClick={() => s.setActiveTool(label)}
              className={cn(
                "flex size-[26px] items-center justify-center rounded-[4px] transition-colors",
                selected
                  ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                  : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
              )}
              style={selected ? { background: "var(--gradient-accent)" } : undefined}
            >
              <Icon className="size-[14px]" />
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 items-center gap-[2px] rounded-[6px] border border-line bg-surface/85 p-[5px] backdrop-blur-sm">
        {BOTTOM_TOOLS.map(({ label, icon: Icon, tool }, i) => {
          const selected = tool ? s.activeTool === tool : false;
          return (
            <span key={label} className="flex items-center">
              {i === 5 || i === 7 ? <span className="mx-[4px] h-[16px] w-px bg-line" /> : null}
              <button
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => {
                  if (tool) s.setActiveTool(tool);
                  if (label === "Fullscreen") void ref.current?.requestFullscreen?.().catch(() => {});
                }}
                className={cn(
                  "flex size-[28px] items-center justify-center rounded-[4px] transition-colors",
                  selected ? "text-white" : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
                )}
                style={selected ? { background: "var(--gradient-accent)" } : undefined}
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

const ORTHO = {
  Front: texFront,
  Right: texRight,
  Back: texBack,
  Left: texLeft,
} as const;

export function TextureOrthographicViewport({
  name,
  gizmo,
  className,
}: {
  name: keyof typeof ORTHO;
  gizmo?: "front" | "right";
  className?: string;
}) {
  const filter = useModelFilter();
  return (
    <div className={cn("viewport-surface relative overflow-hidden", className)}>
      <button
        type="button"
        className="absolute left-[12px] top-[10px] z-10 flex items-center gap-[5px] text-[11.5px] text-txt-muted"
      >
        {name}
        <ChevronDown className="size-[12px] text-txt-dim" />
      </button>
      <img
        src={ORTHO[name]}
        alt={`Textured model ${name.toLowerCase()} view`}
        loading="lazy"
        style={{ filter }}
        className="absolute left-1/2 top-[56%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {gizmo ? <AxisGizmo variant={gizmo} /> : null}
    </div>
  );
}