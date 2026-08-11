import {
  Camera,
  ChevronDown,
  Grid3x3,
  Maximize2,
  Move3d,
  MousePointer2,
  RotateCw,
  Scale3d,
  Sun,
} from "lucide-react";
import { useRef } from "react";

import crystalFront from "@/assets/crystal-front.png";
import crystalHero from "@/assets/crystal-hero.png";
import crystalProfile from "@/assets/crystal-profile.png";
import texLeft from "@/assets/tex-left.png";
import texPerspective from "@/assets/tex-perspective.png";
import type { ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { cn } from "@/lib/utils";
import { useScenes, type GizmoMode } from "@/stores/scenesStore";

function TransformGizmo({ mode }: { mode: GizmoMode }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="pointer-events-none absolute left-1/2 top-[52%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    >
      {mode === "Rotate" ? (
        <>
          <ellipse cx="100" cy="100" rx="72" ry="26" fill="none" stroke="var(--axis-y)" strokeWidth="1.6" />
          <ellipse cx="100" cy="100" rx="26" ry="72" fill="none" stroke="var(--axis-x)" strokeWidth="1.6" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="var(--axis-z)" strokeWidth="1.2" opacity="0.7" />
        </>
      ) : (
        <>
          <line x1="100" y1="100" x2="100" y2="24" stroke="var(--axis-y)" strokeWidth="2" />
          <line x1="100" y1="100" x2="174" y2="122" stroke="var(--axis-x)" strokeWidth="2" />
          <line x1="100" y1="100" x2="30" y2="128" stroke="var(--axis-z)" strokeWidth="2" />
          {mode === "Scale" ? (
            <>
              <rect x="94" y="18" width="12" height="12" fill="var(--axis-y)" />
              <rect x="168" y="116" width="12" height="12" fill="var(--axis-x)" />
              <rect x="24" y="122" width="12" height="12" fill="var(--axis-z)" />
            </>
          ) : (
            <>
              <polygon points="100,14 95,28 105,28" fill="var(--axis-y)" />
              <polygon points="184,124 170,114 172,128" fill="var(--axis-x)" />
              <polygon points="20,130 34,120 34,134" fill="var(--axis-z)" />
            </>
          )}
        </>
      )}
      <circle cx="100" cy="100" r="3.5" fill="oklch(0.92 0.02 265)" />
    </svg>
  );
}

const GIZMO_TOOLS: { label: GizmoMode | "Select"; icon: typeof Move3d }[] = [
  { label: "Select", icon: MousePointer2 },
  { label: "Move", icon: Move3d },
  { label: "Rotate", icon: RotateCw },
  { label: "Scale", icon: Scale3d },
];

export function ScenesPerspectiveViewport({ mode }: { mode: ViewportMode }) {
  const s = useScenes();
  const ref = useRef<HTMLDivElement>(null);
  const hiddenBust = s.hidden.includes("bust");

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      {s.showGrid ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] opacity-[0.45]"
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

      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Perspective — {s.activeScene}
      </span>
      <span className="absolute right-[14px] top-[10px] z-10 flex items-center gap-[6px] rounded-[4px] border border-line bg-surface/85 px-[10px] py-[4px] text-[11px] text-txt-muted backdrop-blur-sm">
        <Camera className="size-[12px] text-txt-dim" />
        {s.camera}
        <ChevronDown className="size-[11px] text-txt-dim" />
      </span>

      <img
        src={crystalHero}
        alt="Scene view of the bust and crystal on the display base"
        width={1024}
        height={1024}
        className={cn(
          "absolute left-1/2 top-[53%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain transition-opacity",
          hiddenBust && "opacity-25",
          mode === "Wireframe" && "opacity-70 grayscale contrast-125",
        )}
        style={{
          filter: `brightness(${0.7 + s.intensity / 160}) contrast(${1 + s.ambient / 400})`,
          transform: `translate(-50%, -50%) rotate(${s.rotY / 20}deg) scale(${s.scale / 100})`,
        }}
      />

      <TransformGizmo mode={s.gizmo} />

      <div className="absolute left-[8px] top-[46px] flex flex-col gap-[6px]">
        {GIZMO_TOOLS.map(({ label, icon: Icon }) => {
          const selected = label !== "Select" && s.gizmo === label;
          return (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={selected}
              onClick={() => label !== "Select" && s.setGizmo(label)}
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

      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 items-center gap-[10px] rounded-[6px] border border-line bg-surface/85 px-[12px] py-[7px] font-mono text-[10.5px] text-txt-muted backdrop-blur-sm">
        <Sun className="size-[13px] text-lime" />
        <span>{s.lightPreset}</span>
        <span className="h-[12px] w-px bg-line" />
        <span>
          X {s.posX} Y {s.posY} Z {s.posZ}
        </span>
        <span className="h-[12px] w-px bg-line" />
        <Grid3x3 className="size-[13px] text-txt-dim" />
        <button
          type="button"
          aria-label="Fullscreen"
          title="Fullscreen"
          onClick={() => void ref.current?.requestFullscreen?.().catch(() => {})}
          className="text-txt-dim hover:text-txt"
        >
          <Maximize2 className="size-[13px]" />
        </button>
      </div>
    </div>
  );
}

const CAMS = {
  "Camera 01": crystalFront,
  "Camera 02": crystalProfile,
  Turntable: texPerspective,
  "Top Rig": texLeft,
} as const;

export function ScenesCameraViewport({
  name,
  className,
}: {
  name: keyof typeof CAMS;
  className?: string;
}) {
  const s = useScenes();
  const active = s.camera === name;
  return (
    <div
      className={cn(
        "viewport-surface relative overflow-hidden",
        active && "ring-1 ring-accent/60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => s.setCamera(name)}
        className="absolute left-[12px] top-[10px] z-10 flex items-center gap-[5px] text-[11.5px] text-txt-muted hover:text-txt"
      >
        {name}
        <ChevronDown className="size-[12px] text-txt-dim" />
      </button>
      <img
        src={CAMS[name]}
        alt={`Scene render from ${name}`}
        loading="lazy"
        className="absolute left-1/2 top-[56%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </div>
  );
}