-- cancel_bet() inserted NULL into bet_events.payload when no reason was given,
-- and that column is `jsonb not null default '{}'`. The UI passes no reason, so
-- every cancel violated the constraint and failed. Use the empty object.

create or replace function cancel_bet(p_bet uuid, p_reason text default null)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if b.id is null then raise exception 'no_such_bet'; end if;
  if b.creator_id <> auth.uid() then raise exception 'not_allowed'; end if;
  if b.status <> 'active' then raise exception 'not_cancellable'; end if;

  update bets set status = 'cancelled' where id = p_bet;

  insert into bet_events (bet_id, actor_id, kind, payload)
  values (p_bet, auth.uid(), 'cancelled',
          case when p_reason is null then '{}'::jsonb
               else jsonb_build_object('reason', p_reason) end);

  insert into notifications (user_id, type, title, body, bet_id, group_id, actor_id)
  select bp.user_id, 'bet_cancelled', 'Bet called off', b.title,
         p_bet, b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.user_id <> auth.uid();

  select * into b from bets where id = p_bet;
  return b;
end $$;

revoke all on function cancel_bet(uuid, text) from public, anon;
grant execute on function cancel_bet(uuid, text) to authenticated;
