-- Recording something that was not a bet.
--
-- The table has always been the right shape for this: bet_id and violation_id
-- are both nullable, and a row with neither is simply a debt between two people.
-- What stopped it was that nothing could create one. There is no INSERT policy
-- on ledger_entries — every row so far has come from resolve_bet,
-- resolve_closest or add_violation, all security definer — and a manual entry
-- has nothing to call itself, because a bet-derived entry borrows its name from
-- the bets row it points at and this has no bets row.

alter table ledger_entries add column if not exists note text
  check (note is null or char_length(note) between 1 and 80);

comment on column ledger_entries.note is
  'What a manual entry was for ("Dinner at the Anchor"). Entries that come from '
  'a bet or a jar violation take their name from those and leave this null.';

/**
 * Record a debt that did not come from a bet.
 *
 * Either direction, decided by p_i_owe. You may only do this with somebody you
 * share a group with — the same bar profiles are visible over — and the other
 * person is told, because one side can write a row that says the other owes
 * them. That is the same trust the app already assumes: either party can mark
 * an entry settled without asking, and none of it is money.
 */
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

  -- No bet and no violation, so ledger_entry_currency() would fall through to
  -- its 'GBP' default. The caller says what unit this is in instead.
  code := upper(coalesce(nullif(btrim(p_currency), ''), 'GBP'));
  if char_length(code) <> 3 then raise exception 'bad_currency'; end if;

  -- from_user owes to_user, which is the whole of the direction.
  insert into ledger_entries (from_user, to_user, amount_cents, note, currency)
  values (
    case when p_i_owe then me else p_other end,
    case when p_i_owe then p_other else me end,
    p_amount_cents,
    btrim(p_note),
    code
  )
  returning * into row;

  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = me;
  amount := code || ' ' || to_char(p_amount_cents / 100.0, 'FM999999990.00');

  insert into notifications (user_id, type, title, body, actor_id)
  values (
    p_other,
    'ledger_entry_added',
    actor_name || case when p_i_owe then ' owes you ' else ' says you owe ' end || amount,
    btrim(p_note),
    me
  );

  return row;
end $$;

revoke all on function record_entry(uuid, integer, text, boolean, text) from public, anon;
grant execute on function record_entry(uuid, integer, text, boolean, text) to authenticated;

/**
 * Remove a manual entry.
 *
 * Only manual ones. An entry that came from a bet is that bet's outcome written
 * down, and deleting it would leave the bet resolved with its consequence
 * missing — that is what settling is for. A typo in something you recorded by
 * hand has no such record behind it and should just go.
 */
create or replace function delete_entry(p_entry uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e ledger_entries;
begin
  select * into e from ledger_entries where id = p_entry;
  if e.id is null then raise exception 'no_such_entry'; end if;
  if e.bet_id is not null or e.violation_id is not null then raise exception 'not_manual'; end if;
  if not (auth.uid() = e.from_user or auth.uid() = e.to_user) then
    raise exception 'not_party';
  end if;
  delete from ledger_entries where id = p_entry;
end $$;

revoke all on function delete_entry(uuid) from public, anon;
grant execute on function delete_entry(uuid) to authenticated;
