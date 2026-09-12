import { Box } from "lucide-react";
import { useRef } from "react";

import { useReconstruct, type Quality } from "@/stores/reconstructStore";
import { FieldLabel, PanelSectionTitle, SegmentedControl, SliderControl } from "./primitives";

export function ReconstructionPanel() {
  const s = useReconstruct();
  const fileRef = useRef<HTMLInputElement>(null);

  const previewSrc = s.sourceImageUrl ?? s.pendingPreviewUrl;
  const busy =
    s.status === "loading-model" || s.status === "estimating-depth" || s.status === "building-mesh";

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    s.setPendingFile(file);
  };

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel lg:w-[300px]">
      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. INPUT</PanelSectionTitle>
          <p className="mt-[13px] text-[11px] text-txt-muted">Source Image</p>
          <div className="mt-[8px] aspect-[16/11] w-full overflow-hidden rounded-[5px] border border-line bg-surface">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Source portrait used for reconstruction"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-[14px] text-center text-[10.5px] text-txt-dim">
                No image selected
              </div>
            )}
          </div>
          <div className="mt-[9px] flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-[28px] flex-1 rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
            >
              {previewSrc ? "Change Image" : "Choose Image"}
            </button>
            <div className="leading-[1.25]">
              <p className="text-[9.5px] text-txt-dim">PNG, JPG, WEBP</p>
              <p className="text-[9.5px] text-txt-dim">(Max 20MB)</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPick}
            className="hidden"
            aria-label="Choose source image"
          />
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>2. DEPTH ENGINE</PanelSectionTitle>

          <div className="mt-[13px] space-y-[6px]">
            <FieldLabel>Quality</FieldLabel>
            <SegmentedControl
              options={["Fast", "Balanced", "High"] as const}
              value={s.quality}
              onChange={(v: Quality) => s.setQuality(v)}
            />
          </div>

          <div className="mt-[15px]">
            <SliderControl label="Depth Intensity" value={s.detail} onChange={s.setDetail} />
          </div>

          <button
            type="button"
            onClick={() => void s.startReconstruction()}
            disabled={!s.pendingPreviewUrl && !s.sourceImageUrl}
            className="mt-[15px] flex h-[36px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Box className={busy ? "size-[14px] animate-pulse" : "size-[14px]"} />
            {busy ? "Processing…" : "Start Reconstruction"}
          </button>
          <p className="mt-[9px] text-center text-[10.5px] text-txt-dim">
            Runs fully in your browser — no photo leaves your device
          </p>
          {s.status === "error" && s.errorMessage ? (
            <p className="mt-[9px] text-center text-[10.5px] text-destructive">{s.errorMessage}</p>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
