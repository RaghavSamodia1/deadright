-- Public bucket for the Party Pool guest page.
--
-- The pool edge function cannot serve the page itself: Supabase rewrites
-- text/html to text/plain with nosniff on the shared *.supabase.co functions
-- domain, so a guest opening the link sees raw markup. Storage serves objects
-- with their stored content type, so the page lives here and calls the
-- function's JSON API (/pool/<token>/data, /results, POST join).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- allowed_mime_types is left null: Storage matches the *full* Content-Type
-- string, so an allowlist of 'text/html' rejects the 'text/html; charset=utf-8'
-- that every uploader actually sends. Writes here are deploys under the service
-- role, so the bucket is not an upload surface that needs narrowing.
values ('web', 'web', true, 2097152, null)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = null;

-- Read-only to the world; writes are deploys, done with the service role.
drop policy if exists "web is public" on storage.objects;
create policy "web is public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'web');
