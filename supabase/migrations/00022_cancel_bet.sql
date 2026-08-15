-- Calling a bet off. The schema anticipated this from the start — bet_status
-- has carried 'cancelled' since 00001, types/database.ts declares it, mappers
-- maps it and BetDetailScreen already renders "Cancelled" — but nothing was
-- ever able to set it. There is no delete policy on bets either, so until now a
-- bet opened by mistake stayed in the group forever.
--
-- Cancel rather than delete, deliberately. A bet is a shared record: other
-- people's participation, timeline events and (once resolved) ledger and cred
-- rows hang off it. Hard-deleting one tears rows out from under everyone who
-- joined. Cancelling leaves the record honest about what happened.

create or replace function cancel_bet(p_bet uuid, p_reason text default null)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if b.id is null then raise exception 'no_such_bet'; end if;

  -- Only the person who opened it. Participants who disagree with a result have
  -- the dispute path; cancelling is not for losing an argument.
  if b.creator_id <> auth.uid() then raise exception 'not_allowed'; end if;

  -- Only while it is still open. Once the deadline has passed or a result has
  -- been called, the honest routes are resolving or disputing — withdrawing a
  -- bet after the outcome is known is exactly the move the app exists to stop.
  if b.status <> 'active' then raise exception 'not_cancellable'; end if;

  update bets set status = 'cancelled' where id = p_bet;

  insert into bet_events (bet_id, actor_id, kind, payload)
  values (p_bet, auth.uid(), 'cancelled',
          case when p_reason is null then null else jsonb_build_object('reason', p_reason) end);

  -- Anyone who had already taken a side backed something that is now off, so
  -- they are told. The canceller already knows.
  insert into notifications (user_id, type, title, body, bet_id, group_id, actor_id)
  select bp.user_id, 'bet_cancelled',
         'Bet called off',
         b.title,
         p_bet, b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.user_id <> auth.uid();

  select * into b from bets where id = p_bet;
  return b;
end $$;

revoke all on function cancel_bet(uuid, text) from public, anon;
grant execute on function cancel_bet(uuid, text) to authenticated;
