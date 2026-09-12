import { Link, useRouterState } from "@tanstack/react-router";
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
import { type ComponentType, type SVGProps } from "react";

import { cn } from "@/lib/utils";

const ITEMS: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  to?:
    | "/reconstruct"
    | "/refine"
    | "/texture"
    | "/export"
    | "/scenes"
    | "/history"
    | "/explorer"
    | "/console"
    | "/settings";
}[] = [
  { label: "Explorer", icon: FolderClosed, to: "/explorer" },
  { label: "Reconstruct", icon: Box, to: "/reconstruct" },
  { label: "Refine", icon: Wand2, to: "/refine" },
  { label: "Texture", icon: Grid2x2, to: "/texture" },
  { label: "Export", icon: Upload, to: "/export" },
  { label: "Scenes", icon: Layers, to: "/scenes" },
  { label: "History", icon: Clock, to: "/history" },
  { label: "Console", icon: SquareTerminal, to: "/console" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

export function NavigationRail({
  expanded = false,
  onNavigate,
}: {
  expanded?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Workspace sections"
      className={cn(
        "flex shrink-0 border-line bg-panel py-[12px]",
        expanded
          ? "w-full flex-col items-stretch gap-[2px] border-r-0"
          : "w-[80px] flex-col items-stretch gap-[10px] border-r",
      )}
    >
      {ITEMS.map(({ label, icon: Icon, to }) => {
        const isActive = to ? pathname.startsWith(to) : false;
        const cls = cn(
          "relative transition-colors",
          expanded
            ? "mx-[8px] flex h-[42px] flex-row items-center gap-[10px] rounded-[5px] px-[10px]"
            : "mx-[6px] flex h-[52px] flex-col items-center justify-center gap-[5px] rounded-[5px]",
          isActive
            ? "bg-accent/12 shadow-[inset_0_0_0_1px_var(--accent-deep)]"
            : "hover:bg-surface-2/70",
        );
        const inner = (
          <>
            {isActive ? (
              <span
                className={cn(
                  "absolute bg-accent-2",
                  expanded
                    ? "left-0 top-[8px] h-[26px] w-[2px] rounded-r"
                    : "-left-[6px] top-[6px] h-[40px] w-[2px] rounded-r",
                )}
              />
            ) : null}
            <Icon
              className={cn(
                expanded ? "size-[16px]" : "size-[18px]",
                isActive ? "text-accent-2" : "text-txt-dim",
              )}
              strokeWidth={1.6}
            />
            <span
              className={cn(
                expanded ? "text-[12.5px]" : "text-[10px] leading-none",
                isActive ? "text-accent-2" : "text-txt-dim",
              )}
            >
              {label}
            </span>
          </>
        );

        if (to) {
          return (
            <Link
              key={label}
              to={to}
              title={label}
              aria-label={label}
              className={cls}
              onClick={onNavigate}
            >
              {inner}
            </Link>
          );
        }
        return (
          <button key={label} type="button" title={label} aria-label={label} className={cls}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
