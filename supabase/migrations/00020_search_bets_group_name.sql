-- 00019's search_bets returned `setof bets`, dropping the group join the Search
-- screen reads (`b.group?.name`), so every result would have labelled itself
-- "Personal". Return the name alongside the row instead of re-joining client
-- side, which would need a second round trip per result.

drop function if exists search_bets(text);

create or replace function search_bets(p_query text)
returns table (
  id uuid,
  title text,
  status bet_status,
  deadline timestamptz,
  group_name text
)
language sql stable security definer set search_path = public as $$
  select b.id, b.title, b.status, b.deadline, g.name
  from bets b
  left join groups g on g.id = b.group_id
  where char_length(btrim(p_query)) >= 2
    and b.title ilike '%' || btrim(p_query) || '%'
    and can_see_bet(b.id)
    and not exists (
      select 1 from blocks bl
      where (bl.blocker_id = auth.uid() and bl.blocked_id = b.creator_id)
         or (bl.blocker_id = b.creator_id and bl.blocked_id = auth.uid())
    )
  order by b.created_at desc
  limit 20;
$$;

revoke all on function search_bets(text) from public, anon;
grant execute on function search_bets(text) to authenticated;
