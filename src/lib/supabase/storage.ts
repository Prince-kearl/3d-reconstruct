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
  const subfolders = ["source", "depth", "masks", "thumbnails", "models"];
  for (const folder of subfolders) {
    const { data: files } = await supabase.storage.from(BUCKET).list(`${prefix}/${folder}`);
    if (files?.length) {
      await supabase.storage.from(BUCKET).remove(files.map((f) => `${prefix}/${folder}/${f.name}`));
    }
  }
}
