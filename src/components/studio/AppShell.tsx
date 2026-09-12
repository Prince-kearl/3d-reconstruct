import { useRef, useState, type ReactNode } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsCompact } from "@/hooks/use-mobile";
import { AppHeader } from "./AppHeader";
import { NavigationRail } from "./NavigationRail";
import { StatusBar } from "./StatusBar";
import { Toaster } from "@/components/ui/sonner";

const PANEL_WIDTH_PRESETS = [280, 340, 560];

function MainContent({ toolbar, workspace }: { toolbar: ReactNode; workspace: ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {toolbar}
      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto p-[8px] lg:flex-row lg:overflow-hidden">
        {workspace}
      </div>
    </div>
  );
}

export function AppShell({
  toolbar,
  workspace,
  properties,
  status = "Ready",
  projectName,
  projectId,
  onResetTransform,
}: {
  toolbar: ReactNode;
  workspace: ReactNode;
  properties: ReactNode;
  status?: string;
  projectName?: string | null | undefined;
  projectId?: string | null | undefined;
  onResetTransform?: (() => void) | undefined;
}) {
  const compact = useIsCompact();
  const [navOpen, setNavOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const propertiesPanelRef = useRef<PanelImperativeHandle>(null);
  const widthPresetIndex = useRef(1);

  const togglePanels = () => {
    const panel = propertiesPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  const cyclePanelWidth = () => {
    const panel = propertiesPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    widthPresetIndex.current = (widthPresetIndex.current + 1) % PANEL_WIDTH_PRESETS.length;
    panel.resize(PANEL_WIDTH_PRESETS[widthPresetIndex.current]!);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app text-txt">
      <AppHeader
        onOpenNav={compact ? () => setNavOpen(true) : undefined}
        onOpenProperties={compact ? () => setPropertiesOpen(true) : undefined}
        onTogglePanels={!compact ? togglePanels : undefined}
        onCyclePanelWidth={!compact ? cyclePanelWidth : undefined}
        projectName={projectName}
        projectId={projectId}
        onResetTransform={onResetTransform}
      />
      <div className="flex min-h-0 flex-1">
        {!compact ? <NavigationRail /> : null}
        {!compact ? (
          <ResizablePanelGroup id="app-shell-panels" className="min-w-0 flex-1">
            <ResizablePanel id="main-content" defaultSize={1000} minSize={480}>
              <MainContent toolbar={toolbar} workspace={workspace} />
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="w-[3px] shrink-0 bg-line transition-colors hover:bg-accent active:bg-accent"
            />
            <ResizablePanel
              id="properties-panel"
              panelRef={propertiesPanelRef}
              defaultSize={340}
              minSize={280}
              maxSize={560}
              collapsible
              collapsedSize={0}
              className="flex h-full flex-col overflow-hidden"
            >
              {properties}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <MainContent toolbar={toolbar} workspace={workspace} />
        )}
      </div>
      <StatusBar status={status} />
      <Toaster />

      {compact ? (
        <>
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetContent side="left" className="w-[240px] border-line bg-panel p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <NavigationRail expanded onNavigate={() => setNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
            <SheetContent
              side="right"
              className="w-[min(92vw,380px)] overflow-y-auto border-line bg-panel p-0"
            >
              <SheetTitle className="sr-only">Properties</SheetTitle>
              {properties}
            </SheetContent>
          </Sheet>
        </>
      ) : null}
    </div>
  );
}
