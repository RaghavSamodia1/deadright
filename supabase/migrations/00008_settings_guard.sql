-- get_or_create_settings inserted auth.uid() blindly. Called without a session
-- (or from a service-role context) that's NULL, which surfaced as a confusing
-- not-null violation (23502) instead of an auth error. Fail clearly instead.
create or replace function get_or_create_settings()
returns user_settings language plpgsql security definer set search_path = public as $$
declare s user_settings; uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into s from user_settings where user_id = uid;
  if s.user_id is null then
    insert into user_settings (user_id) values (uid) returning * into s;
  end if;
  return s;
end $$;
