-- The join screen showed a preview card — name, avatars, "5 members · 12 open
-- bets" — as soon as you had typed six characters. It was hardcoded to
-- "Flatmates" and fired for any six characters at all, so it cheerfully
-- confirmed a group existed while the field underneath said the code matched
-- nothing. Convincing and false, which is the worst combination.
--
-- Look the code up for real instead. Security definer because a joiner is by
-- definition not yet a member, so RLS on groups would hide the row from them —
-- and it returns only what an invite already tells you: which group it is, and
-- how many people are in it. No member list, no bet titles.

create or replace function peek_group(p_code text)
returns table (id uuid, name text, emoji text, member_count int)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emoji,
         (select count(*)::int from group_members m where m.group_id = g.id)
  from groups g
  where upper(btrim(p_code)) = upper(g.invite_code)
  limit 1;
$$;

revoke all on function peek_group(text) from public, anon;
grant execute on function peek_group(text) to authenticated;
