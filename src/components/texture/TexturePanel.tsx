import { Sparkles } from "lucide-react";
import { useRef } from "react";

import {
  FieldLabel,
  PanelSectionTitle,
  SegmentedControl,
  Select,
  SliderControl,
  ToggleSwitch,
} from "@/components/studio/primitives";
import { SKIN_PRESETS } from "@/data/textureMock";
import { cn } from "@/lib/utils";
import { useTexture } from "@/stores/textureStore";

const MAP_ROWS = [
  { key: "baseColor", label: "Base Color" },
  { key: "normal", label: "Normal Map" },
  { key: "roughness", label: "Roughness" },
  { key: "ao", label: "Ambient Occlusion" },
] as const;

export function TexturePanel() {
  const s = useTexture();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      s.setSourceError("Unsupported file. Use PNG, JPG or WEBP.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      s.setSourceError(null);
      s.setSourceImage({
        src: url,
        label: file.name,
        meta: `${img.naturalWidth} × ${img.naturalHeight} • sRGB`,
      });
    };
    img.src = url;
  };

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[6px] border border-line bg-panel">
      <div className="border-b border-line px-[16px] py-[14px]">
        <h1 className="text-[12.5px] font-semibold tracking-[0.06em] text-txt">
          TEXTURE WORKSPACE
        </h1>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto">
        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>1. TEXTURE SOURCE</PanelSectionTitle>
          <div className="mt-[12px] flex gap-[14px]">
            <img
              src={s.sourceImage.src}
              alt="Source portrait used for texture projection"
              title={s.sourceImage.label}
              className="h-[112px] w-[112px] shrink-0 rounded-[5px] border border-line object-cover"
            />
            <div className="min-w-0 flex-1 space-y-[9px] pt-[2px]">
              <span className="block text-[11.5px] text-txt-muted">Source Image</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-[30px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
              >
                Replace Image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPick}
                className="sr-only"
                aria-label="Replace source image"
              />
              <span className="block text-[10.5px] text-txt-dim">{s.sourceImage.meta}</span>
              {s.sourceError ? (
                <span className="block text-[10.5px] text-danger">{s.sourceError}</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-b border-line px-[16px] py-[13px]">
          <PanelSectionTitle>2. GENERATION MODE</PanelSectionTitle>
          <div className="mt-[12px] space-y-[11px]">
            <SegmentedControl
              options={["Photo Project", "AI Enhance", "Manual"] as const}
              value={s.generationMode}
              onChange={s.setGenerationMode}
            />
            <div className="flex items-center gap-[10px]">
              <FieldLabel className="w-[84px] shrink-0">Skin Preset</FieldLabel>
              <Select
                label="Skin Preset"
                value={s.skinPreset}
                onChange={s.setSkinPreset}
                options={SKIN_PRESETS}
                className="flex-1"
              />
            </div>
            <SliderControl
              inline
              label="Texture Detail"
              value={s.textureDetail}
              onChange={s.setTextureDetail}
              labelWidth={84}
            />
            <SliderControl
              inline
              label="Blend Strength"
              value={s.blendStrength}
              onChange={s.setBlendStrength}
              labelWidth={84}
            />
            <div className="flex items-center justify-between">
              <FieldLabel>Preserve Identity</FieldLabel>
              <ToggleSwitch
                label="Preserve Identity"
                checked={s.preserveIdentity}
                onChange={s.setPreserveIdentity}
              />
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Hair Detail</FieldLabel>
              <ToggleSwitch label="Hair Detail" checked={s.hairDetail} onChange={s.setHairDetail} />
            </div>
          </div>
        </section>

        <section className="px-[16px] py-[13px]">
          <PanelSectionTitle>3. MAP GENERATION</PanelSectionTitle>
          <div className="mt-[13px] space-y-[11px]">
            {MAP_ROWS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <FieldLabel>{label}</FieldLabel>
                <ToggleSwitch
                  label={label}
                  checked={s.maps[key]}
                  onChange={() => s.toggleMap(key)}
                />
              </div>
            ))}
            <div className="flex items-center gap-[10px]">
              <FieldLabel className="w-[84px] shrink-0">Resolution</FieldLabel>
              <SegmentedControl
                options={["1K", "2K", "4K"] as const}
                value={s.resolution}
                onChange={s.setResolution}
                className="flex-1"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={s.generateTexture}
            disabled={s.status === "running"}
            className="mt-[15px] flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95 disabled:opacity-60"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Sparkles className={cn("size-[14px]", s.status === "running" && "animate-pulse")} />
            {s.status === "running" ? "Generating..." : "Generate Texture"}
          </button>
          <p className="mt-[9px] text-center text-[10.5px] text-txt-dim">
            Estimated time: 60–90 sec
          </p>
        </section>
      </div>
    </aside>
  );
}