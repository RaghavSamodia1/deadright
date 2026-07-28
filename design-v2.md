# DeadRight (formerly CalledIt → StakeHouse) — UI v2: Bento Redesign

**Supersedes** the tab-bar navigation model in `design-system.md` (v1 remains as reference).
**Trigger:** July 2026 direction change — bento layout, no bottom nav, Cookie Jar promoted.

---

## 1. What changed and why

| v1 | v2 | Why |
|---|---|---|
| 5-tab bottom bar + FAB | **No bottom nav.** Bento hub home; everything else pushes with a back header | Cleaner canvas, more content per screen, tiles self-describe destinations |
| Feed list as home | **Bento hub**: mixed-size tiles + inline bet cards | Glanceable status (jar, cred, streak, money) before scrolling |
| Swear Jar as side feature | **Cookie Jar 🍪 is a top-level pillar** — hero tile on home, tile on ledger | It's the most social/viral loop in the app |
| Screens hand-assembled | Screens compose **Tile components** + existing library | Bento vocabulary is first-class, propagates like everything else |

## 2. Navigation model (hub-and-spoke)

```
Home hub (bento)
├── header bell    → Alerts (push)
├── header avatar  → Profile (push)
├── Cookie Jar tile→ Jar screen (push)
├── Cred tile      → Profile (push)
├── Ledger tile    → Ledger (push)
├── Search tile    → Search (push)
├── New Bet tile   → Create (modal, unchanged)
├── bet cards      → Bet Detail (push)
└── "See all bets" → Full feed list (push)
```

Rules:
- Every pushed screen gets `NavHeader/back`. No screen is more than 2 pushes deep.
- Modals (create, resolution, sheets) unchanged from v1.
- Tiles that navigate carry a visible `→` affordance (H6 recognition).
- Depth trade-off vs tabs is accepted; spec's "max depth 3" still holds.

## 3. Bento grid system

Base: 20px gutters, **12px gaps**, content width 350.

| Tile size | Dimensions | Use |
|---|---|---|
| `hero` | 226 × 226 | One per screen max — the headline object (Cookie Jar on home, Balance on ledger) |
| `tall` | 112 × 226 | Companion column to a hero |
| `stat` | 112 × 107 | Single number + label (two stack beside a hero) |
| `wide` | 226 × 150 | Featured metric with caption |
| `nav` | 112 × 84 | Navigation strip tiles (3-up) |
| `chart` | 226 × 120 | Mini visualisations |
| `full` | 350 × auto | Existing cards (BetCard etc.) slot in as full-width rows |

Radius: hero/wide = 32 (lg), others = 24 (md). Fills follow v1 card-status logic:
bold solid for the hero (amber jar, mint balance), surface-1 + border for neutral,
15%-tint + 40%-border for accent tiles.

## 4. Component changes

**New:**
- `Tile` set (Figma + `BentoTile` in code): variants `size × tone`, slots for value/label/caption
- `SectionHeader` (the amber overline — finally a component)

**Changed:**
- `JarCard` copy → Cookie Jar 🍪 (done)
- `NavHeader/home` is now the only persistent chrome

**Deprecated (kept for v1 reference, not used in v2):**
- `TabBar` — description marked DEPRECATED

## 5. Screen inventory v2 (rebuilt on 🎨 UI v2 page)

| ID | Screen | Composition |
|---|---|---|
| V2-01 | Home hub | NavHeader/home + Tile hero(jar)/stat×2/nav×3 + BetCard×2 |
| V2-02 | Cookie Jar | NavHeader/back + JarCard + Button + ViolationRow feed |
| V2-03 | Ledger | NavHeader/back + Tile wide(balance)/stat(pending)/stat(jar)/chart + ListRow |
| V2-04 | Bet Detail | NavHeader/back + BetCard + Tile stat×3 (deadline/stake/pot) + TimelineEvent |
| V2-05 | Profile | NavHeader/back + Tile hero(cred)/stat×2 + StatsRow + ListRow history |
| V2-06 | Search | NavHeader/back + SearchBar + FilterChips + ListRow results |
| V2-07 | Alerts | NavHeader/back + NotificationRow feed |
| V2-08 | Full feed | NavHeader/back + FilterChips + BetCard list (v1 feed, now pushed) |

Create flow, resolution flow, peaks, settings: unchanged from v1 (no nav-bar dependency).

## 6. Cookie Jar widgets (page 📲 Widgets — Cookie Jar)

The jar's social pressure works best when it's visible *outside* the app.

| Format | Size | Content | Deep link |
|---|---|---|---|
| `systemSmall` | 170×170 | Amber jar: total, weekly count, cap bar | Cookie Jar screen |
| `systemMedium` | 364×170 | Jar panel + 3 latest violations + **Own up 😇** button | Jar / own-up sheet |
| `systemLarge` | 364×382 | Jar hero + cap progress + **Leaderboard of Shame** | Cookie Jar screen |
| `accessoryCircular` | 72×72 | 🍪 + total + cap progress ring (monochrome) | app open |
| `accessoryRectangular` | 172×72 | Total + weekly count + cap (monochrome) | app open |

Implementation: WidgetKit (SwiftUI) via `expo-apple-targets` or a bare workflow target;
data via App Group shared storage refreshed by a background fetch of `getJar()`.
Android: Glance widgets, same layouts. Widget radius: iOS-supplied continuous corner.

## 7. Code impact

- `src/components/BentoTile/` — new (size/tone props, value/label/caption/onPress)
- `src/screens/HomeScreen.tsx` — new bento hub (replaces feed-as-home)
- React Navigation: single stack + modals, **no `createBottomTabNavigator`**
- `TabBar.tsx` stays exported but unused (delete when v1 screens are retired)

## 8. Full screen inventory (built in code)

All 38 screens exist as `src/screens/*.tsx`, composed from the component library
(mock data + `TODO: wire to src/api`). Wired in `src/navigation/RootNavigator.tsx`
(single native stack, hub-and-spoke) and mounted from `App.tsx`.

| Group | Screens (route names) |
|---|---|
| Auth | Splash · Onboarding · SignUp · OTP · ProfileSetup |
| Hub & spokes | Root (Home) · Ledger · BetDetail · Profile · Search · Alerts · AllBets (feed) · CookieJar · JarRules |
| Create | CreateBet (modal wizard) · BetPlaced (peak) |
| Resolve/dispute | SideSelection · Resolution · EvidenceUpload · Win (peak) · DisputeDetail |
| Social/groups | FriendProfile · Group · CreateGroup · JoinGroup · ShareInvite · AlertDetail |
| Ledger | TransactionDetail |
| Settings | Settings · ProfileEdit · NotificationPrefs · Privacy · BlockedUsers · DeleteAccount |
| Peaks | RankUp · Streak · FriendJoined (fullScreenModal, bold tones) |

**Presentation:** regular screens push with `NavHeader/back`; wizards & sheets use
`presentation: 'modal'`; emotional peaks use `presentation: 'fullScreenModal'` on
their bold `ScreenBackground` tone (win=mint, rank=amber, streak=flame, placed/friend=violet).

**Runtime deps to install** (app not scaffolded yet): `@react-navigation/native`,
`@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`,
`@expo-google-fonts/barlow` · `/inter` · `/space-mono`, `expo-font`, `expo-status-bar`.
