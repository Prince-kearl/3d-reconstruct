import {
  Camera,
  ChevronDown,
  Crosshair,
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
} from "lucide-react";
import { useRef, useState, type ComponentType, type SVGProps } from "react";

import bustBack from "@/assets/bust-back.png";
import bustFront from "@/assets/bust-front.png";
import bustLeft from "@/assets/bust-left.png";
import bustPerspective from "@/assets/bust-perspective.png";
import bustRight from "@/assets/bust-right.png";
import { cn } from "@/lib/utils";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const STRIP_TOOLS: { label: string; icon: Icon }[] = [
  { label: "Orbit", icon: Move },
  { label: "Pan", icon: Crosshair },
  { label: "Rotate", icon: RotateCw },
  { label: "Reset centre", icon: Target },
  { label: "Zoom", icon: ZoomIn },
  { label: "Frame selection", icon: SquareDashed },
  { label: "Viewport settings", icon: Scan },
];

const BOTTOM_TOOLS: { label: string; icon: Icon }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Pan view", icon: Hand },
  { label: "Move model", icon: Move },
  { label: "Focus model", icon: Expand },
  { label: "Toggle grid", icon: Grid3x3 },
  { label: "Snapshot", icon: Camera },
  { label: "Fullscreen", icon: Maximize2 },
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
      <circle cx={variant === "front" ? 8 : 12} cy={variant === "front" ? 50 : 48} r="1.8" fill="var(--axis-z)" />
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

export function PerspectiveViewport() {
  const [tool, setTool] = useState(0);
  const [bottomTool, setBottomTool] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      {/* grid floor */}
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
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-line/50" />
      <div className="pointer-events-none absolute inset-x-0 top-[62%] h-px bg-line/40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 40%, oklch(0.12 0.01 265 / 0.85) 100%)",
        }}
      />

      <span className="absolute left-[16px] top-[12px] text-[11.5px] text-txt-muted">
        Perspective
      </span>

      <img
        src={bustPerspective}
        alt="Reconstructed grey mesh bust in perspective view"
        className="absolute left-1/2 top-[46%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_20px_40px_oklch(0_0_0/0.55)]"
      />

      <div className="absolute left-[8px] top-[42px] flex flex-col gap-[6px]">
        {STRIP_TOOLS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={tool === i}
            onClick={() => setTool(i)}
            className={cn(
              "flex size-[26px] items-center justify-center rounded-[4px] transition-colors",
              tool === i
                ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
            )}
            style={tool === i ? { background: "var(--gradient-accent)" } : undefined}
          >
            <Icon className="size-[14px]" />
          </button>
        ))}
      </div>

      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 items-center gap-[2px] rounded-[6px] border border-line bg-surface/85 p-[5px] backdrop-blur-sm">
        {BOTTOM_TOOLS.map(({ label, icon: Icon }, i) => (
          <span key={label} className="flex items-center">
            {i === 4 || i === 6 ? <span className="mx-[4px] h-[16px] w-px bg-line" /> : null}
            <button
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={bottomTool === i}
              onClick={() => {
                setBottomTool(i);
                if (label === "Fullscreen") void ref.current?.requestFullscreen?.().catch(() => {});
              }}
              className={cn(
                "flex size-[28px] items-center justify-center rounded-[4px] transition-colors",
                bottomTool === i
                  ? "bg-surface-2 text-txt"
                  : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
              )}
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

export function OrthographicViewport({
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
        alt={`Reconstructed mesh ${name.toLowerCase()} view`}
        loading="lazy"
        className="absolute left-1/2 top-[54%] h-[82%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {gizmo ? <AxisGizmo variant={gizmo} /> : null}
    </div>
  );
}