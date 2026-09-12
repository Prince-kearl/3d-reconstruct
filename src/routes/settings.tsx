import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { SettingsNav, SETTINGS_SECTIONS } from "@/components/settings/SettingsNav";
import { SettingsSystemPanel } from "@/components/settings/SettingsSystemPanel";
import { AppShell } from "@/components/studio/AppShell";
import { WorkspaceTabsToolbar } from "@/components/studio/WorkspaceTabsToolbar";
import {
  getReconstructionDefaults,
  setReconstructionDefaults,
  type ReconstructionDefaults,
} from "@/lib/settings/reconstructionDefaults";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "DXF2OBJ — Settings" },
      {
        name: "description",
        content: "Account, reconstruction defaults, storage and privacy settings for DXF2OBJ.",
      },
      { property: "og:title", content: "DXF2OBJ — Settings" },
      {
        property: "og:description",
        content: "Real account, storage and reconstruction-default preferences — no fake data.",
      },
    ],
  }),
  component: SettingsPage,
});

function isValidDefaults(value: unknown): value is ReconstructionDefaults {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["quality"] === "string" &&
    typeof v["detail"] === "number" &&
    typeof v["smoothing"] === "number" &&
    typeof v["edgeFeather"] === "number" &&
    typeof v["volume"] === "number"
  );
}

function SettingsPage() {
  const [section, setSection] = useState<string>(SETTINGS_SECTIONS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportPreferences = () => {
    const defaults = getReconstructionDefaults();
    const blob = new Blob([JSON.stringify(defaults, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dxf2obj-preferences.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Preferences exported");
  };

  const importPreferences = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidDefaults(parsed)) {
        toast.error("That file doesn't look like a DXF2OBJ preferences export");
        return;
      }
      setReconstructionDefaults(parsed);
      toast.success("Preferences imported — new reconstructions will use them");
    } catch {
      toast.error("Could not read that file");
    }
  };

  return (
    <AppShell
      toolbar={
        <WorkspaceTabsToolbar
          tabs={SETTINGS_SECTIONS}
          tab={section}
          onTabChange={setSection}
          actions={[
            {
              label: "Import preferences",
              icon: Upload,
              onClick: () => fileInputRef.current?.click(),
            },
            { label: "Export preferences", icon: Download, onClick: exportPreferences },
          ]}
        />
      }
      properties={<SettingsSystemPanel />}
      workspace={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            aria-label="Import preferences file"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importPreferences(file);
              e.target.value = "";
            }}
          />
          <SettingsNav section={section} onSectionChange={setSection} />
          <GeneralSettings section={section} />
        </>
      }
    />
  );
}
