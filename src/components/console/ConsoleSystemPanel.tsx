import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RUNTIME_INFO, SESSION_INFO } from "@/data/consoleMock";
import {
  CollapsibleSection,
  FieldLabel,
  Select,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { cn } from "@/lib/utils";

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-[5px] w-[92px] overflow-hidden rounded-full bg-line-strong">
      <span
        className="block h-full rounded-full"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[10px] py-[3px] text-[11px]">
      <FieldLabel>{label}</FieldLabel>
      <span className="flex items-center gap-[8px] text-txt">{children}</span>
    </div>
  );
}

export function ConsoleSystemPanel() {
  const [tab, setTab] = useState<"System" | "History">("System");
  const [safeMode, setSafeMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [logLevel, setLogLevel] = useState("Info");

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <div className="flex h-[40px] shrink-0 items-center gap-[2px] border-b border-line px-[8px]">
        {(["System", "History"] as const).map((t) => (
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

      {tab === "History" ? (
        <div className="px-[14px] py-[12px] text-[11px] text-txt-muted">
          <p>Previous sessions</p>
          <ul className="mt-[8px] space-y-[6px] font-mono text-[10.5px] text-txt-dim">
            <li>DXF-240810-C2 — 42 min</li>
            <li>DXF-240809-B9 — 1 h 12 min</li>
            <li>DXF-240808-A1 — 26 min</li>
          </ul>
        </div>
      ) : (
        <>
          <CollapsibleSection title="Session Info">
            {SESSION_INFO.map(([k, v]) => (
              <Row key={k} label={k}>
                {v}
              </Row>
            ))}
            <Row label="Status">
              <span className="rounded-[3px] bg-ok/20 px-[6px] text-[10px] text-ok">Live</span>
            </Row>
            <Row label="Events">128</Row>
          </CollapsibleSection>

          <CollapsibleSection title="GPU Monitor">
            <Row label="GPU">RTX 3060</Row>
            <Row label="Utilization">
              <Meter value={58} color="var(--accent)" />
              58%
            </Row>
            <Row label="Temperature">
              <Meter value={64} color="var(--ok)" />
              64°C
            </Row>
            <Row label="VRAM">
              <Meter value={53} color="var(--accent)" />
              6.4 / 12GB
            </Row>
            <Row label="Compute Mode">CUDA</Row>
          </CollapsibleSection>

          <CollapsibleSection title="Runtime">
            {RUNTIME_INFO.map(([k, v]) => (
              <Row key={k} label={k}>
                {v}
              </Row>
            ))}
            <Row label="Safe Mode">
              <ToggleSwitch label="Safe mode" checked={safeMode} onChange={setSafeMode} />
            </Row>
          </CollapsibleSection>

          <CollapsibleSection title="Console Settings">
            <Row label="Auto-scroll">
              <ToggleSwitch label="Auto-scroll" checked={autoScroll} onChange={setAutoScroll} />
            </Row>
            <Row label="Show Timestamps">
              <ToggleSwitch label="Show timestamps" checked={timestamps} onChange={setTimestamps} />
            </Row>
            <Row label="Wrap Lines">
              <ToggleSwitch label="Wrap lines" checked={wrap} onChange={setWrap} />
            </Row>
            <div className="mt-[6px] flex items-center justify-between gap-[10px]">
              <FieldLabel>Log Level</FieldLabel>
              <Select
                label="Log level"
                value={logLevel}
                options={["Trace", "Info", "Warning", "Error"]}
                onChange={setLogLevel}
                className="w-[150px]"
              />
            </div>
            <div className="mt-[8px] flex items-center justify-between gap-[10px]">
              <FieldLabel>Max Entries</FieldLabel>
              <span className="flex h-[30px] w-[150px] items-center rounded-[4px] border border-line bg-surface px-[10px] text-[11.5px] text-txt">
                5,000
              </span>
            </div>
            <button
              type="button"
              onClick={() => toast.success("Console cleared")}
              className="mt-[10px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-axis-x/40 text-[11.5px] text-axis-x hover:bg-axis-x/10"
            >
              <Trash2 className="size-[13px]" />
              Clear Console
            </button>
          </CollapsibleSection>
        </>
      )}

      <div className="mt-auto px-[14px] py-[14px]">
        <button
          type="button"
          onClick={() => toast.success("Diagnostic report exported")}
          style={{ background: "var(--gradient-lime)" }}
          className="flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
        >
          Export Diagnostic Report
        </button>
      </div>
    </aside>
  );
}