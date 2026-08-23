-- Cred becomes Form.
--
-- The name collides with an existing product, and a bet tracker that prices
-- your reliability in something called a Cred Score is a collision worth
-- avoiding rather than arguing about. "Form" is what the thing already meant:
-- a sporting word for whether somebody has been getting it right lately, which
-- is exactly what the number measures, and it sits naturally beside Streak.
--
-- Nothing user-facing lives in this schema — every "cred" below is an
-- identifier, checked before writing this — so the function bodies can be
-- rewritten by substitution without touching a word anybody reads.
--
-- Every step is guarded. The first attempt at this migration renamed the
-- objects and then failed on the function rewrite, which left the database
-- half-renamed and the migration unrecorded; a file that cannot be re-run from
-- either state is a file that strands you there.

-- ── The objects ─────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_class where relname = 'cred_events' and relkind = 'r') then
    alter table cred_events rename to form_events;
  end if;

  if exists (select 1 from pg_class where relname = 'idx_cred_user') then
    alter index idx_cred_user rename to idx_form_user;
  end if;

  if exists (select 1 from information_schema.columns
             where table_name = 'profiles' and column_name = 'cred_score') then
    alter table profiles rename column cred_score to form_score;
  end if;

  if exists (select 1 from information_schema.columns
             where table_name = 'user_settings' and column_name = 'notify_cred') then
    alter table user_settings rename column notify_cred to notify_form;
  end if;

  if exists (select 1 from pg_enum e
             join pg_type t on t.oid = e.enumtypid
             where t.typname = 'notification_type' and e.enumlabel = 'cred_change') then
    alter type notification_type rename value 'cred_change' to 'form_change';
  end if;

  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'recompute_cred') then
    alter function recompute_cred(uuid) rename to recompute_form;
  end if;

  if exists (select 1 from pg_policies
             where tablename = 'form_events' and policyname = 'own cred history') then
    alter policy "own cred history" on form_events rename to "own form history";
  end if;
end $$;

-- ── The functions that named them ───────────────────────────────────────────
-- Rewriting these by hand would mean knowing which definition is currently
-- live: resolve_bet has been replaced three times across 00003, 00017 and
-- 00018, and whichever ran last is the one in the database. Asking the database
-- for its own definition and substituting identifiers cannot get out of step.
-- A plpgsql body is stored as text and resolved at execution, so a function
-- left naming cred_events would not fail until somebody resolved a bet.
do $$
declare
  fn record;
  def text;
  sig text;
begin
  for fn in
    select p.oid, p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and pg_get_functiondef(p.oid) ~ '(cred_events|cred_score|notify_cred|recompute_cred|cred_change)'
  loop
    def := pg_get_functiondef(fn.oid);
    sig := fn.signature;
    def := replace(def, 'cred_events', 'form_events');
    def := replace(def, 'cred_score', 'form_score');
    def := replace(def, 'notify_cred', 'notify_form');
    def := replace(def, 'recompute_cred', 'recompute_form');
    def := replace(def, 'cred_change', 'form_change');
    begin
      execute def;
    exception when others then
      -- search_profiles names cred_score as an output column, and renaming a
      -- RETURNS TABLE column counts as changing the return type, which CREATE
      -- OR REPLACE refuses outright. Those have to be dropped first.
      execute 'drop function ' || sig;
      execute def;
    end;
  end loop;
end $$;

-- ── Prove it ────────────────────────────────────────────────────────────────
do $$
declare leftover text;
begin
  select string_agg(p.proname, ', ') into leftover
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and pg_get_functiondef(p.oid) ~ '(cred_events|cred_score|notify_cred|recompute_cred|cred_change)';
  if leftover is not null then
    raise exception 'functions still reference the old names: %', leftover;
  end if;
end $$;
