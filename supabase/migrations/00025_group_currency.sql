-- Every amount in this app is a bare integer of cents — jar_violations via
-- rules, ledger_entries, bet stakes, groups.jar_cap_cents — and the client
-- rendered all of them with the *viewer's* user_settings.currency. So one jar
-- holding 200 cents read as ₹2 to one member and $2 to another, and nothing
-- converted: the number was identical and only the symbol moved. A shared
-- ledger with no agreed unit cannot say who owes what.
--
-- Currency belongs to the money, not to whoever is looking at it. Every amount
-- here settles inside a group ("nothing pools across them", as the jar list
-- says), so the group is the natural owner of the unit.
--
-- user_settings.currency survives as the *default* for groups you create, and
-- as the unit for solo bets, which have no group_id to inherit from.

alter table groups
  add column currency text not null default 'GBP'
  check (char_length(currency) = 3);

-- Existing groups inherit their creator's chosen currency — the closest thing
-- to intent already on record. Groups whose creator never set one keep 'GBP'.
update groups g
set currency = upper(s.currency)
from user_settings s
where s.user_id = g.created_by;

-- Solo bets (group_id is null) have no group to inherit from, so they carry
-- their own unit, set from the creator's default at insert time. Denormalised
-- deliberately: a bet that later moves into a group must not silently change
-- what its stake means.
alter table bets
  add column currency text
  check (currency is null or char_length(currency) = 3);

update bets b
set currency = upper(coalesce(s.currency, 'GBP'))
from user_settings s
where b.group_id is null and s.user_id = b.creator_id;

-- create_group never set a currency, so every new group would land on the 'GBP'
-- column default even for a creator whose own default is something else.
create or replace function create_group(p_name text, p_emoji text default '⚽')
returns groups language plpgsql security definer set search_path = public as $$
declare
  g groups;
  c text;
begin
  select upper(currency) into c from user_settings where user_id = auth.uid();
  insert into groups (name, emoji, invite_code, created_by, currency)
  values (p_name, p_emoji, generate_invite_code(), auth.uid(), coalesce(c, 'GBP'))
  returning * into g;
  insert into group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'admin');
  return g;
end $$;

/**
 * Set a group's currency. Admin only — it changes what every member reads.
 *
 * This RELABELS, it does not convert: a jar holding 500 cents shows as ₹5
 * instead of $5. That is the correct behaviour for a play-money ledger with no
 * FX rates, but it is destructive to meaning, so the app warns before calling
 * this once a group has amounts recorded.
 */
create or replace function set_group_currency(
  p_group uuid,
  p_currency text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_currency is null or char_length(p_currency) <> 3 then
    raise exception 'invalid_currency';
  end if;

  if not exists (
    select 1 from group_members
    where group_id = p_group and user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'admin_only';
  end if;

  update groups set currency = upper(p_currency) where id = p_group;
end $$;

revoke all on function set_group_currency(uuid, text) from public, anon;
grant execute on function set_group_currency(uuid, text) to authenticated;
