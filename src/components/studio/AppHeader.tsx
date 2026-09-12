import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  FolderOpen,
  LayoutGrid,
  Menu,
  Minus,
  PanelRight,
  PanelsTopLeft,
  Square,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/stores/authStore";
import { IconButton } from "./primitives";

const WORKSPACE_SECTIONS = [
  { label: "Explorer", to: "/explorer" as const },
  { label: "Reconstruct", to: "/reconstruct" as const },
  { label: "Refine", to: "/refine" as const },
  { label: "Texture", to: "/texture" as const },
  { label: "Export", to: "/export" as const },
  { label: "Scenes", to: "/scenes" as const },
  { label: "History", to: "/history" as const },
  { label: "Console", to: "/console" as const },
  { label: "Settings", to: "/settings" as const },
];

function MenuButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-[12.5px] text-txt-muted transition-colors hover:text-txt data-[state=open]:text-txt"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] border-line bg-panel text-txt">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader({
  onOpenNav,
  onOpenProperties,
  onTogglePanels,
  onCyclePanelWidth,
  projectName,
  projectId,
  onResetTransform,
}: {
  onOpenNav?: (() => void) | undefined;
  onOpenProperties?: (() => void) | undefined;
  onTogglePanels?: (() => void) | undefined;
  onCyclePanelWidth?: (() => void) | undefined;
  projectName?: string | null | undefined;
  projectId?: string | null | undefined;
  onResetTransform?: (() => void) | undefined;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  const requestAppFullscreen = () => {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <header className="relative flex h-[52px] shrink-0 items-center border-b border-line bg-panel px-[10px] sm:px-[14px]">
      <div className="flex items-center gap-[10px] sm:gap-[22px]">
        {onOpenNav ? (
          <IconButton label="Open navigation" onClick={onOpenNav}>
            <Menu className="size-[17px]" />
          </IconButton>
        ) : null}
        <div className="flex items-center gap-[9px]">
          <svg viewBox="0 0 24 24" className="size-[19px] shrink-0 text-txt" aria-hidden="true">
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
          <span className="hidden rounded-[3px] bg-surface-2 px-[5px] py-[2px] text-[9px] font-semibold tracking-[0.08em] text-txt-muted sm:inline-block">
            BETA
          </span>
        </div>
        <nav className="hidden items-center gap-[18px] lg:flex">
          <MenuButton label="File">
            <DropdownMenuItem onClick={() => void navigate({ to: "/reconstruct" })}>
              New Reconstruction
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void navigate({ to: "/explorer" })}>
              Open Explorer…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
              Settings…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>Sign Out</DropdownMenuItem>
          </MenuButton>

          <MenuButton label="Edit">
            <DropdownMenuItem disabled={!onResetTransform} onClick={() => onResetTransform?.()}>
              Reset Transform
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
              Preferences…
            </DropdownMenuItem>
          </MenuButton>

          <MenuButton label="View">
            <DropdownMenuItem disabled={!onTogglePanels} onClick={() => onTogglePanels?.()}>
              Toggle Properties Panel
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onCyclePanelWidth} onClick={() => onCyclePanelWidth?.()}>
              Cycle Panel Width
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={requestAppFullscreen}>Fullscreen</DropdownMenuItem>
          </MenuButton>

          <MenuButton label="Workspace">
            <DropdownMenuLabel className="text-txt-dim">Sections</DropdownMenuLabel>
            {WORKSPACE_SECTIONS.map((s) => (
              <DropdownMenuItem key={s.to} onClick={() => void navigate({ to: s.to })}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </MenuButton>

          <MenuButton label="Tools">
            <DropdownMenuItem onClick={() => void navigate({ to: "/" })}>
              System Readiness
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void navigate({ to: "/console" })}>
              Console
            </DropdownMenuItem>
          </MenuButton>

          <MenuButton label="Help">
            <DropdownMenuItem onClick={() => setAboutOpen(true)}>About DXF2OBJ</DropdownMenuItem>
          </MenuButton>
        </nav>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-[7px] text-txt md:flex"
          >
            <FolderOpen className="size-[14px] text-txt-muted" />
            <span className="max-w-[220px] truncate text-[12.5px] font-medium">
              {projectName ?? "DXF2OBJ"}
            </span>
            <ChevronDown className="size-[13px] text-txt-dim" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[220px] border-line bg-panel text-txt">
          {projectName ? (
            <DropdownMenuLabel className="truncate text-txt-dim">{projectName}</DropdownMenuLabel>
          ) : null}
          <DropdownMenuItem onClick={() => void navigate({ to: "/explorer" })}>
            Browse Projects
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void navigate({ to: "/reconstruct" })}>
            New Reconstruction
          </DropdownMenuItem>
          {projectId ? (
            <DropdownMenuItem
              onClick={() => void navigate({ to: "/history", search: { project: projectId } })}
            >
              View History
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-[4px] sm:gap-[6px]">
        <div className="hidden items-center gap-[4px] sm:flex">
          <IconButton
            label="Cycle panel width"
            disabled={!onCyclePanelWidth}
            onClick={onCyclePanelWidth}
          >
            <LayoutGrid className="size-[15px]" />
          </IconButton>
          <IconButton
            label="Toggle properties panel"
            disabled={!onTogglePanels}
            onClick={onTogglePanels}
          >
            <PanelsTopLeft className="size-[15px]" />
          </IconButton>
        </div>
        {onOpenProperties ? (
          <IconButton label="Open properties" onClick={onOpenProperties}>
            <PanelRight className="size-[16px]" />
          </IconButton>
        ) : null}
        {user ? (
          <IconButton
            label={`Sign out (${user.email})`}
            size={26}
            onClick={() => void signOut()}
            className="bg-surface-2 font-semibold text-txt"
          >
            {initial}
          </IconButton>
        ) : null}
        <span className="mx-[4px] hidden h-[18px] w-px bg-line sm:mx-[8px] sm:block" />
        <div className="hidden items-center gap-[4px] sm:flex">
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
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="border-line bg-panel text-txt">
          <DialogHeader>
            <DialogTitle>DXF2OBJ (Beta)</DialogTitle>
            <DialogDescription className="text-txt-muted">
              Turns a single photo into a rotatable pseudo-3D depth relief, entirely in your
              browser. Depth Anything V2 (Small) runs client-side via WebGPU/WASM — no photo ever
              leaves your device for reconstruction. Signed in as {user?.email ?? "—"}.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-[4px]">
            <Link
              to="/explorer"
              onClick={() => setAboutOpen(false)}
              className="text-[11.5px] text-accent-2 hover:underline"
            >
              Browse your projects →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
