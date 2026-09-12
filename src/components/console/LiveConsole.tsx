import { Copy, Download, Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { ToggleSwitch } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";
import { useReconstruct } from "@/stores/reconstructStore";
import type { LogLevelFilter } from "./ConsoleExplorer";

function levelOf(line: string): "Info" | "Error" {
  return /error/i.test(line) ? "Error" : "Info";
}

function downloadText(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function LiveConsole({
  search,
  level,
  followTail,
  onToggleFollowTail,
}: {
  search: string;
  level: LogLevelFilter;
  followTail: boolean;
  onToggleFollowTail: (v: boolean) => void;
}) {
  const { logLines, status, sourceFileName } = useReconstruct();
  const listRef = useRef<HTMLOListElement>(null);

  const isLive =
    status === "loading-model" ||
    status === "removing-background" ||
    status === "estimating-depth" ||
    status === "building-mesh";

  const filtered = logLines.filter((line) => {
    if (level !== "All" && levelOf(line) !== level) return false;
    if (search.trim() && !line.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (!followTail) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length, followTail]);

  return (
    <section className="flex h-[320px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel xl:h-auto xl:min-h-0 xl:flex-1">
      <div className="flex h-[38px] shrink-0 items-center gap-[10px] border-b border-line px-[12px]">
        <span
          className={cn("size-[9px] rounded-full", isLive ? "bg-ok" : "bg-txt-dim")}
          style={isLive ? { boxShadow: "0 0 8px var(--ok)" } : undefined}
        />
        <h2 className="text-[13px] font-medium text-txt">Live Console</h2>
        <span className="flex items-center gap-[5px] text-[11px] text-txt-muted">
          <span className={cn("size-[6px] rounded-full", isLive ? "bg-ok" : "bg-txt-dim")} />
          {isLive ? "Streaming" : "Idle"}
        </span>

        <span className="ml-auto flex items-center gap-[7px] text-[11px] text-txt-muted">
          Follow Tail
          <ToggleSwitch label="Follow tail" checked={followTail} onChange={onToggleFollowTail} />
        </span>
        <button
          type="button"
          aria-label={followTail ? "Pause following" : "Resume following"}
          onClick={() => onToggleFollowTail(!followTail)}
          className="flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          {followTail ? <Pause className="size-[12px]" /> : <Play className="size-[12px]" />}
        </button>
        <button
          type="button"
          aria-label="Copy visible log lines"
          onClick={() => {
            void navigator.clipboard.writeText(filtered.join("\n")).then(
              () => toast.success("Log lines copied"),
              () => toast.error("Could not copy — clipboard unavailable"),
            );
          }}
          className="flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          <Copy className="size-[12px]" />
        </button>
        <button
          type="button"
          aria-label="Download visible log lines"
          onClick={() => {
            const name = (sourceFileName ?? "console").replace(/\.[^.]+$/, "");
            downloadText(filtered.join("\n"), `${name}-log.txt`);
          }}
          className="flex size-[26px] items-center justify-center rounded-[4px] border border-line bg-surface text-txt-muted hover:text-txt"
        >
          <Download className="size-[12px]" />
        </button>
      </div>

      <ol
        ref={listRef}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto py-[6px] font-mono text-[11px]"
      >
        {filtered.map((line, i) => (
          <li key={`${i}-${line}`} className="flex items-center gap-[10px] px-[12px] py-[2.5px]">
            <span className="w-[3px] self-stretch rounded-full bg-accent/70" aria-hidden="true" />
            <span className="w-[26px] shrink-0 text-txt-dim">{String(i + 1).padStart(3, "0")}</span>
            <span
              className={cn(
                "w-[40px] shrink-0 rounded-[3px] border text-center text-[9.5px] font-semibold leading-[15px]",
                levelOf(line) === "Error"
                  ? "border-destructive/50 bg-destructive/15 text-destructive"
                  : "border-axis-z/50 bg-axis-z/15 text-axis-z",
              )}
            >
              {levelOf(line)}
            </span>
            <span className="truncate text-txt-muted">{line}</span>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-[12px] py-[10px] text-[11px] text-txt-dim">
            {logLines.length === 0
              ? "No output yet — start a reconstruction to see live logs."
              : "No log lines match this filter."}
          </li>
        ) : null}
      </ol>
    </section>
  );
}
