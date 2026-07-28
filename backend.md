# CalledIt — Backend Architecture

**Stack:** Supabase (Postgres + Auth + Realtime + Edge Functions) — chosen per UX spec
(§4b names Supabase Edge Functions; FLOW 5 names Supabase realtime channels).

```
React Native app (src/api/*)
        │ supabase-js
        ▼
┌─ Supabase ──────────────────────────────────────────┐
│  Auth (phone OTP / email)                            │
│  Postgres                                            │
│    • schema: profiles, groups, bets, participants,   │
│      events, disputes, votes, ledger, cred,          │
│      notifications, ordinals, swear jar              │
│    • RLS: group-scoped visibility everywhere         │
│    • functions: resolve_bet, compute_cred,           │
│      escalate_stale_resolutions, join_group_by_code  │
│    • pg_cron: escalation sweep every 15 min          │
│  Realtime: postgres_changes on bets/bet_events       │
│  Edge Functions                                      │
│    • sharpen — Claude Haiku structured-output call   │
└──────────────────────────────────────────────────────┘
```

## Directory layout

```
supabase/
├── migrations/
│   ├── 00001_schema.sql      # enums, tables, indexes
│   ├── 00002_rls.sql         # row-level security policies
│   └── 00003_functions.sql   # triggers, RPCs, cron
└── functions/
    └── sharpen/index.ts      # AI text polish (Claude Haiku 4.5)

src/
├── lib/supabase.ts           # client init
├── types/database.ts         # row types matching schema
└── api/                      # typed data layer the screens call
    ├── bets.ts  groups.ts  resolution.ts  ledger.ts
    ├── jar.ts   notifications.ts  profile.ts  sharpen.ts
    └── index.ts
```

## Domain rules encoded in the database

| Rule (spec source) | Where enforced |
|---|---|
| Only description required to publish (FLOW 4) | `bets` column defaults |
| Side switches are visible timeline events (FLOW 5) | trigger `log_side_switch` |
| First outcome proposal → pending_agreement (FLOW 6) | RPC `propose_outcome` |
| Losers' agreement resolves; winners assumed (FLOW 6) | RPC `agree_outcome` |
| 48h resolution timeout → group vote (FLOW 6) | `escalate_stale_resolutions` + pg_cron |
| 5-minute undo after resolve (FLOW 6) | RPC `undo_resolution` (resolver only, 5 min window) |
| Dispute requires a reason (FLOW 7) | `disputes.reason` NOT NULL enum |
| Ledger entries auto-generate on money resolution | inside `resolve_bet` |
| Cred = 40% win rate + 20% volume + 25% streak + 15% consensus | `compute_cred` |
| Jar violations disputable 24h; own-ups instant | `jar_violations` columns + `add_violation` RPC |
| Jar cap forces settle-up | trigger `check_jar_cap` → notification |
| Ordinal scoring: Kendall tau vs final order | RPC `score_ordinal_bet` |

## Realtime channels

Screens subscribe via `supabase.channel()`:
- `bets:group_id=eq.{gid}` — feed live updates (FLOW 5 "betting closed the moment countdown hits zero")
- `bet_events:bet_id=eq.{id}` — detail timeline
- `notifications:user_id=eq.{uid}` — alerts badge

## Edge Function: sharpen (§4b)

`POST /functions/v1/sharpen` `{ text, type }` →
`{ sharpened, suggested_type, suggested_deadline, confidence }`

- Claude `claude-haiku-4-5` with `output_config.format` (json_schema) — guaranteed-valid JSON
- Spec constraints honoured: suggestion never substitution (client shows preview card),
  2s budget (client aborts + hides), no auto-fire, prompt lives server-side
- `ANTHROPIC_API_KEY` set via `supabase secrets set`

## Local dev

```bash
supabase init                      # once
supabase start                     # local stack
supabase db push                   # or: supabase migration up
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy sharpen
```

Client env (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
