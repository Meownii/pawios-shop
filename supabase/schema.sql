-- Private Doodle Room inbox. Run this in the Supabase SQL Editor.
-- After this finishes, only the allowlisted Pawio account can read submissions.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.doodles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default 'Anonymous' check (char_length(nickname) <= 24),
  image_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.doodles enable row level security;
revoke all on public.doodles from public;
revoke all on public.doodles from anon, authenticated;
grant select on public.doodles to authenticated;
grant all on public.doodles to service_role;

create table if not exists public.doodle_admin_emails (
  email text primary key check (email = lower(btrim(email)))
);
alter table public.doodle_admin_emails enable row level security;
revoke all on public.doodle_admin_emails from public, anon, authenticated;
grant all on public.doodle_admin_emails to service_role;

create or replace function public.is_doodle_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.doodle_admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_doodle_admin() from public, anon;
grant execute on function public.is_doodle_admin() to authenticated, service_role;

-- Remove every previous table policy so an older public rule cannot survive.
do $private$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'doodles'
  loop
    execute format('drop policy %I on public.doodles', p.policyname);
  end loop;
end
$private$;
create policy "private admin can view doodles" on public.doodles
  for select to authenticated
  using (public.is_doodle_admin());

-- The bucket must be private. Existing drawings will no longer have public URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doodle-submissions', 'doodle-submissions', false, 524288, array['image/png'])
on conflict (id) do update
set public = false, file_size_limit = 524288, allowed_mime_types = array['image/png'];

-- Remove any earlier Storage policy that mentions this bucket only.
do $private$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%doodle-submissions%'
        or coalesce(with_check, '') ilike '%doodle-submissions%'
      )
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end
$private$;
create policy "doodle admins can read private images" on storage.objects
  for select to authenticated
  using (bucket_id = 'doodle-submissions' and public.is_doodle_admin());

-- The Edge Function applies a five-submission limit per IP per 15 minutes.
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
language plpgsql
security definer
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
