-- Deleting a bet outright, alongside cancelling.
--
-- 00022 argued for cancel *instead of* delete, and that reasoning still holds for
-- any bet that produced something: participation, a timeline, money, cred. But it
-- left no way to remove a bet created by mistake — a typo, a duplicate, a test —
-- which then sat in the group's feed forever wearing a "Cancelled" badge. Both
-- routes now exist, and this one refuses whenever cancelling is the honest answer.
--
-- What the schema does on delete decides the guard:
--   * bet_participants, bet_events, bet_options, evidence, rankings and
--     notifications are ON DELETE CASCADE — they go with the bet, correctly.
--   * ledger_entries.bet_id and cred_events.bet_id are ON DELETE SET NULL — the
--     rows SURVIVE with their link cut. A settled bet's money would be left in
--     everyone's ledger as an amount with no bet behind it, and cred points would
--     stand for a bet nobody can look up.
-- So a bet that reached the ledger or moved cred cannot be deleted. Cancel it.

create or replace function delete_bet(p_bet uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  b bets;
  actor_name text;
begin
  select * into b from bets where id = p_bet for update;
  if b.id is null then raise exception 'no_such_bet'; end if;

  -- Only the person who opened it, same rule as cancelling.
  if b.creator_id <> auth.uid() then raise exception 'not_allowed'; end if;

  -- Anything that outlives the bet with a nulled link makes the record dishonest.
  if exists (select 1 from ledger_entries where bet_id = p_bet)
     or exists (select 1 from cred_events where bet_id = p_bet) then
    raise exception 'has_settlement';
  end if;

  select coalesce(display_name, handle, 'Someone') into actor_name
  from profiles where id = auth.uid();

  -- Tell anyone who had taken a side, before the delete: notifications.bet_id is
  -- ON DELETE CASCADE, so a notification pointing at this bet would be destroyed
  -- along with it. bet_id is left null and the title carried in the body instead,
  -- which is also the truth — there is no bet left to open.
  insert into notifications (user_id, type, title, body, group_id, actor_id)
  select bp.user_id, 'bet_deleted',
         'Bet deleted',
         actor_name || ' deleted "' || b.title || '". Nothing was settled on it.',
         b.group_id, auth.uid()
  from bet_participants bp
  where bp.bet_id = p_bet and bp.user_id <> auth.uid();

  delete from bets where id = p_bet;
end $$;

revoke all on function delete_bet(uuid) from public, anon;
grant execute on function delete_bet(uuid) to authenticated;
