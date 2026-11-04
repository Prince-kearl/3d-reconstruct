import { supabase } from "./client";

const BUCKET = "projects";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function objectPath(userId: string, projectId: string, ...parts: string[]) {
  return [userId, projectId, ...parts].join("/");
}

export function sourceImagePath(userId: string, projectId: string, extension: string) {
  return objectPath(userId, projectId, "source", `original.${extension}`);
}

export function depthMapPath(userId: string, projectId: string) {
  return objectPath(userId, projectId, "depth", "depth.png");
}

export function maskPath(userId: string, projectId: string) {
  return objectPath(userId, projectId, "masks", "mask.png");
}

export function thumbnailPath(userId: string, projectId: string) {
  return objectPath(userId, projectId, "thumbnails", "thumbnail.jpg");
}

export function modelPath(userId: string, projectId: string, format: string) {
  return objectPath(userId, projectId, "models", `model.${format}`);
}

export function importedAssetPath(
  userId: string,
  projectId: string,
  fileName: string,
  sequence: number,
) {
  const safeName = fileName
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 128);
  return objectPath(
    userId,
    projectId,
    "imported",
    `asset-${sequence.toString().padStart(4, "0")}-${safeName || "asset.bin"}`,
  );
}

export function multiViewPath(userId: string, projectId: string, angle: string) {
  return objectPath(userId, projectId, "views", `${angle}.png`);
}

export async function uploadObject(path: string, blob: Blob, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeProjectFolder(userId: string, projectId: string): Promise<void> {
  const prefix = objectPath(userId, projectId);
  const subfolders = ["source", "depth", "masks", "thumbnails", "models", "views", "imported"];
  const storage = supabase.storage.from(BUCKET);
  const pageSize = 1000;
  for (const folder of subfolders) {
    const folderPath = `${prefix}/${folder}`;
    const filePaths: string[] = [];
    let offset = 0;
    while (true) {
      const { data: files, error } = await storage.list(folderPath, { limit: pageSize, offset });
      if (error) throw error;
      const page = files ?? [];
      filePaths.push(...page.map((file) => `${folderPath}/${file.name}`));
      if (page.length < pageSize) break;
      offset += page.length;
    }
    for (let index = 0; index < filePaths.length; index += pageSize) {
      const { error } = await storage.remove(filePaths.slice(index, index + pageSize));
      if (error) throw error;
    }
  }
}
