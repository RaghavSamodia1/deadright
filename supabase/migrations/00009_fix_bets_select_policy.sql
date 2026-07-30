-- Creating a bet failed with "new row violates row-level security policy".
--
-- The SELECT policy called can_see_bet(id), which is STABLE and re-queries
-- `bets` for the row being checked. The client inserts with .select(), i.e.
-- INSERT ... RETURNING, and Postgres applies the SELECT policy to the returned
-- row — but a STABLE function reads the statement's snapshot, which does not
-- contain the row still being inserted. can_see_bet therefore returned false
-- and the insert was rejected.
--
-- Checking the row's own columns needs no self-query, so it works in RETURNING
-- and is cheaper per row. The predicate is otherwise identical to can_see_bet.
drop policy if exists "visible bets" on bets;
create policy "visible bets"
  on bets for select to authenticated
  using (
    creator_id = auth.uid()
    or (group_id is not null and is_group_member(group_id))
    or privacy = 'link'
  );

-- Same self-reference trap on the pools SELECT policy? No — it reads pools'
-- own columns already. Left alone deliberately.

drop function if exists _diag_bet_policy(uuid, uuid);
