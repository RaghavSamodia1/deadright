-- Its own migration on purpose: Postgres will not let a new enum value be used
-- in the same transaction that adds it, and Supabase runs each migration in one.
-- 00028 creates reset_my_ledger(), which notifies with this value.
alter type notification_type add value if not exists 'ledger_reset';
