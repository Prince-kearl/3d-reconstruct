import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, X } from "lucide-react";

import { ProgressRing } from "@/components/studio/ProgressRing";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type CheckResult = { name: string; ok: boolean; detail: string };

async function checkSupabaseReachable(): Promise<boolean> {
  try {
    // Reaching the server and getting a structured response back (even an
    // RLS/permission error) proves the network round-trip succeeded — only
    // a thrown exception here means Supabase itself is unreachable.
    await supabase.from("projects").select("id").limit(1);
    return true;
  } catch {
    return false;
  }
}

export function SystemReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: checks = [], isFetching } = useQuery<CheckResult[]>({
    queryKey: ["system-readiness"],
    queryFn: async () => {
      const supabaseOk = await checkSupabaseReachable();
      const webgpuOk = typeof navigator !== "undefined" && "gpu" in navigator;
      return [
        { name: "Signed in", ok: Boolean(user), detail: user?.email ?? "Not signed in" },
        {
          name: "Supabase",
          ok: supabaseOk,
          detail: supabaseOk ? "Reachable" : "Could not reach Supabase",
        },
        {
          name: "WebGPU",
          ok: webgpuOk,
          detail: webgpuOk ? "Available" : "Unavailable — using CPU/WASM",
        },
      ];
    },
  });

  const passCount = checks.filter((c) => c.ok).length;
  const allPass = checks.length > 0 && passCount === checks.length;

  return (
    <aside className="scroll-thin flex h-full w-full shrink-0 flex-col overflow-y-auto bg-panel lg:border-l lg:border-line">
      <div className="flex items-center gap-[10px] border-b border-line px-[14px] py-[12px]">
        <ProgressRing
          value={checks.length ? Math.round((passCount / checks.length) * 100) : 0}
          size={74}
          sub={allPass ? "Ready" : "Check"}
          label="System readiness"
        />
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold text-txt">System Readiness</h2>
          <p className="mt-[3px] text-[10.5px] leading-[16px] text-txt-muted">
            {allPass ? "All checks passed." : `${passCount}/${checks.length} checks passed.`}
          </p>
        </div>
      </div>

      <div className="border-b border-line px-[14px] py-[11px]">
        <ul className="space-y-[8px]">
          {checks.map((c) => (
            <li key={c.name} className="flex items-start gap-[8px]">
              <span
                className={cn(
                  "mt-[1px] flex size-[15px] shrink-0 items-center justify-center rounded-full",
                  c.ok ? "bg-ok/18" : "bg-destructive/18",
                )}
              >
                {c.ok ? (
                  <Check className="size-[10px] text-ok-2" strokeWidth={3} />
                ) : (
                  <X className="size-[10px] text-destructive" strokeWidth={3} />
                )}
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
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["system-readiness"] })}
          disabled={isFetching}
          className="mt-[11px] flex h-[28px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface text-[11.5px] text-txt-muted hover:text-txt disabled:opacity-60"
        >
          <RefreshCw className={isFetching ? "size-[13px] animate-spin" : "size-[13px]"} />
          {isFetching ? "Checking…" : "Re-run Checks"}
        </button>
      </div>
    </aside>
  );
}
