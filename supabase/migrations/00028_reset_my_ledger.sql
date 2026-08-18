-- "Reset my ledger" from Settings → Danger Zone.
--
-- A ledger entry is a shared row: one record with a from_user and a to_user. So
-- deleting the caller's entries also removes them from the other person's ledger,
-- and there is no version of this that is purely local. That is why every
-- counterparty is notified — someone else's balance changing without a word is
-- how a bookkeeping app loses trust.
--
-- Jar violation records are deliberately left alone. They belong to a group and
-- were logged by whoever logged them; deleting them would reach further into
-- other people's data than a personal reset should. A jar may therefore read
-- "1 violation · 0" until it is settled again.

create or replace function reset_my_ledger()
returns integer language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  deleted integer;
  actor_name text;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = me;

  -- Who is affected, before the rows go. Only the *other* party, and only where
  -- there is one (jar entries have a null to_user).
  create temp table _affected on commit drop as
  select distinct other_id from (
    select case when from_user = me then to_user else from_user end as other_id
    from ledger_entries
    where from_user = me or to_user = me
  ) x
  where other_id is not null and other_id <> me;

  with gone as (
    delete from ledger_entries
    where from_user = me or to_user = me
    returning 1
  )
  select count(*) into deleted from gone;

  -- Tell them, naming who did it. Sent even when nothing was deleted for them
  -- specifically, because a shared entry that vanishes is always both parties'
  -- business.
  insert into notifications (user_id, type, title, body, actor_id)
  select
    a.other_id,
    'ledger_reset',
    actor_name || ' reset their ledger',
    'Entries you shared with ' || actor_name ||
      ' have been removed, so your balance with them is now clear. Nothing was ' ||
      'paid or received — the ledger only ever tracked what was agreed.',
    me
  from _affected a;

  return deleted;
end $$;

revoke all on function reset_my_ledger() from public, anon;
grant execute on function reset_my_ledger() to authenticated;
