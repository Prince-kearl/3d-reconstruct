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

import { REFINE_LOGS, REFINE_SEQUENCE, REFINE_STAGES } from "@/data/refineMock";

export type RefinementTool =
  | "Smooth"
  | "Relax"
  | "Inflate"
  | "Flatten"
  | "Pinch"
  | "Grab"
  | "Fill Holes"
  | "Remove Artifacts";

export type RefinementStatus = "idle" | "running" | "completed";

type Store = {
  status: RefinementStatus;
  statusLabel: string;
  activeTool: RefinementTool;
  setActiveTool: (t: RefinementTool) => void;
  brushSize: number;
  setBrushSize: (v: number) => void;
  strength: number;
  setStrength: (v: number) => void;
  falloff: string;
  setFalloff: (v: string) => void;
  symmetryX: boolean;
  setSymmetryX: (v: boolean) => void;
  surfaceOnly: boolean;
  setSurfaceOnly: (v: boolean) => void;
  removeSpikes: boolean;
  setRemoveSpikes: (v: boolean) => void;
  fixNonManifold: boolean;
  setFixNonManifold: (v: boolean) => void;
  closeSmallHoles: boolean;
  setCloseSmallHoles: (v: boolean) => void;
  quality: "Fast" | "Balanced" | "Precise";
  setQuality: (v: "Fast" | "Balanced" | "Precise") => void;
  preserveDetails: boolean;
  setPreserveDetails: (v: boolean) => void;
  targetDensity: string;
  setTargetDensity: (v: string) => void;
  adaptiveRemesh: boolean;
  setAdaptiveRemesh: (v: boolean) => void;
  voxelSize: string;
  setVoxelSize: (v: string) => void;
  preserveBoundaries: boolean;
  setPreserveBoundaries: (v: boolean) => void;
  comparison: number;
  setComparison: (v: number) => void;
  meshHealth: number;
  progress: number;
  stagesDone: number;
  logs: string[];
  elapsed: string;
  runAutoRefine: () => void;
  stageCount: number;
};

const RefinementContext = createContext<Store | null>(null);

export function RefinementProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RefinementStatus>("completed");
  const [statusLabel, setStatusLabel] = useState("Ready");
  const [activeTool, setActiveTool] = useState<RefinementTool>("Smooth");
  const [brushSize, setBrushSize] = useState(42);
  const [strength, setStrength] = useState(65);
  const [falloff, setFalloff] = useState("Smooth");
  const [symmetryX, setSymmetryX] = useState(true);
  const [surfaceOnly, setSurfaceOnly] = useState(true);
  const [removeSpikes, setRemoveSpikes] = useState(true);
  const [fixNonManifold, setFixNonManifold] = useState(true);
  const [closeSmallHoles, setCloseSmallHoles] = useState(true);
  const [quality, setQuality] = useState<"Fast" | "Balanced" | "Precise">("Balanced");
  const [preserveDetails, setPreserveDetails] = useState(true);
  const [targetDensity, setTargetDensity] = useState("High");
  const [adaptiveRemesh, setAdaptiveRemesh] = useState(true);
  const [voxelSize, setVoxelSize] = useState("0.25 mm");
  const [preserveBoundaries, setPreserveBoundaries] = useState(true);
  const [comparison, setComparison] = useState(70);
  const [meshHealth, setMeshHealth] = useState(98);
  const [progress, setProgress] = useState(100);
  const [stagesDone, setStagesDone] = useState(REFINE_STAGES.length);
  const [logs, setLogs] = useState<string[]>(REFINE_LOGS);
  const [elapsed, setElapsed] = useState("02:17");

  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const runAutoRefine = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStatus("running");
    setStatusLabel("Refining...");
    setProgress(0);
    setStagesDone(0);
    setLogs([]);
    setMeshHealth(72);
    setElapsed("00:00");

    REFINE_SEQUENCE.forEach((step, i) => {
      const t = window.setTimeout(
        () => {
          setProgress(step.progress);
          setStagesDone(step.stage);
          setStatusLabel(step.status);
          setLogs((prev) => [...prev, ...step.logs]);
          setElapsed(`0${i}:${String(20 + i * 8).padStart(2, "0")}`);
          if (i === REFINE_SEQUENCE.length - 1) {
            setStatus("completed");
            setStatusLabel("Ready");
            setMeshHealth(98);
            setElapsed("02:17");
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
      activeTool,
      setActiveTool,
      brushSize,
      setBrushSize,
      strength,
      setStrength,
      falloff,
      setFalloff,
      symmetryX,
      setSymmetryX,
      surfaceOnly,
      setSurfaceOnly,
      removeSpikes,
      setRemoveSpikes,
      fixNonManifold,
      setFixNonManifold,
      closeSmallHoles,
      setCloseSmallHoles,
      quality,
      setQuality,
      preserveDetails,
      setPreserveDetails,
      targetDensity,
      setTargetDensity,
      adaptiveRemesh,
      setAdaptiveRemesh,
      voxelSize,
      setVoxelSize,
      preserveBoundaries,
      setPreserveBoundaries,
      comparison,
      setComparison,
      meshHealth,
      progress,
      stagesDone,
      logs,
      elapsed,
      runAutoRefine,
      stageCount: REFINE_STAGES.length,
    }),
    [
      status,
      statusLabel,
      activeTool,
      brushSize,
      strength,
      falloff,
      symmetryX,
      surfaceOnly,
      removeSpikes,
      fixNonManifold,
      closeSmallHoles,
      quality,
      preserveDetails,
      targetDensity,
      adaptiveRemesh,
      voxelSize,
      preserveBoundaries,
      comparison,
      meshHealth,
      progress,
      stagesDone,
      logs,
      elapsed,
      runAutoRefine,
    ],
  );

  return <RefinementContext.Provider value={value}>{children}</RefinementContext.Provider>;
}

export function useRefinement() {
  const ctx = useContext(RefinementContext);
  if (!ctx) throw new Error("useRefinement must be used inside RefinementProvider");
  return ctx;
}