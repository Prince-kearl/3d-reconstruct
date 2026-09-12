import { FolderOpen, History, Import, Lightbulb, Plus, RotateCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { LAUNCHER_TIPS } from "@/data/launcherMock";
import { cn } from "@/lib/utils";

const ICONS = [Plus, FolderOpen, Import, History, RotateCcw];

export function LauncherQuickActions({
  onNewProject,
  onImport,
  onRecover,
  projectCount,
  mostRecentProjectId,
}: {
  onNewProject: () => void;
  onImport: () => void;
  onRecover: () => void;
  projectCount: number;
  mostRecentProjectId: string | null;
}) {
  const navigate = useNavigate();

  const actions = [
    { label: "New Project", hint: "Ctrl+N", primary: true, onClick: onNewProject },
    {
      label: "Open Project",
      hint: "Ctrl+O",
      primary: false,
      onClick: () => void navigate({ to: "/explorer" }),
    },
    { label: "Import Assets", hint: "Ctrl+I", primary: false, onClick: onImport },
    {
      label: "Open Last Session",
      hint: "Ctrl+L",
      primary: false,
      onClick: () =>
        void navigate(
          mostRecentProjectId
            ? { to: "/reconstruct", search: { project: mostRecentProjectId } }
            : { to: "/reconstruct" },
        ),
    },
    { label: "Recover Autosave", hint: "", primary: false, onClick: onRecover },
  ];

  return (
    <aside className="scroll-thin flex w-full shrink-0 flex-col overflow-y-auto rounded-[6px] border border-line bg-panel lg:w-[248px]">
      <div className="border-b border-line px-[14px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Quick Actions</h2>
        <p className="mt-[3px] text-[10.5px] text-txt-dim">Start or resume work</p>
      </div>
      <div className="space-y-[6px] border-b border-line p-[10px]">
        {actions.map((a, i) => {
          const Icon = ICONS[i]!;
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={cn(
                "flex w-full items-center gap-[9px] rounded-[5px] px-[10px] py-[9px] text-left text-[12px] transition-colors",
                a.primary
                  ? "font-medium text-white shadow-[0_6px_18px_-8px_var(--accent)]"
                  : "border border-line bg-surface text-txt-muted hover:bg-surface-2 hover:text-txt",
              )}
              style={a.primary ? { background: "var(--gradient-accent)" } : undefined}
            >
              <Icon className="size-[15px] shrink-0" strokeWidth={1.7} />
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
              {a.hint ? (
                <span className="shrink-0 font-mono text-[9.5px] text-txt-dim">{a.hint}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="border-b border-line px-[14px] py-[11px]">
        <h3 className="text-[11px] font-semibold text-txt">Workspace</h3>
        <dl className="mt-[8px] space-y-[6px] text-[10.5px]">
          <div className="flex items-center justify-between">
            <dt className="text-txt-dim">Projects</dt>
            <dd className="text-txt">{projectCount}</dd>
          </div>
        </dl>
      </div>
      <div className="px-[14px] py-[11px]">
        <h3 className="flex items-center gap-[6px] text-[11px] font-semibold text-txt">
          <Lightbulb className="size-[13px] text-lime" /> Tips
        </h3>
        <ul className="mt-[8px] space-y-[7px] text-[10.5px] leading-[16px] text-txt-muted">
          {LAUNCHER_TIPS.map((t) => (
            <li key={t} className="border-l border-line-strong pl-[8px]">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
