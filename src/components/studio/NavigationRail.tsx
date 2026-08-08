import {
  Box,
  Clock,
  FolderClosed,
  Grid2x2,
  Layers,
  Settings,
  SquareTerminal,
  Upload,
  Wand2,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { cn } from "@/lib/utils";

const ITEMS: { label: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Explorer", icon: FolderClosed },
  { label: "Reconstruct", icon: Box },
  { label: "Refine", icon: Wand2 },
  { label: "Texture", icon: Grid2x2 },
  { label: "Export", icon: Upload },
  { label: "Scenes", icon: Layers },
  { label: "History", icon: Clock },
  { label: "Console", icon: SquareTerminal },
  { label: "Settings", icon: Settings },
];

export function NavigationRail() {
  const [active, setActive] = useState("Reconstruct");

  return (
    <nav
      aria-label="Workspace sections"
      className="flex w-[80px] shrink-0 flex-col items-stretch gap-[10px] border-r border-line bg-panel py-[12px]"
    >
      {ITEMS.map(({ label, icon: Icon }) => {
        const isActive = active === label;
        return (
          <button
            key={label}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => setActive(label)}
            className={cn(
              "relative mx-[6px] flex h-[52px] flex-col items-center justify-center gap-[5px] rounded-[5px] transition-colors",
              isActive ? "bg-accent/12" : "hover:bg-surface-2/70",
            )}
          >
            {isActive ? (
              <span className="absolute -left-[6px] top-[6px] h-[40px] w-[2px] rounded-r bg-accent-2" />
            ) : null}
            <Icon
              className={cn("size-[18px]", isActive ? "text-accent-2" : "text-txt-dim")}
              strokeWidth={1.6}
            />
            <span
              className={cn(
                "text-[10px] leading-none",
                isActive ? "text-accent-2" : "text-txt-dim",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}