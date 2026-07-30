-- The participant_change trigger on bet_participants already writes the
-- 'joined' timeline event, so submit_ranking's own insert produced a second,
-- sideless one: the timeline read "You joined Side A" followed by
-- "You joined Side ".
create or replace function submit_ranking(p_bet uuid, p_options uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet;
  if b.id is null then raise exception 'no_such_bet'; end if;
  if not can_see_bet(p_bet) then raise exception 'not_allowed'; end if;
  if b.type <> 'ordinal' then raise exception 'not_an_ordinal_bet'; end if;
  if b.status not in ('active', 'live') then raise exception 'not_open'; end if;
  if b.deadline <= now() then raise exception 'deadline_passed'; end if;

  -- Every option must belong to this bet, and all of them must be present:
  -- a partial order is not scoreable by Kendall tau.
  if exists (
    select 1 from unnest(p_options) o
    where not exists (select 1 from bet_options bo where bo.id = o and bo.bet_id = p_bet)
  ) then
    raise exception 'unknown_option';
  end if;
  if (select count(*) from bet_options where bet_id = p_bet)
     <> (select count(distinct o) from unnest(p_options) o) then
    raise exception 'incomplete_ranking';
  end if;

  -- side is not null in the schema and is meaningless for an ordinal bet;
  -- 'a' is a placeholder that only marks participation.
  insert into bet_participants (bet_id, user_id, side)
  values (p_bet, auth.uid(), 'a')
  on conflict (bet_id, user_id) do nothing;

  delete from bet_rankings where bet_id = p_bet and user_id = auth.uid();
  insert into bet_rankings (bet_id, user_id, option_id, rank)
  select p_bet, auth.uid(), o, ord
  from unnest(p_options) with ordinality as t(o, ord);
end $$;
