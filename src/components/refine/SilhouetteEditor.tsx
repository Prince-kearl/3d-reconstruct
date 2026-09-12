import { useEffect, useRef, useState } from "react";

import { SegmentedControl, SliderControl } from "@/components/studio/primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paintMaskTint } from "@/lib/mesh/paintMaskTint";
import { useReconstruct } from "@/stores/reconstructStore";

const CANVAS_MAX_WIDTH = 560;

export function SilhouetteEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sourceImageUrl, mask, applyMaskEdit, resetMaskToAutomatic } = useReconstruct();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageDataRef = useRef<ImageData | null>(null);
  const compositeImageDataRef = useRef<ImageData | null>(null);
  const workingMaskRef = useRef<Float32Array | null>(null);
  const dimsRef = useRef({ width: 0, height: 0 });

  const [brushMode, setBrushMode] = useState<"Erase" | "Restore">("Erase");
  const [brushSize, setBrushSize] = useState(28);
  const [ready, setReady] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!open || !sourceImageUrl || !mask) {
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = mask.width;
      const h = mask.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const base = ctx.getImageData(0, 0, w, h);
      baseImageDataRef.current = base;
      dimsRef.current = { width: w, height: h };
      workingMaskRef.current = Float32Array.from(mask.data);

      const composite = new ImageData(new Uint8ClampedArray(base.data), w, h);
      compositeImageDataRef.current = composite;
      paintMaskTint(composite, base, workingMaskRef.current, 0, 0, w, h);
      ctx.putImageData(composite, 0, 0);
      setReady(true);
    };
    img.src = sourceImageUrl;

    return () => {
      cancelled = true;
    };
  }, [open, sourceImageUrl, mask]);

  function paintAt(mx: number, my: number, radius: number) {
    const wm = workingMaskRef.current;
    const composite = compositeImageDataRef.current;
    const base = baseImageDataRef.current;
    const canvas = canvasRef.current;
    if (!wm || !composite || !base || !canvas) return;
    const { width, height } = dimsRef.current;

    const value = brushMode === "Erase" ? 0 : 1;
    const minX = Math.max(0, Math.floor(mx - radius));
    const maxX = Math.min(width - 1, Math.ceil(mx + radius));
    const minY = Math.max(0, Math.floor(my - radius));
    const maxY = Math.min(height - 1, Math.ceil(my + radius));
    if (maxX < minX || maxY < minY) return;

    const r2 = radius * radius;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - mx;
        const dy = y - my;
        if (dx * dx + dy * dy <= r2) wm[y * width + x] = value;
      }
    }

    paintMaskTint(composite, base, wm, minX, minY, maxX - minX + 1, maxY - minY + 1);
    const ctx = canvas.getContext("2d");
    ctx?.putImageData(composite, 0, 0, minX, minY, maxX - minX + 1, maxY - minY + 1);
  }

  function toMaskCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      mx: (e.clientX - rect.left) * scaleX,
      my: (e.clientY - rect.top) * scaleY,
      radius: brushSize * scaleX,
    };
  }

  function commit() {
    const wm = workingMaskRef.current;
    const { width, height } = dimsRef.current;
    if (!wm || !width || !height) return;
    applyMaskEdit({ width, height, data: wm });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = toMaskCoords(e);
    if (coords) paintAt(coords.mx, coords.my, coords.radius);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready || e.buttons !== 1) return;
    const coords = toMaskCoords(e);
    if (coords) paintAt(coords.mx, coords.my, coords.radius);
  }

  function handlePointerUp() {
    if (ready) commit();
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetMaskToAutomatic();
    } finally {
      setResetting(false);
    }
  }

  const coveragePct = mask
    ? Math.round(
        (mask.data.reduce((sum, v) => sum + (v >= 0.5 ? 1 : 0), 0) / mask.data.length) * 100,
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] border-line bg-panel text-txt">
        <DialogHeader>
          <DialogTitle>Edit Silhouette</DialogTitle>
          <DialogDescription className="text-txt-muted">
            Paint to manually add or remove parts of the subject mask. Tinted areas are excluded
            from the mesh and texture.
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative mx-auto w-full overflow-hidden rounded-[5px] border border-line bg-surface"
          style={{ maxWidth: CANVAS_MAX_WIDTH }}
        >
          <canvas
            ref={canvasRef}
            className="block w-full cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface text-[11px] text-txt-dim">
              Loading mask…
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-[16px]">
          <SegmentedControl
            options={["Erase", "Restore"] as const}
            value={brushMode}
            onChange={setBrushMode}
          />
          <div className="min-w-[160px] flex-1">
            <SliderControl
              label="Brush Size"
              value={brushSize}
              onChange={setBrushSize}
              min={4}
              max={80}
            />
          </div>
          <span className="text-[11px] text-txt-dim">
            {coveragePct !== null ? `${coveragePct}% of image kept` : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={resetting || !sourceImageUrl}
          className="h-[30px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong disabled:opacity-50"
        >
          {resetting ? "Re-running automatic removal…" : "Reset to Automatic"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
