-- ============================================================================
-- Videos: one row per generation request, owned by a single user.
-- ============================================================================

create type public.video_status as enum ('queued', 'processing', 'completed', 'failed');

create table public.videos (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt            text not null check (char_length(prompt) between 1 and 2000),
  aspect_ratio      text not null check (aspect_ratio in ('16:9', '9:16')),
  input_image_path  text,
  status            public.video_status not null default 'queued',
  provider          text not null,
  provider_job_id   text,
  video_path        text,           -- object path in the private `videos` bucket
  remote_video_url  text,           -- provider URL, kept as a fallback
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index videos_user_created_idx on public.videos (user_id, created_at desc);
create index videos_user_status_idx on public.videos (user_id, status)
  where status in ('queued', 'processing');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;

create policy "Users can read their own videos"
  on public.videos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own videos"
  on public.videos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own videos"
  on public.videos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own videos"
  on public.videos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- Storage: private buckets, each user may only touch objects under `<uid>/`.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('inputs', 'inputs', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('videos', 'videos', false, 524288000, array['video/mp4'])
on conflict (id) do nothing;

create policy "Users can read their own media"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('inputs', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('inputs', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('inputs', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('inputs', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
