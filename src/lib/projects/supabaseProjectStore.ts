import { decodeDepthMap, encodeDepthMapBlob } from "@/lib/depth";
import { NEUTRAL_GRADING, type ColorGrading } from "@/lib/mesh/applyColorGrading";
import { decodeMask } from "@/lib/segmentation";
import { supabase } from "@/lib/supabase/client";
import {
  deleteProject,
  getMostRecentProject,
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
  maskPath,
  modelPath,
  removeProjectFolder,
  sourceImagePath,
  thumbnailPath,
  uploadObject,
} from "@/lib/supabase/storage";
import type { Quality } from "@/stores/reconstructStore";

import type {
  ProjectCompleteInput,
  ProjectCreateInput,
  ProjectExportInput,
  ProjectMaskInput,
  ProjectSettingsInput,
  ProjectStore,
  ProjectSummary,
} from "./types";

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

interface ReconstructionSettings {
  quality?: Quality;
  detail?: number;
  smoothing?: number;
  edgeFeather?: number;
  volume?: number;
  colorGrading?: ColorGrading;
}

async function rowToSummary(row: ProjectRow): Promise<ProjectSummary> {
  const [sourceImageUrl, thumbnailUrl, modelUrl] = await Promise.all([
    row.source_image_path ? getSignedUrl(row.source_image_path) : Promise.resolve(""),
    row.thumbnail_path ? getSignedUrl(row.thumbnail_path) : Promise.resolve(null),
    row.model_path ? getSignedUrl(row.model_path) : Promise.resolve(null),
  ]);
  const settings = row.reconstruction_settings as ReconstructionSettings;

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
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
    vertexCount: row.vertex_count ?? 0,
    faceCount: row.face_count ?? 0,
    modelUrl,
    modelFormat: row.model_format,
    errorMessage: row.error_message,
  };
}

export const supabaseProjectStore: ProjectStore = {
  async list() {
    const rows = await listProjects();
    return Promise.all(rows.map(rowToSummary));
  },

  async getMostRecent() {
    const row = await getMostRecentProject();
    return row ? rowToSummary(row) : null;
  },

  async get(id) {
    const row = await getProject(id);
    if (!row) return null;
    const summary = await rowToSummary(row);

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
