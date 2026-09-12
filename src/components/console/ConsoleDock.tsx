import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/stores/authStore";
import { cn } from "@/lib/utils";

function useWebGpuAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && "gpu" in navigator);
  }, []);
  return available;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

function HealthCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-[8px] text-[11px] text-txt-muted">
      {ok ? (
        <Check className="size-[13px] text-ok" strokeWidth={2.4} />
      ) : (
        <X className="size-[13px] text-destructive" strokeWidth={2.4} />
      )}
      {label}
    </li>
  );
}

export function ConsoleDock() {
  const { user } = useAuth();
  const webgpu = useWebGpuAvailable();
  const online = useOnline();
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const checks = [
    { label: "Signed in", ok: Boolean(user) },
    { label: "Network online", ok: online },
    { label: "WebGPU available", ok: webgpu },
  ];
  const healthPct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="flex shrink-0 flex-col gap-[8px] xl:h-[120px] xl:flex-row">
      <section className="flex w-full shrink-0 gap-[10px] rounded-[6px] border border-line bg-panel px-[14px] py-[11px]">
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-semibold text-txt">Session Health</h2>
          <ul className="mt-[9px] space-y-[6px]">
            {checks.map((c) => (
              <HealthCheck key={c.label} label={c.label} ok={c.ok} />
            ))}
          </ul>
        </div>
        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center gap-[6px] border-l border-line pl-[14px]">
          <span
            className={cn(
              "text-[20px] font-semibold",
              healthPct === 100 ? "text-ok" : healthPct > 0 ? "text-lime" : "text-destructive",
            )}
          >
            {healthPct}%
          </span>
          <span className="text-[10.5px] text-txt-muted">
            {healthPct === 100 ? "Healthy" : "Attention needed"}
          </span>
          <span className="text-[10.5px] text-txt-muted">
            Uptime <span className="font-mono text-txt">{formatUptime(now - startedAt)}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
