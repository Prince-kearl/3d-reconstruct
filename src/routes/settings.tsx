import { createFileRoute } from "@tanstack/react-router";
import { Download, History, LayoutGrid, Search, Upload } from "lucide-react";
import { useState } from "react";

import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { SettingsQuickPanel } from "@/components/settings/SettingsQuickPanel";
import { SettingsSystemPanel } from "@/components/settings/SettingsSystemPanel";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Settings Workspace" },
      {
        name: "description",
        content:
          "Configure application defaults, appearance, reconstruction presets, autosave recovery and performance profiles for DXF2OBJ.",
      },
      { property: "og:title", content: "DXF2OBJ — Settings Workspace" },
      {
        property: "og:description",
        content: "Application, project and performance preferences for the crystal portrait pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const TABS = ["General", "Performance", "Storage", "Advanced"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<string>(TABS[0]);
  const [section, setSection] = useState("General");

  return (
    <AppShell
      status="Settings Valid"
      toolbar={
        <WorkspaceTabsToolbar
          tabs={TABS}
          tab={tab}
          onTabChange={setTab}
          actions={[
            { label: "Search settings", icon: Search },
            { label: "Setting history", icon: History },
            { label: "Import preferences", icon: Download },
            { label: "Export preferences", icon: Upload },
            { label: "Panel layout", icon: LayoutGrid },
          ]}
        />
      }
      properties={<SettingsSystemPanel />}
      workspace={
        <>
          <SettingsNav section={section} onSectionChange={setSection} />
          <GeneralSettings section={section} />
          <SettingsQuickPanel />
        </>
      }
    />
  );
}