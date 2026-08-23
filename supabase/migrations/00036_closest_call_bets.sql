-- Over/under, where everyone names their own number and the closest wins.
--
-- Every bet in the app so far has had two sides: bet_participants.side is a
-- non-null two-value enum, and resolve_bet(bet, side) drives the ledger, Form
-- and streaks from which side won. "How many goals?" has no sides — it has as
-- many positions as there are people — so it needs its own way in and its own
-- way out.
--
-- What it does NOT need is its own ledger rule. resolve_bet already says "each
-- loser owes the stake, split evenly across winners", and that generalises to
-- this exactly: two people equidistant from the answer both win and split, and
-- a tie stops being a special case that needs a policy. That is why there is no
-- tiebreak below.

-- ── What kind of call a bet takes ───────────────────────────────────────────
alter table bets add column if not exists call_kind text
  check (call_kind is null or call_kind in ('number', 'date'));
-- What is being counted — "goals", "minutes late". Shown next to the calls so
-- a bare 3.5 means something.
alter table bets add column if not exists call_unit text
  check (call_unit is null or char_length(call_unit) <= 24);
-- The answer, once somebody settles it.
alter table bets add column if not exists actual_number numeric;
alter table bets add column if not exists actual_date timestamptz;

-- ── The calls themselves ────────────────────────────────────────────────────
alter table bet_participants add column if not exists call_number numeric;
alter table bet_participants add column if not exists call_date timestamptz;
-- Set at resolution. A call bet has no winning_side to read the result from,
-- and every screen that wants to know whether you won would otherwise have to
-- recompute the distances for itself.
alter table bet_participants add column if not exists is_winner boolean;

comment on column bet_participants.side is
  'Which side you took. Meaningless on a call bet (call_kind is not null), '
  'where everyone is stored as side a — the column is not-null and the '
  'position is carried by call_number/call_date instead.';

-- ── Joining ────────────────────────────────────────────────────────────────
create or replace function place_call(
  p_bet uuid,
  p_number numeric default null,
  p_date timestamptz default null
) returns bet_participants language plpgsql security definer set search_path = public as $$
declare b bets; row bet_participants;
begin
  select * into b from bets where id = p_bet;
  if b.id is null then raise exception 'no_such_bet'; end if;
  if b.call_kind is null then raise exception 'not_a_call_bet'; end if;
  if b.status in ('resolved', 'controversial', 'cancelled') then
    raise exception 'already_resolved';
  end if;
  if b.deadline < now() then raise exception 'deadline_passed'; end if;
  if b.group_id is not null and not is_group_member(b.group_id) then
    raise exception 'not_member';
  end if;

  if b.call_kind = 'number' and p_number is null then raise exception 'call_required'; end if;
  if b.call_kind = 'date' and p_date is null then raise exception 'call_required'; end if;

  -- Changing your mind before the deadline is allowed; it is the same act.
  insert into bet_participants (bet_id, user_id, side, call_number, call_date)
  values (p_bet, auth.uid(), 'a', p_number, p_date)
  on conflict (bet_id, user_id) do update
    set call_number = excluded.call_number,
        call_date = excluded.call_date
  returning * into row;

  return row;
end $$;

revoke all on function place_call(uuid, numeric, timestamptz) from public, anon;
grant execute on function place_call(uuid, numeric, timestamptz) to authenticated;

-- ── Settling ───────────────────────────────────────────────────────────────
create or replace function resolve_closest(
  p_bet uuid,
  p_number numeric default null,
  p_date timestamptz default null
) returns bets language plpgsql security definer set search_path = public as $$
declare
  b bets;
  winner_count int;
  loser record;
  winner record;
  share int;
  actor_name text;
begin
  select * into b from bets where id = p_bet for update;
  if b.id is null then raise exception 'no_such_bet'; end if;
  if b.call_kind is null then raise exception 'not_a_call_bet'; end if;
  if not can_resolve_bet(p_bet) then raise exception 'not_resolver'; end if;
  if b.status in ('resolved', 'controversial', 'cancelled') then
    raise exception 'already_resolved';
  end if;
  if b.call_kind = 'number' and p_number is null then raise exception 'actual_required'; end if;
  if b.call_kind = 'date' and p_date is null then raise exception 'actual_required'; end if;

  update bets
     set status = 'resolved',
         actual_number = p_number,
         actual_date = p_date,
         resolved_by = auth.uid(),
         resolved_at = now()
   where id = p_bet
  returning * into b;

  -- Closest wins, and everybody equally close wins together.
  with d as (
    select bp.user_id,
           case when b.call_kind = 'number'
                then abs(bp.call_number - p_number)
                else abs(extract(epoch from (bp.call_date - p_date)))
           end as dist
    from bet_participants bp
    where bp.bet_id = p_bet
      and (bp.call_number is not null or bp.call_date is not null)
  )
  update bet_participants bp
     set is_winner = (d.dist = (select min(dist) from d))
    from d
   where bp.bet_id = p_bet and bp.user_id = d.user_id;

  perform log_bet_event(p_bet, 'resolved',
    jsonb_build_object('actual_number', p_number, 'actual_date', p_date));

  select count(*) into winner_count
  from bet_participants where bet_id = p_bet and is_winner;

  -- Same rule as a two-sided bet: each loser owes the stake, split evenly
  -- across the winners. A tie simply means there is more than one.
  if b.stake_kind = 'money' and winner_count > 0 then
    for loser in select user_id from bet_participants
                 where bet_id = p_bet and is_winner is false loop
      share := b.stake_amount_cents / winner_count;
      for winner in select user_id from bet_participants
                    where bet_id = p_bet and is_winner loop
        insert into ledger_entries (bet_id, from_user, to_user, amount_cents)
        values (p_bet, loser.user_id, winner.user_id, greatest(share, 1));
      end loop;
    end loop;
  end if;

  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = auth.uid();

  for winner in select user_id from bet_participants
                where bet_id = p_bet and is_winner loop
    update profiles set current_streak = current_streak + 1,
                        best_streak = greatest(best_streak, current_streak + 1)
    where id = winner.user_id;
    insert into form_events (user_id, delta, reason, bet_id)
    values (winner.user_id, 25, 'bet_won', p_bet);
    insert into notifications (user_id, type, title, bet_id, group_id)
    values (winner.user_id, 'bet_won', 'CALLED IT 🔥 "' || left(b.title, 40) || '"',
            p_bet, b.group_id);
    perform recompute_form(winner.user_id);
  end loop;

  for loser in select user_id from bet_participants
               where bet_id = p_bet and is_winner is false loop
    update profiles set current_streak = 0 where id = loser.user_id;
    insert into form_events (user_id, delta, reason, bet_id)
    values (loser.user_id, -10, 'bet_lost', p_bet);
    insert into notifications (user_id, type, title, bet_id, group_id)
    values (loser.user_id, 'bet_lost', 'You''ll get the next one', p_bet, b.group_id);
    perform recompute_form(loser.user_id);
  end loop;

  return b;
end $$;

revoke all on function resolve_closest(uuid, numeric, timestamptz) from public, anon;
grant execute on function resolve_closest(uuid, numeric, timestamptz) to authenticated;
