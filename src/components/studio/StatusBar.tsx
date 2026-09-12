import {
  Activity,
  Bell,
  Bug,
  ChevronDown,
  CircleAlert,
  Copy,
  GitBranch,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "./primitives";

function useWebGpuAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && "gpu" in navigator);
  }, []);
  return available;
}

export function StatusBar({ status = "Ready" }: { status?: string }) {
  const webgpu = useWebGpuAvailable();
  return (
    <footer className="flex h-[38px] shrink-0 items-center gap-[6px] overflow-hidden border-t border-line bg-panel px-[10px] text-[11px] text-txt-muted sm:gap-[10px]">
      <IconButton label="Activity" size={22} className="hidden sm:flex">
        <Activity className="size-[13px]" />
      </IconButton>
      <button
        type="button"
        className="hidden items-center gap-[6px] rounded-[4px] bg-surface-2 px-[8px] py-[4px] text-txt-muted hover:text-txt sm:flex"
      >
        <GitBranch className="size-[12px]" />
        main
        <ChevronDown className="size-[11px] text-txt-dim" />
      </button>
      <div className="hidden items-center gap-[2px] md:flex">
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

      <div className="ml-auto flex min-w-0 items-center gap-[6px] sm:gap-[10px]">
        <span
          className="flex min-w-0 items-center gap-[6px] truncate"
          role="status"
          aria-live="polite"
        >
          <span className="size-[7px] shrink-0 rounded-full bg-ok shadow-[0_0_6px_var(--ok)]" />
          <span className="truncate">{status}</span>
        </span>
        <span className="hidden h-[16px] w-px bg-line md:block" />
        <span className="hidden items-center gap-[6px] md:flex">
          <span className={`size-[6px] rounded-full ${webgpu ? "bg-ok" : "bg-txt-dim"}`} />
          WebGPU: {webgpu ? "available" : "unavailable (using CPU/WASM)"}
        </span>
        <IconButton label="Copy diagnostics" size={22} className="hidden sm:flex">
          <Copy className="size-[13px]" />
        </IconButton>
      </div>
    </footer>
  );
}
