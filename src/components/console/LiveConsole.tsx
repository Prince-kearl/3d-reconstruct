import { ChevronRight, Copy, Pause, Play, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CONSOLE_EVENTS, type ConsoleEvent } from "@/data/consoleMock";
import { Select, ToggleSwitch } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<ConsoleEvent["level"], string> = {
  INFO: "border-axis-z/50 bg-axis-z/15 text-axis-z",
  OK: "border-ok/50 bg-ok/15 text-ok",
  WARN: "border-lime/50 bg-lime/15 text-lime",
  ERR: "border-axis-x/50 bg-axis-x/15 text-axis-x",
};

const PROCESSES = ["All Processes", "Reconstruction", "Refinement", "Texture", "Export"];

export function LiveConsole() {
  const [streaming, setStreaming] = useState(true);
  const [follow, setFollow] = useState(true);
  const [process, setProcess] = useState(PROCESSES[0]!);
  const [cleared, setCleared] = useState(false);
  const [command, setCommand] = useState("");
  const [mode, setMode] = useState("Safe Mode");

  const events = useMemo(
    () =>
      cleared
        ? []
        : CONSOLE_EVENTS.filter((e) => process === "All Processes" || e.source === process),
    [cleared, process],
  );

  const blanks = Array.from({ length: Math.max(0, 20 - events.length) }, (_, i) =>
    String(events.length + i + 1).padStart(3, "0"),
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="flex h-[38px] shrink-0 items-center gap-[10px] border-b border-line px-[12px]">
        <span
          className={cn("size-[9px] rounded-full", streaming ? "bg-ok" : "bg-txt-dim")}
          style={streaming ? { boxShadow: "0 0 8px var(--ok)" } : undefined}
        />
        <h2 className="text-[13px] font-medium text-txt">Live Console</h2>
        <span className="flex items-center gap-[5px] text-[11px] text-ok">
          <span className="size-[6px] rounded-full bg-ok" />
          {streaming ? "Streaming" : "Paused"}
        </span>
        <Select
          label="Process filter"
          value={process}
          options={PROCESSES}
          onChange={setProcess}
          className="ml-[14px] !h-[26px] w-[150px]"
        />
        <button
          type="button"
          aria-label={streaming ? "Pause stream" : "Resume stream"}
          aria-pressed={!streaming}
          onClick={() => setStreaming(!streaming)}
          className="flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          {streaming ? <Pause className="size-[12px]" /> : <Play className="size-[12px]" />}
        </button>
        <span className="ml-[6px] flex items-center gap-[7px] text-[11px] text-txt-muted">
          Follow Tail
          <ToggleSwitch label="Follow tail" checked={follow} onChange={setFollow} />
        </span>
        <button
          type="button"
          aria-label="Clear console"
          onClick={() => setCleared(true)}
          className="ml-[6px] flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          <Trash2 className="size-[12px]" />
        </button>
        <button
          type="button"
          aria-label="Copy console output"
          onClick={() => toast.success("Console output copied")}
          className="flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          <Copy className="size-[12px]" />
        </button>
      </div>

      <ol className="scroll-thin min-h-0 flex-1 overflow-y-auto py-[6px] font-mono text-[11px]">
        {events.map((e, i) => (
          <li
            key={e.n}
            className={cn(
              "flex items-center gap-[10px] px-[12px] py-[2.5px]",
              i === 10 ? "bg-surface-2/60" : null,
            )}
          >
            <span className="w-[3px] self-stretch rounded-full bg-accent/70" aria-hidden="true" />
            <span className="w-[26px] text-txt-dim">{e.n}</span>
            <span className="text-txt-dim">[{e.time}]</span>
            <span
              className={cn(
                "w-[44px] rounded-[3px] border text-center text-[9.5px] font-semibold leading-[15px]",
                LEVEL_STYLE[e.level],
              )}
            >
              {e.level}
            </span>
            <span className="truncate text-txt-muted">{e.text}</span>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="px-[12px] py-[10px] text-[11px] text-txt-dim">
            Console cleared — no events for this filter.
          </li>
        ) : null}
        {blanks.map((n) => (
          <li key={n} className="flex gap-[10px] px-[12px] py-[2.5px] text-txt-dim/60">
            <span className="w-[3px]" aria-hidden="true" />
            <span className="w-[26px]">{n}</span>
          </li>
        ))}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!command.trim()) return;
          toast.success(`Command queued: ${command.trim()}`);
          setCommand("");
        }}
        className="flex h-[46px] shrink-0 items-center gap-[8px] border-t border-line px-[10px]"
      >
        <ChevronRight className="size-[14px] text-accent-2" />
        <input
          aria-label="Console command"
          placeholder="Enter command or filter expression..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="h-[30px] min-w-0 flex-1 rounded-[4px] border border-line bg-surface px-[10px] text-[11.5px] text-txt outline-none placeholder:text-txt-dim focus-visible:border-accent"
        />
        <Select
          label="Execution mode"
          value={mode}
          options={["Safe Mode", "Verbose", "Dry Run"]}
          onChange={setMode}
          className="!h-[30px] w-[118px]"
        />
        <span className="rounded-[4px] border border-line bg-surface px-[10px] py-[6px] text-[10.5px] text-txt-dim">
          Ctrl + Enter
        </span>
        <button
          type="submit"
          style={{ background: "var(--gradient-accent)" }}
          className="h-[30px] rounded-[4px] px-[18px] text-[11.5px] font-semibold text-white"
        >
          Run
        </button>
      </form>
    </section>
  );
}