-- ── Party Pools ──────────────────────────────────────────────────────────────
-- A pool is a prediction anyone at a party can join from a shared link or QR —
-- no app install, no signup. Guests are identified only by the name they type,
-- so nothing here references auth.users.
--
-- Guest traffic never touches these tables directly: the `pool` edge function
-- holds the service key, validates the share token from the URL, and does the
-- reads/writes. RLS below therefore only covers the in-app (host) side.

-- Guarded so a partially-applied migration can be re-run.
do $$ begin
  create type pool_status as enum ('open', 'locked', 'settled');
exception when duplicate_object then null;
end $$;

create table pools (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references groups(id) on delete set null,
  host_id       uuid not null references profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 60),
  question      text not null check (char_length(question) between 1 and 140),
  -- The unguessable part of the share URL. Derived from gen_random_uuid()
  -- rather than pgcrypto's gen_random_bytes, which lives in the `extensions`
  -- schema on Supabase and isn't on the default search_path. Hex is URL-safe.
  share_token   text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status        pool_status not null default 'open',
  closes_at     timestamptz,
  winning_option uuid,
  created_at    timestamptz not null default now()
);

create table pool_options (
  id        uuid primary key default gen_random_uuid(),
  pool_id   uuid not null references pools(id) on delete cascade,
  label     text not null check (char_length(label) between 1 and 60),
  sort      smallint not null default 0
);

create table pool_entries (
  id           uuid primary key default gen_random_uuid(),
  pool_id      uuid not null references pools(id) on delete cascade,
  option_id    uuid not null references pool_options(id) on delete cascade,
  -- guests have no account; this is just what they typed
  display_name text not null check (char_length(display_name) between 1 and 24),
  -- set when a signed-in app user enters, so hosts can spot real accounts
  user_id      uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- One entry per name per pool: stops double-voting by accident and makes
-- "already joined" detectable without cookies.
create unique index pool_entries_unique_name
  on pool_entries (pool_id, lower(display_name));

create index pool_entries_pool on pool_entries (pool_id);
create index pool_options_pool on pool_options (pool_id);
create index pools_token on pools (share_token);

alter table pools enable row level security;
alter table pool_options enable row level security;
alter table pool_entries enable row level security;

-- Hosts manage their own pools; group members can see a group's pools.
create policy "read own or group pools"
  on pools for select to authenticated
  using (host_id = auth.uid() or (group_id is not null and is_group_member(group_id)));

create policy "create own pools"
  on pools for insert to authenticated
  with check (host_id = auth.uid());

create policy "host updates own pool"
  on pools for update to authenticated
  using (host_id = auth.uid());

create policy "host deletes own pool"
  on pools for delete to authenticated
  using (host_id = auth.uid());

create policy "options visible with pool"
  on pool_options for select to authenticated
  using (exists (
    select 1 from pools p where p.id = pool_id
      and (p.host_id = auth.uid() or (p.group_id is not null and is_group_member(p.group_id)))
  ));

create policy "host writes options"
  on pool_options for insert to authenticated
  with check (exists (select 1 from pools p where p.id = pool_id and p.host_id = auth.uid()));

create policy "entries visible with pool"
  on pool_entries for select to authenticated
  using (exists (
    select 1 from pools p where p.id = pool_id
      and (p.host_id = auth.uid() or (p.group_id is not null and is_group_member(p.group_id)))
  ));

-- Signed-in users can enter a pool they can see; guests go via the edge function.
create policy "enter visible pool"
  on pool_entries for insert to authenticated
  with check (exists (
    select 1 from pools p where p.id = pool_id and p.status = 'open'
      and (p.host_id = auth.uid() or (p.group_id is not null and is_group_member(p.group_id)))
  ));

/**
 * Tally for the results view: option label, count, and share of the vote.
 * Security definer so the edge function can call it for guests.
 */
create or replace function pool_results(p_pool uuid)
returns table (option_id uuid, label text, entries bigint, pct numeric)
language sql stable security definer set search_path = public as $$
  with counts as (
    select o.id, o.label, o.sort, count(e.id) as entries
    from pool_options o
    left join pool_entries e on e.option_id = o.id
    where o.pool_id = p_pool
    group by o.id, o.label, o.sort
  ), total as (select nullif(sum(entries), 0) as n from counts)
  select c.id, c.label, c.entries,
         round(100.0 * c.entries / coalesce((select n from total), 1), 0)
  from counts c order by c.sort, c.label
$$;
