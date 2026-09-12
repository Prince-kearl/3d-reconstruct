import type { Quality } from "@/stores/reconstructStore";

export interface ReconstructionDefaults {
  quality: Quality;
  detail: number;
  smoothing: number;
  edgeFeather: number;
  volume: number;
}

export const FACTORY_DEFAULTS: ReconstructionDefaults = {
  quality: "Balanced",
  detail: 70,
  smoothing: 35,
  edgeFeather: 25,
  volume: 45,
};

const STORAGE_KEY = "dxf2obj:reconstruction-defaults";
const QUALITIES: Quality[] = ["Fast", "Balanced", "High"];

function isValid(value: unknown): value is ReconstructionDefaults {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["quality"] === "string" &&
    QUALITIES.includes(v["quality"] as Quality) &&
    typeof v["detail"] === "number" &&
    typeof v["smoothing"] === "number" &&
    typeof v["edgeFeather"] === "number" &&
    typeof v["volume"] === "number"
  );
}

/** Real per-browser preference — where new reconstructions start from. */
export function getReconstructionDefaults(): ReconstructionDefaults {
  if (typeof window === "undefined") return FACTORY_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return FACTORY_DEFAULTS;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : FACTORY_DEFAULTS;
  } catch {
    return FACTORY_DEFAULTS;
  }
}

export function setReconstructionDefaults(defaults: ReconstructionDefaults): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}
