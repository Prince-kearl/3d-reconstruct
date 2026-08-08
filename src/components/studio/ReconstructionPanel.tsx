import { Box, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import portrait from "@/assets/source-portrait.jpg";
import { cn } from "@/lib/utils";
import {
  FieldLabel,
  PanelSectionTitle,
  SegmentedControl,
  Select,
  SliderControl,
  ToggleSwitch,
} from "./primitives";

export function ReconstructionPanel({ onStart }: { onStart: () => void }) {
  const [engine, setEngine] = useState("ECON (Human)");
  const [quality, setQuality] = useState<"Fast" | "Balanced" | "High">("Balanced");
  const [detail, setDetail] = useState(85);
  const [symmetry, setSymmetry] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. INPUT</PanelSectionTitle>
          <p className="mt-[13px] text-[11px] text-txt-muted">Source Image</p>
          <div className="mt-[8px] overflow-hidden rounded-[5px] border border-line bg-surface">
            <img
              src={portrait}
              alt="Source portrait used for reconstruction"
              width={1024}
              height={704}
              className="aspect-[16/11] w-full object-cover"
            />
          </div>
          <div className="mt-[9px] flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-[28px] flex-1 rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
            >
              Change Image
            </button>
            <div className="leading-[1.25]">
              <p className="text-[9.5px] text-txt-dim">PNG, JPG, WEBP</p>
              <p className="text-[9.5px] text-txt-dim">(Max 20MB)</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-hidden="true" />
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>2. RECONSTRUCTION ENGINE</PanelSectionTitle>

          <div className="mt-[13px] space-y-[6px]">
            <FieldLabel>Engine</FieldLabel>
            <Select
              label="Engine"
              value={engine}
              onChange={setEngine}
              options={["ECON (Human)", "PIFuHD (Human)", "TripoSR (Object)"]}
              className="h-[32px]"
            />
          </div>

          <div className="mt-[13px] space-y-[6px]">
            <FieldLabel>Quality</FieldLabel>
            <SegmentedControl
              options={["Fast", "Balanced", "High"] as const}
              value={quality}
              onChange={setQuality}
            />
          </div>

          <div className="mt-[15px]">
            <SliderControl label="Detail Preservation" value={detail} onChange={setDetail} />
          </div>

          <div className="mt-[15px] flex items-center justify-between">
            <FieldLabel>Symmetry Assist</FieldLabel>
            <ToggleSwitch label="Symmetry Assist" checked={symmetry} onChange={setSymmetry} />
          </div>

          <div className="mt-[15px] space-y-[7px]">
            <FieldLabel>Multi-view (Optional)</FieldLabel>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                toast.success("Images queued for multi-view refinement");
              }}
              className={cn(
                "rounded-[5px] border border-dashed px-[12px] py-[10px] transition-colors",
                dragging ? "border-accent bg-accent/10" : "border-line-strong bg-surface/60",
              )}
            >
              <p className="text-[11px] text-txt-muted">Add more images</p>
              <div className="mt-[10px] flex flex-col items-center gap-[7px]">
                <Upload className="size-[15px] text-txt-dim" />
                <p className="text-[10.5px] text-txt-dim">Drag &amp; drop or click to upload</p>
                <p className="text-[10px] text-txt-dim">PNG, JPG</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-[15px] flex h-[36px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Box className="size-[14px]" />
            Start Reconstruction
          </button>
          <p className="mt-[9px] text-center text-[10.5px] text-txt-dim">
            Estimated time: 2 - 4 min
          </p>
        </section>
      </div>
    </aside>
  );
}