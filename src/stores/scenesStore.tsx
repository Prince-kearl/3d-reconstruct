import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { SCENE_LOGS } from "@/data/scenesMock";

export type GizmoMode = "Move" | "Rotate" | "Scale";

type Store = {
  selectedId: string;
  setSelectedId: (v: string) => void;
  hidden: string[];
  toggleHidden: (id: string) => void;
  gizmo: GizmoMode;
  setGizmo: (v: GizmoMode) => void;
  activeScene: string;
  setActiveScene: (v: string) => void;
  camera: string;
  setCamera: (v: string) => void;
  lightPreset: string;
  setLightPreset: (v: string) => void;
  intensity: number;
  setIntensity: (v: number) => void;
  ambient: number;
  setAmbient: (v: number) => void;
  shadows: boolean;
  setShadows: (v: boolean) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  posX: string;
  setPosX: (v: string) => void;
  posY: string;
  setPosY: (v: string) => void;
  posZ: string;
  setPosZ: (v: string) => void;
  rotY: number;
  setRotY: (v: number) => void;
  scale: number;
  setScale: (v: number) => void;
  logs: string[];
  statusLabel: string;
  setStatusLabel: (v: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function ScenesProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState("bust");
  const [hidden, setHidden] = useState<string[]>([]);
  const [gizmo, setGizmo] = useState<GizmoMode>("Move");
  const [activeScene, setActiveScene] = useState("Studio Neutral");
  const [camera, setCamera] = useState("Camera 01");
  const [lightPreset, setLightPreset] = useState("Studio");
  const [intensity, setIntensity] = useState(72);
  const [ambient, setAmbient] = useState(38);
  const [shadows, setShadows] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [posX, setPosX] = useState("0.00");
  const [posY, setPosY] = useState("8.40");
  const [posZ, setPosZ] = useState("0.00");
  const [rotY, setRotY] = useState(12);
  const [scale, setScale] = useState(100);
  const [statusLabel, setStatusLabel] = useState("Ready");

  const value = useMemo<Store>(
    () => ({
      selectedId,
      setSelectedId,
      hidden,
      toggleHidden: (id: string) =>
        setHidden((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      gizmo,
      setGizmo,
      activeScene,
      setActiveScene,
      camera,
      setCamera,
      lightPreset,
      setLightPreset,
      intensity,
      setIntensity,
      ambient,
      setAmbient,
      shadows,
      setShadows,
      showGrid,
      setShowGrid,
      posX,
      setPosX,
      posY,
      setPosY,
      posZ,
      setPosZ,
      rotY,
      setRotY,
      scale,
      setScale,
      logs: SCENE_LOGS,
      statusLabel,
      setStatusLabel,
    }),
    [
      selectedId,
      hidden,
      gizmo,
      activeScene,
      camera,
      lightPreset,
      intensity,
      ambient,
      shadows,
      showGrid,
      posX,
      posY,
      posZ,
      rotY,
      scale,
      statusLabel,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenes() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScenes must be used inside ScenesProvider");
  return ctx;
}