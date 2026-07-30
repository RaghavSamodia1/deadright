-- Jar violation notifications read "$2.0000000000000000 to the jar".
--
-- `amount_cents / 100.0` yields numeric, and numeric → text keeps the full
-- scale of the division rather than trimming it. to_char with FM999999990.99
-- gives a plain two-decimal amount.
create or replace function money_text(cents integer)
  returns text language sql immutable as $$
    select to_char(cents / 100.0, 'FM999999990.00');
  $$;

comment on function money_text(integer) is
  'Cents → "2.00" for user-facing strings. Never build money text by dividing inline.';

-- Replay add_violation with money_text() in the notification title.
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
