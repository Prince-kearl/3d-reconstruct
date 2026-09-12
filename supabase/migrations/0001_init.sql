-- Phase 1B schema: profiles, projects, project_history, and the storage
-- bucket backing them. Run this once in the Supabase SQL editor.

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),

  source_image_path text,
  thumbnail_path text,
  depth_map_path text,
  model_path text,
  model_format text,

  image_width int,
  image_height int,
  depth_width int,
  depth_height int,
  vertex_count int,
  face_count int,

  reconstruction_settings jsonb not null default '{}'::jsonb,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now()
);

create index if not exists projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- project_history
-- ---------------------------------------------------------------------
create table if not exists public.project_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_history_project_id_created_at_idx
  on public.project_history (project_id, created_at desc);

alter table public.project_history enable row level security;

create policy "history_select_own" on public.project_history
  for select using (auth.uid() = user_id);
create policy "history_insert_own" on public.project_history
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Storage: one private bucket, objects at {user_id}/{project_id}/...
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('projects', 'projects', false)
on conflict (id) do nothing;

create policy "storage_select_own" on storage.objects
  for select using (
    bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "storage_update_own" on storage.objects
  for update using (
    bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text
  );
