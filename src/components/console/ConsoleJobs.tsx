import { CircleCheck, Clock, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CONSOLE_ERRORS,
  JOB_QUEUE,
  THROUGHPUT_A,
  THROUGHPUT_B,
} from "@/data/consoleMock";
import { cn } from "@/lib/utils";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${40 - (v / max) * 36}`)
    .join(" ");
  return (
    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
  );
}

export function ConsoleJobs() {
  const [cancelled, setCancelled] = useState(false);

  return (
    <div className="flex w-[248px] shrink-0 flex-col gap-[8px]">
      <section className="rounded-[6px] border border-line bg-panel px-[12px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Active Job</h2>
        <p className="mt-[8px] text-[11.5px] text-txt-muted">Crystal Scene Render</p>
        <div className="mt-[8px] flex items-center gap-[8px]">
          <div
            role="progressbar"
            aria-label="Crystal Scene Render progress"
            aria-valuenow={cancelled ? 0 : 72}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-[5px] flex-1 overflow-hidden rounded-full bg-line-strong"
          >
            <span
              className="block h-full rounded-full bg-accent transition-all"
              style={{ width: cancelled ? "0%" : "72%" }}
            />
          </div>
          <span className="text-[11px] text-txt">{cancelled ? "0%" : "72%"}</span>
        </div>
        <dl className="mt-[9px] space-y-[5px] text-[11px]">
          {(
            [
              ["Status", cancelled ? "Cancelled" : "Running"],
              ["Elapsed", "00:18"],
              ["GPU", "58%"],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-txt-muted">{k}</dt>
              <dd className={k === "Status" ? (cancelled ? "text-axis-x" : "text-ok") : "text-txt"}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          disabled={cancelled}
          onClick={() => {
            setCancelled(true);
            toast.error("Scene render cancelled");
          }}
          className="mt-[10px] h-[28px] w-full rounded-[4px] border border-axis-x/50 bg-axis-x/10 text-[11.5px] text-axis-x hover:bg-axis-x/20 disabled:opacity-50"
        >
          {cancelled ? "Cancelled" : "Cancel"}
        </button>
      </section>

      <section className="rounded-[6px] border border-line bg-panel px-[12px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Job Queue</h2>
        <ul className="mt-[9px] space-y-[6px]">
          {JOB_QUEUE.map((j) => (
            <li
              key={j.name}
              className="flex h-[28px] items-center gap-[8px] rounded-[4px] border border-line bg-surface px-[8px] text-[11px]"
            >
              {j.state === "Completed" ? (
                <CircleCheck className="size-[13px] text-ok" />
              ) : j.state === "Running" ? (
                <Loader className="size-[13px] animate-spin text-accent-2 motion-reduce:animate-none" />
              ) : (
                <Clock className="size-[13px] text-txt-dim" />
              )}
              <span className="truncate text-txt-muted">{j.name}</span>
              <span
                className={cn(
                  "ml-auto text-[10.5px]",
                  j.state === "Completed"
                    ? "text-ok"
                    : j.state === "Running"
                      ? "text-accent-2"
                      : "text-txt-dim",
                )}
              >
                {j.state}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex min-h-0 flex-1 gap-[8px]">
        <section className="min-w-0 flex-1 rounded-[6px] border border-line bg-panel px-[10px] py-[10px]">
          <h2 className="flex items-center gap-[6px] text-[12px] font-semibold text-txt">
            Errors
            <span className="rounded-[3px] bg-axis-x/20 px-[5px] text-[9.5px] text-axis-x">2</span>
          </h2>
          <ul className="mt-[8px] space-y-[8px] text-[10.5px] text-txt-muted">
            {CONSOLE_ERRORS.map((e) => (
              <li key={e.time} className="flex gap-[6px]">
                <span className="mt-[4px] size-[5px] shrink-0 rounded-full bg-axis-x" />
                <span>
                  {e.time} {e.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="w-[118px] shrink-0 rounded-[6px] border border-line bg-panel px-[10px] py-[10px]">
          <h2 className="text-[12px] font-semibold text-txt">Throughput</h2>
          <div className="mt-[6px] flex gap-[4px]">
            <div className="flex flex-col justify-between py-[1px] text-[9px] text-txt-dim">
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 100 40" className="h-[54px] flex-1" role="img" aria-label="Events throughput chart">
              <Sparkline data={THROUGHPUT_A} color="var(--accent-2)" />
              <Sparkline data={THROUGHPUT_B} color="var(--ok)" />
            </svg>
          </div>
          <p className="mt-[8px] flex justify-between text-[10px] text-txt-muted">
            Events/s <span className="text-txt">24</span>
          </p>
          <p className="mt-[3px] flex justify-between text-[10px] text-txt-muted">
            Avg latency <span className="text-txt">18 ms</span>
          </p>
        </section>
      </div>
    </div>
  );
}