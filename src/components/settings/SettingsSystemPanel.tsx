import { FolderOpen, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SYSTEM_INFO } from "@/data/settingsMock";
import {
  CollapsibleSection,
  FieldLabel,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { cn } from "@/lib/utils";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[10px] py-[3px] text-[11px]">
      <FieldLabel>{label}</FieldLabel>
      <span className="flex items-center gap-[8px] text-txt">{children}</span>
    </div>
  );
}

export function SettingsSystemPanel() {
  const [tab, setTab] = useState<"System" | "Updates">("System");
  const [profile, setProfile] = useState("Balanced Workstation");
  const [gpuAccel, setGpuAccel] = useState(true);
  const [maxGpu, setMaxGpu] = useState(85);
  const [maxVram, setMaxVram] = useState(10);
  const [background, setBackground] = useState(true);
  const [parallel, setParallel] = useState("2");
  const [channel, setChannel] = useState("Beta");

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <div className="flex h-[40px] shrink-0 items-center gap-[2px] border-b border-line px-[8px]">
        {(["System", "Updates"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "h-[28px] flex-1 rounded-[4px] text-[11.5px] transition-colors",
              tab === t
                ? "border border-accent/60 bg-accent/15 text-accent-2"
                : "text-txt-muted hover:text-txt",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Updates" ? (
        <div className="px-[14px] py-[12px] text-[11px] text-txt-muted">
          <p>You are on the Beta channel.</p>
          <p className="mt-[6px] text-txt-dim">No updates pending — last checked 10:48.</p>
        </div>
      ) : (
        <>
          <CollapsibleSection title="System Information">
            {SYSTEM_INFO.map(([k, v]) => (
              <Row key={k} label={k}>
                {v}
              </Row>
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="Performance Profile">
            <div className="flex items-center justify-between gap-[10px]">
              <FieldLabel>Profile</FieldLabel>
              <Select
                label="Performance profile"
                value={profile}
                options={["Balanced Workstation", "Maximum Quality", "Low VRAM", "Custom"]}
                onChange={setProfile}
                className="w-[170px]"
              />
            </div>
            <div className="mt-[8px] space-y-[8px]">
              <Row label="GPU Acceleration">
                <ToggleSwitch label="GPU acceleration" checked={gpuAccel} onChange={setGpuAccel} />
              </Row>
              <SliderControl inline label="Max GPU Usage" value={maxGpu} onChange={setMaxGpu} labelWidth={104} />
              <SliderControl
                inline
                label="Max VRAM"
                value={maxVram}
                onChange={setMaxVram}
                min={2}
                max={12}
                format={(v) => `${v} GB`}
                labelWidth={104}
              />
              <Row label="Background Processing">
                <ToggleSwitch label="Background processing" checked={background} onChange={setBackground} />
              </Row>
              <div className="flex items-center justify-between gap-[10px]">
                <FieldLabel>Parallel Jobs</FieldLabel>
                <Select
                  label="Parallel jobs"
                  value={parallel}
                  options={["1", "2", "4", "8"]}
                  onChange={setParallel}
                  className="w-[170px]"
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Storage">
            <div className="space-y-[8px]">
              <div>
                <FieldLabel>Cache Location</FieldLabel>
                <div className="mt-[4px] flex h-[30px] items-center gap-[6px] rounded-[4px] border border-line bg-surface px-[9px]">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-txt">D:/DXF2OBJ/Cache</span>
                  <FolderOpen className="size-[13px] text-txt-dim" />
                </div>
              </div>
              <div>
                <FieldLabel>Project Location</FieldLabel>
                <div className="mt-[4px] flex h-[30px] items-center gap-[6px] rounded-[4px] border border-line bg-surface px-[9px]">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-txt">Documents/DXF2OBJ</span>
                  <FolderOpen className="size-[13px] text-txt-dim" />
                </div>
              </div>
              <Row label="Cache Used">
                <span className="flex items-center gap-[7px]">
                  8.4 GB
                  <span className="h-[5px] w-[86px] overflow-hidden rounded-full bg-line-strong">
                    <span className="block h-full w-[62%] rounded-full bg-accent" />
                  </span>
                </span>
              </Row>
              <Row label="Available">
                <span className="flex items-center gap-[7px]">
                  142 GB
                  <span className="h-[5px] w-[86px] overflow-hidden rounded-full bg-line-strong">
                    <span className="block h-full w-[8%] rounded-full bg-ok" />
                  </span>
                </span>
              </Row>
              <button
                type="button"
                onClick={() => toast.success("Cache cleared — 8.4 GB reclaimed")}
                className="h-[30px] w-full rounded-[4px] border border-line bg-surface text-[11.5px] text-txt-muted hover:text-txt"
              >
                Clear Cache
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Application">
            <Row label="Version">v0.8.4-beta</Row>
            <Row label="Build">2026.08.11</Row>
            <div className="mt-[6px] flex items-center justify-between gap-[10px]">
              <FieldLabel>Update Channel</FieldLabel>
              <Select
                label="Update channel"
                value={channel}
                options={["Stable", "Beta", "Nightly"]}
                onChange={setChannel}
                className="w-[170px]"
              />
            </div>
            <p className="mt-[10px] text-center">
              <span className="rounded-full border border-ok/50 bg-ok/12 px-[10px] py-[3px] text-[10.5px] text-ok">
                Up to date
              </span>
            </p>
            <button
              type="button"
              onClick={() => toast("No updates available")}
              className="mt-[10px] h-[30px] w-full rounded-[4px] border border-line bg-surface text-[11.5px] text-txt-muted hover:text-txt"
            >
              Check for Updates
            </button>
          </CollapsibleSection>
        </>
      )}

      <div className="mt-auto px-[14px] py-[14px]">
        <button
          type="button"
          onClick={() => toast.success("All settings saved")}
          style={{ background: "var(--gradient-lime)" }}
          className="flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
        >
          <Save className="size-[15px]" />
          Save All Changes
        </button>
      </div>
    </aside>
  );
}