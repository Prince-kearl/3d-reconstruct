import {
  Activity,
  Bell,
  Bug,
  ChevronDown,
  CircleAlert,
  Copy,
  GitBranch,
  Gauge,
  Search,
} from "lucide-react";

import { IconButton } from "./primitives";

export function StatusBar() {
  return (
    <footer className="flex h-[38px] shrink-0 items-center gap-[10px] border-t border-line bg-panel px-[10px] text-[11px] text-txt-muted">
      <IconButton label="Activity" size={22}>
        <Activity className="size-[13px]" />
      </IconButton>
      <button
        type="button"
        className="flex items-center gap-[6px] rounded-[4px] bg-surface-2 px-[8px] py-[4px] text-txt-muted hover:text-txt"
      >
        <GitBranch className="size-[12px]" />
        main
        <ChevronDown className="size-[11px] text-txt-dim" />
      </button>
      <div className="flex items-center gap-[2px]">
        <IconButton label="Search" size={22}>
          <Search className="size-[13px]" />
        </IconButton>
        <IconButton label="Warnings" size={22}>
          <CircleAlert className="size-[13px]" />
        </IconButton>
        <IconButton label="Debug" size={22}>
          <Bug className="size-[13px]" />
        </IconButton>
        <IconButton label="Notifications" size={22}>
          <Bell className="size-[13px]" />
        </IconButton>
      </div>

      <div className="ml-auto flex items-center gap-[10px]">
        <span className="flex items-center gap-[6px]">
          <span className="size-[7px] rounded-full bg-ok shadow-[0_0_6px_var(--ok)]" />
          Ready
        </span>
        <span className="h-[16px] w-px bg-line" />
        <span>GPU: RTX 3060</span>
        <Gauge className="size-[13px] text-txt-dim" />
        <span>71%</span>
        <span className="h-[16px] w-px bg-line" />
        <span>VRAM: 5.2 / 12GB</span>
        <IconButton label="Copy diagnostics" size={22}>
          <Copy className="size-[13px]" />
        </IconButton>
      </div>
    </footer>
  );
}