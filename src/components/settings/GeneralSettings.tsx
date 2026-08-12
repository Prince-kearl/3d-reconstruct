import { Check, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ACCENT_SWATCHES,
  CONFIG_LOG,
  SETTINGS_HEALTH,
} from "@/data/settingsMock";
import {
  FieldLabel,
  SegmentedControl,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { cn } from "@/lib/utils";

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[6px] border border-line bg-surface px-[12px] py-[11px]", className)}>
      <h3 className="text-[12px] font-semibold text-txt">{title}</h3>
      <div className="mt-[10px] space-y-[10px]">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function HealthRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[100px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="4" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--ok-2)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="progressbar"
        aria-label="Settings health"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="text-[19px] font-semibold text-txt">{value}%</span>
        <span className="text-[10px] text-txt-muted">Valid</span>
      </div>
    </div>
  );
}

const LOG_TABS = ["Configuration Log", "Warnings", "Preferences File"] as const;

export function GeneralSettings({ section }: { section: string }) {
  const [language, setLanguage] = useState("English (UK)");
  const [startup, setStartup] = useState("Reconstruct");
  const [openLast, setOpenLast] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [confirmExit, setConfirmExit] = useState(true);
  const [theme, setTheme] = useState<"Dark" | "System" | "Light">("Dark");
  const [density, setDensity] = useState<"Compact" | "Comfortable">("Compact");
  const [accent, setAccent] = useState(0);
  const [uiScale, setUiScale] = useState(100);
  const [transparency, setTransparency] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [monoConsole, setMonoConsole] = useState(true);
  const [engine, setEngine] = useState("ECON (Human)");
  const [quality, setQuality] = useState<"Fast" | "Balanced" | "High">("Balanced");
  const [units, setUnits] = useState("Centimeters");
  const [exportFormat, setExportFormat] = useState("OBJ");
  const [texRes, setTexRes] = useState("2K");
  const [crystal, setCrystal] = useState("Rectangular Block");
  const [watertight, setWatertight] = useState(true);
  const [identity, setIdentity] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [interval, setIntervalValue] = useState("2 minutes");
  const [maxVersions, setMaxVersions] = useState("25");
  const [saveBefore, setSaveBefore] = useState(true);
  const [snapshots, setSnapshots] = useState(true);
  const [logTab, setLogTab] = useState<(typeof LOG_TABS)[number]>("Configuration Log");

  return (
    <div className="scroll-thin flex min-w-0 flex-1 flex-col gap-[10px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px]">
      <div>
        <h2 className="text-[15px] font-semibold text-txt">{section} Settings</h2>
        <p className="mt-[3px] text-[11.5px] text-txt-muted">
          Configure your DXF2OBJ workspace and project defaults.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1.35fr] gap-[10px]">
        <Card title="Application">
          <Row label="Language">
            <Select
              label="Language"
              value={language}
              options={["English (UK)", "English (US)", "Deutsch", "Français"]}
              onChange={setLanguage}
              className="w-[104px]"
            />
          </Row>
          <Row label="Startup Workspace">
            <Select
              label="Startup workspace"
              value={startup}
              options={["Reconstruct", "Refine", "Texture", "Explorer"]}
              onChange={setStartup}
              className="w-[104px]"
            />
          </Row>
          <Row label="Open Last Project">
            <ToggleSwitch label="Open last project" checked={openLast} onChange={setOpenLast} />
          </Row>
          <Row label="Show Welcome Screen">
            <ToggleSwitch label="Show welcome screen" checked={welcome} onChange={setWelcome} />
          </Row>
          <Row label="Check for Updates">
            <ToggleSwitch label="Check for updates" checked={updates} onChange={setUpdates} />
          </Row>
          <Row label="Confirm Before Exit">
            <ToggleSwitch label="Confirm before exit" checked={confirmExit} onChange={setConfirmExit} />
          </Row>
        </Card>

        <Card title="Appearance">
          <div className="grid grid-cols-[1fr_190px] gap-[14px]">
            <div className="space-y-[10px]">
              <Row label="Theme">
                <SegmentedControl
                  options={["Dark", "System", "Light"] as const}
                  value={theme}
                  onChange={setTheme}
                  className="w-[164px]"
                />
              </Row>
              <Row label="Interface Density">
                <SegmentedControl
                  options={["Compact", "Comfortable"] as const}
                  value={density}
                  onChange={setDensity}
                  className="w-[164px]"
                />
              </Row>
              <Row label="Accent Color">
                <span className="flex w-[164px] items-center gap-[8px]">
                  {ACCENT_SWATCHES.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={accent === i}
                      aria-label={`Accent colour ${i + 1}`}
                      onClick={() => setAccent(i)}
                      style={{ background: c }}
                      className={cn(
                        "size-[15px] rounded-full",
                        accent === i ? "ring-2 ring-txt ring-offset-2 ring-offset-surface" : null,
                      )}
                    />
                  ))}
                </span>
              </Row>
              <SliderControl inline label="UI Scale" value={uiScale} onChange={setUiScale} min={70} max={130} labelWidth={106} />
              <SliderControl
                inline
                label="Panel Transparency"
                value={transparency}
                onChange={setTransparency}
                labelWidth={106}
              />
              <Row label="Reduce Motion">
                <ToggleSwitch label="Reduce motion" checked={reduceMotion} onChange={setReduceMotion} />
              </Row>
              <Row label="Monospace Console">
                <ToggleSwitch label="Monospace console" checked={monoConsole} onChange={setMonoConsole} />
              </Row>
            </div>

            <div className="rounded-[5px] border border-line bg-app p-[8px]">
              <p className="text-[10.5px] text-txt-muted">Interface Preview</p>
              <div className="mt-[7px] overflow-hidden rounded-[4px] border border-line">
                <div className="flex h-[16px] items-center gap-[4px] bg-panel px-[5px] text-[7px] text-txt-dim">
                  DXF2OBJ
                  <span className="rounded bg-surface-2 px-[3px] text-[6px]">BETA</span>
                  <span className="ml-auto">— □ ✕</span>
                </div>
                <div className="flex" style={{ opacity: 1 - transparency / 200 }}>
                  <div className="flex w-[14px] flex-col items-center gap-[4px] bg-panel py-[4px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="size-[5px] rounded-sm bg-surface-2" />
                    ))}
                  </div>
                  <div className="flex-1 space-y-[3px] bg-surface p-[5px]">
                    <span className="block h-[3px] w-3/4 rounded bg-line-strong" />
                    <span className="block h-[3px] w-1/2 rounded bg-line-strong" />
                    <span
                      className="block h-[7px] w-full rounded"
                      style={{ background: ACCENT_SWATCHES[accent] }}
                    />
                    <p className="pt-[3px] font-mono text-[6px] leading-[9px] text-txt-dim">
                      [10:48:01] Session initialized
                      <br />
                      [10:48:02] GPU detected: RTX 3060
                    </p>
                  </div>
                </div>
                <div
                  style={{ background: "var(--gradient-lime)" }}
                  className="m-[5px] rounded py-[3px] text-center text-[6.5px] font-semibold text-app"
                >
                  Export Diagnostic Report
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Project Defaults">
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-[10px]">
          <Row label="Default Engine">
            <Select
              label="Default engine"
              value={engine}
              options={["ECON (Human)", "PIFuHD", "Photogrammetry"]}
              onChange={setEngine}
              className="w-[180px]"
            />
          </Row>
          <Row label="Texture Resolution">
            <Select
              label="Texture resolution"
              value={texRes}
              options={["1K", "2K", "4K"]}
              onChange={setTexRes}
              className="w-[180px]"
            />
          </Row>
          <Row label="Default Quality">
            <SegmentedControl
              options={["Fast", "Balanced", "High"] as const}
              value={quality}
              onChange={setQuality}
              className="w-[180px]"
            />
          </Row>
          <Row label="Crystal Preset">
            <Select
              label="Crystal preset"
              value={crystal}
              options={["Rectangular Block", "Cube", "Heart", "Rounded Block"]}
              onChange={setCrystal}
              className="w-[180px]"
            />
          </Row>
          <Row label="Units">
            <Select
              label="Units"
              value={units}
              options={["Centimeters", "Millimeters", "Inches"]}
              onChange={setUnits}
              className="w-[180px]"
            />
          </Row>
          <Row label="Watertight">
            <ToggleSwitch label="Watertight" checked={watertight} onChange={setWatertight} />
          </Row>
          <Row label="Default Export Format">
            <Select
              label="Default export format"
              value={exportFormat}
              options={["OBJ", "STL", "PLY", "GLB"]}
              onChange={setExportFormat}
              className="w-[180px]"
            />
          </Row>
          <Row label="Preserve Identity">
            <ToggleSwitch label="Preserve identity" checked={identity} onChange={setIdentity} />
          </Row>
        </div>
      </Card>

      <Card title="Autosave & Recovery">
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-[10px]">
          <Row label="Enable Autosave">
            <ToggleSwitch label="Enable autosave" checked={autosave} onChange={setAutosave} />
          </Row>
          <Row label="Save Before Processing">
            <ToggleSwitch label="Save before processing" checked={saveBefore} onChange={setSaveBefore} />
          </Row>
          <Row label="Autosave Interval">
            <Select
              label="Autosave interval"
              value={interval}
              options={["1 minute", "2 minutes", "5 minutes", "10 minutes"]}
              onChange={setIntervalValue}
              className="w-[180px]"
            />
          </Row>
          <Row label="Recovery Snapshots">
            <ToggleSwitch label="Recovery snapshots" checked={snapshots} onChange={setSnapshots} />
          </Row>
          <Row label="Maximum Versions">
            <input
              aria-label="Maximum versions"
              value={maxVersions}
              onChange={(e) => setMaxVersions(e.target.value)}
              className="h-[30px] w-[180px] rounded-[4px] border border-line bg-surface px-[10px] text-[11.5px] text-txt outline-none focus-visible:border-accent"
            />
          </Row>
        </div>
      </Card>

      <div className="flex h-[46px] shrink-0 items-center gap-[10px] rounded-[6px] border border-line bg-surface px-[12px]">
        <ShieldCheck className="size-[15px] text-ok" />
        <span className="text-[11.5px] text-txt-muted">Recovery protection is active</span>
        <button
          type="button"
          onClick={() => toast("Section reset to defaults")}
          className="ml-auto flex h-[28px] items-center gap-[7px] rounded-[4px] border border-line bg-panel px-[12px] text-[11.5px] text-txt-muted hover:text-txt"
        >
          <RotateCcw className="size-[13px]" />
          Reset Section
        </button>
        <button
          type="button"
          onClick={() => toast.success("Settings applied")}
          style={{ background: "var(--gradient-accent)" }}
          className="h-[28px] rounded-[4px] px-[14px] text-[11.5px] font-semibold text-white"
        >
          Apply Settings
        </button>
      </div>

      <div className="flex h-[168px] shrink-0 gap-[10px]">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-surface">
          <div className="flex h-[32px] shrink-0 items-center gap-[2px] border-b border-line px-[6px]">
            {LOG_TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={logTab === t}
                onClick={() => setLogTab(t)}
                className={cn(
                  "relative h-full px-[12px] text-[11px]",
                  logTab === t ? "bg-accent/12 text-accent-2" : "text-txt-muted hover:text-txt",
                )}
              >
                {t}
                {logTab === t ? (
                  <span className="absolute inset-x-[6px] -bottom-px h-[2px] rounded-t bg-accent-2" />
                ) : null}
              </button>
            ))}
          </div>
          <pre className="scroll-thin flex-1 overflow-y-auto px-[12px] py-[8px] font-mono text-[11px] leading-[19px] text-txt-muted">
            {logTab === "Configuration Log"
              ? CONFIG_LOG.join("\n")
              : logTab === "Warnings"
                ? "[10:48:06]  No warnings in current configuration"
                : "{\n  \"theme\": \"dark\",\n  \"units\": \"cm\"\n}"}
          </pre>
        </section>
        <section className="flex w-[356px] shrink-0 gap-[10px] rounded-[6px] border border-line bg-surface px-[14px] py-[11px]">
          <div className="min-w-0 flex-1">
            <h3 className="text-[12px] font-semibold text-txt">Settings Health</h3>
            <ul className="mt-[8px] space-y-[5px]">
              {SETTINGS_HEALTH.map((h) => (
                <li key={h} className="flex items-center gap-[8px] text-[11px] text-txt-muted">
                  <Check className="size-[13px] text-ok" strokeWidth={2.4} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex w-[128px] shrink-0 flex-col items-center justify-center gap-[7px]">
            <HealthRing value={100} />
            <span className="text-[10.5px] text-txt-dim">Saved just now</span>
          </div>
        </section>
      </div>
    </div>
  );
}