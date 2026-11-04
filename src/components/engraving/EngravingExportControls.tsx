import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import * as THREE from "three";
import { toast } from "sonner";

import { buildLaserEngravingSTL, downloadBlob } from "@/lib/mesh/exportMesh";

export interface EngravingSourceLease {
  object: THREE.Object3D;
  dispose?: (() => void) | undefined;
}

export function EngravingExportControls({
  createSource,
  sourceName,
  sourceKind,
  disabled = false,
}: {
  createSource: () => EngravingSourceLease | null;
  sourceName: string;
  sourceKind: "complete-model" | "photo-relief";
  disabled?: boolean;
}) {
  const [maxDimensionMm, setMaxDimensionMm] = useState("62");
  const [markSizeMm, setMarkSizeMm] = useState("0.01");
  const [spacingMm, setSpacingMm] = useState("0.20");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const dimension = Number(maxDimensionMm);
    const markSize = Number(markSizeMm);
    const spacing = Number(spacingMm);
    if (!Number.isFinite(dimension) || dimension < 1 || dimension > 1000) {
      setError("Set the longest model dimension between 1 and 1000 mm.");
      return;
    }
    if (!Number.isFinite(markSize) || markSize < 0.001 || markSize > 1) {
      setError("Set the mark edge size between 0.001 and 1 mm.");
      return;
    }
    if (!Number.isFinite(spacing) || spacing < 0.02 || spacing > 10) {
      setError("Set the nominal point spacing between 0.02 and 10 mm.");
      return;
    }

    setError(null);
    setExporting(true);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    let lease: EngravingSourceLease | null = null;
    try {
      lease = createSource();
      if (!lease) throw new Error("The model is not ready for engraving export.");
      const result = buildLaserEngravingSTL(lease.object, {
        maxDimensionMm: dimension,
        markSizeMm: markSize,
        spacingMm: spacing,
      });
      const stem = sourceName.replace(/\.[^.]+$/, "").trim() || "model";
      downloadBlob(result.blob, `${stem}-laser-engraving.stl`);
      const [width, height, depth] = result.dimensionsMm;
      toast.success(
        `Engraving STL ready: ${result.markCount.toLocaleString()} marks, ${width.toFixed(1)} × ${height.toFixed(1)} × ${depth.toFixed(1)} mm`,
      );
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "Could not create the engraving STL.";
      setError(message);
      toast.error("Engraving STL export failed");
    } finally {
      lease?.dispose?.();
      setExporting(false);
    }
  };

  return (
    <section className="border-b border-line px-[14px] py-[12px]">
      <h2 className="text-[11px] font-semibold tracking-[0.06em] text-txt">
        LASER ENGRAVING MARKS
      </h2>
      <p className="mt-[7px] text-[10.5px] leading-[15px] text-txt-dim">
        Exports a binary STL made from tiny tetrahedral marks, instead of a solid shell. The default
        0.01 mm mark edge follows the supplied crystal example; spacing controls mark density. Each
        export is capped at 250,000 marks to keep browser memory use manageable.
      </p>

      <div className="mt-[11px] grid grid-cols-2 gap-[8px]">
        <label className="min-w-0 text-[10.5px] text-txt-muted">
          Longest dimension (mm)
          <input
            type="number"
            min="1"
            max="1000"
            step="0.1"
            value={maxDimensionMm}
            onChange={(event) => setMaxDimensionMm(event.target.value)}
            className="mt-[4px] h-[32px] w-full rounded-[4px] border border-line bg-surface px-[8px] text-[11.5px] text-txt outline-none focus:border-accent"
          />
        </label>
        <label className="min-w-0 text-[10.5px] text-txt-muted">
          Mark edge (mm)
          <input
            type="number"
            min="0.001"
            max="1"
            step="0.001"
            value={markSizeMm}
            onChange={(event) => setMarkSizeMm(event.target.value)}
            className="mt-[4px] h-[32px] w-full rounded-[4px] border border-line bg-surface px-[8px] text-[11.5px] text-txt outline-none focus:border-accent"
          />
        </label>
        <label className="col-span-2 min-w-0 text-[10.5px] text-txt-muted">
          Nominal spacing / density (mm)
          <input
            type="number"
            min="0.02"
            max="10"
            step="0.01"
            value={spacingMm}
            onChange={(event) => setSpacingMm(event.target.value)}
            className="mt-[4px] h-[32px] w-full rounded-[4px] border border-line bg-surface px-[8px] text-[11.5px] text-txt outline-none focus:border-accent"
          />
        </label>
      </div>

      <p className="mt-[9px] text-[10px] leading-[14px] text-txt-dim">
        {sourceKind === "complete-model"
          ? "Samples visible surfaces across the imported 3D model and preserves material/texture brightness as mark density."
          : "Uses the geometry currently available from the photo workflow. A single-photo or silhouette-guided relief is not a full 3D body; use a complete 3D model for genuinely volumetric anatomy."}
      </p>
      <p className="mt-[7px] rounded-[4px] border border-line bg-surface px-[8px] py-[7px] text-[10px] leading-[14px] text-txt-muted">
        This is an internal crystal-engraving point cloud, not a watertight 3D-print solid. Confirm
        point-size and STL requirements with your crystal laser supplier before production.
      </p>

      {error ? (
        <p role="alert" className="mt-[8px] break-words text-[10.5px] leading-[14px] text-warning">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={disabled || exporting}
        className="mobile-hit-target mt-[10px] flex h-[38px] w-full items-center justify-center gap-[7px] rounded-[5px] bg-accent px-[8px] text-[11.5px] font-semibold text-app transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          <LoaderCircle className="size-[14px] animate-spin" />
        ) : (
          <Download className="size-[14px]" />
        )}
        {exporting ? "Building engraving STL…" : "Export Engraving STL"}
      </button>
    </section>
  );
}
