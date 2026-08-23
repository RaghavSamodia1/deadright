-- Closing the hole under the privacy switches.
--
-- 00019 made search respect `discoverable` and blocking, and said the right
-- thing about why: EXPO_PUBLIC_SUPABASE_ANON_KEY ships inside the app bundle,
-- so a control that only exists in JavaScript is a suggestion. But it left the
-- table itself readable —
--
--   create policy "profiles are readable by authed users"
--     on profiles for select to authenticated using (true);
--
-- — so anyone with the bundled key and any signed-in session could
-- `select * from profiles` and read every handle, display name, bio, cred score
-- and streak in the product. Search was the front door; the table was an open
-- window beside it. Turning "Discoverable" off hid you from one and not the
-- other, which is the same failure 00019 set out to fix.
--
-- Profiles are now visible to yourself and to people you actually share a group
-- with. Everything the app legitimately needs beyond that goes through a
-- security-definer function that applies a rule, rather than through a blanket
-- read that applies none.

-- ── Who can see whom ────────────────────────────────────────────────────────
create or replace function shares_group_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from group_members mine
    join group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid()
      and theirs.user_id = other
  );
$$;

comment on function shares_group_with(uuid) is
  'Do I share at least one group with this person? Security definer so the '
  'profiles policy can ask it without recursing through group_members RLS.';

drop policy if exists "profiles are readable by authed users" on profiles;

create policy "profiles readable to self and co-members"
  on profiles for select to authenticated
  using (id = auth.uid() or shares_group_with(id));

-- ── Handle availability ─────────────────────────────────────────────────────
-- The sign-up flow counted rows in `profiles` to decide whether a handle was
-- free. Under the policy above that count is zero for anybody you do not share
-- a group with, so the app would have called a taken handle available and then
-- failed on the unique constraint. It asks a function now, which answers the
-- one question without handing over the table to do it.
create or replace function handle_available(p_handle text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from profiles where handle = lower(btrim(p_handle))
  );
$$;

revoke all on function handle_available(text) from public, anon;
grant execute on function handle_available(text) to authenticated;

-- ── The blocked list ────────────────────────────────────────────────────────
-- Blocking someone you met through search is exactly the case where you share
-- no group with them, so the joined read behind the Blocked-users screen would
-- have come back with the names stripped out — a list of people you cannot
-- identify. You are allowed to see who you have blocked.
create or replace function list_blocked()
returns table (
  blocked_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select b.blocked_id, p.handle, p.display_name, p.avatar_url, b.created_at
  from blocks b
  join profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

revoke all on function list_blocked() from public, anon;
grant execute on function list_blocked() to authenticated;

-- ── private_profile, finally doing something ────────────────────────────────
-- The switch has existed since 00007 and has never been read. Search is the one
-- route by which somebody outside your groups reaches your details, so that is
-- where it has to bite: they can still find you by handle — that is what
-- `discoverable` is for — but your record stays yours. The flag comes back with
-- the row so the app can say "private" rather than draw a blank and let the
-- reader assume the number is zero.
drop function if exists search_profiles(text);

create or replace function search_profiles(p_query text)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  cred_score integer,
  is_private boolean
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.handle, p.display_name, p.avatar_url,
    case when coalesce(s.private_profile, false) and p.id <> auth.uid()
         then null else p.cred_score end,
    coalesce(s.private_profile, false)
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
