-- CalledIt domain logic · migration 00003

-- ── Housekeeping triggers ────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger bets_touch before update on bets
  for each row execute function touch_updated_at();
create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- Auto-create profile on signup (handle derived from phone/email, editable later)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(new.raw_user_meta_data->>'display_name', 'New Bettor')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Groups ───────────────────────────────────────────────────────────────────
create or replace function generate_invite_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I/L ambiguity
  code  text := '';
begin
  for i in 1..6 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return code;
end $$;

create or replace function create_group(p_name text, p_emoji text default '⚽')
returns groups language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  insert into groups (name, emoji, invite_code, created_by)
  values (p_name, p_emoji, generate_invite_code(), auth.uid())
  returning * into g;
  insert into group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'admin');
  return g;
end $$;

create or replace function join_group_by_code(p_code text)
returns groups language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  select * into g from groups where invite_code = upper(trim(p_code));
  if g.id is null then
    raise exception 'invalid_code' using hint = 'That code doesn''t match any group';
  end if;
  insert into group_members (group_id, user_id)
  values (g.id, auth.uid())
  on conflict do nothing; -- already a member → idempotent (FLOW 3 edge case)
  return g;
end $$;

-- ── Bet lifecycle ────────────────────────────────────────────────────────────
create or replace function log_bet_event(p_bet uuid, p_kind event_kind, p_payload jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into bet_events (bet_id, actor_id, kind, payload)
  values (p_bet, auth.uid(), p_kind, p_payload);
$$;

-- creation timeline entry + creator auto-joins side A? No — spec: creator MAY join.
create or replace function on_bet_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into bet_events (bet_id, actor_id, kind)
  values (new.id, new.creator_id, 'created');
  return new;
end $$;
create trigger bet_created after insert on bets
  for each row execute function on_bet_created();

-- join + side-switch timeline (FLOW 5: "Jordan switched to NO 👀")
create or replace function on_participant_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into bet_events (bet_id, actor_id, kind, payload)
    values (new.bet_id, new.user_id, 'joined', jsonb_build_object('side', new.side));
  elsif tg_op = 'UPDATE' and new.side <> old.side then
    if exists (select 1 from bets where id = new.bet_id and deadline < now()) then
      raise exception 'sides_locked' using hint = 'Side changes lock at the deadline';
    end if;
    insert into bet_events (bet_id, actor_id, kind, payload)
    values (new.bet_id, new.user_id, 'side_switched',
            jsonb_build_object('from', old.side, 'to', new.side));
  end if;
  return new;
end $$;
create trigger participant_change after insert or update on bet_participants
  for each row execute function on_participant_change();

-- ── Resolution (FLOW 6) ──────────────────────────────────────────────────────
-- Step 1: any participant proposes an outcome once the deadline has passed.
create or replace function propose_outcome(p_bet uuid, p_side bet_side, p_evidence text default null)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if not is_bet_participant(p_bet) then raise exception 'not_participant'; end if;
  if b.status not in ('active', 'live', 'awaiting') then raise exception 'not_resolvable'; end if;

  update bets set status = 'pending_agreement',
                  proposed_outcome = p_side,
                  proposed_by = auth.uid(),
                  proposed_at = now()
  where id = p_bet returning * into b;

  -- reset agreement flags; proposer implicitly agrees
  update bet_participants set agreed = (user_id = auth.uid()) where bet_id = p_bet;

  if p_evidence is not null then
    insert into bet_evidence (bet_id, user_id, note) values (p_bet, auth.uid(), p_evidence);
  end if;
  perform log_bet_event(p_bet, 'outcome_proposed', jsonb_build_object('side', p_side));

  -- notify the losing side (their agreement is what's needed)
  insert into notifications (user_id, type, title, bet_id, group_id, actor_id)
  select bp.user_id, 'outcome_proposed',
         'Outcome proposed on "' || left(b.title, 40) || '"',
         b.id, b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.side <> p_side and bp.user_id <> auth.uid();

  return b;
end $$;

-- Step 2: losers agree. When ALL losing-side participants agree → resolve.
create or replace function agree_outcome(p_bet uuid)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets; losers_left int;
begin
  select * into b from bets where id = p_bet for update;
  if b.status <> 'pending_agreement' then raise exception 'nothing_to_agree'; end if;

  update bet_participants set agreed = true
  where bet_id = p_bet and user_id = auth.uid();
  perform log_bet_event(p_bet, 'agreed');

  select count(*) into losers_left
  from bet_participants
  where bet_id = p_bet and side <> b.proposed_outcome
    and coalesce(agreed, false) = false;

  if losers_left = 0 then
    return resolve_bet(p_bet, b.proposed_outcome);
  end if;
  return b;
end $$;

-- Core resolution: sets status, writes ledger, cred, streaks, notifications.
create or replace function resolve_bet(p_bet uuid, p_side bet_side)
returns bets language plpgsql security definer set search_path = public as $$
declare
  b bets; winner_count int; loser record; winner record; share int;
begin
  select * into b from bets where id = p_bet for update;
  if b.status in ('resolved', 'controversial', 'cancelled') then
    raise exception 'already_resolved';
  end if;

  update bets set status = 'resolved', winning_side = p_side,
                  resolved_by = auth.uid(), resolved_at = now()
  where id = p_bet returning * into b;
  perform log_bet_event(p_bet, 'resolved', jsonb_build_object('side', p_side));

  select count(*) into winner_count
  from bet_participants where bet_id = p_bet and side = p_side;

  -- Ledger: each loser owes stake; split evenly across winners (money bets only)
  if b.stake_kind = 'money' and winner_count > 0 then
    for loser in select user_id from bet_participants
                 where bet_id = p_bet and side <> p_side loop
      share := b.stake_amount_cents / winner_count;
      for winner in select user_id from bet_participants
                    where bet_id = p_bet and side = p_side loop
        insert into ledger_entries (bet_id, from_user, to_user, amount_cents)
        values (p_bet, loser.user_id, winner.user_id, greatest(share, 1));
      end loop;
    end loop;
  end if;

  -- Cred + streaks + notifications
  for winner in select user_id from bet_participants
                where bet_id = p_bet and side = p_side loop
    update profiles set current_streak = current_streak + 1,
                        best_streak = greatest(best_streak, current_streak + 1)
    where id = winner.user_id;
    insert into cred_events (user_id, delta, reason, bet_id)
    values (winner.user_id, 25, 'bet_won', p_bet);
    insert into notifications (user_id, type, title, bet_id, group_id)
    values (winner.user_id, 'bet_won', 'CALLED IT 🔥 "' || left(b.title, 40) || '"',
            p_bet, b.group_id);
    perform recompute_cred(winner.user_id);
  end loop;

  for loser in select user_id from bet_participants
               where bet_id = p_bet and side <> p_side loop
    update profiles set current_streak = 0 where id = loser.user_id;
    insert into cred_events (user_id, delta, reason, bet_id)
    values (loser.user_id, -10, 'bet_lost', p_bet);
    insert into notifications (user_id, type, title, bet_id, group_id)
    values (loser.user_id, 'bet_lost', 'You''ll get the next one', p_bet, b.group_id);
    perform recompute_cred(loser.user_id);
  end loop;

  return b;
end $$;

-- 5-minute undo, resolver only (FLOW 6 error recovery)
create or replace function undo_resolution(p_bet uuid)
returns bets language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = p_bet for update;
  if b.resolved_by <> auth.uid() then raise exception 'not_resolver'; end if;
  if b.resolved_at < now() - interval '5 minutes' then raise exception 'undo_window_closed'; end if;

  delete from ledger_entries where bet_id = p_bet and status = 'pending';
  delete from cred_events where bet_id = p_bet
    and created_at >= b.resolved_at;
  -- streaks are recomputed lazily by recompute_cred on next resolution; reset deltas:
  update bets set status = 'awaiting', winning_side = null,
                  resolved_by = null, resolved_at = null,
                  proposed_outcome = null, proposed_by = null, proposed_at = null
  where id = p_bet returning * into b;
  perform log_bet_event(p_bet, 'undone');
  return b;
end $$;

-- Dispute insert → flip bet status + timeline + notify (definer so any
-- participant can trigger it; RLS on bets stays creator-only)
create or replace function on_dispute_raised()
returns trigger language plpgsql security definer set search_path = public as $$
declare b bets;
begin
  select * into b from bets where id = new.bet_id;
  update bets set status = 'disputed' where id = new.bet_id;
  insert into bet_events (bet_id, actor_id, kind, payload)
  values (new.bet_id, new.raised_by, 'dispute_raised',
          jsonb_build_object('reason', new.reason));
  insert into notifications (user_id, type, title, bet_id, group_id, actor_id)
  select bp.user_id, 'dispute_raised',
         'Dispute raised on "' || left(b.title, 40) || '"',
         b.id, b.group_id, new.raised_by
  from bet_participants bp
  where bp.bet_id = new.bet_id and bp.user_id <> new.raised_by;
  return new;
end $$;
create trigger dispute_raised after insert on disputes
  for each row execute function on_dispute_raised();

-- ── Cred score (40% win rate, 20% volume, 25% streak, 15% consensus) ─────────
create or replace function recompute_cred(p_user uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  wins int; total int; streak int; consensus_pts int; score int;
begin
  select count(*) filter (where b.winning_side = bp.side), count(*)
    into wins, total
  from bet_participants bp
  join bets b on b.id = bp.bet_id and b.status = 'resolved'
  where bp.user_id = p_user;

  select current_streak into streak from profiles where id = p_user;

  -- consensus: agreeing promptly during resolutions (proxy: agreed=true count)
  select count(*) into consensus_pts
  from bet_participants where user_id = p_user and agreed = true;

  -- baseline 500; components weighted 40/20/25/15 over a 500-point spread
  score := 500
    + coalesce(round(wins::numeric / nullif(total, 0) * 200), 0)::int -- win rate  → 0..200 (40%)
    + round(least(total, 50) / 50.0 * 100)::int                       -- volume    → 0..100 (20%)
    + round(least(streak, 10) / 10.0 * 125)::int                      -- streak    → 0..125 (25%)
    + round(least(consensus_pts, 30) / 30.0 * 75)::int;               -- consensus → 0..75  (15%)

  update profiles set cred_score = greatest(score, 0) where id = p_user;
  return score;
end $$;

-- ── Escalation sweep (FLOW 6: 48h timeout → group vote) ──────────────────────
create or replace function escalate_stale_resolutions()
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  -- deadline passed → awaiting
  update bets set status = 'awaiting'
  where status in ('active', 'live') and deadline < now();

  -- pending_agreement stale 48h → disputed w/ group vote
  for r in select * from bets
           where status = 'pending_agreement'
             and proposed_at < now() - interval '48 hours' loop
    update bets set status = 'disputed' where id = r.id;
    insert into disputes (bet_id, raised_by, reason, detail, status)
    values (r.id, r.proposed_by, 'other', 'Auto-escalated: resolution timed out', 'voting');
    insert into bet_events (bet_id, kind, payload)
    values (r.id, 'escalated', '{"cause":"agreement_timeout"}');
    insert into notifications (user_id, type, title, bet_id, group_id)
    select gm.user_id, 'dispute_raised',
           'Resolution timed out — group votes now', r.id, r.group_id
    from group_members gm where gm.group_id = r.group_id;
    n := n + 1;
  end loop;

  -- close dispute votes past deadline: majority wins, tie → controversial
  for r in select d.*, b.group_id from disputes d
           join bets b on b.id = d.bet_id
           where d.status = 'voting' and d.closes_at < now() loop
    declare a_votes int; b_votes int;
    begin
      select count(*) filter (where side = 'a'),
             count(*) filter (where side = 'b')
        into a_votes, b_votes
      from dispute_votes where dispute_id = r.id;

      if a_votes > b_votes then
        update disputes set status = 'resolved', resolution_side = 'a' where id = r.id;
        perform resolve_bet(r.bet_id, 'a');
      elsif b_votes > a_votes then
        update disputes set status = 'resolved', resolution_side = 'b' where id = r.id;
        perform resolve_bet(r.bet_id, 'b');
      else
        update disputes set status = 'resolved' where id = r.id;
        update bets set status = 'controversial', resolved_at = now() where id = r.bet_id;
        insert into bet_events (bet_id, kind, payload)
        values (r.bet_id, 'resolved', '{"outcome":"controversial"}');
      end if;
      n := n + 1;
    end;
  end loop;

  return n;
end $$;

-- every 15 minutes
select cron.schedule('calledit-escalations', '*/15 * * * *',
                     $$select escalate_stale_resolutions()$$);

-- ── Ordinal scoring (Kendall tau vs final order) ─────────────────────────────
create or replace function score_ordinal_bet(p_bet uuid)
returns table (user_id uuid, tau numeric, exact_hits int)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with pairs as (
    select r.user_id as uid,
           o1.id a_opt, o2.id b_opt,
           r1.rank r1a, r2.rank r2a,
           o1.final_position f1, o2.final_position f2
    from (select distinct br.user_id from bet_rankings br where br.bet_id = p_bet) r
    cross join bet_options o1
    cross join bet_options o2
    join bet_rankings r1 on r1.bet_id = p_bet and r1.user_id = r.user_id and r1.option_id = o1.id
    join bet_rankings r2 on r2.bet_id = p_bet and r2.user_id = r.user_id and r2.option_id = o2.id
    where o1.bet_id = p_bet and o2.bet_id = p_bet and o1.id < o2.id
  ),
  scored as (
    select uid,
      count(*) filter (where sign(r1a - r2a) = sign(f1 - f2)) as concordant,
      count(*) as total
    from pairs group by uid
  ),
  exacts as (
    select br.user_id as uid, count(*) as hits
    from bet_rankings br
    join bet_options o on o.id = br.option_id
    where br.bet_id = p_bet and br.rank = o.final_position
    group by br.user_id
  )
  select s.uid,
         round((2.0 * s.concordant - s.total) / nullif(s.total, 0), 2),
         coalesce(e.hits, 0)::int
  from scored s left join exacts e on e.uid = s.uid
  order by 2 desc;
end $$;

-- ── Swear jar ────────────────────────────────────────────────────────────────
create or replace function add_violation(
  p_group uuid, p_rule uuid, p_violator uuid, p_owned_up boolean default false
) returns jar_violations language plpgsql security definer set search_path = public as $$
declare v jar_violations; r jar_rules; jar_total int; cap int;
begin
  if not is_group_member(p_group) then raise exception 'not_member'; end if;
  select * into r from jar_rules where id = p_rule and group_id = p_group and active;
  if r.id is null then raise exception 'invalid_rule'; end if;
  if p_owned_up and p_violator <> auth.uid() then raise exception 'own_up_is_self_only'; end if;

  insert into jar_violations (group_id, rule_id, violator_id, reporter_id, owned_up, status, dispute_deadline)
  values (p_group, p_rule, p_violator, auth.uid(), p_owned_up,
          -- explicit cast: a bare CASE yields text, which Postgres won't
          -- coerce to the violation_status enum on insert
          (case when p_owned_up then 'confirmed' else 'pending' end)::violation_status,
          case when p_owned_up then now() else now() + interval '24 hours' end)
  returning * into v;

  -- ledger: violator owes the jar (to_user null = pot)
  insert into ledger_entries (violation_id, from_user, to_user, amount_cents)
  values (v.id, p_violator, null, r.amount_cents);

  if not p_owned_up then
    insert into notifications (user_id, type, title, group_id, actor_id)
    values (p_violator, 'jar_violation',
            r.emoji || ' ' || r.label || ' — $' || money_text(r.amount_cents) || ' to the jar',
            p_group, auth.uid());
  end if;

  -- cap check → force settle-up notification to admins
  select coalesce(sum(le.amount_cents), 0) into jar_total
  from ledger_entries le
  join jar_violations jv on jv.id = le.violation_id
  where jv.group_id = p_group and le.status = 'pending';
  select jar_cap_cents into cap from groups where id = p_group;

  if jar_total >= cap then
    insert into notifications (user_id, type, title, group_id)
    select gm.user_id, 'jar_cap_reached', 'Jar is full — time to settle up 🍕', p_group
    from group_members gm where gm.group_id = p_group and gm.role = 'admin';
  end if;

  return v;
end $$;

create or replace function settle_jar(p_group uuid, p_note text default null)
returns jar_settlements language plpgsql security definer set search_path = public as $$
declare s jar_settlements; total int;
begin
  if not exists (select 1 from group_members
                 where group_id = p_group and user_id = auth.uid() and role = 'admin') then
    raise exception 'admin_only';
  end if;

  select coalesce(sum(le.amount_cents), 0) into total
  from ledger_entries le
  join jar_violations jv on jv.id = le.violation_id
  where jv.group_id = p_group and le.status = 'pending';

  update ledger_entries le set status = 'settled', settled_at = now()
  from jar_violations jv
  where jv.id = le.violation_id and jv.group_id = p_group and le.status = 'pending';

  insert into jar_settlements (group_id, total_cents, note)
  values (p_group, total, p_note) returning * into s;
  return s;
end $$;

-- confirm pending violations after the 24h window (piggybacks on the cron sweep)
create or replace function confirm_stale_violations()
returns int language sql security definer set search_path = public as $$
  with upd as (
    update jar_violations set status = 'confirmed'
    where status = 'pending' and dispute_deadline < now()
    returning 1
  ) select count(*)::int from upd;
$$;

select cron.schedule('calledit-jar-confirm', '*/15 * * * *',
                     $$select confirm_stale_violations()$$);
