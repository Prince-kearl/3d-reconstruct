import { Camera, ChevronDown, Gem, Grid3x3, Maximize2, Move3d, Ruler, Scan } from "lucide-react";
import { useRef } from "react";

import baseTop from "@/assets/base-top.png";
import bustFront from "@/assets/bust-front.png";
import crystalFront from "@/assets/crystal-front.png";
import crystalHero from "@/assets/crystal-hero.png";
import crystalProfile from "@/assets/crystal-profile.png";
import type { ViewportMode } from "@/components/studio/WorkspaceToolbar";
import { cn } from "@/lib/utils";
import { useExport } from "@/stores/exportStore";

const STRIP = [
  { label: "Crystal view", icon: Gem },
  { label: "Measure", icon: Ruler },
  { label: "Bounds", icon: Move3d },
  { label: "Inspect", icon: Scan },
  { label: "Grid", icon: Grid3x3 },
  { label: "Snapshot", icon: Camera },
];

export function ExportPerspectiveViewport({ mode }: { mode: ViewportMode }) {
  const s = useExport();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="viewport-surface relative flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px)",
          backgroundSize: "58px 34px",
          transform: "perspective(340px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, oklch(0 0 0) 20%, transparent 95%)",
        }}
      />
      <span className="absolute left-[16px] top-[12px] z-10 text-[11.5px] text-txt-muted">
        Perspective — Crystal Fit
      </span>
      <span className="absolute right-[14px] top-[10px] z-10 rounded-[4px] border border-line bg-surface/85 px-[10px] py-[4px] font-mono text-[11px] text-txt-muted backdrop-blur-sm">
        {s.width} × {s.height} × {s.depth} cm
      </span>

      <img
        src={crystalHero}
        alt="Reconstructed bust fitted inside a transparent crystal block on a display base"
        width={1024}
        height={1024}
        className={cn(
          "absolute left-1/2 top-[53%] h-[88%] -translate-x-1/2 -translate-y-1/2 object-contain",
          mode === "Wireframe" && "opacity-70 contrast-125 grayscale",
          mode === "Bounds" && "opacity-80",
        )}
      />

      {mode === "Bounds" ? (
        <div className="pointer-events-none absolute left-1/2 top-[52%] h-[74%] w-[42%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-accent-2/70">
          <span className="absolute -top-[18px] left-0 font-mono text-[10px] text-accent-2">
            bbox {s.width} × {s.height} × {s.depth}
          </span>
        </div>
      ) : null}

      <div className="absolute left-[8px] top-[46px] flex flex-col gap-[6px]">
        {STRIP.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            className={cn(
              "flex size-[26px] items-center justify-center rounded-[4px] transition-colors",
              i === 0
                ? "text-white shadow-[0_2px_10px_-4px_var(--accent)]"
                : "text-txt-dim hover:bg-surface-2/70 hover:text-txt-muted",
            )}
            style={i === 0 ? { background: "var(--gradient-accent)" } : undefined}
          >
            <Icon className="size-[14px]" />
          </button>
        ))}
      </div>

      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 items-center gap-[10px] rounded-[6px] border border-line bg-surface/85 px-[12px] py-[7px] font-mono text-[10.5px] text-txt-muted backdrop-blur-sm">
        <span>Format: {s.format}</span>
        <span className="h-[12px] w-px bg-line" />
        <span>Quality: {s.quality}%</span>
        <span className="h-[12px] w-px bg-line" />
        <span>{s.fileName}</span>
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

const VIEWS = {
  "Crystal Preview": { src: crystalFront, alt: "Crystal preview front view" },
  "Mesh Check": { src: bustFront, alt: "Mesh integrity check view" },
  Bounds: { src: crystalProfile, alt: "Bounding box profile view" },
  Base: { src: baseTop, alt: "Display base top view" },
} as const;

export function ExportSecondaryViewport({
  name,
  className,
}: {
  name: keyof typeof VIEWS;
  className?: string;
}) {
  const view = VIEWS[name];
  const green = name === "Mesh Check";
  return (
    <div className={cn("viewport-surface relative overflow-hidden", className)}>
      <button
        type="button"
        className="absolute left-[12px] top-[10px] z-10 flex items-center gap-[5px] text-[11.5px] text-txt-muted"
      >
        {name}
        <ChevronDown className="size-[12px] text-txt-dim" />
      </button>
      {green ? (
        <span className="absolute right-[10px] top-[10px] z-10 rounded-[3px] bg-ok/15 px-[6px] py-[2px] text-[9.5px] font-medium text-ok">
          PASS
        </span>
      ) : null}
      <img
        src={view.src}
        alt={view.alt}
        loading="lazy"
        className={cn(
          "absolute left-1/2 top-[56%] h-[86%] -translate-x-1/2 -translate-y-1/2 object-contain",
          green && "hue-rotate-[75deg] saturate-[1.6] brightness-110",
        )}
      />
      {name === "Bounds" ? (
        <div className="pointer-events-none absolute inset-[18%] border border-dashed border-accent-2/60" />
      ) : null}
    </div>
  );
}