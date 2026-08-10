import { Brush, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import texFront from "@/assets/tex-front.png";
import {
  CollapsibleSection,
  FieldLabel,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { BLEND_MODES, SHADERS, TEXTURE_HISTORY } from "@/data/textureMock";
import { cn } from "@/lib/utils";
import { useTexture } from "@/stores/textureStore";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);

export function TextureProperties() {
  const s = useTexture();
  const [tab, setTab] = useState<"Properties" | "History">("Properties");
  const [applying, setApplying] = useState(false);

  const apply = () => {
    setApplying(true);
    s.setStatusLabel("Applying texture...");
    window.setTimeout(() => {
      setApplying(false);
      s.setStatusLabel("Ready");
      toast.success("Texture applied", {
        description: "The textured model is ready for export.",
      });
    }, 900);
  };

  const MAP_ITEMS = [
    { key: "baseColor", name: "Base Color", img: texFront, style: undefined as string | undefined },
    { key: "normal", name: "Normal", img: null, style: "linear-gradient(135deg,#8b8bff,#5a6dd8)" },
    {
      key: "roughness",
      name: "Roughness",
      img: null,
      style: "linear-gradient(135deg,#9a9a9a,#3f3f3f)",
    },
    { key: "ao", name: "AO", img: null, style: "linear-gradient(135deg,#6a6a6a,#141414)" },
  ] as const;

  return (
    <aside className="flex w-[352px] shrink-0 flex-col border-l border-line bg-panel">
      <div
        role="tablist"
        className="flex h-[44px] shrink-0 items-center border-b border-line px-[8px]"
      >
        {(["Properties", "History"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative h-full px-[14px] text-[12px] transition-colors",
              tab === t ? "bg-accent/10 text-accent-2" : "text-txt-muted hover:text-txt",
            )}
          >
            {t}
            {tab === t ? (
              <span className="absolute inset-x-[8px] top-0 h-[2px] rounded-b bg-accent-2" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "History" ? (
        <div className="scroll-thin flex-1 overflow-y-auto px-[16px] py-[14px]">
          <ul className="space-y-[9px] text-[11px] text-txt-muted">
            {TEXTURE_HISTORY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Material Info">
            <dl className="space-y-[9px]">
              <Row label="Material" value="Human Skin" />
              <Row label="Resolution" value="2048 × 2048" />
              <Row label="Color Space" value="sRGB" />
              <Row label="Texture Sets" value="4" />
              <Row label="Coverage" value={`${s.coverage.toFixed(1)}%`} />
            </dl>
            <div className="mt-[10px] h-[4px] w-full overflow-hidden rounded-full bg-line-strong">
              <div
                className="h-full rounded-full bg-ok transition-[width]"
                style={{ width: `${s.coverage}%` }}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Active Tool">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[9px] pl-[6px]">
                <Brush className="size-[15px] text-accent-2" strokeWidth={1.7} />
                <span className="text-[11.5px] text-txt">Texture Paint</span>
              </div>
              <dl className="space-y-[9px]">
                <Row label="Size" value={`${s.brushSize} px`} />
                <Row label="Opacity" value={`${s.opacity}%`} />
                <Row label="Flow" value={`${s.flow}%`} />
              </dl>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Blend Mode
                </FieldLabel>
                <Select
                  label="Blend Mode"
                  value={s.blendMode}
                  onChange={s.setBlendMode}
                  options={BLEND_MODES}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Pressure</FieldLabel>
                <ToggleSwitch label="Pressure" checked={s.pressure} onChange={s.setPressure} />
              </div>
              <SliderControl
                inline
                label="Brush Size"
                min={4}
                max={120}
                value={s.brushSize}
                onChange={s.setBrushSize}
                format={(v) => `${v} px`}
                labelWidth={92}
              />
              <SliderControl
                inline
                label="Opacity"
                value={s.opacity}
                onChange={s.setOpacity}
                labelWidth={92}
              />
              <SliderControl
                inline
                label="Flow"
                value={s.flow}
                onChange={s.setFlow}
                labelWidth={92}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Color Correction">
            <div className="space-y-[11px]">
              <SliderControl
                inline
                label="Exposure"
                min={-100}
                max={100}
                value={s.exposure}
                onChange={s.setExposure}
                format={(v) => (v / 100).toFixed(2)}
                labelWidth={82}
              />
              <SliderControl
                inline
                label="Saturation"
                min={-50}
                max={50}
                value={s.saturation}
                onChange={s.setSaturation}
                format={signed}
                labelWidth={82}
              />
              <SliderControl
                inline
                label="Warmth"
                min={-50}
                max={50}
                value={s.warmth}
                onChange={s.setWarmth}
                format={signed}
                labelWidth={82}
              />
              <SliderControl
                inline
                label="Contrast"
                min={-50}
                max={50}
                value={s.contrast}
                onChange={s.setContrast}
                format={signed}
                labelWidth={82}
              />
              <button
                type="button"
                onClick={() => {
                  s.resetColor();
                  toast("Color correction reset");
                }}
                className="h-[32px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
              >
                Reset Color
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Material Maps">
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-[11px]">
              {MAP_ITEMS.map((m) => (
                <div key={m.key} className="flex items-center gap-[8px]">
                  <div
                    className="size-[32px] shrink-0 overflow-hidden rounded-[4px] border border-line"
                    style={m.style ? { background: m.style } : undefined}
                  >
                    {m.img ? (
                      <img src={m.img} alt="" loading="lazy" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-txt-muted">
                    {m.name}
                  </span>
                  <ToggleSwitch
                    label={m.name}
                    checked={s.maps[m.key]}
                    onChange={() => s.toggleMap(m.key)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-[12px] flex items-center gap-[8px]">
              <FieldLabel className="w-[70px] shrink-0 pl-[6px] text-[11.5px]">Shader</FieldLabel>
              <Select
                label="Shader"
                value={s.shader}
                onChange={s.setShader}
                options={SHADERS}
                className="flex-1"
              />
            </div>
          </CollapsibleSection>

          <div className="px-[14px] py-[13px]">
            <button
              type="button"
              onClick={apply}
              disabled={applying || s.status === "running"}
              className="flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[13px] font-semibold text-app transition-opacity hover:opacity-95 disabled:opacity-70"
              style={{ background: "var(--gradient-lime)" }}
            >
              <Sparkles className="size-[15px]" />
              {applying ? "Applying texture..." : "Apply Texture"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}