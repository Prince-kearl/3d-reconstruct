import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";

import { PanelSectionTitle, SliderControl } from "@/components/studio/primitives";
import { useReconstruct } from "@/stores/reconstructStore";

const signed = (v: number) => (v > 0 ? `+${v}%` : `${v}%`);

export function TexturePanel() {
  const s = useReconstruct();

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:w-[300px]">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">
          TEXTURE WORKSPACE
        </h1>
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
          <PanelSectionTitle>2. COLOR GRADING</PanelSectionTitle>
          <p className="mt-[8px] text-[10.5px] leading-[15px] text-txt-dim">
            Adjusts the real photo texture applied to the mesh — the same pixels used in the
            viewport and in your OBJ/GLB export.
          </p>
          <div className="mt-[13px] space-y-[11px]">
            <SliderControl
              inline
              label="Exposure"
              value={s.colorGrading.exposure}
              onChange={s.setExposure}
              min={-100}
              max={100}
              format={signed}
            />
            <SliderControl
              inline
              label="Saturation"
              value={s.colorGrading.saturation}
              onChange={s.setSaturation}
              min={-100}
              max={100}
              format={signed}
            />
            <SliderControl
              inline
              label="Warmth"
              value={s.colorGrading.warmth}
              onChange={s.setWarmth}
              min={-100}
              max={100}
              format={signed}
            />
            <SliderControl
              inline
              label="Contrast"
              value={s.colorGrading.contrast}
              onChange={s.setContrast}
              min={-100}
              max={100}
              format={signed}
            />
          </div>
          <button
            type="button"
            onClick={s.resetColorGrading}
            className="mt-[13px] h-[30px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
          >
            Reset Color Grading
          </button>
        </section>
      </div>
    </aside>
  );
}
