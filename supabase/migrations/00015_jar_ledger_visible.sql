-- The Cookie Jar total read $0.00 for everyone except the person who owed it.
--
-- A jar violation writes a ledger entry with to_user null (null = the pot), so
-- the only row that matched "own ledger entries"
-- (from_user = auth.uid() or to_user = auth.uid()) was the violator's own. Every
-- other member of the group summed an empty set. A shared pot that only one
-- person can see is not a shared pot.
--
-- Scoped deliberately to jar entries: a bet's ledger row is a debt between two
-- named people and stays visible only to them.
create policy "group jar entries visible to members"
  on ledger_entries for select to authenticated
  using (
    violation_id is not null
    and exists (
      select 1 from jar_violations jv
      where jv.id = ledger_entries.violation_id
        and is_group_member(jv.group_id)
    )
  );
