import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { TEXTURE_LOGS, TEXTURE_SEQUENCE, TEXTURE_STAGES } from "@/data/textureMock";

export type TextureTool =
  | "Select"
  | "Paint"
  | "Erase"
  | "Clone"
  | "Smudge"
  | "Mask"
  | "Eyedropper";

export type TextureStatus = "idle" | "running" | "completed";

export type SourceImage = { src: string; label: string; meta: string };

type Store = {
  status: TextureStatus;
  statusLabel: string;
  sourceImage: SourceImage;
  setSourceImage: (v: SourceImage) => void;
  sourceError: string | null;
  setSourceError: (v: string | null) => void;
  generationMode: "Photo Project" | "AI Enhance" | "Manual";
  setGenerationMode: (v: "Photo Project" | "AI Enhance" | "Manual") => void;
  skinPreset: string;
  setSkinPreset: (v: string) => void;
  textureDetail: number;
  setTextureDetail: (v: number) => void;
  blendStrength: number;
  setBlendStrength: (v: number) => void;
  preserveIdentity: boolean;
  setPreserveIdentity: (v: boolean) => void;
  hairDetail: boolean;
  setHairDetail: (v: boolean) => void;
  maps: { baseColor: boolean; normal: boolean; roughness: boolean; ao: boolean };
  toggleMap: (k: "baseColor" | "normal" | "roughness" | "ao") => void;
  resolution: "1K" | "2K" | "4K";
  setResolution: (v: "1K" | "2K" | "4K") => void;
  activeTool: TextureTool;
  setActiveTool: (v: TextureTool) => void;
  brushSize: number;
  setBrushSize: (v: number) => void;
  opacity: number;
  setOpacity: (v: number) => void;
  flow: number;
  setFlow: (v: number) => void;
  blendMode: string;
  setBlendMode: (v: string) => void;
  pressure: boolean;
  setPressure: (v: boolean) => void;
  exposure: number;
  setExposure: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  warmth: number;
  setWarmth: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  resetColor: () => void;
  shader: string;
  setShader: (v: string) => void;
  coverage: number;
  progress: number;
  stagesDone: number;
  logs: string[];
  elapsed: string;
  generateTexture: () => void;
  setStatusLabel: (v: string) => void;
};

const TextureContext = createContext<Store | null>(null);

export function TextureProvider({
  children,
  defaultSource,
}: {
  children: ReactNode;
  defaultSource: SourceImage;
}) {
  const [status, setStatus] = useState<TextureStatus>("completed");
  const [statusLabel, setStatusLabel] = useState("Ready");
  const [sourceImage, setSourceImage] = useState<SourceImage>(defaultSource);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<
    "Photo Project" | "AI Enhance" | "Manual"
  >("Photo Project");
  const [skinPreset, setSkinPreset] = useState("Natural Skin");
  const [textureDetail, setTextureDetail] = useState(85);
  const [blendStrength, setBlendStrength] = useState(72);
  const [preserveIdentity, setPreserveIdentity] = useState(true);
  const [hairDetail, setHairDetail] = useState(true);
  const [maps, setMaps] = useState({
    baseColor: true,
    normal: true,
    roughness: true,
    ao: true,
  });
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("2K");
  const [activeTool, setActiveTool] = useState<TextureTool>("Paint");
  const [brushSize, setBrushSize] = useState(36);
  const [opacity, setOpacity] = useState(70);
  const [flow, setFlow] = useState(55);
  const [blendMode, setBlendMode] = useState("Normal");
  const [pressure, setPressure] = useState(true);
  const [exposure, setExposure] = useState(0);
  const [saturation, setSaturation] = useState(6);
  const [warmth, setWarmth] = useState(3);
  const [contrast, setContrast] = useState(4);
  const [shader, setShader] = useState("PBR Skin");
  const [coverage, setCoverage] = useState(99.6);
  const [progress, setProgress] = useState(100);
  const [stagesDone, setStagesDone] = useState<number>(TEXTURE_STAGES.length);
  const [logs, setLogs] = useState<string[]>(TEXTURE_LOGS);
  const [elapsed, setElapsed] = useState("00:49");

  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const toggleMap = useCallback((k: "baseColor" | "normal" | "roughness" | "ao") => {
    setMaps((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const resetColor = useCallback(() => {
    setExposure(0);
    setSaturation(0);
    setWarmth(0);
    setContrast(0);
  }, []);

  const generateTexture = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStatus("running");
    setStatusLabel("Generating texture...");
    setProgress(0);
    setStagesDone(0);
    setLogs([]);
    setCoverage(0);
    setElapsed("00:00");

    TEXTURE_SEQUENCE.forEach((step, i) => {
      const t = window.setTimeout(
        () => {
          setProgress(step.progress);
          setStagesDone(step.stage);
          setStatusLabel(step.status);
          setLogs((prev) => [...prev, ...step.logs]);
          setElapsed(`00:${String(9 + i * 10).padStart(2, "0")}`);
          if (i === TEXTURE_SEQUENCE.length - 1) {
            setStatus("completed");
            setStatusLabel("Ready");
            setCoverage(99.6);
            setElapsed("00:49");
          }
        },
        (i + 1) * 850,
      );
      timers.current.push(t);
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      status,
      statusLabel,
      setStatusLabel,
      sourceImage,
      setSourceImage,
      sourceError,
      setSourceError,
      generationMode,
      setGenerationMode,
      skinPreset,
      setSkinPreset,
      textureDetail,
      setTextureDetail,
      blendStrength,
      setBlendStrength,
      preserveIdentity,
      setPreserveIdentity,
      hairDetail,
      setHairDetail,
      maps,
      toggleMap,
      resolution,
      setResolution,
      activeTool,
      setActiveTool,
      brushSize,
      setBrushSize,
      opacity,
      setOpacity,
      flow,
      setFlow,
      blendMode,
      setBlendMode,
      pressure,
      setPressure,
      exposure,
      setExposure,
      saturation,
      setSaturation,
      warmth,
      setWarmth,
      contrast,
      setContrast,
      resetColor,
      shader,
      setShader,
      coverage,
      progress,
      stagesDone,
      logs,
      elapsed,
      generateTexture,
    }),
    [
      status,
      statusLabel,
      sourceImage,
      sourceError,
      generationMode,
      skinPreset,
      textureDetail,
      blendStrength,
      preserveIdentity,
      hairDetail,
      maps,
      toggleMap,
      resolution,
      activeTool,
      brushSize,
      opacity,
      flow,
      blendMode,
      pressure,
      exposure,
      saturation,
      warmth,
      contrast,
      resetColor,
      shader,
      coverage,
      progress,
      stagesDone,
      logs,
      elapsed,
      generateTexture,
    ],
  );

  return <TextureContext.Provider value={value}>{children}</TextureContext.Provider>;
}

export function useTexture() {
  const ctx = useContext(TextureContext);
  if (!ctx) throw new Error("useTexture must be used inside TextureProvider");
  return ctx;
}