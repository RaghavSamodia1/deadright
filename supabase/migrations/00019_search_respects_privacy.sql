-- Privacy audit: the settings row has offered `discoverable`, `private_profile`
-- and `show_ledger` since 00007, and `profiles.is_public` since 00001. Nothing
-- in the app or the database has ever read any of them. The Privacy screen
-- presents four switches that change nothing, which is worse than not offering
-- them — a user who turns "Discoverable" off is told they are hidden and is not.
--
-- Blocking had the same shape of hole: blocks rows were written and read back
-- for the Blocked-users list, but no query anywhere excluded a blocked person.
-- You could block someone and still surface in their search results.
--
-- Filtering in the client would not fix either one. EXPO_PUBLIC_SUPABASE_ANON_KEY
-- ships inside the app bundle, so anyone can query profiles directly with it;
-- a control that only exists in JavaScript is a suggestion. This RPC runs
-- security definer so the rule holds wherever the query comes from.

create or replace function search_profiles(p_query text)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  cred_score integer
)
language sql stable security definer set search_path = public as $$
  select p.id, p.handle, p.display_name, p.avatar_url, p.cred_score
  from profiles p
  left join user_settings s on s.user_id = p.id
  where char_length(btrim(p_query)) >= 2
    and (p.handle ilike '%' || btrim(p_query) || '%'
      or p.display_name ilike '%' || btrim(p_query) || '%')
    -- Opting out of discovery hides you from search. Missing settings row means
    -- the default, which 00007 sets to discoverable.
    and coalesce(s.discoverable, true)
    -- Blocking cuts both ways: neither party should surface for the other.
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
    -- You already know where to find yourself.
    and p.id <> auth.uid()
  order by p.handle
  limit 20;
$$;

revoke all on function search_profiles(text) from public, anon;
grant execute on function search_profiles(text) to authenticated;

-- Bet search leaked across the visibility boundary too: it queried `bets` by
-- title with no filter beyond RLS. RLS does gate it, but a blocked person's
-- link-privacy bets were still reachable, so apply the same block rule.
create or replace function search_bets(p_query text)
returns setof bets
language sql stable security definer set search_path = public as $$
  select b.* from bets b
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
