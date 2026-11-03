-- Run in the Supabase SQL Editor. This creates or upgrades the Doodle Room
-- to publish visitor drawings immediately, with no moderation queue or admin panel.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.doodles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default 'Anonymous' check (char_length(nickname) <= 24),
  image_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.doodles enable row level security;

-- Remove the previous approval workflow if the earlier schema was already installed.
drop policy if exists "approved doodles are visible" on public.doodles;
drop policy if exists "admins can read all doodles" on public.doodles;
drop policy if exists "admins can update doodles" on public.doodles;
drop policy if exists "admins can delete doodles" on public.doodles;
drop policy if exists "public doodles are visible" on public.doodles;
drop policy if exists "approved doodle images are visible" on storage.objects;
drop policy if exists "admins can delete doodle images" on storage.objects;
drop policy if exists "public doodle gallery images are visible" on storage.objects;
drop index if exists public.doodles_public_gallery_idx;
drop index if exists public.doodles_moderation_idx;
alter table public.doodles drop column if exists status;
drop function if exists public.is_doodle_admin();
drop table if exists public.doodle_admins;

create index if not exists doodles_gallery_idx on public.doodles (created_at desc);
create policy "public doodles are visible" on public.doodles
  for select to anon, authenticated using (true);
revoke all on public.doodles from public;
revoke insert, update, delete on public.doodles from anon, authenticated;
grant select on public.doodles to anon, authenticated;
grant all on public.doodles to service_role;

-- Images are public because they are submitted specifically for the shared gallery.
-- Only the server-side Edge Function can upload; no public upload policy is created.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doodle-submissions', 'doodle-submissions', true, 524288, array['image/png'])
on conflict (id) do update
set public = true, file_size_limit = 524288, allowed_mime_types = array['image/png'];

create policy "public doodle gallery images are visible" on storage.objects
  for select to anon, authenticated using (bucket_id = 'doodle-submissions');

-- The Edge Function uses this table for a five-submission limit per IP per 15 minutes.
create table if not exists public.doodle_submission_limits (
  window_key text primary key,
  submission_count integer not null,
  expires_at timestamptz not null
);
alter table public.doodle_submission_limits enable row level security;
revoke all on public.doodle_submission_limits from public, anon, authenticated;
grant all on public.doodle_submission_limits to service_role;

create or replace function public.consume_doodle_submission(p_window_key text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare current_count integer;
begin
  delete from public.doodle_submission_limits where expires_at < now();
  insert into public.doodle_submission_limits (window_key, submission_count, expires_at)
  values (p_window_key, 1, now() + interval '20 minutes')
  on conflict (window_key) do update
    set submission_count = public.doodle_submission_limits.submission_count + 1,
        expires_at = excluded.expires_at
  returning submission_count into current_count;
  return current_count <= 5;
end;
$$;
revoke all on function public.consume_doodle_submission(text) from public, anon, authenticated;
grant execute on function public.consume_doodle_submission(text) to service_role;
