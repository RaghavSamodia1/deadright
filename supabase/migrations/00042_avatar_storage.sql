-- Somewhere to put a profile photo.
--
-- profiles.avatar_url has existed since 00001 and every Avatar in the app reads
-- it, but nothing could ever write one: the edit screen showed a "Change photo"
-- control that was a Pressable with no onPress. This is the bucket that makes
-- it real.
--
-- Public, unlike the evidence bucket. Avatars render in lists, bet cards and
-- member rows, and a private bucket would mean minting a signed URL for every
-- face on every screen. The tradeoff is that somebody holding the URL can fetch
-- the image without being in your group — the URL itself is only discoverable
-- through a profile row, which 00034 already restricts to people you share a
-- group with, and the path carries a uuid so it cannot be guessed.
--
-- Path convention (see src/api/profile.ts): <user_id>/<timestamp>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,                                  -- 2 MB; the picker downscales first
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Your own folder, and only your own.
drop policy if exists "write own avatar" on storage.objects;
create policy "write own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
