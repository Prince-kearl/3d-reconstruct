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

import { EXPORT_LOGS, EXPORT_SEQUENCE, EXPORT_STAGES } from "@/data/exportMock";

type Store = {
  format: string;
  setFormat: (v: string) => void;
  quality: number;
  setQuality: (v: number) => void;
  decimation: number;
  setDecimation: (v: number) => void;
  smoothing: number;
  setSmoothing: (v: number) => void;
  hollow: boolean;
  setHollow: (v: boolean) => void;
  includeBase: boolean;
  setIncludeBase: (v: boolean) => void;
  embedTexture: boolean;
  setEmbedTexture: (v: boolean) => void;
  binary: boolean;
  setBinary: (v: boolean) => void;
  width: string;
  setWidth: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  depth: string;
  setDepth: (v: string) => void;
  units: string;
  setUnits: (v: string) => void;
  fileName: string;
  setFileName: (v: string) => void;
  logs: string[];
  progress: number;
  stagesDone: number;
  elapsed: string;
  statusLabel: string;
  setStatusLabel: (v: string) => void;
  running: boolean;
  runExport: () => void;
};

const Ctx = createContext<Store | null>(null);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [format, setFormat] = useState("OBJ");
  const [quality, setQuality] = useState(88);
  const [decimation, setDecimation] = useState(35);
  const [smoothing, setSmoothing] = useState(60);
  const [hollow, setHollow] = useState(false);
  const [includeBase, setIncludeBase] = useState(true);
  const [embedTexture, setEmbedTexture] = useState(true);
  const [binary, setBinary] = useState(false);
  const [width, setWidth] = useState("14.8");
  const [height, setHeight] = useState("20.0");
  const [depth, setDepth] = useState("11.6");
  const [units, setUnits] = useState("Centimetres");
  const [fileName, setFileName] = useState("portrait-project.obj");
  const [logs, setLogs] = useState<string[]>(EXPORT_LOGS);
  const [progress, setProgress] = useState(100);
  const [stagesDone, setStagesDone] = useState<number>(EXPORT_STAGES.length);
  const [elapsed, setElapsed] = useState("00:31");
  const [statusLabel, setStatusLabel] = useState("Ready");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const runExport = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setStagesDone(0);
    setElapsed("00:00");
    setStatusLabel("Exporting...");

    EXPORT_SEQUENCE.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setLogs((prev) => [...prev, ...step.logs]);
            setProgress(step.progress);
            setStagesDone(step.stage);
            setStatusLabel(step.status);
            setElapsed(`00:${String((i + 1) * 6).padStart(2, "0")}`);
            if (i === EXPORT_SEQUENCE.length - 1) {
              setRunning(false);
              setStatusLabel("Export complete");
            }
          },
          (i + 1) * 700,
        ),
      );
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      format,
      setFormat,
      quality,
      setQuality,
      decimation,
      setDecimation,
      smoothing,
      setSmoothing,
      hollow,
      setHollow,
      includeBase,
      setIncludeBase,
      embedTexture,
      setEmbedTexture,
      binary,
      setBinary,
      width,
      setWidth,
      height,
      setHeight,
      depth,
      setDepth,
      units,
      setUnits,
      fileName,
      setFileName,
      logs,
      progress,
      stagesDone,
      elapsed,
      statusLabel,
      setStatusLabel,
      running,
      runExport,
    }),
    [
      format,
      quality,
      decimation,
      smoothing,
      hollow,
      includeBase,
      embedTexture,
      binary,
      width,
      height,
      depth,
      units,
      fileName,
      logs,
      progress,
      stagesDone,
      elapsed,
      statusLabel,
      running,
      runExport,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExport() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExport must be used inside ExportProvider");
  return ctx;
}