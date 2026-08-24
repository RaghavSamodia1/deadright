-- Their own migration on purpose: Postgres will not let a new enum value be
-- used in the transaction that adds it, and Supabase runs each migration in
-- one. 00041 uses all three.
alter type ledger_status add value if not exists 'proposed';
alter type notification_type add value if not exists 'ledger_entry_accepted';
alter type notification_type add value if not exists 'ledger_entry_declined';
