-- Ordinal bets could never be ranked.
--
-- The bet_rankings INSERT policy requires is_bet_participant(bet_id), i.e. a row
-- in bet_participants. But an ordinal bet has no "pick a side" step — submitting
-- your order *is* how you take part, and nothing ever created that row. Every
-- attempt failed with "new row violates row-level security policy for table
-- bet_rankings", so the feature was inert.
--
-- Ranking is now a single RPC that joins you and writes the order together,
-- which also makes it atomic: the client was sending a multi-row upsert that
-- could half-apply, and re-ranking fewer options than before would have left the
-- dropped ones behind.
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

  insert into bet_events (bet_id, actor_id, kind, payload)
  values (p_bet, auth.uid(), 'joined', jsonb_build_object('ordinal', true));
end $$;

revoke all on function submit_ranking(uuid, uuid[]) from public;
grant execute on function submit_ranking(uuid, uuid[]) to authenticated;

-- The UPDATE policy had a USING clause but no WITH CHECK, so the update half of
-- an upsert would have been rejected even once participation existed.
drop policy if exists "rerank until deadline" on bet_rankings;
create policy "rerank until deadline"
  on bet_rankings for update to authenticated
  using (user_id = auth.uid()
         and exists (select 1 from bets b
                     where b.id = bet_id and b.deadline > now()))
  with check (user_id = auth.uid()
              and exists (select 1 from bets b
                          where b.id = bet_id and b.deadline > now()));
