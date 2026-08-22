-- Removing a violation from the jar.
--
-- Violations are added in one tap, often on someone else's behalf and usually
-- mid-conversation, so they get mis-tapped: wrong rule, wrong person, or a
-- second tap that lands twice. Until now there was no way back — the amount sat
-- in the group's jar permanently and the only alternative was disputing your
-- own friend, which is a lot of ceremony for a fat thumb.
--
-- Two things decide the guards:
--
--   * ledger_entries.violation_id is ON DELETE SET NULL, so deleting the
--     violation alone leaves the ledger row ALIVE with its link cut — money in
--     the jar with nothing behind it, and no way to work out what it was for.
--     The entry is deleted explicitly, first.
--   * settle_jar() flips those entries to 'settled' and writes a
--     jar_settlements row with the total. Once that has happened the amount has
--     been counted in a settlement everyone has seen, and taking it back out
--     would make the settlement wrong retrospectively. So: pending only.

create or replace function delete_violation(p_violation uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v jar_violations;
  r jar_rules;
  actor_name text;
begin
  select * into v from jar_violations where id = p_violation for update;
  if v.id is null then raise exception 'no_such_violation'; end if;

  -- Whoever put it in can take it out; so can a group admin, who is the one
  -- people will ask when it was not their tap. Notably NOT the violator on
  -- their own: that is what disputing is for, and it leaves a record.
  if v.reporter_id <> auth.uid()
     and not exists (
       select 1 from group_members
       where group_id = v.group_id and user_id = auth.uid() and role = 'admin'
     )
  then
    raise exception 'not_allowed';
  end if;

  -- Already counted into a settle-up. Removing it now would quietly change a
  -- total the group has already divided up.
  if exists (
    select 1 from ledger_entries
    where violation_id = p_violation and status <> 'pending'
  ) then
    raise exception 'already_settled';
  end if;

  select * into r from jar_rules where id = v.rule_id;
  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = auth.uid();

  -- Before the delete, or the FK nulls the link and the row is unfindable.
  delete from ledger_entries where violation_id = p_violation;

  -- The person who was charged was told they owed it, so they get told it is
  -- gone. Skipped when they removed it themselves.
  if v.violator_id <> auth.uid() then
    insert into notifications (user_id, type, title, body, group_id, actor_id)
    values (
      v.violator_id, 'jar_violation_removed', 'Violation removed',
      actor_name || ' removed "' || coalesce(r.label, 'a rule') || '" — ' ||
        money_text(coalesce(r.amount_cents, 0)) || ' is back out of the jar.',
      v.group_id, auth.uid()
    );
  end if;

  delete from jar_violations where id = p_violation;
end $$;

revoke all on function delete_violation(uuid) from public, anon;
grant execute on function delete_violation(uuid) to authenticated;
