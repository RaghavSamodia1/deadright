-- CalledIt RLS · migration 00002
-- Principle: everything is group-scoped. Membership check via security-definer
-- helper so policies never recurse.

-- ── Helpers ──────────────────────────────────────────────────────────────────
create or replace function is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function is_bet_participant(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bet_participants
    where bet_id = bid and user_id = auth.uid()
  );
$$;

create or replace function can_see_bet(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bets b
    where b.id = bid
      and (
        b.creator_id = auth.uid()
        or (b.group_id is not null and is_group_member(b.group_id))
        or b.privacy = 'link' -- link-shared bets readable by any authed user
      )
  );
$$;

-- ── Profiles ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles are readable by authed users"
  on profiles for select to authenticated using (true);
-- (public read keeps avatar/handle joins simple; sensitive stats gated app-side
--  by is_public. Tighten to shared-group-only post-v1 if needed.)

create policy "users update own profile"
  on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "users insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- ── Groups ───────────────────────────────────────────────────────────────────
alter table groups enable row level security;

create policy "members read their groups"
  on groups for select to authenticated using (is_group_member(id));

create policy "authed users create groups"
  on groups for insert to authenticated with check (created_by = auth.uid());

create policy "admins update group"
  on groups for update to authenticated
  using (exists (select 1 from group_members
                 where group_id = id and user_id = auth.uid() and role = 'admin'));

-- ── Group members ────────────────────────────────────────────────────────────
alter table group_members enable row level security;

create policy "members see co-members"
  on group_members for select to authenticated using (is_group_member(group_id));

-- inserts happen via join_group_by_code / create_group RPCs (security definer)
create policy "self-leave"
  on group_members for delete to authenticated using (user_id = auth.uid());

-- ── Bets ─────────────────────────────────────────────────────────────────────
alter table bets enable row level security;

create policy "visible bets"
  on bets for select to authenticated using (can_see_bet(id));

create policy "members create bets in their groups"
  on bets for insert to authenticated
  with check (
    creator_id = auth.uid()
    and (group_id is null or is_group_member(group_id))
  );

-- updates flow through RPCs; allow creator basic edits pre-join
create policy "creator updates own active bet"
  on bets for update to authenticated
  using (creator_id = auth.uid() and status = 'active');

-- ── Participants / events / evidence ─────────────────────────────────────────
alter table bet_participants enable row level security;

create policy "participants visible with bet"
  on bet_participants for select to authenticated using (can_see_bet(bet_id));

create policy "join visible bets"
  on bet_participants for insert to authenticated
  with check (user_id = auth.uid() and can_see_bet(bet_id));

create policy "switch own side"
  on bet_participants for update to authenticated
  using (user_id = auth.uid());

alter table bet_events enable row level security;
create policy "events visible with bet"
  on bet_events for select to authenticated using (can_see_bet(bet_id));
-- events written by triggers/RPCs only (definer)

alter table bet_evidence enable row level security;
create policy "evidence visible with bet"
  on bet_evidence for select to authenticated using (can_see_bet(bet_id));
create policy "participants add evidence"
  on bet_evidence for insert to authenticated
  with check (user_id = auth.uid() and is_bet_participant(bet_id));

-- ── Disputes ─────────────────────────────────────────────────────────────────
alter table disputes enable row level security;
create policy "disputes visible with bet"
  on disputes for select to authenticated using (can_see_bet(bet_id));
create policy "participants raise disputes"
  on disputes for insert to authenticated
  with check (raised_by = auth.uid() and is_bet_participant(bet_id));

alter table dispute_votes enable row level security;
create policy "votes visible with dispute"
  on dispute_votes for select to authenticated
  using (exists (select 1 from disputes d
                 where d.id = dispute_id and can_see_bet(d.bet_id)));
create policy "group members vote once"
  on dispute_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from disputes d join bets b on b.id = d.bet_id
                where d.id = dispute_id
                  and d.status = 'voting'
                  and is_group_member(b.group_id))
  );

-- ── Ledger ───────────────────────────────────────────────────────────────────
alter table ledger_entries enable row level security;
create policy "own ledger entries"
  on ledger_entries for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
create policy "counterparties settle"
  on ledger_entries for update to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
-- inserts via resolve_bet / add_violation (definer)

-- ── Cred / notifications ─────────────────────────────────────────────────────
alter table cred_events enable row level security;
create policy "own cred history"
  on cred_events for select to authenticated using (user_id = auth.uid());

alter table notifications enable row level security;
create policy "own notifications"
  on notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own read"
  on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Ordinals ─────────────────────────────────────────────────────────────────
alter table bet_options enable row level security;
create policy "options visible with bet"
  on bet_options for select to authenticated using (can_see_bet(bet_id));
create policy "creator adds options"
  on bet_options for insert to authenticated
  with check (exists (select 1 from bets b
                      where b.id = bet_id and b.creator_id = auth.uid()
                        and b.status = 'active'));

alter table bet_rankings enable row level security;
create policy "rankings visible with bet"
  on bet_rankings for select to authenticated using (can_see_bet(bet_id));
create policy "participants rank"
  on bet_rankings for insert to authenticated
  with check (user_id = auth.uid() and is_bet_participant(bet_id));
create policy "rerank until deadline"
  on bet_rankings for update to authenticated
  using (user_id = auth.uid()
         and exists (select 1 from bets b
                     where b.id = bet_id and b.deadline > now()));

-- ── Swear jar ────────────────────────────────────────────────────────────────
alter table jar_rules enable row level security;
create policy "rules visible to members"
  on jar_rules for select to authenticated using (is_group_member(group_id));
create policy "members propose rules"
  on jar_rules for insert to authenticated
  with check (created_by = auth.uid() and is_group_member(group_id));
create policy "admins deactivate rules"
  on jar_rules for update to authenticated
  using (exists (select 1 from group_members
                 where group_id = jar_rules.group_id
                   and user_id = auth.uid() and role = 'admin'));

alter table jar_violations enable row level security;
create policy "violations visible to members"
  on jar_violations for select to authenticated using (is_group_member(group_id));
-- inserts via add_violation RPC (enforces own-up / dispute-window rules)
create policy "violator disputes within window"
  on jar_violations for update to authenticated
  using (violator_id = auth.uid()
         and status = 'pending'
         and now() < dispute_deadline);

alter table jar_settlements enable row level security;
create policy "settlements visible to members"
  on jar_settlements for select to authenticated using (is_group_member(group_id));
