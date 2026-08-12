import {
  Box,
  Clock,
  FolderClosed,
  Info,
  Keyboard,
  Monitor,
  Palette,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Gauge,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

import { SETTINGS_SECTIONS } from "@/data/settingsMock";
import { cn } from "@/lib/utils";

const ICONS = [
  SettingsIcon,
  Palette,
  Box,
  Monitor,
  Gauge,
  FolderClosed,
  Clock,
  ShieldCheck,
  Keyboard,
  Info,
];

export function SettingsNav({
  section,
  onSectionChange,
}: {
  section: string;
  onSectionChange: (s: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = SETTINGS_SECTIONS.map((name, i) => ({ name, Icon: ICONS[i]! })).filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <aside className="scroll-thin flex w-[236px] shrink-0 flex-col gap-[12px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[12px] py-[12px]">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-txt-muted">SETTINGS</h2>
      <div className="flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-surface px-[8px]">
        <Search className="size-[13px] shrink-0 text-txt-dim" />
        <input
          aria-label="Search settings"
          placeholder="Search settings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[11.5px] text-txt outline-none placeholder:text-txt-dim"
        />
      </div>

      <nav aria-label="Settings sections" className="space-y-[2px]">
        {visible.map(({ name, Icon }) => {
          const active = section === name;
          return (
            <button
              key={name}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSectionChange(name)}
              className={cn(
                "flex h-[34px] w-full items-center gap-[10px] rounded-[5px] px-[10px] text-[11.5px] transition-colors",
                active
                  ? "bg-accent/18 font-medium text-txt shadow-[inset_0_0_0_1px_var(--accent-deep)]"
                  : "text-txt-muted hover:bg-surface-2/70 hover:text-txt",
              )}
            >
              <Icon className={cn("size-[15px]", active ? "text-accent-2" : "text-txt-dim")} />
              {name}
            </button>
          );
        })}
        {visible.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[11px] text-txt-dim">No settings match.</p>
        ) : null}
      </nav>

      <div className="mt-[6px]">
        <h3 className="mb-[8px] text-[10.5px] font-semibold tracking-[0.08em] text-txt-dim">
          PROFILE
        </h3>
        <div className="flex h-[46px] items-center gap-[9px] rounded-[5px] border border-line bg-surface px-[9px]">
          <span className="flex size-[28px] items-center justify-center rounded-full bg-accent/25 text-[11px] font-semibold text-accent-2">
            PK
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11.5px] text-txt">Portrait Workstation</span>
            <span className="block text-[10px] text-txt-dim">Local Profile</span>
          </span>
          <MoreVertical className="size-[13px] text-txt-dim" />
        </div>
        <button
          type="button"
          className="mt-[10px] flex h-[32px] w-full items-center justify-center gap-[7px] rounded-[5px] border border-accent/50 bg-accent/12 text-[11.5px] text-accent-2 hover:bg-accent/20"
        >
          <RefreshCw className="size-[13px]" />
          Sync Preferences
        </button>
        <p className="mt-[10px] text-center text-[10.5px] text-txt-dim">Settings saved locally</p>
      </div>
    </aside>
  );
}