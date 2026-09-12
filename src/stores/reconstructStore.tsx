import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";

import { depthEstimator, renderDepthPreview, type DepthEstimationResult } from "@/lib/depth";
import {
  applyColorGrading,
  NEUTRAL_GRADING,
  type ColorGrading,
} from "@/lib/mesh/applyColorGrading";
import { buildDepthGeometry } from "@/lib/mesh/buildDepthGeometry";
import { compositeMaskedImage } from "@/lib/mesh/compositeMaskedImage";
import { projectStore } from "@/lib/projects";
import { makeThumbnailBlob } from "@/lib/projects/thumbnail";
import { backgroundRemover, encodeMaskBlob, type SegmentationResult } from "@/lib/segmentation";
import { getReconstructionDefaults } from "@/lib/settings/reconstructionDefaults";

export const QUALITY_SEGMENTS = { Fast: 96, Balanced: 160, High: 224 } as const;
export type Quality = keyof typeof QUALITY_SEGMENTS;

export type ReconstructStatus =
  | "idle"
  | "loading-model"
  | "removing-background"
  | "estimating-depth"
  | "building-mesh"
  | "ready"
  | "error";

export const RECONSTRUCTION_STEPS = [
  "Loading models",
  "Removing background",
  "Estimating depth",
  "Building mesh",
  "Ready",
] as const;

const STATUS_STEP: Record<ReconstructStatus, number> = {
  idle: 0,
  "loading-model": 0,
  "removing-background": 1,
  "estimating-depth": 2,
  "building-mesh": 3,
  ready: 5,
  error: 0,
};

const SETTINGS_SAVE_DEBOUNCE_MS = 800;

function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function extensionFromFile(file: File): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  if (match?.[1]) return match[1].toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load image"));
    el.src = url;
  });
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  return canvas;
}

type Store = {
  status: ReconstructStatus;
  logLines: string[];
  errorMessage: string | null;
  completedSteps: number;
  progress: number;

  sourceImageUrl: string | null;
  sourceFileName: string | null;
  imageWidth: number;
  imageHeight: number;
  pendingPreviewUrl: string | null;
  setPendingFile: (file: File) => void;

  quality: Quality;
  setQuality: (q: Quality) => void;
  detail: number;
  setDetail: (v: number) => void;
  smoothing: number;
  setSmoothing: (v: number) => void;
  edgeFeather: number;
  setEdgeFeather: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;

  colorGrading: ColorGrading;
  setExposure: (v: number) => void;
  setSaturation: (v: number) => void;
  setWarmth: (v: number) => void;
  setContrast: (v: number) => void;
  resetColorGrading: () => void;

  scale: number;
  setScale: (v: number) => void;
  rotationY: number;
  setRotationY: (v: number) => void;
  resetTransform: () => void;

  geometry: THREE.BufferGeometry | null;
  texture: THREE.Texture | null;
  vertexCount: number;
  faceCount: number;
  depthPreviewUrl: string | null;

  mask: SegmentationResult | null;
  applyMaskEdit: (mask: SegmentationResult) => void;
  resetMaskToAutomatic: () => Promise<void>;

  projectId: string | null;
  startReconstruction: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  newProject: () => void;
};

const Ctx = createContext<Store | null>(null);

export function ReconstructProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ReconstructStatus>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [defaults] = useState(() => getReconstructionDefaults());
  const [quality, setQualityState] = useState<Quality>(defaults.quality);
  const [detail, setDetailState] = useState(defaults.detail);
  const [smoothing, setSmoothingState] = useState(defaults.smoothing);
  const [edgeFeather, setEdgeFeatherState] = useState(defaults.edgeFeather);
  const [volume, setVolumeState] = useState(defaults.volume);
  const [colorGrading, setColorGradingState] = useState<ColorGrading>(NEUTRAL_GRADING);

  const [scale, setScale] = useState(1);
  const [rotationY, setRotationY] = useState(0);

  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [vertexCount, setVertexCount] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [depthPreviewUrl, setDepthPreviewUrl] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mask, setMask] = useState<SegmentationResult | null>(null);

  const depthResultRef = useRef<DepthEstimationResult | null>(null);
  const maskResultRef = useRef<SegmentationResult | null>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);
  const compositedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rebuildTimer = useRef<number | null>(null);
  const textureRebuildTimer = useRef<number | null>(null);
  const settingsSaveTimer = useRef<number | null>(null);
  const maskSaveTimer = useRef<number | null>(null);
  const projectIdRef = useRef<string | null>(null);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev, `[${timestamp()}] ${line}`]);
  }, []);

  const rebuildGeometry = useCallback(
    (params: {
      detail: number;
      smoothing: number;
      edgeFeather: number;
      volume: number;
      quality: Quality;
    }) => {
      const depth = depthResultRef.current;
      const img = imageElRef.current;
      if (!depth || !img) return;

      const result = buildDepthGeometry(
        depth,
        img.naturalWidth / img.naturalHeight,
        {
          detail: params.detail,
          smoothing: params.smoothing,
          edgeFeather: params.edgeFeather,
          volume: params.volume,
          segments: QUALITY_SEGMENTS[params.quality],
        },
        maskResultRef.current,
      );
      setGeometry((prev) => {
        prev?.dispose();
        return result.geometry;
      });
      setVertexCount(result.vertexCount);
      setFaceCount(result.faceCount);
    },
    [],
  );

  const scheduleSettingsSave = useCallback(
    (params: {
      detail: number;
      smoothing: number;
      edgeFeather: number;
      volume: number;
      quality: Quality;
      colorGrading: ColorGrading;
    }) => {
      if (!projectIdRef.current) return;
      if (settingsSaveTimer.current) window.clearTimeout(settingsSaveTimer.current);
      const id = projectIdRef.current;
      settingsSaveTimer.current = window.setTimeout(() => {
        void projectStore.updateSettings(id, params);
      }, SETTINGS_SAVE_DEBOUNCE_MS);
    },
    [],
  );

  const scheduleRebuild = useCallback(
    (params: {
      detail: number;
      smoothing: number;
      edgeFeather: number;
      volume: number;
      quality: Quality;
      colorGrading: ColorGrading;
    }) => {
      if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
      rebuildTimer.current = window.setTimeout(() => rebuildGeometry(params), 120);
      scheduleSettingsSave(params);
    },
    [rebuildGeometry, scheduleSettingsSave],
  );

  const rebuildTexture = useCallback((grading: ColorGrading) => {
    const base = compositedCanvasRef.current;
    if (!base) return;
    const graded = applyColorGrading(base, grading);
    const tex = new THREE.Texture(graded);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    setTexture((prev) => {
      prev?.dispose();
      return tex;
    });
  }, []);

  const scheduleTextureRebuild = useCallback(
    (grading: ColorGrading) => {
      if (textureRebuildTimer.current) window.clearTimeout(textureRebuildTimer.current);
      textureRebuildTimer.current = window.setTimeout(() => rebuildTexture(grading), 80);
    },
    [rebuildTexture],
  );

  const setColorGrading = useCallback(
    (patch: Partial<ColorGrading>) => {
      setColorGradingState((prev) => {
        const next = { ...prev, ...patch };
        scheduleTextureRebuild(next);
        scheduleSettingsSave({
          detail,
          smoothing,
          edgeFeather,
          volume,
          quality,
          colorGrading: next,
        });
        return next;
      });
    },
    [scheduleTextureRebuild, scheduleSettingsSave, detail, smoothing, edgeFeather, volume, quality],
  );
  const setExposure = useCallback(
    (v: number) => setColorGrading({ exposure: v }),
    [setColorGrading],
  );
  const setSaturation = useCallback(
    (v: number) => setColorGrading({ saturation: v }),
    [setColorGrading],
  );
  const setWarmth = useCallback((v: number) => setColorGrading({ warmth: v }), [setColorGrading]);
  const setContrast = useCallback(
    (v: number) => setColorGrading({ contrast: v }),
    [setColorGrading],
  );
  const resetColorGrading = useCallback(() => setColorGrading(NEUTRAL_GRADING), [setColorGrading]);

  const scheduleMaskSave = useCallback(
    (maskToSave: SegmentationResult) => {
      if (!projectIdRef.current) return;
      if (maskSaveTimer.current) window.clearTimeout(maskSaveTimer.current);
      const id = projectIdRef.current;
      maskSaveTimer.current = window.setTimeout(() => {
        void encodeMaskBlob(maskToSave)
          .then((maskBlob) =>
            projectStore.saveMask(id, {
              maskWidth: maskToSave.width,
              maskHeight: maskToSave.height,
              maskBlob,
            }),
          )
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Could not save mask edit";
            appendLog(`Error saving silhouette edit: ${message}`);
          });
      }, SETTINGS_SAVE_DEBOUNCE_MS);
    },
    [appendLog],
  );

  const applyMaskEdit = useCallback(
    (newMask: SegmentationResult) => {
      maskResultRef.current = newMask;
      setMask(newMask);

      const img = imageElRef.current;
      if (img) {
        compositedCanvasRef.current = compositeMaskedImage(img, newMask);
        rebuildTexture(colorGrading);
      }

      rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
      scheduleMaskSave(newMask);
    },
    [
      rebuildGeometry,
      rebuildTexture,
      scheduleMaskSave,
      detail,
      smoothing,
      edgeFeather,
      volume,
      quality,
      colorGrading,
    ],
  );

  const resetMaskToAutomatic = useCallback(async () => {
    const url = sourceImageUrl;
    if (!url) return;
    const fresh = await backgroundRemover.removeBackground(url);
    applyMaskEdit(fresh);
  }, [sourceImageUrl, applyMaskEdit]);

  const setDetail = useCallback(
    (v: number) => {
      setDetailState(v);
      scheduleRebuild({ detail: v, smoothing, edgeFeather, volume, quality, colorGrading });
    },
    [scheduleRebuild, smoothing, edgeFeather, volume, quality, colorGrading],
  );
  const setSmoothing = useCallback(
    (v: number) => {
      setSmoothingState(v);
      scheduleRebuild({ detail, smoothing: v, edgeFeather, volume, quality, colorGrading });
    },
    [scheduleRebuild, detail, edgeFeather, volume, quality, colorGrading],
  );
  const setEdgeFeather = useCallback(
    (v: number) => {
      setEdgeFeatherState(v);
      scheduleRebuild({ detail, smoothing, edgeFeather: v, volume, quality, colorGrading });
    },
    [scheduleRebuild, detail, smoothing, volume, quality, colorGrading],
  );
  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      scheduleRebuild({ detail, smoothing, edgeFeather, volume: v, quality, colorGrading });
    },
    [scheduleRebuild, detail, smoothing, edgeFeather, quality, colorGrading],
  );
  const setQuality = useCallback(
    (q: Quality) => {
      setQualityState(q);
      scheduleRebuild({ detail, smoothing, edgeFeather, volume, quality: q, colorGrading });
    },
    [scheduleRebuild, detail, smoothing, edgeFeather, volume, colorGrading],
  );

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotationY(0);
  }, []);

  const setPendingFile = useCallback((file: File) => {
    pendingFileRef.current = file;
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const startReconstruction = useCallback(async () => {
    const file = pendingFileRef.current;
    if (!file) return;

    if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
    setErrorMessage(null);
    setLogLines([]);
    setStatus("loading-model");
    appendLog(`Loaded ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    appendLog("Loading AI models (first run downloads ~250MB combined, then caches)...");

    const id = projectId ?? crypto.randomUUID();
    let created = false;
    const localUrl = URL.createObjectURL(file);

    try {
      const img = await loadImageElement(localUrl);
      imageElRef.current = img;
      setSourceImageUrl(localUrl);
      setSourceFileName(file.name);
      setImageWidth(img.naturalWidth);
      setImageHeight(img.naturalHeight);

      appendLog("Saving project...");
      await projectStore.create({
        id,
        name: file.name.replace(/\.[^.]+$/, ""),
        sourceImageBlob: file,
        sourceImageExtension: extensionFromFile(file),
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
      });
      created = true;
      setProjectId(id);
      projectIdRef.current = id;

      setStatus("removing-background");
      appendLog("Removing background...");
      const mask = await backgroundRemover.removeBackground(localUrl);
      maskResultRef.current = mask;
      setMask(mask);

      setStatus("estimating-depth");
      appendLog(`Estimating depth (${img.naturalWidth}×${img.naturalHeight})...`);
      const depth = await depthEstimator.estimate(localUrl);
      depthResultRef.current = depth;
      setDepthPreviewUrl(renderDepthPreview(depth).toDataURL("image/png"));

      setStatus("building-mesh");
      appendLog(
        `Building mesh (${QUALITY_SEGMENTS[quality]}×${QUALITY_SEGMENTS[quality]} segments)...`,
      );
      const meshResult = buildDepthGeometry(
        depth,
        img.naturalWidth / img.naturalHeight,
        {
          detail,
          smoothing,
          edgeFeather,
          volume,
          segments: QUALITY_SEGMENTS[quality],
        },
        mask,
      );
      setGeometry((prev) => {
        prev?.dispose();
        return meshResult.geometry;
      });
      setVertexCount(meshResult.vertexCount);
      setFaceCount(meshResult.faceCount);

      compositedCanvasRef.current = compositeMaskedImage(img, mask);
      rebuildTexture(colorGrading);

      appendLog("Uploading depth map and thumbnail...");
      const thumbnailBlob = await makeThumbnailBlob(img);
      await projectStore.complete(id, {
        depthData: depth.data,
        depthWidth: depth.width,
        depthHeight: depth.height,
        thumbnailBlob,
        quality,
        detail,
        smoothing,
        edgeFeather,
        volume,
        colorGrading,
        vertexCount: meshResult.vertexCount,
        faceCount: meshResult.faceCount,
      });

      setStatus("ready");
      appendLog("Ready — rotate the viewport to see the depth effect.");
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Depth estimation failed";
      setErrorMessage(message);
      appendLog(`Error: ${message}`);
      if (created) {
        await projectStore.markFailed(id, message).catch(() => {});
      }
    }
  }, [
    appendLog,
    detail,
    smoothing,
    edgeFeather,
    volume,
    colorGrading,
    quality,
    projectId,
    rebuildTexture,
  ]);

  const loadProject = useCallback(
    async (id: string) => {
      if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
      setErrorMessage(null);
      setLogLines([]);
      setStatus("loading-model");

      try {
        const record = await projectStore.get(id);
        if (!record) throw new Error("Project not found");

        appendLog(`Loading project "${record.name}"...`);
        const img = await loadImageElement(record.sourceImageUrl);

        imageElRef.current = img;
        setSourceImageUrl(record.sourceImageUrl);
        setSourceFileName(record.name);
        setImageWidth(record.imageWidth);
        setImageHeight(record.imageHeight);
        setQualityState(record.quality);
        setDetailState(record.detail);
        setSmoothingState(record.smoothing);
        setEdgeFeatherState(record.edgeFeather);
        setVolumeState(record.volume);
        setColorGradingState(record.colorGrading);
        setProjectId(record.id);
        projectIdRef.current = record.id;

        void projectStore.touchOpened(record.id).catch(() => {});

        if (record.depthWidth === 0 || record.depthHeight === 0) {
          setDepthPreviewUrl(null);
          setStatus("error");
          setErrorMessage(
            record.status === "failed"
              ? (record.errorMessage ?? "This project's reconstruction failed.")
              : "This project never finished reconstructing — start a new reconstruction to retry.",
          );
          appendLog("No depth data saved for this project.");
          return;
        }

        depthResultRef.current = {
          width: record.depthWidth,
          height: record.depthHeight,
          data: record.depthData,
        };
        setDepthPreviewUrl(renderDepthPreview(depthResultRef.current).toDataURL("image/png"));

        if (record.maskData && record.maskWidth > 0 && record.maskHeight > 0) {
          appendLog("Loaded your saved silhouette edit...");
          maskResultRef.current = {
            width: record.maskWidth,
            height: record.maskHeight,
            data: record.maskData,
          };
        } else {
          setStatus("removing-background");
          appendLog("Removing background...");
          maskResultRef.current = await backgroundRemover
            .removeBackground(record.sourceImageUrl)
            .catch(() => null);
        }
        setMask(maskResultRef.current);

        setStatus("building-mesh");
        rebuildGeometry({
          detail: record.detail,
          smoothing: record.smoothing,
          edgeFeather: record.edgeFeather,
          volume: record.volume,
          quality: record.quality,
        });

        compositedCanvasRef.current = maskResultRef.current
          ? compositeMaskedImage(img, maskResultRef.current)
          : imageToCanvas(img);
        rebuildTexture(record.colorGrading);

        setStatus("ready");
        appendLog(`Ready — loaded "${record.name}" from your saved projects.`);
      } catch (error) {
        setStatus("error");
        const message = error instanceof Error ? error.message : "Could not load project";
        setErrorMessage(message);
        appendLog(`Error: ${message}`);
      }
    },
    [appendLog, rebuildGeometry, rebuildTexture],
  );

  const newProject = useCallback(() => {
    if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
    if (textureRebuildTimer.current) window.clearTimeout(textureRebuildTimer.current);
    if (settingsSaveTimer.current) window.clearTimeout(settingsSaveTimer.current);
    if (maskSaveTimer.current) window.clearTimeout(maskSaveTimer.current);
    pendingFileRef.current = null;
    depthResultRef.current = null;
    maskResultRef.current = null;
    imageElRef.current = null;
    compositedCanvasRef.current = null;
    projectIdRef.current = null;
    setStatus("idle");
    setLogLines([]);
    setErrorMessage(null);
    setSourceImageUrl(null);
    setSourceFileName(null);
    setImageWidth(0);
    setImageHeight(0);
    setPendingPreviewUrl(null);
    setDepthPreviewUrl(null);
    setProjectId(null);
    setMask(null);
    setGeometry((prev) => {
      prev?.dispose();
      return null;
    });
    setTexture((prev) => {
      prev?.dispose();
      return null;
    });
    setVertexCount(0);
    setFaceCount(0);
    resetTransform();
  }, [resetTransform]);

  const value = useMemo<Store>(
    () => ({
      status,
      logLines,
      errorMessage,
      completedSteps: STATUS_STEP[status],
      progress: (STATUS_STEP[status] / RECONSTRUCTION_STEPS.length) * 100,
      sourceImageUrl,
      sourceFileName,
      imageWidth,
      imageHeight,
      pendingPreviewUrl,
      setPendingFile,
      quality,
      setQuality,
      detail,
      setDetail,
      smoothing,
      setSmoothing,
      edgeFeather,
      setEdgeFeather,
      volume,
      setVolume,
      colorGrading,
      setExposure,
      setSaturation,
      setWarmth,
      setContrast,
      resetColorGrading,
      scale,
      setScale,
      rotationY,
      setRotationY,
      resetTransform,
      geometry,
      texture,
      vertexCount,
      faceCount,
      depthPreviewUrl,
      mask,
      applyMaskEdit,
      resetMaskToAutomatic,
      projectId,
      startReconstruction,
      loadProject,
      newProject,
    }),
    [
      status,
      logLines,
      errorMessage,
      sourceImageUrl,
      sourceFileName,
      imageWidth,
      imageHeight,
      pendingPreviewUrl,
      setPendingFile,
      quality,
      setQuality,
      detail,
      setDetail,
      smoothing,
      setSmoothing,
      edgeFeather,
      setEdgeFeather,
      volume,
      setVolume,
      colorGrading,
      setExposure,
      setSaturation,
      setWarmth,
      setContrast,
      resetColorGrading,
      scale,
      rotationY,
      resetTransform,
      geometry,
      texture,
      vertexCount,
      faceCount,
      depthPreviewUrl,
      mask,
      applyMaskEdit,
      resetMaskToAutomatic,
      projectId,
      startReconstruction,
      loadProject,
      newProject,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReconstruct() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useReconstruct must be used inside ReconstructProvider");
  return ctx;
}
