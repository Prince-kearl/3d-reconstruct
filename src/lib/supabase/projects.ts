import { supabase } from "./client";

export type ProjectStatus = "processing" | "completed" | "failed";

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  source_image_path: string | null;
  thumbnail_path: string | null;
  depth_map_path: string | null;
  mask_path: string | null;
  model_path: string | null;
  model_format: string | null;
  image_width: number | null;
  image_height: number | null;
  depth_width: number | null;
  depth_height: number | null;
  vertex_count: number | null;
  face_count: number | null;
  reconstruction_settings: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export type NewProjectRow = Pick<ProjectRow, "id" | "user_id" | "name" | "status"> &
  Partial<Omit<ProjectRow, "id" | "user_id" | "name" | "status">>;

export interface HistoryRow {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function insertProject(row: NewProjectRow): Promise<ProjectRow> {
  const { data, error } = await supabase.from("projects").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<ProjectRow, "id" | "user_id" | "created_at">>,
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function touchLastOpened(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase.from("projects").select().eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select()
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMostRecentProject(): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select()
    .order("last_opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function insertHistoryEvent(
  row: Omit<HistoryRow, "id" | "created_at">,
): Promise<void> {
  const { error } = await supabase.from("project_history").insert(row);
  if (error) throw error;
}

export async function listHistoryEvents(projectId: string): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from("project_history")
    .select()
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
