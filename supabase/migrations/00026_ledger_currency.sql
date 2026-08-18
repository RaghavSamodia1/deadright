-- 00025 gave groups a currency, but ledger_entries has no group_id: an entry
-- hangs off a bet or a jar violation, and the group is another hop away. So the
-- ledger kept adding cents across currencies — net balance, this month, pending,
-- and the per-person balances all summed ₹ and $ into one number and printed it
-- under whichever symbol the viewer had chosen.
--
-- Resolve it once here rather than in four client functions, and store it: an
-- entry's unit is decided when it is recorded. If a group later changes currency,
-- history must keep meaning what it meant — the same reason bets.currency is
-- denormalised.

alter table ledger_entries
  add column currency text
  check (currency is null or char_length(currency) = 3);

/**
 * Where an entry's unit comes from, in order:
 *   1. the group of the bet it settles
 *   2. that bet's own currency, when it has no group (a solo bet)
 *   3. the group of the jar violation it settles
 *   4. 'GBP', matching the column defaults elsewhere
 */
create or replace function ledger_entry_currency(
  p_bet uuid,
  p_violation uuid
)
returns text language sql stable set search_path = public as $$
  select coalesce(
    (select upper(g.currency)
       from bets b join groups g on g.id = b.group_id
      where b.id = p_bet),
    (select upper(b.currency) from bets b where b.id = p_bet),
    (select upper(g.currency)
       from jar_violations v join groups g on g.id = v.group_id
      where v.id = p_violation),
    'GBP'
  );
$$;

update ledger_entries
set currency = ledger_entry_currency(bet_id, violation_id)
where currency is null;

-- Every insert goes through this, so the column can be trusted from here on.
-- Note it only fills a NULL: an explicit currency on the insert wins, and the
-- column deliberately has no DEFAULT, which would otherwise pre-empt this.
create or replace function set_ledger_entry_currency()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.currency is null then
    new.currency := ledger_entry_currency(new.bet_id, new.violation_id);
  end if;
  return new;
end $$;

drop trigger if exists ledger_entries_currency on ledger_entries;
create trigger ledger_entries_currency
  before insert on ledger_entries
  for each row execute function set_ledger_entry_currency();

alter table ledger_entries alter column currency set not null;
