import type { ColorGrading } from "@/lib/mesh/applyColorGrading";
import type { Quality, ReconstructionMode } from "@/stores/reconstructStore";

export type ProjectStatus = "processing" | "completed" | "failed";

export interface ProjectRecord {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;

  sourceImageUrl: string;
  imageWidth: number;
  imageHeight: number;
  thumbnailUrl: string | null;

  depthData: Float32Array;
  depthWidth: number;
  depthHeight: number;

  /** A previously saved silhouette-brush edit, if any; overrides the automatic mask on load. */
  maskData: Float32Array | null;
  maskWidth: number;
  maskHeight: number;

  quality: Quality;
  detail: number;
  smoothing: number;
  edgeFeather: number;
  volume: number;
  colorGrading: ColorGrading;
  reconstructionMode: ReconstructionMode;

  vertexCount: number;
  faceCount: number;

  modelUrl: string | null;
  modelFormat: string | null;
  errorMessage: string | null;

  /** null = multi-view AI has never been run for this project. */
  multiViewStatus: MultiViewStoredStatus | null;
  multiViewViews: StoredMultiViewEntry[];
  /** The maskVersion the stored views were generated against — compared to the live mask's version to detect staleness. */
  multiViewMaskVersion: string | null;
}

export type MultiViewStoredStatus = "ready" | "stale" | "failed";

export interface StoredMultiViewEntry {
  angle: string;
  imageUrl: string;
  width: number;
  height: number;
  confidence: number;
  provider: string;
  model: string;
  generatedAt: number;
}

export type ProjectSummary = Omit<
  ProjectRecord,
  "depthData" | "maskData" | "maskWidth" | "maskHeight"
>;

export interface ProjectCreateInput {
  id: string;
  name: string;
  sourceImageBlob: Blob;
  sourceImageExtension: string;
  imageWidth: number;
  imageHeight: number;
}

export interface ProjectCompleteInput {
  depthData: Float32Array;
  depthWidth: number;
  depthHeight: number;
  thumbnailBlob: Blob;
  quality: Quality;
  detail: number;
  smoothing: number;
  edgeFeather: number;
  volume: number;
  colorGrading: ColorGrading;
  reconstructionMode: ReconstructionMode;
  vertexCount: number;
  faceCount: number;
}

export interface ProjectSettingsInput {
  quality: Quality;
  detail: number;
  smoothing: number;
  edgeFeather: number;
  volume: number;
  colorGrading: ColorGrading;
  reconstructionMode: ReconstructionMode;
}

export interface ProjectExportInput {
  modelBlob: Blob;
  modelFormat: string;
}

export interface ProjectMaskInput {
  maskWidth: number;
  maskHeight: number;
  maskBlob: Blob;
}

export interface ProjectMultiViewInput {
  status: MultiViewStoredStatus;
  maskVersion: string;
  views: {
    angle: string;
    blob: Blob;
    width: number;
    height: number;
    confidence: number;
    provider: string;
    model: string;
  }[];
}

/**
 * Swappable project-persistence backend. Currently Supabase (Postgres +
 * Storage); the shape here is what `reconstructStore.tsx` and Explorer/Home
 * actually depend on, so a different backend could replace
 * `supabaseProjectStore.ts` without touching either.
 */
export interface ProjectStore {
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<ProjectRecord | null>;
  getMostRecent(): Promise<ProjectSummary | null>;
  create(input: ProjectCreateInput): Promise<void>;
  complete(id: string, input: ProjectCompleteInput): Promise<void>;
  markFailed(id: string, message: string): Promise<void>;
  updateSettings(id: string, input: ProjectSettingsInput): Promise<void>;
  recordExport(id: string, input: ProjectExportInput): Promise<void>;
  saveMask(id: string, input: ProjectMaskInput): Promise<void>;
  saveMultiView(id: string, input: ProjectMultiViewInput): Promise<void>;
  markMultiViewStale(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  touchOpened(id: string): Promise<void>;
  remove(id: string): Promise<void>;
}
