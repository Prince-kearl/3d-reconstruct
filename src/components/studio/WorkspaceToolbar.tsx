import {
  Box,
  Columns2,
  Contrast,
  Grid2x2,
  Image,
  LayoutGrid,
  LayoutPanelTop,
  Lightbulb,
  Maximize,
  MoveHorizontal,
  MoveRight,
  Network,
  Orbit,
  Palette,
  RotateCcw,
  RotateCw,
  Scan,
  Sparkles,
  Grid3x3,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { IconButton } from "./primitives";

const MODE_ICONS = {
  Solid: Box,
  Wireframe: Grid2x2,
  Topology: Network,
  "Before / After": Contrast,
  Textured: Image,
  Material: Palette,
  "UV Map": Grid3x3,
  Lighting: Lightbulb,
} as const;

export type ViewportMode = keyof typeof MODE_ICONS;

export function WorkspaceToolbar({
  modes = ["Solid", "Wireframe"],
  mode: modeProp,
  onModeChange,
}: {
  modes?: readonly ViewportMode[];
  mode?: ViewportMode;
  onModeChange?: (m: ViewportMode) => void;
}) {
  const [localMode, setLocalMode] = useState<ViewportMode>("Solid");
  const mode = modeProp ?? localMode;
  const setMode = onModeChange ?? setLocalMode;
  const [layout, setLayout] = useState(3);

  const layoutIcons = [LayoutPanelTop, Columns2, LayoutGrid, Grid2x2];

  return (
    <div className="relative flex h-[44px] shrink-0 items-center gap-[10px] border-b border-line bg-panel px-[12px]">
      <Sparkles className="size-[14px] text-accent-2" />
      <span className="text-[12.5px] font-medium text-txt">3D Workspace</span>
      <div className="ml-[16px] flex items-center gap-[2px]">
        <IconButton label="Fit view" size={26}>
          <Maximize className="size-[14px]" />
        </IconButton>
      </div>
      <div className="ml-[16px] flex items-center gap-[2px]">
        <IconButton label="Undo" size={26}>
          <RotateCcw className="size-[13px]" />
        </IconButton>
        <IconButton label="Redo" size={26}>
          <RotateCw className="size-[13px]" />
        </IconButton>
        <IconButton label="Mirror horizontally" size={26}>
          <MoveHorizontal className="size-[13px]" />
        </IconButton>
        <IconButton label="Step forward" size={26}>
          <MoveRight className="size-[13px]" />
        </IconButton>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-[4px] rounded-[5px] border border-line bg-surface p-[3px]">
        {modes.map((m) => {
          const selected = mode === m;
          const Icon = MODE_ICONS[m];
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(m)}
              className={cn(
                "flex h-[26px] items-center gap-[6px] rounded-[4px] px-[11px] text-[11.5px] transition-colors",
                selected
                  ? "border border-accent/60 bg-accent/18 font-medium text-txt"
                  : "text-txt-muted hover:bg-surface-2 hover:text-txt",
              )}
            >
              <Icon className={cn("size-[13px]", selected ? "text-accent-2" : "text-txt-dim")} />
              {m}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-[3px]">
        <IconButton label="Scene controls" size={26}>
          <Orbit className="size-[14px]" />
        </IconButton>
        <IconButton label="Inspect mesh" size={26}>
          <Scan className="size-[14px]" />
        </IconButton>
        {layoutIcons.map((Icon, i) => (
          <IconButton
            key={i}
            label={`Viewport layout ${i + 1}`}
            size={26}
            active={layout === i}
            className={layout === i ? "bg-accent text-white hover:bg-accent" : ""}
            onClick={() => setLayout(i)}
          >
            <Icon className="size-[14px]" />
          </IconButton>
        ))}
      </div>
    </div>
  );
}