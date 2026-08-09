import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import { NavigationRail } from "./NavigationRail";
import { StatusBar } from "./StatusBar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({
  toolbar,
  workspace,
  properties,
  status = "Ready",
}: {
  toolbar: ReactNode;
  workspace: ReactNode;
  properties: ReactNode;
  status?: string;
}) {
  return (
    <div className="flex h-screen min-w-[1280px] flex-col overflow-hidden bg-app text-txt">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <NavigationRail />
        <div className="flex min-w-0 flex-1 flex-col">
          {toolbar}
          <div className="flex min-h-0 flex-1 gap-[8px] p-[8px]">{workspace}</div>
        </div>
        {properties}
      </div>
      <StatusBar status={status} />
      <Toaster />
    </div>
  );
}