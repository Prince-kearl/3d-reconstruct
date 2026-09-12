import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader } from "lucide-react";

import { listHistoryEvents } from "@/lib/supabase/projects";
import { cn } from "@/lib/utils";
import { describeHistoryEvent } from "@/stores/historyStore";
import { RECONSTRUCTION_STEPS, useReconstruct } from "@/stores/reconstructStore";

export function ConsoleJobs() {
  const { status, progress, completedSteps, projectId } = useReconstruct();

  const { data: rows = [] } = useQuery({
    queryKey: ["project_history", projectId],
    queryFn: () => (projectId ? listHistoryEvents(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });

  const recent = rows.slice(0, 8).map((row) => ({
    id: row.id,
    time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...describeHistoryEvent(row),
  }));

  const statusIcon =
    status === "ready" ? (
      <CircleCheck className="size-[13px] text-ok" />
    ) : status === "error" ? (
      <CircleX className="size-[13px] text-destructive" />
    ) : status === "idle" ? null : (
      <Loader className="size-[13px] animate-spin text-accent-2 motion-reduce:animate-none" />
    );

  return (
    <div className="flex w-full shrink-0 flex-col gap-[8px] xl:w-[248px]">
      <section className="rounded-[6px] border border-line bg-panel px-[12px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Current Status</h2>
        <div className="mt-[8px] flex items-center gap-[8px]">
          {statusIcon}
          <span className="text-[11.5px] text-txt-muted">
            {RECONSTRUCTION_STEPS[Math.min(completedSteps, RECONSTRUCTION_STEPS.length - 1)]}
          </span>
        </div>
        <div className="mt-[8px] flex items-center gap-[8px]">
          <div
            role="progressbar"
            aria-label="Reconstruction progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-[5px] flex-1 overflow-hidden rounded-full bg-line-strong"
          >
            <span
              className="block h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-txt">{Math.round(progress)}%</span>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-[6px] border border-line bg-panel px-[12px] py-[11px]">
        <h2 className="text-[12px] font-semibold text-txt">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="mt-[9px] text-[11px] text-txt-dim">No events yet for this project.</p>
        ) : (
          <ul className="scroll-thin mt-[9px] min-h-0 flex-1 space-y-[6px] overflow-y-auto">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-[2px] rounded-[4px] border border-line bg-surface px-[8px] py-[6px] text-[10.5px]"
              >
                <div className="flex items-center gap-[6px]">
                  <span
                    className={cn(
                      "rounded-[3px] px-[4px] text-[9px] font-semibold",
                      e.stage === "Export"
                        ? "bg-ok/20 text-ok"
                        : e.stage === "Refine"
                          ? "bg-accent/20 text-accent-2"
                          : "bg-axis-z/20 text-axis-z",
                    )}
                  >
                    {e.stage}
                  </span>
                  <span className="truncate text-txt-muted">{e.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[9.5px] text-txt-dim">
                    {e.time}
                  </span>
                </div>
                {e.note ? <p className="text-txt-dim">{e.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
