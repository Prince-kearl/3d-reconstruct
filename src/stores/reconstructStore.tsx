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
import { buildDepthGeometry, type SideViewSilhouette } from "@/lib/mesh/buildDepthGeometry";
import { compositeMaskedImage } from "@/lib/mesh/compositeMaskedImage";
import {
  buildMultiViewTextureAtlas,
  type MultiViewTextureAtlas,
} from "@/lib/texture/buildMultiViewTextureAtlas";
import {
  ANGLE_DEGREES,
  ANGLE_LABELS,
  computeMaskFingerprint,
  multiViewProvider,
  prepareSubjectForGeneration,
  STANDARD_ANGLES,
  MultiViewError,
  type GeneratedView,
  type ViewAngle,
} from "@/lib/multiview";
import { projectStore } from "@/lib/projects";
import { makeThumbnailBlob } from "@/lib/projects/thumbnail";
import { backgroundRemover, encodeMaskBlob, type SegmentationResult } from "@/lib/segmentation";
import { getReconstructionDefaults } from "@/lib/settings/reconstructionDefaults";

export const QUALITY_SEGMENTS = { Fast: 96, Balanced: 160, High: 224 } as const;
export type Quality = keyof typeof QUALITY_SEGMENTS;

export type ReconstructionMode = "depth-only" | "ai-multi-view";
/**
 * "off" — never generated. "idle" — generated once, not currently running.
 * "generating" — a job is in flight. "ready" — usable views exist and match
 * the current mask. "stale" — usable views exist but the mask has changed
 * since (never used silently — see applyMaskEdit). "failed" — last attempt
 * produced no usable views.
 */
export type MultiViewStatus = "off" | "idle" | "generating" | "ready" | "stale" | "failed";

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

/** Only "ok" views with a real mask can inform geometry — failed/maskless views are skipped, never faked. */
function toSideViewSilhouettes(views: GeneratedView[]): SideViewSilhouette[] {
  const result: SideViewSilhouette[] = [];
  for (const view of views) {
    if (view.status !== "ok" || !view.mask) continue;
    result.push({ angleDegrees: ANGLE_DEGREES[view.angle], mask: view.mask });
  }
  return result;
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

  reconstructionMode: ReconstructionMode;
  setReconstructionMode: (mode: ReconstructionMode) => void;
  multiViewStatus: MultiViewStatus;
  multiViewViews: GeneratedView[];
  multiViewError: string | null;
  generateMultiView: () => Promise<void>;
  cancelMultiView: () => void;
  rebuildGeometryFromExistingViews: () => void;

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
  const [reconstructionMode, setReconstructionModeState] =
    useState<ReconstructionMode>("depth-only");
  const [multiViewStatus, setMultiViewStatus] = useState<MultiViewStatus>("off");
  const [multiViewViews, setMultiViewViews] = useState<GeneratedView[]>([]);
  const [multiViewError, setMultiViewError] = useState<string | null>(null);

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
  /** Populated only when multiViewStatus is genuinely "ready" for the current mask — see applyMaskEdit. */
  const multiViewGeometryInputRef = useRef<SideViewSilhouette[] | null>(null);
  const multiViewJobRef = useRef<{ cancel: () => void } | null>(null);
  const multiViewMaskFingerprintRef = useRef<string | null>(null);
  /** Populated only alongside multiViewGeometryInputRef — see applyMultiViewTexture. Null means "use the plain original texture" (today's behavior). */
  const multiViewAtlasRef = useRef<MultiViewTextureAtlas | null>(null);

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
        multiViewGeometryInputRef.current,
        multiViewAtlasRef.current
          ? {
              frontURange: multiViewAtlasRef.current.frontURange,
              backURange: multiViewAtlasRef.current.backURange,
            }
          : null,
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
      reconstructionMode: ReconstructionMode;
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
      reconstructionMode: ReconstructionMode;
    }) => {
      if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
      rebuildTimer.current = window.setTimeout(() => rebuildGeometry(params), 120);
      scheduleSettingsSave(params);
    },
    [rebuildGeometry, scheduleSettingsSave],
  );

  const rebuildTexture = useCallback((grading: ColorGrading) => {
    const base = multiViewAtlasRef.current?.canvas ?? compositedCanvasRef.current;
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

  /**
   * Bakes (or clears) the view-aware texture atlas from real generated views
   * — never called automatically on a timer, only right after views become
   * usable (generation succeeds, a geometry-only rebuild reuses existing
   * views, or a project loads with fresh views). Failure here degrades to
   * the plain original texture, never breaks reconstruction (§29).
   */
  const applyMultiViewTexture = useCallback(
    async (views: GeneratedView[]) => {
      const img = imageElRef.current;
      const currentMask = maskResultRef.current;
      if (!img || !currentMask) {
        multiViewAtlasRef.current = null;
        return;
      }
      try {
        appendLog("Multi-view: projecting textures");
        const frontCanvas = compositedCanvasRef.current ?? compositeMaskedImage(img, currentMask);
        const atlas = await buildMultiViewTextureAtlas(
          frontCanvas,
          currentMask,
          img.naturalWidth,
          img.naturalHeight,
          views,
        );
        multiViewAtlasRef.current = atlas;
        appendLog(
          atlas
            ? "Multi-view: blending texture sources"
            : "Multi-view: no usable views for texture blending — keeping original texture.",
        );
      } catch (error) {
        multiViewAtlasRef.current = null;
        const message = error instanceof Error ? error.message : "unknown error";
        appendLog(`Multi-view: texture blending failed (${message}) — using original texture.`);
      }
    },
    [appendLog],
  );

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
          reconstructionMode,
        });
        return next;
      });
    },
    [
      scheduleTextureRebuild,
      scheduleSettingsSave,
      detail,
      smoothing,
      edgeFeather,
      volume,
      quality,
      reconstructionMode,
    ],
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

      // The mask no longer matches whatever multi-view views might exist —
      // never silently keep using them for geometry once that's true.
      // Regenerating is always an explicit user action (see generateMultiView /
      // rebuildGeometryFromExistingViews), never automatic.
      multiViewGeometryInputRef.current = null;
      multiViewAtlasRef.current = null;
      setMultiViewStatus((prev) => {
        if (prev !== "ready") return prev;
        if (projectIdRef.current) void projectStore.markMultiViewStale(projectIdRef.current);
        return "stale";
      });

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

  const generateMultiView = useCallback(async () => {
    const img = imageElRef.current;
    const currentMask = maskResultRef.current;
    const srcUrl = sourceImageUrl;
    const pid = projectIdRef.current;
    if (!img || !currentMask || !srcUrl || !pid) {
      appendLog("Multi-view: no project loaded — nothing to generate views for.");
      return;
    }

    setMultiViewStatus("generating");
    setMultiViewError(null);
    appendLog("Multi-view: preparing source");

    try {
      const preparedImageDataUrl = prepareSubjectForGeneration(img, currentMask).toDataURL(
        "image/png",
      );

      appendLog("Multi-view: submitting generation job");
      const handle = await multiViewProvider.generateViews({
        projectId: pid,
        sourceImageUrl: srcUrl,
        mask: currentMask,
        angles: STANDARD_ANGLES,
        preparedImageDataUrl,
      });
      multiViewJobRef.current = handle;

      const { views } = await handle.result;
      multiViewJobRef.current = null;

      for (const view of views) {
        appendLog(
          view.status === "ok"
            ? `Multi-view: ${ANGLE_LABELS[view.angle]} generated`
            : `Multi-view: ${ANGLE_LABELS[view.angle]} failed — ${view.failureReason ?? "unknown reason"}`,
        );
      }
      setMultiViewViews(views);

      const okViews = views.filter((v) => v.status === "ok");
      if (okViews.length === 0) {
        setMultiViewStatus("failed");
        setMultiViewError("No usable views were generated.");
        appendLog("Multi-view: no usable views — falling back to depth-only reconstruction.");
        return;
      }

      appendLog("Multi-view: validating generated views");
      appendLog("Multi-view: reconstructing geometry");
      multiViewGeometryInputRef.current = toSideViewSilhouettes(okViews);
      await applyMultiViewTexture(okViews);
      rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
      rebuildTexture(colorGrading);

      const fingerprint = computeMaskFingerprint(currentMask);
      multiViewMaskFingerprintRef.current = fingerprint;
      setMultiViewStatus("ready");
      appendLog("Multi-view: complete");

      try {
        const viewBlobs = await Promise.all(
          okViews.map(async (v) => {
            const blob = await (await fetch(v.imageUrl!)).blob();
            return {
              angle: v.angle,
              blob,
              width: v.width,
              height: v.height,
              confidence: v.confidence,
              provider: v.provider,
              model: v.model,
            };
          }),
        );
        await projectStore.saveMultiView(pid, {
          status: "ready",
          maskVersion: fingerprint,
          views: viewBlobs,
        });
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Could not save views";
        appendLog(`Multi-view: generated views ready, but saving them failed — ${message}`);
      }
    } catch (error) {
      multiViewJobRef.current = null;
      if (error instanceof MultiViewError && error.code === "MULTIVIEW_CANCELLED") {
        appendLog("Multi-view: cancelled");
        setMultiViewStatus((prev) => (prev === "generating" ? "idle" : prev));
        return;
      }
      const message = error instanceof Error ? error.message : "Multi-view generation failed";
      setMultiViewStatus("failed");
      setMultiViewError(message);
      appendLog(`Multi-view: ${message} — falling back to depth-only reconstruction.`);
    }
  }, [
    sourceImageUrl,
    detail,
    smoothing,
    edgeFeather,
    volume,
    quality,
    colorGrading,
    rebuildGeometry,
    rebuildTexture,
    applyMultiViewTexture,
    appendLog,
  ]);

  const cancelMultiView = useCallback(() => {
    multiViewJobRef.current?.cancel();
  }, []);

  const rebuildGeometryFromExistingViews = useCallback(() => {
    const okViews = multiViewViews.filter((v) => v.status === "ok");
    if (okViews.length === 0) {
      appendLog("Multi-view: no previously generated views to rebuild from.");
      return;
    }
    appendLog("Multi-view: rebuilding geometry from previously generated views (no AI re-run)");
    multiViewGeometryInputRef.current = toSideViewSilhouettes(okViews);
    rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
    setMultiViewStatus("ready");
    // Texture blending runs after the initial (instant) geometry rebuild —
    // it refines appearance shortly after, it never blocks the rebuild.
    void applyMultiViewTexture(okViews).then(() => {
      rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
      rebuildTexture(colorGrading);
    });
  }, [
    multiViewViews,
    rebuildGeometry,
    rebuildTexture,
    applyMultiViewTexture,
    detail,
    smoothing,
    edgeFeather,
    volume,
    quality,
    colorGrading,
    appendLog,
  ]);

  const setReconstructionMode = useCallback(
    (mode: ReconstructionMode) => {
      setReconstructionModeState(mode);
      if (mode === "depth-only") {
        multiViewGeometryInputRef.current = null;
        multiViewAtlasRef.current = null;
      } else if (multiViewStatus === "ready") {
        const okViews = multiViewViews.filter((v) => v.status === "ok");
        multiViewGeometryInputRef.current = toSideViewSilhouettes(okViews);
        void applyMultiViewTexture(okViews).then(() => {
          rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
          rebuildTexture(colorGrading);
        });
      }
      rebuildGeometry({ detail, smoothing, edgeFeather, volume, quality });
      rebuildTexture(colorGrading);
      scheduleSettingsSave({
        detail,
        smoothing,
        edgeFeather,
        volume,
        quality,
        colorGrading,
        reconstructionMode: mode,
      });
    },
    [
      multiViewStatus,
      multiViewViews,
      rebuildGeometry,
      rebuildTexture,
      applyMultiViewTexture,
      scheduleSettingsSave,
      detail,
      smoothing,
      edgeFeather,
      volume,
      quality,
      colorGrading,
    ],
  );

  const setDetail = useCallback(
    (v: number) => {
      setDetailState(v);
      scheduleRebuild({
        detail: v,
        smoothing,
        edgeFeather,
        volume,
        quality,
        colorGrading,
        reconstructionMode,
      });
    },
    [scheduleRebuild, smoothing, edgeFeather, volume, quality, colorGrading, reconstructionMode],
  );
  const setSmoothing = useCallback(
    (v: number) => {
      setSmoothingState(v);
      scheduleRebuild({
        detail,
        smoothing: v,
        edgeFeather,
        volume,
        quality,
        colorGrading,
        reconstructionMode,
      });
    },
    [scheduleRebuild, detail, edgeFeather, volume, quality, colorGrading, reconstructionMode],
  );
  const setEdgeFeather = useCallback(
    (v: number) => {
      setEdgeFeatherState(v);
      scheduleRebuild({
        detail,
        smoothing,
        edgeFeather: v,
        volume,
        quality,
        colorGrading,
        reconstructionMode,
      });
    },
    [scheduleRebuild, detail, smoothing, volume, quality, colorGrading, reconstructionMode],
  );
  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      scheduleRebuild({
        detail,
        smoothing,
        edgeFeather,
        volume: v,
        quality,
        colorGrading,
        reconstructionMode,
      });
    },
    [scheduleRebuild, detail, smoothing, edgeFeather, quality, colorGrading, reconstructionMode],
  );
  const setQuality = useCallback(
    (q: Quality) => {
      setQualityState(q);
      scheduleRebuild({
        detail,
        smoothing,
        edgeFeather,
        volume,
        quality: q,
        colorGrading,
        reconstructionMode,
      });
    },
    [scheduleRebuild, detail, smoothing, edgeFeather, volume, colorGrading, reconstructionMode],
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
    multiViewGeometryInputRef.current = null;
    multiViewAtlasRef.current = null;
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
        reconstructionMode,
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
    reconstructionMode,
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
        setReconstructionModeState(record.reconstructionMode);

        if (record.multiViewViews.length > 0) {
          appendLog("Multi-view: restoring previously generated views...");
          const restoredViews: GeneratedView[] = await Promise.all(
            record.multiViewViews.map(async (v) => ({
              angle: v.angle as ViewAngle,
              imageUrl: v.imageUrl,
              mask: await backgroundRemover.removeBackground(v.imageUrl).catch(() => null),
              width: v.width,
              height: v.height,
              confidence: v.confidence,
              status: "ok" as const,
              provider: v.provider,
              model: v.model,
              generatedAt: v.generatedAt,
            })),
          );
          setMultiViewViews(restoredViews);
          multiViewMaskFingerprintRef.current = record.multiViewMaskVersion;

          const currentFingerprint = maskResultRef.current
            ? computeMaskFingerprint(maskResultRef.current)
            : null;
          const isFresh =
            record.multiViewStatus === "ready" &&
            currentFingerprint !== null &&
            currentFingerprint === record.multiViewMaskVersion;

          if (isFresh && record.reconstructionMode === "ai-multi-view") {
            multiViewGeometryInputRef.current = toSideViewSilhouettes(restoredViews);
            setMultiViewStatus("ready");
            // Rebuild the blended texture from the restored views too, without
            // re-running AI generation — mirrors rebuildGeometryFromExistingViews.
            void applyMultiViewTexture(restoredViews).then(() => {
              rebuildGeometry({
                detail: record.detail,
                smoothing: record.smoothing,
                edgeFeather: record.edgeFeather,
                volume: record.volume,
                quality: record.quality,
              });
              rebuildTexture(record.colorGrading);
            });
          } else {
            setMultiViewStatus(record.multiViewStatus === "failed" ? "failed" : "stale");
          }
        } else {
          setMultiViewStatus("off");
        }

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
    [appendLog, rebuildGeometry, rebuildTexture, applyMultiViewTexture],
  );

  const newProject = useCallback(() => {
    if (rebuildTimer.current) window.clearTimeout(rebuildTimer.current);
    if (textureRebuildTimer.current) window.clearTimeout(textureRebuildTimer.current);
    if (settingsSaveTimer.current) window.clearTimeout(settingsSaveTimer.current);
    if (maskSaveTimer.current) window.clearTimeout(maskSaveTimer.current);
    multiViewJobRef.current?.cancel();
    pendingFileRef.current = null;
    depthResultRef.current = null;
    maskResultRef.current = null;
    imageElRef.current = null;
    compositedCanvasRef.current = null;
    projectIdRef.current = null;
    multiViewGeometryInputRef.current = null;
    multiViewAtlasRef.current = null;
    multiViewJobRef.current = null;
    multiViewMaskFingerprintRef.current = null;
    setStatus("idle");
    setMultiViewStatus("off");
    setMultiViewViews([]);
    setMultiViewError(null);
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
      reconstructionMode,
      setReconstructionMode,
      multiViewStatus,
      multiViewViews,
      multiViewError,
      generateMultiView,
      cancelMultiView,
      rebuildGeometryFromExistingViews,
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
      reconstructionMode,
      setReconstructionMode,
      multiViewStatus,
      multiViewViews,
      multiViewError,
      generateMultiView,
      cancelMultiView,
      rebuildGeometryFromExistingViews,
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
