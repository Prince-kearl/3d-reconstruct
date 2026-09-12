import { type ComponentType, type SVGProps } from "react";

import { cn } from "@/lib/utils";
import { IconButton } from "./primitives";

export function WorkspaceTabsToolbar({
  title = "3D Workspace",
  tabs,
  tab,
  onTabChange,
  actions = [],
  badges = {},
}: {
  title?: string;
  tabs: readonly string[];
  tab: string;
  onTabChange: (t: string) => void;
  actions?: { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; onClick?: () => void }[];
  badges?: Record<string, number>;
}) {
  return (
    <div className="scroll-thin flex h-[44px] shrink-0 items-center gap-[8px] overflow-x-auto border-b border-line bg-panel px-[10px] sm:gap-[10px] sm:px-[12px]">
      <span className="hidden shrink-0 text-[12.5px] font-medium text-txt md:inline">{title}</span>

      <div
        role="tablist"
        aria-label={`${title} sections`}
        className="flex shrink-0 items-center gap-[4px] md:mx-auto"
      >
        {tabs.map((t) => {
          const selected = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(t)}
              className={cn(
                "flex h-[28px] shrink-0 items-center gap-[6px] rounded-[5px] px-[12px] text-[11.5px] transition-colors sm:px-[16px]",
                selected
                  ? "border border-accent/70 bg-accent/18 font-medium text-accent-2"
                  : "text-txt-muted hover:bg-surface-2 hover:text-txt",
              )}
            >
              {t}
              {badges[t] ? (
                <span className="rounded-[3px] bg-accent px-[4px] text-[9px] font-semibold text-white">
                  {badges[t]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-[3px]">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <IconButton key={label} label={label} size={26} onClick={onClick ?? (() => {})}>
            <Icon className="size-[14px]" />
          </IconButton>
        ))}
      </div>
    </div>
  );
}
