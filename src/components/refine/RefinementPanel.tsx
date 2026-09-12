import { Link } from "@tanstack/react-router";
import { FolderOpen, Paintbrush } from "lucide-react";
import { useState } from "react";

import { PanelSectionTitle } from "@/components/studio/primitives";
import { useReconstruct } from "@/stores/reconstructStore";

import { SilhouetteEditor } from "./SilhouetteEditor";

export function RefinementPanel() {
  const s = useReconstruct();
  const [editorOpen, setEditorOpen] = useState(false);

  const coveragePct = s.mask
    ? Math.round(
        (s.mask.data.reduce((sum, v) => sum + (v >= 0.5 ? 1 : 0), 0) / s.mask.data.length) * 100,
      )
    : null;

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:w-[300px]">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">REFINE MESH</h1>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. PROJECT</PanelSectionTitle>
          <div className="mt-[8px] aspect-[16/11] w-full overflow-hidden rounded-[5px] border border-line bg-surface">
            {s.sourceImageUrl ? (
              <img
                src={s.sourceImageUrl}
                alt="Current project source"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-[14px] text-center text-[10.5px] text-txt-dim">
                No project loaded
              </div>
            )}
          </div>
          <p className="mt-[10px] truncate text-[11.5px] text-txt">{s.sourceFileName ?? "—"}</p>
          <p className="mt-[2px] text-[10.5px] text-txt-dim">
            {s.imageWidth ? `${s.imageWidth} × ${s.imageHeight}` : "—"}
          </p>
          <Link
            to="/reconstruct"
            search={s.projectId ? { project: s.projectId } : {}}
            className="mt-[11px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
          >
            <FolderOpen className="size-[13px]" />
            Open Full Reconstruction
          </Link>
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>2. SILHOUETTE</PanelSectionTitle>
          <p className="mt-[8px] text-[10.5px] leading-[15px] text-txt-dim">
            Manually touch up the automatic background removal — paint to add back missed parts of
            the subject or erase leftover background, without regenerating the model.
          </p>
          <p className="mt-[9px] text-[11.5px] text-txt">
            {coveragePct !== null ? `${coveragePct}% of image kept` : "—"}
          </p>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            disabled={!s.mask}
            className="mt-[11px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong disabled:opacity-50"
          >
            <Paintbrush className="size-[13px]" />
            Edit Silhouette
          </button>
        </section>
      </div>

      <SilhouetteEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </aside>
  );
}
