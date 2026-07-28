# Sprint 3–5 Screens — Social, Ledger, Ordinals, Timers & Polish

---

# Sprint 3 — Social & Sharing

## S27 — Profile Tab (own profile)

**Layout (top → bottom):**
```
Status bar + settings gear icon (top right, 44×44)

Profile header (surface-1 card, radius/lg, 20px padding):
  Cred ring: 96px amber animated SVG ring wrapping avatar
  Avatar: 80px circle, violet bg with initials
  Name: Barlow Black 24px, off-white
  Handle: @raghav_bets, Inter Regular 13px, text/secondary
  
  Stats row:
    [24 Bets]  [18 Wins]  [75%]  [Cred: 847]
    Barlow Bold 18px values, Inter Regular 11px labels
    Dividers between, amber highlight on Cred

  Cred ring sub-label: "Top 22% · Rising" Inter Regular 11px amber

Edit Profile button: surface-2, text/secondary, radius/full, right-aligned

Sections (tab bar inside profile: "Bets" | "Wins" | "Losses"):
  Each tab: list of bet cards (compact variant, 64px height)
  
  Bet tag chips (filter within tab):
    "#Arsenal" "#Films" "#Food" — amber chips

Bottom: settled ledger summary card:
  "Lifetime: +$145 · This month: +$20"
  Barlow Bold values, surface-1, radius/md
```

---

## S28 — Profile Edit

**Layout:**
```
NavHeader: "← Edit Profile" | "Save" button (top right, amber text)

Avatar section:
  96px circle with amber edit icon overlay (camera)
  Tap → action sheet: Take Photo / Choose / Generate

Fields (surface-2 inputs, radius/sm):
  Display name (max 24 chars)
  Username @handle (max 20, lowercase, auto-prefix @, uniqueness check)
  Bio (max 120 chars, optional)
  
  "Public profile" toggle (green when on)
  
Danger zone (surface-2, coral border):
  "Block list →" text link
  "Delete account →" coral text (confirms with typed phrase)
```

---

## S29 — Cred Score Detail

**Layout:**
```
NavHeader: "← Cred Score"

Hero ring (large, 160px, animated):
  Amber ring with percentage fill, navy track
  Centre: "847" Barlow Black 48px amber
  Below ring: "Top 22% · This month: ↑+63"

Score breakdown table (surface-1 cards, radius/sm):
  ┌──────────────┬──────┬──────┐
  │ Category     │ Pts  │ Wgt  │
  ├──────────────┼──────┼──────┤
  │ Win rate     │ +340 │ 40%  │
  │ Total bets   │ +180 │ 20%  │
  │ Streak bonus │ +200 │ 25%  │
  │ Consensus    │ +127 │ 15%  │
  └──────────────┴──────┴──────┘

History chart:
  Line chart, past 30 days, amber line, mint dots on wins
  Coral dot on loss spikes

Percentile breakdown:
  "You're better at predictions than 78% of CalledIt users this month."
  Inter Regular 13/18, text/secondary
```

---

## S30 — Bet History

**Layout:**
```
NavHeader: "← Bet History"

Filter bar (horizontal scroll):
  "All" | "Wins" | "Losses" | "Awaiting" | "Disputed"
  Active: amber fill chip

Sorted list of bet cards (compact variant):
  Each: 72px tall, surface-1, radius/md
  Left side: coloured dot (mint=win, coral=loss, amber=awaiting, muted=active)
  Bet title (truncated to 1 line, Barlow Bold 13px)
  Date + stake result (Inter Regular 11px muted)
  Right: outcome stamp "+$5" mint or "−$5" coral (Barlow Bold 13px)

Section headers: month grouping
  "MARCH 2026" overline (amber, Barlow Semi Bold 11px)

Load more: "Load 20 more bets" button at bottom (surface-2, text/secondary)
```

---

## S31 — Bet History — Win Filter

Same as S30 with "Wins" filter pre-selected and mint tinted list items.

---

## S32 — Share Bet Sheet

**Trigger:** Sharing icon on BetDetail or Bet Created Peak.

**Layout:**
```
Sheet (bg/sheet):
  Handle
  "SHARE THIS BET" overline (amber)
  
  Bet preview card (compact, surface-1, radius/md):
    Title + side bars

  Share options (2-column grid):
    [📋 Copy link]    [📱 QR Code]
    [💬 Messages]     [📧 Email]
    [More... →]       (native share sheet)

  Invite code (large, surface-2, radius/lg):
    "A3K9FQ"
    Barlow Black 40px, amber, centred, letter-spacing +4px
    "Anyone with this code can join" Inter Regular 12px muted

  "Done" full-width surface-2 button
```

---

## S33 — QR Invite

**Layout:**
```
NavHeader: "← QR Code"

Title: "Scan to join" Barlow Black 28px

QR code: 240×240px, white on navy (no colour — QR scanners need contrast)
Amber border frame (4px) with corner decorations

Group name below QR: "Sunday League" Barlow Bold 17px

"Or share the code:" 
Big code: "A3K9FQ" Barlow Black 40px amber (same as S32)

"Copy code" secondary button + "Share..." primary amber button
```

---

## S34 — Friend Profile (other user)

Same structure as S28 (Profile Tab) but:
- No edit button
- "Challenge →" amber FAB (pre-fills bet with @handle as participant)
- "Follow" / "Following" toggle button (top right of header card)
- Bets tab only shows public/shared bets

---

## S35 — Notifications Tab

**Layout:**
```
Status bar + NavHeader "Alerts" + "Mark all read" text link (right)

Filter: "All" | "Bets" | "Wins" | "Social"

Notification list (grouped by Today / Yesterday / Earlier):
  Each item (surface-1, radius/md, 72px min-height):
    Left: coloured avatar (44×44) + status dot overlay
    Body:
      "@sam wants you to join 'Arsenal bottles it'" (Barlow Semi Bold 13px off-white)
      "Sunday League · 2h ago" (Inter Regular 11px muted)
    Right: unread dot (8px amber) OR action chip

  Notification types + right-side treatment:
    Bet invite → [Join →] amber chip
    Resolution request → [Resolve →] amber chip
    New joiner → avatar only
    Win → "🏆 +125 Cred" mint text
    Dispute alert → [View →] coral chip
    
  Unread rows: surface-2 bg (slightly elevated)
  Read rows: surface-1 bg
```

---

## S36 — Notification Detail

**Layout:**
```
NavHeader: "← Alerts"

Full context card (surface-2, radius/lg, 20px pad):
  Notification headline Barlow Bold 17px
  Bet title in context
  "2 hours ago · Sunday League"

Relevant bet card (full width, interactive):
  Current state of the bet that triggered the notification

Primary action button (context-dependent):
  Join bet → amber "JOIN THIS BET"
  Resolve → amber "RESOLVE NOW"
  View dispute → coral "VIEW DISPUTE"
```

---

# Sprint 4 — Ledger & Ordinals

## S37 — Ledger Tab

**Layout:**
```
Status bar + "Ledger" title (Barlow Black 24px) + filter icon

Summary header card (surface-1, radius/lg, amber border top 3px):
  Row: "TOTAL BALANCE" overline
  "+$145.00" Barlow Black 40px mint
  "This month: +$20 · Pending: $5"
  
  Mini bar chart: past 6 months (amber = positive, coral = negative)

Filter bar: "All" | "Won" | "Lost" | "Pending"

Transaction list (grouped by month):
  Each row (surface-1, radius/md, 64px):
    Left dot: mint (won), coral (lost), amber (pending)
    Bet title truncated 1 line, Barlow Semi Bold 13px
    Opponent @handle, Inter Regular 11px muted
    Right: "+$5.00" mint / "−$5.00" coral, Barlow Bold 15px
           "Settled" / "Pending" caption 10px muted
    
  Long-press row → "Contest this →" bottom sheet option
```

---

## S38 — Transaction Detail

**Layout:**
```
NavHeader: "← Transaction"

Status card (full-width, fill = mint/coral/amber based on outcome):
  "WON +$5.00" Barlow Black 36px
  Or "LOST −$5.00" / "PENDING $5"

Bet summary: title, date, both sides

Settlement info:
  Status: "Settled · March 15, 2026"
  Or: "Awaiting settlement"

Payment options (if manual settlement):
  "@sam owes you $5"
  "Mark as settled" amber button
  "Remind @sam" surface-2 button

Bet detail link: "See full bet →"
```

---

## S39 — Ledger Empty

See empty state spec in design-system.md. "Your ledger is clean." state.

---

## S40 — Ordinal Bet — Create

**Purpose:** Ranked-order predictions (e.g., "Who finishes top 4 this season?").

**Layout (modal):**
```
Handle
"ORDINAL BET" chip (violet, "new feature" badge)
Title: "Predict the order" Barlow Black 28px

Description field (same as S14 but with ordinal placeholder):
  "Who wins the league? Drag to rank."

Rankings drag list:
  Numbered rows (1, 2, 3... up to 8)
  [≡ drag handle] [Team/option name input] [×]
  "Add option" + link below

Type: "First to…" / "Last to…" / "Full ranking"

Continue → S41
```

---

## S41 — Ordinal Rank Picker

**Layout:**
```
"RANK YOUR PREDICTION" overline

Drag-to-reorder list (each row 48px):
  1. Arsenal
  2. Man City  
  3. Liverpool
  ≡ drag handles on right

Participants' current rankings shown as coloured dots next to each option
(only visible if "show rankings" is on)

"Lock in ranking →" amber button
```

---

## S42 — Ordinal Evidence / S43 — Ordinal Resolution

Mirror standard Resolution flow (S21–S23) but with ranked outcomes. Shows who got closest to the correct order (Kendall tau score if full-ranking bet).

---

## S44 — Search Tab

**Layout:**
```
Status bar
"Search" Barlow Black 24px title (becomes input on tap)

Search input (when active):
  surface-2 bg, radius/full, Phosphor MagnifyingGlass icon left, clear × right
  Placeholder: "Search bets, people, groups…"

Trending (when not searching):
  "TRENDING IN YOUR GROUPS" overline
  Horizontal scroll of topic chips: "#Arsenal" "#Films" "#Food"
  
  "PEOPLE YOU MAY KNOW" overline  
  Horizontal avatar row + name + "Challenge →" chip

Recent: list of recent searches (text rows with clock icon)
```

---

## S45 — Search Results

**Layout:**
```
Search input (active, text entered)

Segment tabs: "Bets" | "People" | "Groups"

Results list (matches Search tab row format):
  Bets: compact bet cards with match highlight
  People: avatar + name + handle + "Challenge →" chip
  Groups: group emoji + name + member count + "Join →" chip

No results: "No results for '#Arsenal'" empty state → see S46
```

---

## S46 — Search No Results

See empty state spec in design-system.md. "Try different keywords" state.

---

# Sprint 5 — Timers & Polish

## S47 — Countdown Timer — Full Screen

**Trigger:** Tapping the timer on a Bet Detail when deadline <24h.

**Layout:**
```
Full-screen takeover (bg/base navy, no nav chrome)
Close × top-right (44×44, muted)

"TIME LEFT" overline (amber)
Bet title (truncated 1 line, Barlow Bold 17px, muted)

TIMER (Space Mono Bold, centred):
  "29:58" — 72px, mint → amber <1h → coral <5min

Below timer: "Until deadline · March 15 at 11:59 PM"
Inter Regular 13px, text/secondary

Background circle ring (same as cred ring):
  Animated amber ring depleting as time passes

If <1h: "⚠ Resolve before it expires or it auto-escalates."
  Amber tint box, amber text, Inter Regular 13px
```

---

## S48 — Timer Critical (<5 min)

Same as S47 but:
- Timer text: coral `#FC574E`
- Background ring: coral
- Pulsing animation on timer (scale 1.0→1.02, 500ms loop)
- Haptic warning fires at 5:00, 1:00, 0:30
- "RESOLVE NOW →" coral button pinned at bottom

---

## S49 — Timer Expired ✧

**Layout:**
```
Full screen: coral fill (#FC574E)

"TIME'S UP" Barlow Black 64px, off-white
"00:00" Space Mono Bold 72px, off-white

"Arsenal bottles it by March."
Barlow Bold 17px, off-white @ 75%

"This bet will auto-escalate to group vote in 5 minutes."
Inter Regular 14/20, off-white @ 65%, centred

[Resolve now →] white fill, coral text button
[Let group vote →] off-white @ 20% fill, off-white text button
```

---

## S50 — Settings

**Layout:**
```
NavHeader: "← Settings"

Section: ACCOUNT
  Profile →
  Notifications →
  Privacy →
  Blocked users →

Section: BETS & LEDGER
  Default resolution: Mutual ↕
  Currency: GBP £ ↕
  Auto-settle: toggle (Off)

Section: APPEARANCE (future)
  Theme: Dark (locked for now)

Section: ABOUT
  Rate CalledIt ♥
  Share the app
  Privacy Policy →
  Terms of Service →
  App version: 1.0.0

Section: DANGER ZONE
  "Delete account" coral text
```

---

## S51 — Notification Preferences

**Layout:**
```
NavHeader: "← Notifications"

Toggle rows (surface-1, radius/md):
  Bet invites          [●]
  Bet joined           [●]
  Resolution requests  [●]
  Dispute alerts       [●]
  Win celebrations     [●]
  Cred score changes   [○] (off by default — too noisy)
  Weekly summary       [●]

Quiet hours:
  "From 11:00 PM"  "To 7:00 AM"
  Surface-2, radius/sm time pickers

Note: "We never send more than 5 notifications per day."
Inter Regular 12px muted
```

---

## S52 — Account / Privacy

**Layout:**
```
NavHeader: "← Privacy"

"PROFILE VISIBILITY" section:
  Public / Friends only / Private — radio chips

"BET PRIVACY" section:
  Show bets on profile: toggle
  Show Cred Score: toggle
  Show win/loss stats: toggle

"DATA" section:
  Download my data →
  Delete all bets →  (coral, confirms with typed phrase)
```

---

## S53 — Rate / Feedback Sheet

**Layout:**
```
Sheet
Handle
"Enjoying CalledIt?" Barlow Black 24px

Star rating: 5 stars, amber filled on select, surface-2 empty

If 4–5 stars:
  → "Rate on the App Store →" amber button
  "Thanks for your support 🙌"

If 1–3 stars:
  → "Tell us what's wrong" text area (surface-2, radius/sm)
  "Send feedback →" amber button
  "Your feedback goes directly to Raghav."

"Skip" text link below
```

---

## S54 — Rank Up Peak ✧

```
Background: amber fill
Lottie: stars burst animation
Stamp: "RANK UP ⭐" Barlow Black 56px, navy
Sub: "You broke into the top 20% this week."
Stats: "847 Cred · Top 20%" navy pill
"See your score →" surface-1 button
```

---

## S55 — Streak Milestone Peak ✧

```
Background: flame orange #FF5500
Lottie: fire trail animation  
Stamp: "5 IN A ROW 🔥" Barlow Black 56px, off-white
Sub: "You're on fire. Don't stop calling it."
"Share your streak →" amber button (navy text)
```

---

## S56 — Friend Joined Peak ✧

```
Background: surface-2 (subtle, not full celebration)
"@abi_fc just took the other side."
Avatar: @abi large + joined animation
"GAME ON. 🤝" Barlow Black 36px, off-white
Bet title recap
"See the bet →" amber button
Auto-dismisses in 3s
```

---

# Cross-Sprint Shared Patterns

## Navigation Types

| Type | Animation | Use |
|------|-----------|-----|
| Push | Slide left (spring 250ms) | Browse flows |
| Modal | Slide up (spring 380ms) | Transactions, Create |
| Sheet | Slide up partial (spring 380ms) | Confirmation, quick actions |
| Tab | Cross-fade (150ms) | Tab bar switches |
| Peak ✧ | Scale + fade (600ms) | Emotional moments only |

## Empty State Pattern

Every empty state follows this template:
1. Illustration / Emoji (large, coloured)
2. Headline (Barlow Bold 22px, off-white) — always specific, never generic
3. Body (Inter Regular 15/22, text/secondary) — one actionable sentence
4. Primary CTA (amber button, if applicable)
5. Secondary CTA (text link, if applicable)

## Error State Pattern

Inline errors only (no popups):
- Field error: amber tint border + red helper text below field
- Network error: toast at bottom (surface-2, coral left border, text/primary)
- Conflict warning: amber tint box above CTA (non-blocking)
- Validation: on submit only, scroll to first error, shake animation

## Loading State Pattern

- Screen-level: skeleton cards (surface-2 blocks, shimmer animation, border/subtle)
- Component-level: amber spinner (custom, 24px)
- Optimistic inserts: full card visible immediately with "sending" cloud icon
- Error recovery: cloud icon becomes tap-to-retry (coral tint)
