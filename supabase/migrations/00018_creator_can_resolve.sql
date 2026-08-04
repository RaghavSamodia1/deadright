-- The creator of a bet could not resolve it. propose_outcome gates on
-- is_bet_participant(), and createBet never writes a bet_participants row for
-- the creator — 00003 says why, deliberately:
--   "creator auto-joins side A? No — spec: creator MAY join."
-- So a creator who didn't take a side hit 'not_participant' on the one action
-- the UI pushed them toward: RESOLVE IT was the primary button on their own bet.
--
-- The fix is the gate, not the spec. Auto-joining the creator to side A would
-- put words in their mouth and move the odds the card shows — a bet with a
-- creator and no takers would read "Side A 100%" when nobody has taken a side
-- at all. Letting them call the result they asked for changes no position.
--
-- It also closes a dead end: a bet nobody joined had nobody who could ever
-- resolve it, and it sat in the feed forever.

create or replace function can_resolve_bet(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_bet_participant(bid)
      or exists (select 1 from bets where id = bid and creator_id = auth.uid());
$$;

-- Restores the creation timeline entry. An earlier attempt at this migration
-- redefined on_bet_created() to add a participant row and dropped this insert,
-- which is what writes "You opened this" on every bet.
create or replace function on_bet_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into bet_events (bet_id, actor_id, kind)
  values (new.id, new.creator_id, 'created');
  return new;
end $$;

create or replace function propose_outcome(p_bet uuid, p_side bet_side, p_evidence text default null)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if not can_resolve_bet(p_bet) then raise exception 'not_resolver'; end if;
  if b.status not in ('active', 'live', 'awaiting') then raise exception 'not_resolvable'; end if;

  update bets set proposed_outcome = p_side,
                  proposed_by = auth.uid(),
                  proposed_at = now(),
                  dispute_deadline = now() + bet_dispute_window()
  where id = p_bet;

  if p_evidence is not null then
    insert into bet_evidence (bet_id, user_id, note) values (p_bet, auth.uid(), p_evidence);
  end if;

  -- Settle straight away. resolve_bet writes the ledger, cred and timeline.
  b := resolve_bet(p_bet, p_side);

  -- Everyone who didn't call it needs to know the clock is running on their
  -- chance to object; the resolver already knows.
  insert into notifications (user_id, type, title, body, bet_id, group_id, actor_id)
  select bp.user_id, 'outcome_proposed',
         'Result called',
         'You have 24 hours to dispute it.',
         p_bet, b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.user_id <> auth.uid();

  return b;
end $$;

-- Whoever may call a result may contest one. Disputes are raised by inserting
-- into disputes (the on_dispute_raised trigger does the unwinding), so the same
-- gap lived in this policy: a creator who took no side could not object either.
drop policy if exists "participants raise disputes" on disputes;
create policy "participants raise disputes"
  on disputes for insert to authenticated
  with check (raised_by = auth.uid() and can_resolve_bet(bet_id));
