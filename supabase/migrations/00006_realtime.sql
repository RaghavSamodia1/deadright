-- ── Realtime publication ─────────────────────────────────────────────────────
-- Without these, the client's postgres_changes subscriptions connect happily
-- and then never fire, so a social app silently feels dead. RLS still applies
-- to every broadcast change, so people only receive rows they could already
-- read — publishing a table does not widen access.

do $$
declare t text;
begin
  foreach t in array array[
    'bets', 'bet_participants', 'bet_events',
    'notifications', 'jar_violations', 'group_members',
    'pool_entries'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
