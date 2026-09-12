import { ChevronDown } from "lucide-react";
import { useCallback, useRef } from "react";

import { DepthMeshViewer } from "@/components/studio/DepthMeshViewer";
import { cn } from "@/lib/utils";
import { useHistory } from "@/stores/historyStore";
import { useReconstruct } from "@/stores/reconstructStore";

/**
 * Before/after here means "flat source photo" vs "the real reconstructed
 * mesh" — not two different mesh snapshots. The pipeline only ever keeps one
 * mesh per project (no per-version geometry is stored), so comparing two
 * arbitrary history events against each other would show the same image
 * twice — a real bug this replaces. Photo-vs-mesh is always a genuine,
 * meaningful difference, and still uses the picked events for real vertex
 * count / event-count stats below.
 */
export function HistoryComparisonViewport() {
  const s = useHistory();
  const { sourceImageUrl, geometry, texture, status } = useReconstruct();
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      s.setSplit(Math.min(100, Math.max(0, Math.round(pct))));
    },
    [s],
  );

  if (!sourceImageUrl) {
    return (
      <div className="viewport-surface relative flex flex-1 items-center justify-center text-[11px] text-txt-dim">
        {s.isLoading || status === "idle" ? "Loading…" : "No reconstructed model yet"}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="viewport-surface relative flex-1 select-none overflow-hidden"
      onPointerDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.015 265 / 0.5) 1px, transparent 1px)",
          backgroundSize: "58px 34px",
          transform: "perspective(340px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, oklch(0 0 0) 20%, transparent 95%)",
        }}
      />

      {/* Before: the real flat source photo. */}
      <img
        src={sourceImageUrl}
        alt="Original source photo"
        className="pointer-events-none absolute left-1/2 top-[53%] h-[84%] -translate-x-1/2 -translate-y-1/2 object-contain"
      />

      {/* After: the real reconstructed mesh, revealed as the split moves right. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${s.split}%)` }}
      >
        {geometry ? (
          <DepthMeshViewer geometry={geometry} texture={texture} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-txt-dim">
            Building mesh…
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-accent-2 shadow-[0_0_12px_var(--accent)]"
        style={{ left: `${s.split}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex size-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent-2 bg-surface text-[10px] text-accent-2">
          ⇔
        </span>
      </div>

      <span className="absolute left-[16px] top-[12px] z-10 rounded-[4px] bg-surface/80 px-[8px] py-[3px] text-[11px] text-txt-muted backdrop-blur-sm">
        Photo vs reconstructed mesh
      </span>
      <span className="absolute right-[14px] top-[12px] z-10 rounded-[4px] bg-surface/80 px-[8px] py-[3px] font-mono text-[11px] text-txt-muted backdrop-blur-sm">
        split {s.split}%
      </span>
      {s.showDiff ? (
        <span className="absolute bottom-[16px] left-1/2 -translate-x-1/2 rounded-[5px] border border-line bg-surface/85 px-[12px] py-[6px] font-mono text-[10.5px] text-txt-muted backdrop-blur-sm">
          {s.diffStats.map((d) => `${d.label}: ${d.value}`).join(" · ")}
        </span>
      ) : null}
    </div>
  );
}

export function HistoryTimeline() {
  const s = useHistory();
  return (
    <section className="flex h-[195px] w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel px-[14px] py-[11px] lg:w-[300px]">
      <h2 className="text-[12px] font-semibold text-txt">Project Timeline</h2>
      {s.versions.length === 0 ? (
        <p className="mt-[10px] text-[11px] text-txt-dim">
          {s.isLoading ? "Loading…" : "No events yet."}
        </p>
      ) : (
        <ol className="scroll-thin mt-[10px] flex-1 overflow-y-auto pl-[6px]">
          {s.versions.map((v, i) => {
            const active = v.id === s.compareId || v.id === s.baseId;
            return (
              <li key={v.id} className="relative pb-[12px] pl-[16px]">
                {i < s.versions.length - 1 ? (
                  <span className="absolute left-[4px] top-[10px] h-full w-px bg-line" />
                ) : null}
                <span
                  className={cn(
                    "absolute left-0 top-[4px] size-[9px] rounded-full border",
                    active ? "border-accent-2 bg-accent" : "border-line-strong bg-surface-2",
                  )}
                />
                <button type="button" onClick={() => s.setCompareId(v.id)} className="text-left">
                  <span
                    className={cn("block text-[11px]", active ? "text-accent-2" : "text-txt-muted")}
                  >
                    {v.name}
                  </span>
                  <span className="block font-mono text-[9.5px] text-txt-dim">
                    {v.time} • {v.verts} verts
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function HistoryThumb({ id }: { id: string }) {
  const s = useHistory();
  const v = s.versions.find((x) => x.id === id);
  const active = s.compareId === id;
  if (!v) return <div className="viewport-surface" aria-hidden="true" />;
  return (
    <button
      type="button"
      onClick={() => s.setCompareId(id)}
      className={cn(
        "viewport-surface relative overflow-hidden text-left",
        active && "ring-1 ring-accent/60",
      )}
    >
      <span className="absolute left-[10px] top-[8px] z-10 flex items-center gap-[4px] text-[11px] text-txt-muted">
        {v.stage}
        <ChevronDown className="size-[11px] text-txt-dim" />
      </span>
      {s.thumbnailUrl ? (
        <img
          src={s.thumbnailUrl}
          alt={`Snapshot for ${v.name}`}
          loading="lazy"
          className="absolute left-1/2 top-[58%] h-[82%] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      ) : null}
    </button>
  );
}
