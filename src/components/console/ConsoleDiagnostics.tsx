import { useEffect, useState } from "react";

import { QUALITY_SEGMENTS, useReconstruct } from "@/stores/reconstructStore";

function useWebGpuAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && "gpu" in navigator);
  }, []);
  return available;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-[3px]">
      <dt className="text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[6px] border border-line bg-panel px-[14px] py-[12px]">
      <h3 className="text-[12px] font-semibold text-txt">{title}</h3>
      <dl className="mt-[8px] space-y-[2px]">{children}</dl>
    </section>
  );
}

export function ConsoleDiagnostics() {
  const s = useReconstruct();
  const webgpu = useWebGpuAvailable();

  return (
    <div className="scroll-thin flex min-w-0 flex-1 flex-col gap-[10px] overflow-y-auto rounded-[6px] border border-line bg-panel p-[12px]">
      <Card title="Model">
        <Row label="Status" value={s.status} />
        <Row label="Vertices" value={s.vertexCount.toLocaleString()} />
        <Row label="Faces" value={s.faceCount.toLocaleString()} />
        <Row
          label="Source Resolution"
          value={s.imageWidth ? `${s.imageWidth} × ${s.imageHeight}` : "—"}
        />
        <Row
          label="Mesh Grid"
          value={`${QUALITY_SEGMENTS[s.quality]} × ${QUALITY_SEGMENTS[s.quality]}`}
        />
      </Card>

      <Card title="Reconstruction Settings">
        <Row label="Quality" value={s.quality} />
        <Row label="Depth Intensity" value={`${s.detail}%`} />
        <Row label="Smoothing" value={`${s.smoothing}%`} />
        <Row label="Edge Feather" value={`${s.edgeFeather}%`} />
        <Row label="Volume" value={`${s.volume}%`} />
      </Card>

      <Card title="Color Grading">
        <Row label="Exposure" value={`${s.colorGrading.exposure}%`} />
        <Row label="Saturation" value={`${s.colorGrading.saturation}%`} />
        <Row label="Warmth" value={`${s.colorGrading.warmth}%`} />
        <Row label="Contrast" value={`${s.colorGrading.contrast}%`} />
      </Card>

      <Card title="System">
        <Row label="WebGPU" value={webgpu ? "Available" : "Unavailable (CPU/WASM)"} />
        <Row label="Platform" value={navigator.platform || "—"} />
        <Row label="Language" value={navigator.language} />
      </Card>
    </div>
  );
}
