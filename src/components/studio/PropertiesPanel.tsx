import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MODEL_INFO } from "@/data/mock";
import { cn } from "@/lib/utils";
import {
  CollapsibleSection,
  FieldLabel,
  LockToggle,
  NumberField,
  Select,
  SliderControl,
  ToggleSwitch,
} from "./primitives";

export function PropertiesPanel() {
  const [tab, setTab] = useState<"Properties" | "History">("Properties");
  const [hole, setHole] = useState(80);
  const [smoothing, setSmoothing] = useState(40);
  const [detail, setDetail] = useState(70);
  const [noise, setNoise] = useState(true);
  const [watertight, setWatertight] = useState(true);
  const [format, setFormat] = useState("OBJ");
  const [poly, setPoly] = useState("High (2.5M)");
  const [scale, setScale] = useState("20.0");

  return (
    <aside className="flex w-[352px] shrink-0 flex-col border-l border-line bg-panel">
      <div role="tablist" className="flex h-[44px] shrink-0 items-center border-b border-line px-[8px]">
        {(["Properties", "History"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative h-full px-[14px] text-[12px] transition-colors",
              tab === t ? "text-accent-2" : "text-txt-muted hover:text-txt",
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
            <li>10:26:18 — Final mesh ready</li>
            <li>10:26:05 — Hole filling completed</li>
            <li>10:25:28 — Geometry refinement</li>
            <li>10:25:12 — Initial mesh generated</li>
          </ul>
        </div>
      ) : (
        <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
          <CollapsibleSection title="Model Info">
            <dl className="space-y-[9px]">
              {MODEL_INFO.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="pl-[6px] text-[11.5px] text-txt-muted">{label}</dt>
                  <dd className="text-[11.5px] text-txt">{value}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleSection>

          <CollapsibleSection title="Transform">
            <div className="space-y-[9px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[62px] shrink-0 pl-[6px] text-[11.5px]">Scale</FieldLabel>
                <div className="grid flex-1 grid-cols-3 gap-[7px]">
                  <NumberField label="Scale X" value="1.00" onChange={() => {}} />
                  <NumberField label="Scale Y" value="1.00" onChange={() => {}} />
                  <NumberField label="Scale Z" value="1.00" onChange={() => {}} />
                </div>
                <LockToggle />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[62px] shrink-0 pl-[6px] text-[11.5px]">
                  Position
                </FieldLabel>
                <div className="grid flex-1 grid-cols-3 gap-[7px] pr-[26px]">
                  <NumberField label="Position X" prefix="X" value="0.00" onChange={() => {}} />
                  <NumberField label="Position Y" prefix="Y" value="0.00" onChange={() => {}} />
                  <NumberField label="Position Z" prefix="Z" value="0.00" onChange={() => {}} />
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[62px] shrink-0 pl-[6px] text-[11.5px]">
                  Rotation
                </FieldLabel>
                <div className="grid flex-1 grid-cols-3 gap-[7px] pr-[26px]">
                  <NumberField label="Rotation X" prefix="X" value="0°" onChange={() => {}} />
                  <NumberField label="Rotation Y" prefix="Y" value="0°" onChange={() => {}} />
                  <NumberField label="Rotation Z" prefix="Z" value="0°" onChange={() => {}} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast("Transform reset")}
                className="mt-[4px] h-[30px] w-full rounded-[4px] border border-line bg-surface-2 text-[11.5px] text-txt transition-colors hover:border-line-strong"
              >
                Reset Transform
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Reconstruction">
            <div className="space-y-[11px]">
              <SliderControl inline label="Hole Filling" value={hole} onChange={setHole} />
              <SliderControl inline label="Smoothing" value={smoothing} onChange={setSmoothing} />
              <SliderControl inline label="Detail Level" value={detail} onChange={setDetail} />
              <div className="flex items-center justify-between">
                <FieldLabel className="text-[11.5px]">Remove Noise</FieldLabel>
                <ToggleSwitch label="Remove Noise" checked={noise} onChange={setNoise} />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Output Settings">
            <div className="space-y-[10px]">
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">Format</FieldLabel>
                <Select
                  label="Format"
                  value={format}
                  onChange={setFormat}
                  options={["OBJ", "FBX", "GLB", "STL"]}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Scale (cm)
                </FieldLabel>
                <div className="flex-1">
                  <div className="flex h-[30px] items-center rounded-[4px] border border-line bg-surface px-[10px]">
                    <input
                      aria-label="Scale in centimetres"
                      value={scale}
                      onChange={(e) => setScale(e.target.value)}
                      className="w-full bg-transparent text-[11.5px] text-txt outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <FieldLabel className="w-[110px] shrink-0 pl-[6px] text-[11.5px]">
                  Target Polycount
                </FieldLabel>
                <Select
                  label="Target Polycount"
                  value={poly}
                  onChange={setPoly}
                  options={["Low (250K)", "Medium (1M)", "High (2.5M)"]}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <FieldLabel className="pl-[6px] text-[11.5px]">Watertight</FieldLabel>
                <ToggleSwitch label="Watertight" checked={watertight} onChange={setWatertight} />
              </div>
            </div>
          </CollapsibleSection>

          <div className="px-[14px] py-[13px]">
            <button
              type="button"
              onClick={() => toast.success("Export started — portrait_mesh.obj")}
              className="flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[13px] font-semibold text-app transition-opacity hover:opacity-95"
              style={{ background: "var(--gradient-lime)" }}
            >
              <Upload className="size-[15px]" />
              Export Model
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}