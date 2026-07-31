-- Settle on one person's word; the other side disputes afterwards.
--
-- The old flow parked a bet in `pending_agreement` until every loser agreed,
-- so a settled call sat in limbo whenever the other side simply didn't open the
-- app — the common case. Now proposing an outcome resolves the bet there and
-- then, and the people who didn't call it get a window to contest it. Same
-- shape the Cookie Jar already uses for violations, which is a fair precedent:
-- act immediately, reversible on objection.

alter table bets add column if not exists dispute_deadline timestamptz;

-- How long the other side has to object.
create or replace function bet_dispute_window() returns interval
  language sql immutable as $$ select interval '24 hours' $$;

create or replace function propose_outcome(p_bet uuid, p_side bet_side, p_evidence text default null)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if not is_bet_participant(p_bet) then raise exception 'not_participant'; end if;
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
         'Settled — Side ' || upper(p_side::text) || ' took it',
         'Disagree? You have 24 hours to dispute it.',
         p_bet, b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.user_id <> auth.uid();

  return b;
end $$;

-- Agreeing is now just closing the window early: nothing to tally, because the
-- bet is already resolved. Kept so existing clients don't break.
create or replace function agree_outcome(p_bet uuid)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if not is_bet_participant(p_bet) then raise exception 'not_participant'; end if;

  update bet_participants set agreed = true
  where bet_id = p_bet and user_id = auth.uid();
  perform log_bet_event(p_bet, 'agreed');

  -- Last objector on board → close the window immediately.
  if not exists (
    select 1 from bet_participants
    where bet_id = p_bet and coalesce(agreed, false) = false
  ) then
    update bets set dispute_deadline = now() where id = p_bet returning * into b;
  end if;

  return b;
end $$;

-- A dispute now has to unwind a resolution that already happened. Without this
-- the ledger and cred from the reversed call would stand while the bet showed
-- as disputed.
create or replace function on_dispute_raised()
returns trigger language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = new.bet_id for update;

  -- Objections are only open for the window; after that the result stands.
  if b.status = 'resolved'
     and b.dispute_deadline is not null
     and now() > b.dispute_deadline then
    raise exception 'dispute_window_closed';
  end if;

  if b.status = 'resolved' then
    delete from ledger_entries where bet_id = new.bet_id and status = 'pending';
    delete from cred_events where bet_id = new.bet_id
      and b.resolved_at is not null and created_at >= b.resolved_at;
    update bets set winning_side = null, resolved_by = null, resolved_at = null
    where id = new.bet_id;
  end if;

  update bets set status = 'disputed' where id = new.bet_id;

  insert into bet_events (bet_id, actor_id, kind, payload)
  values (new.bet_id, new.raised_by, 'dispute_raised',
          jsonb_build_object('reason', new.reason));

  insert into notifications (user_id, type, title, bet_id, group_id, actor_id)
  select bp.user_id, 'dispute_raised', 'A result was disputed — the group decides',
         new.bet_id, b.group_id, new.raised_by
  from bet_participants bp
  where bp.bet_id = new.bet_id and bp.user_id <> new.raised_by;

  return new;
end $$;

-- The sweeper escalated stale `pending_agreement` bets. Nothing reaches that
-- state any more; instead, settle the dispute window shut once it lapses so a
-- late objection can't reopen a result everyone has moved on from.
create or replace function close_lapsed_dispute_windows() returns void
language sql security definer set search_path = public as $$
  update bets set dispute_deadline = null
  where status = 'resolved'
    and dispute_deadline is not null
    and now() > dispute_deadline;
$$;
