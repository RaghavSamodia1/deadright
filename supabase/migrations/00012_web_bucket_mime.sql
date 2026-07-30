-- Storage matches the *full* Content-Type string, so the allowlist in 00011
-- ('text/html') rejected the 'text/html; charset=utf-8' every uploader actually
-- sends, with a 415 invalid_mime_type. Writes to this bucket are deploys under
-- the service role, so it is not an upload surface that needs narrowing.
update storage.buckets set allowed_mime_types = null where id = 'web';
