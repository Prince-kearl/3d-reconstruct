import { useQuery } from "@tanstack/react-query";

import { listHistoryEvents } from "@/lib/supabase/projects";
import { cn } from "@/lib/utils";
import { describeHistoryEvent } from "@/stores/historyStore";
import { useReconstruct } from "@/stores/reconstructStore";

export function ConsoleLogsTable() {
  const { projectId } = useReconstruct();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["project_history", projectId],
    queryFn: () => (projectId ? listHistoryEvents(projectId) : Promise.resolve([])),
    enabled: Boolean(projectId),
  });

  const events = rows.map((row) => ({
    id: row.id,
    time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "medium" }),
    ...describeHistoryEvent(row),
  }));

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="flex h-[38px] shrink-0 items-center border-b border-line px-[12px]">
        <h2 className="text-[13px] font-medium text-txt">Full Event Log — this project</h2>
        <span className="ml-[10px] text-[11px] text-txt-dim">{events.length} events</span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="px-[14px] py-[12px] text-[11px] text-txt-dim">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="px-[14px] py-[12px] text-[11px] text-txt-dim">No events yet.</p>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-line text-left text-txt-dim">
                <th className="px-[14px] py-[8px] font-medium">Time</th>
                <th className="px-[14px] py-[8px] font-medium">Stage</th>
                <th className="px-[14px] py-[8px] font-medium">Event</th>
                <th className="px-[14px] py-[8px] font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-[14px] py-[7px] font-mono text-[10.5px] text-txt-dim">
                    {e.time}
                  </td>
                  <td className="px-[14px] py-[7px]">
                    <span
                      className={cn(
                        "rounded-[3px] px-[5px] py-[1px] text-[9.5px] font-semibold",
                        e.stage === "Export"
                          ? "bg-ok/20 text-ok"
                          : e.stage === "Refine"
                            ? "bg-accent/20 text-accent-2"
                            : "bg-axis-z/20 text-axis-z",
                      )}
                    >
                      {e.stage}
                    </span>
                  </td>
                  <td className="px-[14px] py-[7px] text-txt">{e.name}</td>
                  <td className="px-[14px] py-[7px] text-txt-muted">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
