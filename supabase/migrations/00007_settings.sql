-- ── User settings & blocking ─────────────────────────────────────────────────
-- The settings screens rendered toggles that persisted nothing — flip one, leave
-- the screen, and it silently reverted. These give them somewhere to live.

create table user_settings (
  user_id            uuid primary key references profiles(id) on delete cascade,

  -- Notifications (one row per user; absent row means "all defaults on")
  notify_new_bets    boolean not null default true,
  notify_resolutions boolean not null default true,
  notify_disputes    boolean not null default true,
  notify_jar         boolean not null default true,
  notify_cred        boolean not null default false,
  notify_marketing   boolean not null default false,

  -- Privacy
  private_profile    boolean not null default false,
  show_ledger        boolean not null default true,
  discoverable       boolean not null default true,

  -- Bets & ledger defaults
  default_resolution resolution_method not null default 'mutual',
  currency           text not null default 'GBP' check (char_length(currency) = 3),
  auto_settle        boolean not null default false,
  jar_cap_cents      integer not null default 5000 check (jar_cap_cents > 0),

  updated_at         timestamptz not null default now()
);

create trigger user_settings_touch before update on user_settings
  for each row execute function touch_updated_at();

alter table user_settings enable row level security;

create policy "own settings"
  on user_settings for select to authenticated using (user_id = auth.uid());
create policy "insert own settings"
  on user_settings for insert to authenticated with check (user_id = auth.uid());
create policy "update own settings"
  on user_settings for update to authenticated using (user_id = auth.uid());

-- ── Blocking ─────────────────────────────────────────────────────────────────
create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  -- blocking yourself is always a mistake
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

create policy "own blocks"
  on blocks for select to authenticated using (blocker_id = auth.uid());
create policy "create own blocks"
  on blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "remove own blocks"
  on blocks for delete to authenticated using (blocker_id = auth.uid());

/**
 * Read-or-create settings in one call, so the client never has to care whether
 * a row exists yet.
 */
create or replace function get_or_create_settings()
returns user_settings language plpgsql security definer set search_path = public as $$
declare s user_settings;
begin
  select * into s from user_settings where user_id = auth.uid();
  if s.user_id is null then
    insert into user_settings (user_id) values (auth.uid()) returning * into s;
  end if;
  return s;
end $$;
