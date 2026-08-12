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

export function NavigationRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Workspace sections"
      className="flex w-[80px] shrink-0 flex-col items-stretch gap-[10px] border-r border-line bg-panel py-[12px]"
    >
      {ITEMS.map(({ label, icon: Icon, to }) => {
        const isActive = to ? pathname.startsWith(to) : false;
        const cls = cn(
          "relative mx-[6px] flex h-[52px] flex-col items-center justify-center gap-[5px] rounded-[5px] transition-colors",
          isActive ? "bg-accent/12 shadow-[inset_0_0_0_1px_var(--accent-deep)]" : "hover:bg-surface-2/70",
        );
        const inner = (
          <>
            {isActive ? (
              <span className="absolute -left-[6px] top-[6px] h-[40px] w-[2px] rounded-r bg-accent-2" />
            ) : null}
            <Icon
              className={cn("size-[18px]", isActive ? "text-accent-2" : "text-txt-dim")}
              strokeWidth={1.6}
            />
            <span
              className={cn("text-[10px] leading-none", isActive ? "text-accent-2" : "text-txt-dim")}
            >
              {label}
            </span>
          </>
        );

        if (to) {
          return (
            <Link key={label} to={to} title={label} aria-label={label} className={cls}>
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