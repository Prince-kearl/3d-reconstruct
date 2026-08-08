import {
  ChevronDown,
  FolderOpen,
  LayoutGrid,
  Minus,
  PanelsTopLeft,
  Square,
  X,
} from "lucide-react";

import { MENU_ITEMS } from "@/data/mock";
import { IconButton } from "./primitives";

export function AppHeader() {
  return (
    <header className="relative flex h-[52px] shrink-0 items-center border-b border-line bg-panel px-[14px]">
      <div className="flex items-center gap-[22px]">
        <div className="flex items-center gap-[9px]">
          <svg viewBox="0 0 24 24" className="size-[19px] text-txt" aria-hidden="true">
            <path
              d="M3 4h18L12 21 3 4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8.5 4 12 10.5 15.5 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-txt">DXF2OBJ</span>
          <span className="rounded-[3px] bg-surface-2 px-[5px] py-[2px] text-[9px] font-semibold tracking-[0.08em] text-txt-muted">
            BETA
          </span>
        </div>
        <nav className="flex items-center gap-[18px]">
          {MENU_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className="text-[12.5px] text-txt-muted transition-colors hover:text-txt"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-[7px] text-txt"
      >
        <FolderOpen className="size-[14px] text-txt-muted" />
        <span className="text-[12.5px] font-medium">Portrait Project</span>
        <ChevronDown className="size-[13px] text-txt-dim" />
      </button>

      <div className="ml-auto flex items-center gap-[6px]">
        <IconButton label="Layout presets">
          <LayoutGrid className="size-[15px]" />
        </IconButton>
        <IconButton label="Panels">
          <PanelsTopLeft className="size-[15px]" />
        </IconButton>
        <button
          type="button"
          className="ml-[6px] flex items-center gap-[6px] rounded-[4px] px-[6px] py-[4px] text-[12px] text-txt-muted hover:bg-surface-2"
        >
          GPU
          <span className="size-[7px] rounded-full bg-ok shadow-[0_0_6px_var(--ok)]" />
          <ChevronDown className="size-[12px] text-txt-dim" />
        </button>
        <span className="mx-[8px] h-[18px] w-px bg-line" />
        <IconButton label="Minimise" size={26}>
          <Minus className="size-[14px]" />
        </IconButton>
        <IconButton label="Maximise" size={26}>
          <Square className="size-[12px]" />
        </IconButton>
        <IconButton label="Close" size={26}>
          <X className="size-[15px]" />
        </IconButton>
      </div>
    </header>
  );
}