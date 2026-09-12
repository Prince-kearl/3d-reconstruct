-- Adds storage for a user-edited silhouette mask (Refine's silhouette brush),
-- distinct from the automatic background-removal mask which is recomputed
-- from the model on every load. When present, this overrides the automatic
-- mask so manual touch-ups survive a reload.
alter table public.projects add column if not exists mask_path text;
