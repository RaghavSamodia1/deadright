-- ── Evidence storage ─────────────────────────────────────────────────────────
-- Photos attached to resolutions and disputes. Private bucket: files are only
-- reachable through signed URLs minted for people who can already see the bet.
--
-- Path convention (see src/api/resolution.ts): <bet_id>/<timestamp>.<ext>
-- The first path segment is the bet id, which is what the policies below check.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,                                    -- private; served via signed URLs
  10485760,                                 -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read: anyone who can see the bet can see its evidence.
create policy "read evidence for visible bets"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and can_see_bet(((storage.foldername(name))[1])::uuid)
  );

-- Write: only participants of that bet may attach evidence.
create policy "participants upload evidence"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and owner = auth.uid()
    and is_bet_participant(((storage.foldername(name))[1])::uuid)
  );

-- Delete: only your own upload, and only while the bet isn't settled.
create policy "delete own evidence pre-resolution"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and owner = auth.uid()
    and exists (
      select 1 from bets b
      where b.id = ((storage.foldername(name))[1])::uuid
        and b.status not in ('resolved', 'controversial')
    )
  );
