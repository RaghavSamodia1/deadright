-- group_members.role has carried 'member' | 'admin' since 00001 and the app
-- reads it — jar rules talk about admins removing rules, and the members list
-- badges them. Nothing could ever set it: no API, no UI, and no update policy
-- on group_members at all, so whatever role you were given when the row was
-- created was permanent. A group whose only admin left had no way back.

create or replace function set_member_role(
  p_group uuid,
  p_user uuid,
  p_role member_role
)
returns void language plpgsql security definer set search_path = public as $$
declare admin_count int;
begin
  -- Only an admin can hand out or take away admin.
  if not exists (
    select 1 from group_members
    where group_id = p_group and user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'admin_only';
  end if;

  if not exists (
    select 1 from group_members where group_id = p_group and user_id = p_user
  ) then
    raise exception 'not_member';
  end if;

  -- Never leave a group with nobody who can administer it. Demoting the last
  -- admin — including yourself — is the one move that cannot be undone from
  -- inside the app.
  if p_role = 'member' then
    select count(*) into admin_count
    from group_members where group_id = p_group and role = 'admin';
    if admin_count <= 1 then
      raise exception 'last_admin';
    end if;
  end if;

  update group_members set role = p_role
  where group_id = p_group and user_id = p_user;
end $$;

revoke all on function set_member_role(uuid, uuid, member_role) from public, anon;
grant execute on function set_member_role(uuid, uuid, member_role) to authenticated;
