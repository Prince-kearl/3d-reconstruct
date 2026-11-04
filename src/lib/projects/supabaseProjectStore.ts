import { decodeDepthMap, encodeDepthMapBlob } from "@/lib/depth";
import { NEUTRAL_GRADING, type ColorGrading } from "@/lib/mesh/applyColorGrading";
import { decodeMask } from "@/lib/segmentation";
import { supabase } from "@/lib/supabase/client";
import {
  deleteProject,
  getProject,
  insertHistoryEvent,
  insertProject,
  listProjects,
  touchLastOpened,
  updateProject,
  type ProjectRow,
} from "@/lib/supabase/projects";
import {
  depthMapPath,
  getSignedUrl,
  importedAssetPath,
  maskPath,
  modelPath,
  multiViewPath,
  removeProjectFolder,
  sourceImagePath,
  thumbnailPath,
  uploadObject,
} from "@/lib/supabase/storage";
import type { Quality, ReconstructionMode } from "@/stores/reconstructStore";

import type {
  MultiViewStoredStatus,
  ProjectCompleteInput,
  ProjectCreateInput,
  ProjectExportInput,
  ProjectImportInput,
  ProjectMaskInput,
  ProjectMultiViewInput,
  ProjectSettingsInput,
  ProjectStore,
  ProjectSummary,
  StoredMultiViewEntry,
} from "./types";

interface StoredMultiViewPathEntry {
  path: string;
  width: number;
  height: number;
  confidence: number;
  provider: string;
  model: string;
  generatedAt: number;
}

interface MultiViewMeta {
  maskVersion?: string;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

interface ReconstructionSettings {
  kind?: string;
  importedAsset?: {
    primaryFileName: string;
    format: string;
    mimeType: string;
    sizeBytes: number;
    files: { path: string; name: string; mimeType: string; sizeBytes: number }[];
  };
  quality?: Quality;
  detail?: number;
  smoothing?: number;
  edgeFeather?: number;
  volume?: number;
  colorGrading?: ColorGrading;
  reconstructionMode?: ReconstructionMode;
}

async function resolveMultiViewViews(
  row: ProjectRow,
): Promise<{ views: StoredMultiViewEntry[]; maskVersion: string | null }> {
  const paths = row.multi_view_paths as Record<string, StoredMultiViewPathEntry>;
  const entries = Object.entries(paths ?? {});
  if (entries.length === 0) return { views: [], maskVersion: null };

  const views = await Promise.all(
    entries.map(async ([angle, entry]) => ({
      angle,
      imageUrl: await getSignedUrl(entry.path),
      width: entry.width,
      height: entry.height,
      confidence: entry.confidence,
      provider: entry.provider,
      model: entry.model,
      generatedAt: entry.generatedAt,
    })),
  );
  const meta = row.multi_view_meta as MultiViewMeta;
  return { views, maskVersion: meta?.maskVersion ?? null };
}

async function rowToSummary(row: ProjectRow): Promise<ProjectSummary> {
  const settings = row.reconstruction_settings as ReconstructionSettings;
  const importMeta = settings.importedAsset;
  const isImported = settings.kind === "imported-asset" && Boolean(row.model_path && importMeta);
  const [sourceImageUrl, thumbnailUrl, modelUrl, multiView, importedFiles] = await Promise.all([
    row.source_image_path ? getSignedUrl(row.source_image_path) : Promise.resolve(""),
    row.thumbnail_path ? getSignedUrl(row.thumbnail_path) : Promise.resolve(null),
    row.model_path ? getSignedUrl(row.model_path) : Promise.resolve(null),
    resolveMultiViewViews(row),
    isImported && importMeta
      ? Promise.all(
          importMeta.files.map(async (file) => ({
            name: file.name,
            url: await getSignedUrl(file.path),
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
          })),
        )
      : Promise.resolve([]),
  ]);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    projectKind: isImported ? "imported" : "reconstruction",
    importedAsset:
      isImported && importMeta && modelUrl
        ? {
            primaryFileName: importMeta.primaryFileName,
            format: importMeta.format,
            mimeType: importMeta.mimeType,
            sizeBytes: importMeta.sizeBytes,
            files: [
              {
                name: importMeta.primaryFileName,
                url: modelUrl,
                mimeType: importMeta.mimeType,
                sizeBytes: importMeta.sizeBytes,
              },
              ...importedFiles,
            ],
          }
        : null,
    sourceImageUrl,
    imageWidth: row.image_width ?? 0,
    imageHeight: row.image_height ?? 0,
    thumbnailUrl,
    depthWidth: row.depth_width ?? 0,
    depthHeight: row.depth_height ?? 0,
    quality: settings.quality ?? "Balanced",
    detail: settings.detail ?? 70,
    smoothing: settings.smoothing ?? 35,
    edgeFeather: settings.edgeFeather ?? 25,
    volume: settings.volume ?? 0,
    colorGrading: settings.colorGrading ?? NEUTRAL_GRADING,
    reconstructionMode: settings.reconstructionMode ?? "depth-only",
    vertexCount: row.vertex_count ?? 0,
    faceCount: row.face_count ?? 0,
    modelUrl,
    modelFormat: row.model_format,
    errorMessage: row.error_message,
    multiViewStatus: (row.multi_view_status as MultiViewStoredStatus | null) ?? null,
    multiViewViews: multiView.views,
    multiViewMaskVersion: multiView.maskVersion,
  };
}

export const supabaseProjectStore: ProjectStore = {
  async list() {
    const rows = await listProjects();
    return Promise.all(rows.map(rowToSummary));
  },

  async getMostRecent() {
    const rows = await listProjects();
    const row = rows
      .filter((candidate) => {
        const settings = candidate.reconstruction_settings as ReconstructionSettings;
        return settings.kind !== "imported-asset";
      })
      .sort((a, b) => Date.parse(b.last_opened_at) - Date.parse(a.last_opened_at))[0];
    return row ? rowToSummary(row) : null;
  },

  async get(id) {
    const row = await getProject(id);
    if (!row) return null;
    const summary = await rowToSummary(row);

    if (summary.projectKind === "imported") {
      return {
        ...summary,
        depthData: new Float32Array(0),
        maskData: null,
        maskWidth: 0,
        maskHeight: 0,
      };
    }

    if (!row.depth_map_path) {
      return {
        ...summary,
        depthData: new Float32Array(0),
        maskData: null,
        maskWidth: 0,
        maskHeight: 0,
      };
    }
    const depthUrl = await getSignedUrl(row.depth_map_path);
    const depth = await decodeDepthMap(depthUrl);

    if (!row.mask_path) {
      return { ...summary, depthData: depth.data, maskData: null, maskWidth: 0, maskHeight: 0 };
    }
    const maskUrl = await getSignedUrl(row.mask_path);
    const mask = await decodeMask(maskUrl);
    return {
      ...summary,
      depthData: depth.data,
      maskData: mask.data,
      maskWidth: mask.width,
      maskHeight: mask.height,
    };
  },

  async create(input: ProjectCreateInput) {
    const userId = await getCurrentUserId();
    const path = sourceImagePath(userId, input.id, input.sourceImageExtension);
    await uploadObject(path, input.sourceImageBlob, input.sourceImageBlob.type || "image/jpeg");

    await insertProject({
      id: input.id,
      user_id: userId,
      name: input.name,
      status: "processing",
      source_image_path: path,
      image_width: input.imageWidth,
      image_height: input.imageHeight,
    });

    await Promise.all([
      insertHistoryEvent({
        project_id: input.id,
        user_id: userId,
        event_type: "project_created",
        metadata: { name: input.name },
      }),
      insertHistoryEvent({
        project_id: input.id,
        user_id: userId,
        event_type: "image_uploaded",
        metadata: { width: input.imageWidth, height: input.imageHeight },
      }),
      insertHistoryEvent({
        project_id: input.id,
        user_id: userId,
        event_type: "reconstruction_started",
        metadata: {},
      }),
    ]);
  },

  async importAsset(input: ProjectImportInput) {
    const userId = await getCurrentUserId();
    const primary = input.files.find((file) => file.name === input.primaryFileName);
    if (!primary) throw new Error(`The selected model file "${input.primaryFileName}" is missing.`);

    const primaryPath = modelPath(userId, input.id, input.format);
    const companions = input.files
      .filter((file) => file !== primary)
      .map((file, index) => ({
        ...file,
        path: importedAssetPath(userId, input.id, file.name, index),
      }));

    try {
      const uploads = await Promise.allSettled([
        uploadObject(primaryPath, primary.file, primary.mimeType || "application/octet-stream"),
        ...companions.map((file) =>
          uploadObject(file.path, file.file, file.mimeType || "application/octet-stream"),
        ),
      ]);
      const failedUpload = uploads.find((result) => result.status === "rejected");
      if (failedUpload?.status === "rejected") throw failedUpload.reason;

      await insertProject({
        id: input.id,
        user_id: userId,
        name: input.name,
        status: "completed",
        model_path: primaryPath,
        model_format: input.format,
        vertex_count: input.vertexCount,
        face_count: input.faceCount,
        reconstruction_settings: {
          kind: "imported-asset",
          importedAsset: {
            primaryFileName: input.primaryFileName,
            format: input.format,
            mimeType: primary.mimeType || "application/octet-stream",
            sizeBytes: primary.file.size,
            files: companions.map((file) => ({
              path: file.path,
              name: file.name,
              mimeType: file.mimeType || "application/octet-stream",
              sizeBytes: file.file.size,
            })),
          },
        },
      });
    } catch (error) {
      await removeProjectFolder(userId, input.id).catch(() => {});
      throw error;
    }

    try {
      await insertHistoryEvent({
        project_id: input.id,
        user_id: userId,
        event_type: "asset_imported",
        metadata: {
          format: input.format,
          fileName: input.primaryFileName,
          sizeBytes: primary.file.size,
          vertexCount: input.vertexCount,
          faceCount: input.faceCount,
        },
      });
    } catch (error) {
      console.warn(
        "The imported project was saved, but its history event could not be recorded.",
        error,
      );
    }
  },

  async complete(id, input: ProjectCompleteInput) {
    const userId = await getCurrentUserId();
    const depthBlob = await encodeDepthMapBlob({
      width: input.depthWidth,
      height: input.depthHeight,
      data: input.depthData,
    });
    const depthPath = depthMapPath(userId, id);
    const thumbPath = thumbnailPath(userId, id);
    await Promise.all([
      uploadObject(depthPath, depthBlob, "image/png"),
      uploadObject(thumbPath, input.thumbnailBlob, "image/jpeg"),
    ]);

    await updateProject(id, {
      status: "completed",
      depth_map_path: depthPath,
      thumbnail_path: thumbPath,
      depth_width: input.depthWidth,
      depth_height: input.depthHeight,
      vertex_count: input.vertexCount,
      face_count: input.faceCount,
      reconstruction_settings: {
        quality: input.quality,
        detail: input.detail,
        smoothing: input.smoothing,
        edgeFeather: input.edgeFeather,
        volume: input.volume,
        colorGrading: input.colorGrading,
        reconstructionMode: input.reconstructionMode,
      },
      error_message: null,
    });

    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "reconstruction_completed",
      metadata: { vertexCount: input.vertexCount, faceCount: input.faceCount },
    });
  },

  async markFailed(id, message) {
    const userId = await getCurrentUserId();
    await updateProject(id, { status: "failed", error_message: message });
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "reconstruction_failed",
      metadata: { message },
    });
  },

  async updateSettings(id, input: ProjectSettingsInput) {
    await updateProject(id, {
      reconstruction_settings: {
        quality: input.quality,
        detail: input.detail,
        smoothing: input.smoothing,
        edgeFeather: input.edgeFeather,
        volume: input.volume,
        colorGrading: input.colorGrading,
        reconstructionMode: input.reconstructionMode,
      },
    });
  },

  async recordExport(id, input: ProjectExportInput) {
    const userId = await getCurrentUserId();
    const path = modelPath(userId, id, input.modelFormat);
    await uploadObject(path, input.modelBlob, input.modelBlob.type || "application/octet-stream");
    await updateProject(id, { model_path: path, model_format: input.modelFormat });
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "model_exported",
      metadata: { format: input.modelFormat },
    });
  },

  async saveMask(id, input: ProjectMaskInput) {
    const userId = await getCurrentUserId();
    const path = maskPath(userId, id);
    await uploadObject(path, input.maskBlob, "image/png");
    await updateProject(id, { mask_path: path });
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "silhouette_edited",
      metadata: { width: input.maskWidth, height: input.maskHeight },
    });
  },

  async saveMultiView(id, input: ProjectMultiViewInput) {
    const userId = await getCurrentUserId();

    const paths: Record<string, StoredMultiViewPathEntry> = {};
    await Promise.all(
      input.views.map(async (view) => {
        const path = multiViewPath(userId, id, view.angle);
        await uploadObject(path, view.blob, "image/png");
        paths[view.angle] = {
          path,
          width: view.width,
          height: view.height,
          confidence: view.confidence,
          provider: view.provider,
          model: view.model,
          generatedAt: Date.now(),
        };
      }),
    );

    await updateProject(id, {
      multi_view_status: input.status,
      multi_view_paths: paths,
      multi_view_meta: { maskVersion: input.maskVersion },
    });
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "multiview_generated",
      metadata: { status: input.status, angles: input.views.map((v) => v.angle) },
    });
  },

  async markMultiViewStale(id) {
    await updateProject(id, { multi_view_status: "stale" });
  },

  async rename(id, name) {
    const userId = await getCurrentUserId();
    await updateProject(id, { name });
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "project_renamed",
      metadata: { name },
    });
  },

  async touchOpened(id) {
    const userId = await getCurrentUserId();
    await touchLastOpened(id);
    await insertHistoryEvent({
      project_id: id,
      user_id: userId,
      event_type: "project_opened",
      metadata: {},
    });
  },

  async remove(id) {
    const userId = await getCurrentUserId();
    await removeProjectFolder(userId, id);
    await deleteProject(id);
  },
};
