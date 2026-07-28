# DeadRight — backend deployment

The schema, RLS, RPCs and edge function are written and **validated locally**
(applied to Postgres 16, full flow smoke-tested, RLS isolation verified).
What's left needs your Supabase account, so it can't be automated from here.

---

## 1. Create the project (you)

1. Sign in at <https://supabase.com/dashboard> → **New project**
2. Region: pick the one nearest your users (`ap-south-1` for India)
3. Save the database password somewhere safe
4. From **Project Settings → API**, copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon` public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Put them in `.env` at the repo root (copy `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> Until `.env` exists the app runs in **demo mode** on mock data — that's why the
> APK works today with no backend. `src/lib/supabase.ts` detects this via
> `isBackendConfigured`, so a missing key degrades instead of crashing.

## 2. Push the schema

```bash
supabase login                       # opens a browser (you)
supabase link --project-ref <ref>    # ref is in the dashboard URL
supabase db push                     # applies supabase/migrations/*.sql in order
```

`00001_schema.sql` enables `pg_cron`. If push complains, enable it once in the
dashboard under **Database → Extensions**, then re-run.

## 3. Deploy the Sharpen edge function

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy sharpen
```

Turns "arsenal do well" into a resolvable statement with a deadline. It uses
`claude-haiku-4-5` with a JSON-schema-constrained response, so the app always
gets valid structured output. The app treats it as optional — if the call fails,
`sharpen.ts` returns `null` and the user's own wording is used.

## 4. Turn on phone auth

Dashboard → **Authentication → Providers → Phone**. You need an SMS provider
(Twilio / MessageBird / Vonage) with its credentials pasted in.

**Cheaper for testing:** enable **Email** auth instead and use the email helpers
already in `src/api/auth.ts` (`sendEmailOtp` / `verifyEmailOtp`) — no SMS spend.

## 5. Realtime (optional but recommended)

Dashboard → **Database → Replication** → add `bets`, `bet_events`,
`notifications`. The subscriptions in `src/api/bets.ts` and
`notifications.ts` start working the moment this is on.

---

## Verify it worked

```bash
npx expo start          # or rebuild the APK
```

Sign up → you should get a real OTP, land on ProfileSetup, and claim a handle.
The Home tiles then read live Cred/streak instead of mock values.

## What was validated locally (and one bug it caught)

Applied to a throwaway Postgres 16 with `auth.uid()`/`pg_cron` stubbed:

- 17 tables, 58 functions, 37 RLS policies, 6 triggers — all apply cleanly
- Full flow: signup → profile auto-created → group + invite code → join by code →
  bet → propose → agree → **resolved**, ledger entry written, cred recomputed
  (717 / 504), notifications generated
- Cookie Jar: rule → violation → own-up (auto-confirmed) → `settle_jar` empties the pot
- Dispute: raising one flips the bet to `disputed` via trigger; votes recorded
- `undo_resolution` correctly rejects a non-resolver (`not_resolver`) and reverts
  status to `awaiting` for the real resolver
- **RLS verified**: a non-member sees 0 bets / 0 groups / 0 jar rows / 0 ledger
  rows, cannot insert into a group they don't belong to, and cannot edit another
  user's profile

**Bug found and fixed:** `add_violation` inserted a bare `CASE` expression into
the `violation_status` enum column. Postgres won't coerce text→enum there, so
*every* Cookie Jar violation would have failed in production. Fixed with an
explicit `::violation_status` cast (`00003_functions.sql`).
