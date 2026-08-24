-- Somewhere to send a notification to.
--
-- The notifications table has existed since 00001 and every path in the app
-- writes to it, but nothing ever left the database: rows sat waiting for
-- someone to open the alerts screen and find them. That is an inbox, not a
-- notification.
--
-- A token identifies an install, not a person, so it is the primary key: when
-- somebody signs out and a different account signs in on the same handset, the
-- row is claimed by the new user rather than duplicated, and the old account
-- stops receiving pushes on a device it no longer owns.

create table if not exists push_tokens (
  token       text primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  platform    text check (platform is null or platform in ('ios', 'android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_push_tokens_user on push_tokens(user_id);

alter table push_tokens enable row level security;

drop policy if exists "own push tokens" on push_tokens;
create policy "own push tokens"
  on push_tokens for select to authenticated using (user_id = auth.uid());

drop policy if exists "claim push token" on push_tokens;
create policy "claim push token"
  on push_tokens for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "update own push token" on push_tokens;
create policy "update own push token"
  on push_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "drop own push token" on push_tokens;
create policy "drop own push token"
  on push_tokens for delete to authenticated using (user_id = auth.uid());

-- A device claiming a token it already holds under another account has to be
-- able to take it over, which the insert policy above cannot express (the
-- conflicting row belongs to someone else). Definer, and it only ever writes
-- the caller's own id.
create or replace function claim_push_token(p_token text, p_platform text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_token is null or btrim(p_token) = '' then raise exception 'bad_token'; end if;

  insert into push_tokens (token, user_id, platform)
  values (btrim(p_token), auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = coalesce(excluded.platform, push_tokens.platform),
        updated_at = now();
end $$;

revoke all on function claim_push_token(text, text) from public, anon;
grant execute on function claim_push_token(text, text) to authenticated;

-- ── Dispatch ────────────────────────────────────────────────────────────────
create extension if not exists pg_net with schema extensions;

/**
 * Hand a freshly written notification to the edge function that sends it.
 *
 * Every failure path here returns without raising. This trigger fires inside
 * the transaction that resolved a bet or recorded an entry, and push being
 * misconfigured — or Vault being empty, or the network being down — must never
 * be the reason a bet cannot be settled. If it cannot send, the row still
 * exists and the alerts screen still shows it.
 *
 * The URL and the shared secret both live in Vault so that this file, which is
 * in a public repository, carries no credentials. Until they are set, this is a
 * no-op and the app behaves exactly as it did before.
 */
create or replace function notify_push()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
declare fn_url text; secret text;
begin
  begin
    select decrypted_secret into fn_url
      from vault.decrypted_secrets where name = 'push_function_url';
    select decrypted_secret into secret
      from vault.decrypted_secrets where name = 'push_hook_secret';

    if fn_url is null or secret is null then return new; end if;

    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-push-secret', secret
                 ),
      body    := jsonb_build_object('notification_id', new.id)
    );
  exception when others then
    return new;
  end;
  return new;
end $$;

drop trigger if exists notifications_push on notifications;
create trigger notifications_push
  after insert on notifications
  for each row execute function notify_push();
