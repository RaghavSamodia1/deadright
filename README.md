# DeadRight 🔥

**Social bet-tracking for friends.** Capture the informal bets that happen in
every group chat — *"bet you won't"*, *"I'm calling it now"* — then settle who was
actually right and build a reputation on it.

**No real money.** Stakes are tracked on a ledger, never moved. No payment rails,
no wallet, no regulatory surface — the stake is your word.

---

## Why it exists

Every friend group makes predictions constantly, and nobody remembers who was
right. The person with the loudest recall wins the argument, not the person who
called it. DeadRight makes the call durable: you state it, both sides agree the
outcome, and it goes on your record as a **Cred Score**.

## Core loop

1. **Call it** — state a prediction, pick a deadline and a stake (bragging
   rights, a coffee, a tenner on the ledger)
2. **Sides lock in** — friends take the other side; switching sides is logged, so
   everyone sees the wobble 👀
3. **Settle** — at the deadline both sides confirm the outcome. Disagree? It
   escalates to a group vote
4. **Cred moves** — winning calls raise your score, weaselling out lowers it

### Cookie Jar 🍪
A group pot for rule-breakers ("swearing = $1"). Self-report and you get the 😇
badge; get reported and you have 24h to dispute. When the jar hits its cap the
group has to settle up — pizza night. It's the most social loop in the app, so
it's a home-screen tile and an iOS widget.

## Screens

Hub-and-spoke navigation — **no bottom tab bar**. A bento-grid home is the hub;
everything else pushes from it.

| | |
|---|---|
| **Home** | bento hub: Cookie Jar hero, Cred, streak, nav tiles, live bets |
| **Bet detail** | sides, stake, countdown, full event timeline |
| **Resolution** | propose outcome → both sides agree → resolved |
| **Dispute** | claims from each side + group vote tally |
| **Ledger** | net position, month chart, per-bet transactions |
| **Profile** | Cred ring, win rate, history |
| **Peaks** | full-screen celebration moments — the *CALLED IT* stamp |

38 screens total, composed from a 40-component library.

## Stack

| Layer | Choice |
|---|---|
| App | React Native (Expo SDK 52), TypeScript, React Navigation 7 |
| Motion | Reanimated 3, react-native-svg, expo-haptics |
| Backend | Supabase — Postgres, RLS, RPCs, Realtime, Deno edge functions |
| AI | Claude Haiku (`sharpen`) with JSON-schema-constrained output |
| Design | Figma design system → TypeScript tokens |

### Design system
Navy `#0E121A` base with a Sinport-derived palette: amber `#F7C846` for
awaiting/CTA, mint `#8AE98D` for wins, coral `#FC574E` for disputes, flame
`#FF5500` for brand. Barlow Black for display, Inter for body, Space Mono for
timers. Card *fill* encodes card *state*.

### The Sharpen function
"arsenal do well" is not resolvable — there's nothing to settle. A Deno edge
function sends the raw text to Claude Haiku with a JSON schema, and gets back a
sharpened statement, a suggested type, and a deadline. It's a *suggestion*, never
a substitution — the user's wording is never overwritten without a tap, and if
the call fails the app silently keeps the original.

## Backend design notes

- **17 tables, 58 functions, 37 RLS policies, 6 triggers**
- Every cross-user write goes through a `security definer` RPC; direct table
  writes are limited to rows you own
- Group-scoped RLS via `is_group_member()` / `can_see_bet()` helpers — a
  non-member sees zero rows across bets, groups, jar and ledger
- Resolution: propose → agree → resolve, with a 5-minute undo window that only
  the resolver can use; stale resolutions auto-escalate to a group vote via
  `pg_cron`
- Ledger entries are bookkeeping rows; jar entries use `to_user = null` (the pot)

The schema was validated by applying all migrations to a local Postgres 16 and
running the full flow end-to-end — signup → group → bet → resolve → ledger →
cred → jar → dispute — plus RLS isolation tests.

## Running it

```bash
npm install
npx expo start          # press a for Android, i for iOS
```

Without a `.env` the app runs in **demo mode** on mock data, so every screen is
explorable with no backend. To connect a real backend, see **[DEPLOY.md](DEPLOY.md)**.

### Android APK

```bash
cd android && ./gradlew :app:assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Requires JDK 17 + Android SDK. The release build is self-contained (JS bundle and
fonts embedded) and debug-signed for sideloading — not Play Store distribution.

### iOS

```bash
npx pod-install ios          # needs CocoaPods
npx expo run:ios             # or open ios/DeadRight.xcworkspace in Xcode
```

Requires **full Xcode** (Command Line Tools alone won't compile it). The native
project is generated and committed: camera/photo permission strings, dark UI
style, and the six fonts are registered in `Info.plist` via `UIAppFonts`.
Deployment target iOS 15.1.

## Status

| | |
|---|---|
| Design system, 38 screens, component library | ✅ complete |
| Backend (schema, RLS, RPCs, edge function) | ✅ complete, validated on local Postgres |
| Backend deployed to hosted Supabase | ⬜ needs a project — see DEPLOY.md |
| Android APK | ✅ builds and runs |
| iOS | ⚙️ project generated; needs Xcode to compile |
| Photo evidence (camera + storage) | ✅ built |

## Repo layout

```
src/
  components/   40 components (BetCard, BentoTile, CredRing, JarCard…)
  screens/      38 screens
  navigation/   single native stack, hub-and-spoke
  api/          Supabase client layer (bets, groups, resolution, jar, auth…)
  tokens/       colours, spacing, radius, motion, typography
supabase/
  migrations/   schema, RLS, functions
  functions/    sharpen (Deno edge function)
```

Design and product docs: `design-v2.md` (current direction), `design-system.md`,
`backend.md`, `screens/`.
