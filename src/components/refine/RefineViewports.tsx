import {
  Camera,
  ChevronDown,
  Droplet,
  Grid3x3,
  Maximize2,
  Move,
  MousePointer2,
  Pencil,
  Smile,
  SquareDashed,
  Table2,
  CircleMinus,
} from "lucide-react";
import { useRef, useState, type ComponentType, type SVGProps } from "react";

import bustBack from "@/assets/bust-back.png";
import bustFront from "@/assets/bust-front.png";
import bustLeft from "@/assets/bust-left.png";
import bustPerspective from "@/assets/bust-perspective.png";
import bustRight from "@/assets/bust-right.png";
import { cn } from "@/lib/utils";
import { useRefinement } from "@/stores/refinementStore";
import type { ViewportMode } from "@/components/studio/WorkspaceToolbar";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const STRIP_TOOLS: { label: string; icon: Icon }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Sculpt", icon: Pencil },
  { label: "Smooth", icon: Droplet },
  { label: "Move", icon: Move },
  { label: "Inspect", icon: Smile },
  { label: "Frame", icon: CircleMinus },
  { label: "Mesh tools", icon: Table2 },
];

const BOTTOM_TOOLS: { label: string; icon: Icon }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Sculpt", icon: Pencil },
  { label: "Smooth", icon: Droplet },
  { label: "Move", icon: Move },
  { label: "Face mask", icon: Smile },
  { label: "Toggle grid", icon: Grid3x3 },
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
      className="pointer-events-none absolute left-[41%] top-[36%] flex items-center justify-center rounded-full border border-accent-2 bg-accent/25 shadow-[0_0_22px_var(--accent)]"
      style={{ width: size, height: size, transform: "translate(-50%, -50%)" }}
      aria-hidden="true"
    >
      <span className="size-[3px] rounded-full bg-accent-2" />
    </span>
  );
}

export function RefinePerspectiveViewport({ mode }: { mode: ViewportMode }) {
  const s = useRefinement();
  const [strip, setStrip] = useState(2);
  const [bottom, setBottom] = useState(2);
  const [grid, setGrid] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const brushVisible = ["Smooth", "Relax", "Inflate", "Flatten", "Pinch", "Grab"].includes(
    s.activeTool,
  );

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      {grid ? (
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
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 40%, oklch(0.12 0.01 265 / 0.85) 100%)",
        }}
      />

      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Perspective
      </span>

      <div className="absolute inset-0">
        <img
          src={bustPerspective}
          alt="Refined grey mesh bust in perspective view"
          className={cn(
            "absolute left-1/2 top-[48%] h-[92%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_20px_40px_oklch(0_0_0/0.55)]",
            mode === "Wireframe" && "opacity-70 mix-blend-screen contrast-125",
            mode === "Topology" && "opacity-80 saturate-0 contrast-150",
            mode === "Before / After" && "opacity-95",
          )}
          style={
            mode === "Before / After"
              ? { clipPath: `inset(0 ${100 - s.comparison}% 0 0)` }
              : undefined
          }
        />
        {brushVisible ? <BrushCursor size={s.brushSize} /> : null}
      </div>

      <div className="absolute left-[8px] top-[46px] flex flex-col gap-[6px]">
        {STRIP_TOOLS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={strip === i}
            onClick={() => setStrip(i)}
            className={cn(
              "flex size-[26px] items-center justify-center rounded-[4px] transition-colors",
              strip === i
                ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
            )}
            style={strip === i ? { background: "var(--gradient-accent)" } : undefined}
          >
            <Icon className="size-[14px]" />
          </button>
        ))}
      </div>

      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 items-center gap-[2px] rounded-[6px] border border-line bg-surface/85 p-[5px] backdrop-blur-sm">
        {BOTTOM_TOOLS.map(({ label, icon: Icon }, i) => (
          <span key={label} className="flex items-center">
            {i === 5 || i === 7 ? <span className="mx-[4px] h-[16px] w-px bg-line" /> : null}
            <button
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={bottom === i}
              onClick={() => {
                setBottom(i);
                if (label === "Toggle grid") setGrid((g) => !g);
                if (label === "Fullscreen")
                  void ref.current?.requestFullscreen?.().catch(() => {});
              }}
              className={cn(
                "flex size-[28px] items-center justify-center rounded-[4px] transition-colors",
                bottom === i
                  ? "text-white"
                  : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
              )}
              style={bottom === i ? { background: "var(--gradient-accent)" } : undefined}
            >
              <Icon className="size-[15px]" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

const ORTHO = {
  Front: bustFront,
  Right: bustRight,
  Back: bustBack,
  Left: bustLeft,
} as const;

export function RefineOrthographicViewport({
  name,
  gizmo,
  className,
}: {
  name: keyof typeof ORTHO;
  gizmo?: "front" | "right";
  className?: string;
}) {
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
        alt={`Refined mesh ${name.toLowerCase()} view`}
        loading="lazy"
        className="absolute left-1/2 top-[56%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {gizmo ? <AxisGizmo variant={gizmo} /> : null}
    </div>
  );
}

export { SquareDashed as _unused };