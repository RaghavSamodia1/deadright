-- A recorded entry is a claim until the other person agrees with it.
--
-- record_entry (00039) wrote a debt straight into the ledger, so one person
-- could assert that another owed them and the balance simply said so. That is
-- how Splitwise works and it matches what the app already assumes elsewhere —
-- either party can mark an entry settled without asking — but a bet-derived
-- entry has a bet behind it that both people joined, and a hand-recorded one
-- has nothing behind it but one person's typing.
--
-- Doing this now is cheap. There are no manual entries in existence yet, so
-- there is nothing to migrate; any that did exist would keep their 'pending'
-- status and a null proposed_by, which reads correctly as "already agreed".
--
-- 'proposed' rather than a separate boolean because every balance query in the
-- app already filters on status = 'pending' — getCounterparties, settleUpWith,
-- the summary. A proposal is therefore excluded from what anybody is owed
-- without a single one of them having to learn about it.

alter table ledger_entries add column if not exists proposed_by uuid references profiles(id);

comment on column ledger_entries.proposed_by is
  'Who recorded this by hand, on entries that need the other side to accept. '
  'Null on anything from a bet or a jar violation, and on entries that predate '
  'acceptance.';

-- ── Recording is now proposing ──────────────────────────────────────────────
create or replace function record_entry(
  p_other        uuid,
  p_amount_cents integer,
  p_note         text,
  p_i_owe        boolean default false,
  p_currency     text default null
) returns ledger_entries language plpgsql security definer set search_path = public as $$
declare
  row        ledger_entries;
  me         uuid := auth.uid();
  code       text;
  actor_name text;
  amount     text;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  if p_other is null or p_other = me then raise exception 'bad_counterparty'; end if;
  if not shares_group_with(p_other) then raise exception 'not_member'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'bad_amount'; end if;
  if p_note is null or btrim(p_note) = '' then raise exception 'note_required'; end if;

  code := upper(coalesce(nullif(btrim(p_currency), ''), 'GBP'));
  if char_length(code) <> 3 then raise exception 'bad_currency'; end if;

  insert into ledger_entries (from_user, to_user, amount_cents, note, currency, status, proposed_by)
  values (
    case when p_i_owe then me else p_other end,
    case when p_i_owe then p_other else me end,
    p_amount_cents,
    btrim(p_note),
    code,
    'proposed',
    me
  )
  returning * into row;

  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = me;
  amount := code || ' ' || to_char(p_amount_cents / 100.0, 'FM999999990.00');

  insert into notifications (user_id, type, title, body, actor_id)
  values (
    p_other,
    'ledger_entry_added',
    actor_name || case when p_i_owe then ' says they owe you ' else ' says you owe ' end || amount,
    btrim(p_note),
    me
  );

  return row;
end $$;

revoke all on function record_entry(uuid, integer, text, boolean, text) from public, anon;
grant execute on function record_entry(uuid, integer, text, boolean, text) to authenticated;

-- ── Agreeing, or not ────────────────────────────────────────────────────────
/**
 * Only the person who was asked may answer, which is the whole point: the
 * proposer accepting their own claim would be the behaviour this replaces.
 */
create or replace function accept_entry(p_entry uuid)
returns ledger_entries language plpgsql security definer set search_path = public as $$
declare e ledger_entries; me uuid := auth.uid(); actor_name text;
begin
  select * into e from ledger_entries where id = p_entry for update;
  if e.id is null then raise exception 'no_such_entry'; end if;
  if e.status <> 'proposed' then raise exception 'not_proposed'; end if;
  if me is null or me = e.proposed_by then raise exception 'not_yours_to_accept'; end if;
  if not (me = e.from_user or me = e.to_user) then raise exception 'not_party'; end if;

  update ledger_entries set status = 'pending' where id = p_entry returning * into e;

  select coalesce(display_name, handle, 'Someone') into actor_name from profiles where id = me;
  insert into notifications (user_id, type, title, body, actor_id)
  values (e.proposed_by, 'ledger_entry_accepted',
          actor_name || ' agreed', e.note, me);

  return e;
end $$;

/**
 * Declining removes the row rather than parking it in a third state. Nothing
 * was owed, so there is nothing to keep a record of; the proposer is told, and
 * that notification is the record.
 */
create or replace function decline_entry(p_entry uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e ledger_entries; me uuid := auth.uid(); actor_name text;
begin
  select * into e from ledger_entries where id = p_entry for update;
  if e.id is null then raise exception 'no_such_entry'; end if;
  if e.status <> 'proposed' then raise exception 'not_proposed'; end if;
  if me is null or me = e.proposed_by then raise exception 'not_yours_to_accept'; end if;
  if not (me = e.from_user or me = e.to_user) then raise exception 'not_party'; end if;

  delete from ledger_entries where id = p_entry;

  select coalesce(display_name, handle, 'Someone') into actor_name from profiles where id = me;
  insert into notifications (user_id, type, title, body, actor_id)
  values (e.proposed_by, 'ledger_entry_declined',
          actor_name || ' didn''t agree', e.note, me);
end $$;

revoke all on function accept_entry(uuid) from public, anon;
grant execute on function accept_entry(uuid) to authenticated;
revoke all on function decline_entry(uuid) from public, anon;
grant execute on function decline_entry(uuid) to authenticated;

-- ── Undoing a settle ────────────────────────────────────────────────────────
/**
 * Marking something settled was one tap with no way back, and either party can
 * do it. Reopening is the same act in reverse and belongs to the same people.
 *
 * A proposal was never settled, so there is nothing to reopen.
 */
create or replace function unsettle_entry(p_entry uuid)
returns ledger_entries language plpgsql security definer set search_path = public as $$
declare e ledger_entries; me uuid := auth.uid();
begin
  select * into e from ledger_entries where id = p_entry for update;
  if e.id is null then raise exception 'no_such_entry'; end if;
  if e.status <> 'settled' then raise exception 'not_settled'; end if;
  if not (me = e.from_user or me = e.to_user) then raise exception 'not_party'; end if;

  update ledger_entries set status = 'pending', settled_at = null
  where id = p_entry returning * into e;
  return e;
end $$;

revoke all on function unsettle_entry(uuid) from public, anon;
grant execute on function unsettle_entry(uuid) to authenticated;
