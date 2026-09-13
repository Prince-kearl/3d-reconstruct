-- Adds storage for AI-generated multi-view images (Reconstruct's optional
-- "AI Multi-View" mode), used to build more convincing side geometry than
-- pure depth-tapering alone. All columns are nullable/additive — existing
-- projects with no multi-view data keep working unchanged, and reading a
-- project with these columns unset must be treated as "never generated".
alter table public.projects add column if not exists multi_view_status text;
alter table public.projects add column if not exists multi_view_paths jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists multi_view_meta jsonb not null default '{}'::jsonb;
