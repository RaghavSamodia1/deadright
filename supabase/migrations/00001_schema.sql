-- CalledIt schema · migration 00001
-- Money is ledger-only: all *_cents columns are bookkeeping, no payment rails.

create extension if not exists pg_cron;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type bet_type          as enum ('prediction', 'dare', 'open', 'ordinal');
create type stake_kind        as enum ('money', 'dare', 'secret');
create type resolution_method as enum ('mutual', 'group_vote', 'judge');
create type bet_privacy       as enum ('group', 'link');
create type bet_side          as enum ('a', 'b');
create type bet_status        as enum (
  'active',            -- joinable, deadline in future
  'live',              -- event in progress (optional, set by creator)
  'awaiting',          -- deadline passed, needs resolution
  'pending_agreement', -- outcome proposed, losers must agree
  'disputed',          -- dispute raised / vote running
  'resolved',
  'controversial',     -- permanent split decision
  'cancelled'
);
create type member_role       as enum ('member', 'admin');
create type ledger_status     as enum ('pending', 'settled');
create type dispute_reason    as enum ('didnt_happen', 'deadline_issue', 'stake_unclear', 'other');
create type dispute_status    as enum ('open', 'voting', 'resolved');
create type violation_status  as enum ('pending', 'confirmed', 'disputed', 'dismissed');
create type notification_type as enum (
  'bet_invite', 'bet_joined', 'resolution_request', 'outcome_proposed',
  'dispute_raised', 'dispute_resolved', 'bet_won', 'bet_lost',
  'cred_change', 'jar_violation', 'jar_cap_reached', 'group_joined'
);
create type event_kind as enum (
  'created', 'joined', 'side_switched', 'went_live', 'deadline_passed',
  'outcome_proposed', 'agreed', 'dispute_raised', 'escalated',
  'evidence_added', 'resolved', 'undone', 'cancelled'
);

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table profiles (
  id             uuid primary key references auth.users on delete cascade,
  handle         text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name   text not null check (char_length(display_name) between 1 and 24),
  avatar_url     text,
  bio            text check (char_length(bio) <= 120),
  is_public      boolean not null default false,
  cred_score     integer not null default 500,
  current_streak integer not null default 0,
  best_streak    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Groups ───────────────────────────────────────────────────────────────────
create table groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 40),
  emoji         text not null default '⚽',
  invite_code   text not null unique,
  created_by    uuid not null references profiles(id),
  jar_cap_cents integer not null default 5000,
  created_at    timestamptz not null default now()
);

create table group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index idx_group_members_user on group_members(user_id);

-- ── Bets ─────────────────────────────────────────────────────────────────────
create table bets (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid references groups(id) on delete cascade, -- null = solo pending share
  creator_id        uuid not null references profiles(id),
  title             text not null check (char_length(title) between 1 and 140),
  type              bet_type not null default 'prediction',
  stake_kind        stake_kind not null default 'money',
  stake_amount_cents integer check (stake_amount_cents > 0),
  dare_forfeit      text,
  deadline          timestamptz not null,
  resolution_method resolution_method not null default 'mutual',
  judge_id          uuid references profiles(id),
  privacy           bet_privacy not null default 'group',
  status            bet_status not null default 'active',
  side_a_label      text not null default 'YES',
  side_b_label      text not null default 'NO',
  -- resolution state
  proposed_outcome  bet_side,
  proposed_by       uuid references profiles(id),
  proposed_at       timestamptz,
  winning_side      bet_side,
  resolved_by       uuid references profiles(id),
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint judge_required check (resolution_method <> 'judge' or judge_id is not null),
  constraint money_needs_amount check (stake_kind <> 'money' or stake_amount_cents is not null)
);
create index idx_bets_group_status on bets(group_id, status);
create index idx_bets_deadline on bets(deadline) where status in ('active', 'live');
create index idx_bets_proposed on bets(proposed_at) where status = 'pending_agreement';

create table bet_participants (
  bet_id    uuid not null references bets(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  side      bet_side not null,
  agreed    boolean, -- null = not asked yet; used during pending_agreement
  joined_at timestamptz not null default now(),
  primary key (bet_id, user_id)
);
create index idx_participants_user on bet_participants(user_id);

-- Timeline (FLOW 5: side switches are visible events — social transparency)
create table bet_events (
  id         bigint generated always as identity primary key,
  bet_id     uuid not null references bets(id) on delete cascade,
  actor_id   uuid references profiles(id),
  kind       event_kind not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_bet_events_bet on bet_events(bet_id, created_at);

create table bet_evidence (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references bets(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  note       text,
  file_path  text, -- supabase storage path
  created_at timestamptz not null default now()
);

-- ── Disputes (FLOW 7) ────────────────────────────────────────────────────────
create table disputes (
  id              uuid primary key default gen_random_uuid(),
  bet_id          uuid not null references bets(id) on delete cascade,
  raised_by       uuid not null references profiles(id),
  reason          dispute_reason not null,
  detail          text,
  status          dispute_status not null default 'voting',
  resolution_side bet_side,
  closes_at       timestamptz not null default (now() + interval '24 hours'),
  created_at      timestamptz not null default now()
);

create table dispute_votes (
  dispute_id uuid not null references disputes(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  side       bet_side not null,
  created_at timestamptz not null default now(),
  primary key (dispute_id, user_id)
);

-- ── Ledger ───────────────────────────────────────────────────────────────────
create table ledger_entries (
  id           uuid primary key default gen_random_uuid(),
  bet_id       uuid references bets(id) on delete set null,
  violation_id uuid, -- fk added after jar_violations
  from_user    uuid not null references profiles(id),
  to_user      uuid references profiles(id), -- null = group jar pot
  amount_cents integer not null check (amount_cents > 0),
  status       ledger_status not null default 'pending',
  settled_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_ledger_from on ledger_entries(from_user, status);
create index idx_ledger_to on ledger_entries(to_user, status);

-- ── Cred ─────────────────────────────────────────────────────────────────────
create table cred_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  delta      integer not null,
  reason     text not null,
  bet_id     uuid references bets(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_cred_user on cred_events(user_id, created_at);

-- ── Notifications ────────────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  bet_id     uuid references bets(id) on delete cascade,
  group_id   uuid references groups(id) on delete cascade,
  actor_id   uuid references profiles(id),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, created_at desc)
  where read_at is null;

-- ── Ordinal bets (Sprint 4) ──────────────────────────────────────────────────
create table bet_options (
  id             uuid primary key default gen_random_uuid(),
  bet_id         uuid not null references bets(id) on delete cascade,
  label          text not null,
  position       integer not null, -- display order at creation
  final_position integer           -- actual outcome, set at resolution
);
create index idx_bet_options_bet on bet_options(bet_id);

create table bet_rankings (
  bet_id     uuid not null references bets(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  option_id  uuid not null references bet_options(id) on delete cascade,
  rank       integer not null,
  primary key (bet_id, user_id, option_id)
);

-- ── Swear Jar ────────────────────────────────────────────────────────────────
create table jar_rules (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id) on delete cascade,
  emoji        text not null default '🤬',
  label        text not null check (char_length(label) between 1 and 40),
  amount_cents integer not null check (amount_cents > 0),
  created_by   uuid not null references profiles(id),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index idx_jar_rules_group on jar_rules(group_id) where active;

create table jar_violations (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references groups(id) on delete cascade,
  rule_id          uuid not null references jar_rules(id),
  violator_id      uuid not null references profiles(id),
  reporter_id      uuid not null references profiles(id),
  owned_up         boolean not null default false,
  status           violation_status not null default 'pending',
  dispute_deadline timestamptz not null default (now() + interval '24 hours'),
  created_at       timestamptz not null default now()
);
create index idx_violations_group on jar_violations(group_id, created_at desc);

alter table ledger_entries
  add constraint ledger_violation_fk
  foreign key (violation_id) references jar_violations(id) on delete set null;

create table jar_settlements (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  total_cents integer not null,
  note        text, -- "Pizza night 14 June"
  created_at  timestamptz not null default now()
);
