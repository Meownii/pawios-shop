-- Run once in the Supabase SQL editor. Visitor submissions are only accepted by the Edge Function.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.doodle_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.doodle_admins enable row level security;

create table if not exists public.doodles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default 'Anonymous' check (char_length(nickname) <= 24),
  image_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists doodles_public_gallery_idx on public.doodles (created_at desc) where status = 'approved';
create index if not exists doodles_moderation_idx on public.doodles (created_at asc) where status = 'pending';
alter table public.doodles enable row level security;

create or replace function public.is_doodle_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$ select exists (select 1 from public.doodle_admins where user_id = auth.uid()); $$;
revoke all on function public.is_doodle_admin() from public;
grant execute on function public.is_doodle_admin() to anon, authenticated;

drop policy if exists "approved doodles are visible" on public.doodles;
create policy "approved doodles are visible" on public.doodles for select to anon, authenticated using (status = 'approved');
drop policy if exists "admins can read all doodles" on public.doodles;
create policy "admins can read all doodles" on public.doodles for select to authenticated using (public.is_doodle_admin());
drop policy if exists "admins can update doodles" on public.doodles;
create policy "admins can update doodles" on public.doodles for update to authenticated using (public.is_doodle_admin()) with check (public.is_doodle_admin());
drop policy if exists "admins can delete doodles" on public.doodles;
create policy "admins can delete doodles" on public.doodles for delete to authenticated using (public.is_doodle_admin());
revoke insert, update, delete on public.doodles from anon, authenticated;
grant select on public.doodles to anon, authenticated;
grant update, delete on public.doodles to authenticated;
grant all on public.doodles to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doodle-submissions', 'doodle-submissions', false, 524288, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = 524288, allowed_mime_types = array['image/png'];

drop policy if exists "approved doodle images are visible" on storage.objects;
create policy "approved doodle images are visible" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'doodle-submissions' and exists (
    select 1 from public.doodles d where d.image_path = name and (d.status = 'approved' or public.is_doodle_admin())
  )
);
drop policy if exists "admins can delete doodle images" on storage.objects;
create policy "admins can delete doodle images" on storage.objects for delete to authenticated
using (bucket_id = 'doodle-submissions' and public.is_doodle_admin());
-- No browser upload policy is created; the Edge Function alone uses its server-side key to upload.

create table if not exists public.doodle_submission_limits (
  window_key text primary key,
  submission_count integer not null,
  expires_at timestamptz not null
);
alter table public.doodle_submission_limits enable row level security;
revoke all on public.doodle_submission_limits from public, anon, authenticated;

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

-- Replace the example email after creating the owner account through Supabase Auth.
-- insert into public.doodle_admins (user_id)
-- select id from auth.users where lower(email) = lower('OWNER_EMAIL_HERE')
-- on conflict do nothing;
