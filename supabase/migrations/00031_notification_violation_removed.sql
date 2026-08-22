-- Its own migration on purpose: Postgres will not let a new enum value be used
-- in the same transaction that adds it, and Supabase runs each migration in one.
-- 00032 creates delete_violation(), which notifies with this value.
alter type notification_type add value if not exists 'jar_violation_removed';
