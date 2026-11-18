-- ============================================================================
-- Only the server may create or change video rows and generated video files.
--
-- Previously users could UPDATE/INSERT their own rows through the public API,
-- which let them set `remote_video_url` / `status` to anything — the server
-- would then fetch an attacker-chosen URL (SSRF) or serve fake results.
-- Writes now go through route handlers using the service-role key, which
-- bypasses RLS after the handler has verified the user and validated input.
-- ============================================================================

-- videos table: read-only for users ------------------------------------------
drop policy if exists "Users can create their own videos" on public.videos;
drop policy if exists "Users can update their own videos" on public.videos;
drop policy if exists "Users can delete their own videos" on public.videos;

revoke insert, update, delete on public.videos from anon, authenticated;

-- storage: users may upload input images; generated videos are server-only ---
drop policy if exists "Users can read their own media" on storage.objects;
drop policy if exists "Users can upload their own media" on storage.objects;
drop policy if exists "Users can update their own media" on storage.objects;
drop policy if exists "Users can delete their own media" on storage.objects;

create policy "Users can read their own media"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('inputs', 'videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own input images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own input images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
