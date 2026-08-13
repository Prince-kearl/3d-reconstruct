import { Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProgressRing } from "@/components/studio/ProgressRing";
import { READINESS_CHECKS } from "@/data/launcherMock";
import { SYSTEM_INFO } from "@/data/settingsMock";

export function SystemReadiness() {
  const [checking, setChecking] = useState(false);

  const recheck = () => {
    setChecking(true);
    toast("Running readiness checks…");
    window.setTimeout(() => {
      setChecking(false);
      toast.success("All systems ready");
    }, 1200);
  };

  return (
    <aside className="scroll-thin flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <div className="flex items-center gap-[10px] border-b border-line px-[14px] py-[12px]">
        <ProgressRing value={100} size={74} sub="Ready" label="System readiness" />
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold text-txt">System Readiness</h2>
          <p className="mt-[3px] text-[10.5px] leading-[16px] text-txt-muted">
            All six checks passed. The workstation is ready to reconstruct.
          </p>
        </div>
      </div>

      <div className="border-b border-line px-[14px] py-[11px]">
        <ul className="space-y-[8px]">
          {READINESS_CHECKS.map((c) => (
            <li key={c.name} className="flex items-start gap-[8px]">
              <span className="mt-[1px] flex size-[15px] shrink-0 items-center justify-center rounded-full bg-ok/18">
                <Check className="size-[10px] text-ok-2" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] text-txt">{c.name}</span>
                <span className="block text-[10px] text-txt-dim">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={recheck}
          disabled={checking}
          className="mt-[11px] flex h-[28px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface text-[11.5px] text-txt-muted hover:text-txt disabled:opacity-60"
        >
          <RefreshCw className={checking ? "size-[13px] animate-spin" : "size-[13px]"} />
          {checking ? "Checking…" : "Re-run Checks"}
        </button>
      </div>

      <div className="border-b border-line px-[14px] py-[11px]">
        <h3 className="text-[11px] font-semibold text-txt">Workstation</h3>
        <dl className="mt-[8px] space-y-[6px] text-[10.5px]">
          {SYSTEM_INFO.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <dt className="text-txt-dim">{k}</dt>
              <dd className="text-txt">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-[14px] py-[11px]">
        <h3 className="text-[11px] font-semibold text-txt">Resources</h3>
        <div className="mt-[9px] space-y-[10px]">
          {[
            ["GPU", 71, "var(--accent)"],
            ["VRAM", 43, "var(--ok)"],
            ["Disk", 62, "var(--lime)"],
          ].map(([label, pct, color]) => (
            <div key={label as string}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-txt-muted">{label as string}</span>
                <span className="text-txt">{pct as number}%</span>
              </div>
              <div className="mt-[4px] h-[3px] w-full rounded-full bg-line-strong">
                <div
                  className="h-[3px] rounded-full"
                  style={{ width: `${pct as number}%`, background: color as string }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}