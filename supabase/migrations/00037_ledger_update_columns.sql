-- Settling is the only edit a client may make to a ledger entry.
--
-- "counterparties settle" (00002) allows an update to any row you are a party
-- to, which is the right set of rows — but a policy can only choose rows, never
-- columns, and its WITH CHECK defaults to the same test as its USING. So the
-- permission that lets you mark a £5 debt settled has also been letting you
-- rewrite the amount to 5p, or set from_user to yourself so the debt points the
-- other way; the row still passes "am I a party to this", because you are.
--
-- That is reachable from anywhere. EXPO_PUBLIC_SUPABASE_ANON_KEY ships inside
-- the app bundle by design, so this was never protected by the client only
-- offering a Settle button.
--
-- Postgres will not express "only these columns changed" in a policy, but it
-- will express it as a grant. Column privileges are ANDed with RLS: you may
-- touch status and settled_at, and only on rows the policy already allows.
revoke update on table ledger_entries from authenticated, anon;
grant update (status, settled_at) on table ledger_entries to authenticated;

-- Amounts and parties are written once, by resolve_bet / resolve_closest /
-- add_violation, which are security definer and unaffected by the above.

-- Say the check out loud rather than leaning on the default, so the next person
-- to read this policy can see what a settling client is held to.
drop policy if exists "counterparties settle" on ledger_entries;
create policy "counterparties settle"
  on ledger_entries for update to authenticated
  using (from_user = auth.uid() or to_user = auth.uid())
  with check (from_user = auth.uid() or to_user = auth.uid());

-- ── Prove it ────────────────────────────────────────────────────────────────
do $$
declare bad text;
begin
  select string_agg(column_name, ', ') into bad
  from information_schema.column_privileges
  where table_schema = 'public'
    and table_name = 'ledger_entries'
    and grantee = 'authenticated'
    and privilege_type = 'UPDATE'
    and column_name not in ('status', 'settled_at');
  if bad is not null then
    raise exception 'authenticated can still update: %', bad;
  end if;
end $$;
