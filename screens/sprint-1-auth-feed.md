# Sprint 1 Screens — Auth & Core Feed

Frame size: **390 × 844px** (iPhone 14/15)
Status bar: 59px · Tab bar: 83px · Gutter: 20px · Content width: 350px

---

## S01 — Splash

**Purpose:** Brand moment on cold launch. Auto-advance at 1.5s.

**Layout:**
```
Background: #0E121A full bleed
Center: "Called" (Barlow Black 80px, #F0F0F0) + "It." (#F7C846 amber) stacked
Below title: 🔥 emoji 48px, flame orange
Bottom 20%: loading bar (thin, amber, animates 0→100% in 1.2s)
```

**Notes:**
- No status bar visible (edge-to-edge)
- Logo entrance: fade-in + scale 0.85→1.0 with spring (400ms)
- "Called" and "It." on same line with tightly tracked −3px

---

## S02 — Onboarding Slide 1: Make the Call

**Purpose:** Value prop card 1 of 4. Skippable from any slide.

**Layout:**
```
Background: #FF5500 flame orange (bold fill card — Sinport pattern)
Top-right: "Skip" link (Inter Regular 14px, navy #0E121A)
Top: "01" overline (Barlow Semi Bold 11px, navy @ 40%)
Big emoji: 🎯 64px
Headline: "Make the call." (Barlow Black 40px, navy, −1px tracking)
Body: "Call your prediction before the moment arrives. Put it on the line."
      (Inter Regular 15/22, navy @ 75%)
Bottom: dot indicators (4 dots, active = 16px wide pill, inactive = 5px circle)
        "Next →" button (navy bg, off-white text, full-width, radius/lg)
```

**Notes:**
- Text colour: navy `#0E121A` on flame (light-on-dark inversion since flame is bright enough)
- Dots at bottom-center, 8px above "Next" button

---

## S03 — Onboarding Slide 2: Pick Your Side

**Background:** `#6C63FF` violet

Content mirrors S02 pattern:
- Emoji: ⚔️
- Headline: "Pick your side."
- Body: "FOR or AGAINST. Lock it in. Your word is your bond."
- Dot 2 active

---

## S04 — Onboarding Slide 3: Called It Wins

**Background:** `#F7C846` amber

- Emoji: 🏆
- Headline: "Called It wins."
- Body: "The evidence is in. Who was right? You already knew."
- Dot 3 active

---

## S05 — Onboarding Slide 4: Build Your Cred

**Background:** `#8AE98D` mint

- Emoji: ⭐
- Headline: "Build your cred."
- Body: "Win more, earn cred. Your reputation for being right follows you."
- "Get Started" primary CTA (navy bg, off-white text) replaces "Next →"
- Dot 4 active

---

## S06 — Sign Up

**Purpose:** Enter phone number. Single field, keyboard-up immediately.

**Layout:**
```
Status bar (59px, transparent over navy)
Back arrow top-left (44×44 touch target)

Overline: "STEP 1 OF 3" (Barlow Semi Bold 11px, amber, ALL CAPS, +2px tracking)
Title: "What's your\nnumber?" (Barlow Black 36px, off-white, −0.5px tracking)
Sub: "We'll send a one-time code." (Inter Regular 15px, muted)

Phone input:
  - Flag + dial code picker (+44 by default)
  - Phone field: surface-3 bg, border/default, radius/sm (16px)
  - Active border: border/strong (#3C5070)
  - Placeholder: "07700 900 000" in text/tertiary

Below input: "or continue with email →" link (text/link, Inter Regular 13px)

Continue button (pinned above keyboard):
  - Full-width, radius/lg (32px), amber bg, navy text
  - "CONTINUE" Barlow Bold 17px
  - Disabled state: border/default bg, text/tertiary text, until phone entered
```

**Notes:**
- Keyboard appears immediately on screen entrance
- Button floats above keyboard (`KeyboardAvoidingView`)
- No password, no email required (phone-first)

---

## S07 — OTP Verification

**Layout:**
```
Status bar
Back arrow

Overline: "STEP 2 OF 3" (amber)
Title: "Enter the code." (Barlow Black 36px)
Sub: "Sent to +44 7700 900 000" (Inter Regular 15px, muted)
     "Wrong number? ←" link

OTP input: 6 individual boxes in a row
  - Each: 52×64px, surface-2 bg, border/default, radius/sm
  - Focused box: border/strong, amber bottom border 2px
  - Filled box: surface-3 bg, off-white text Barlow Bold 28px
  - Auto-advances on input

Resend link: "Resend code" — disabled for 30s with countdown
  "Resend in 0:28" (text/tertiary) → becomes "Resend code" link after

Continue button: same pattern as S06, auto-submits on 6th digit
```

---

## S08 — Profile Setup

**Purpose:** Name + avatar, both on one screen. "You can change this later."

**Layout:**
```
Status bar
Back arrow

Overline: "STEP 3 OF 3" (amber)
Title: "Who are you?" (Barlow Black 36px)

Avatar picker (centre):
  - 96×96px circle, surface-2 bg, dashed amber border (1.5px)
  - Camera icon inside (32px, muted)
  - Tap → action sheet: "Take a photo / Choose from library / Generate one for me"

Name input:
  - Label: "Display name" (Barlow Semi Bold 12px, amber overline)
  - Input: surface-3 bg, radius/sm, placeholder "e.g. Sam" in text/tertiary
  - Max 24 chars, live counter appears at 16+

Below input:
  - "You can change this later." (Inter Regular 12px, text/tertiary)

Continue button: "LET'S GO 🔥" — disabled until name entered
```

---

## S09 — Feed (Home Tab — with bets)

**Purpose:** Core loop. The group feed of active and recent bets.

**Layout (top to bottom):**

### Status bar (59px)

### Navigation header (56px)
```
Left:  "CalledIt" Barlow Black 24px amber + "🔥" emoji
Right: [Bell icon 24px, muted] [Avatar 32px round, violet bg with initials]
Background: bg/base #0E121A
Bottom border: border/subtle 1px
Padding: 0 20px
```

### Group filter tabs (44px, horizontal scroll, no scroll indicator)
```
Chips: "All" | "Sunday League" | "Work Crew" | "Family"
Active chip: amber fill, navy text, radius/full
Inactive chip: surface-2 fill, text/secondary, radius/full
Padding: 12px 20px each chip, 8px gap
Container: 0 gutter, 16px padding-left
```

### Feed list (vertical scroll, 12px gap between cards)

**Bet Card — Active (default state):**
```
Background: #151B26 surface-1
Border: border/default 1px
Radius: radius/md 24px
Padding: 16px all sides

┌ Author row (height: 36px):
│  [Avatar 32px round, violet bg] [@sam_bets Barlow Semi Bold 13px off-white]
│  [Sunday League · Inter Regular 11px muted]              [ACTIVE chip]
│
│  ACTIVE chip: surface-2 bg, text/secondary, radius/xs 8px, 4px 8px padding
│  Barlow Semi Bold 9px ALL CAPS

├ Title (Barlow Bold 16/22, off-white, max 2 lines):
│  "Arsenal bottles it by March."

├ Side bars:
│  Label row: "Side A  62%"(violet) ·· "38%  Side B"(coral)  Inter Regular 10px
│  Track: 8px height, radius/full
│    - Violet fill: 62% width
│    - Coral fill: 38% width (right-aligned, same track — CSS: flex)
│    - Gap between: 2px, surface-2 bg showing through

└ Footer row:
   [👥 5] · [$25] · [02:59:41 in Space Mono Bold 11px mint]
   Inter Regular 11px text/tertiary
   Dividers: surface-2 rectangles 1×12px between items
```

**Bet Card — Awaiting (amber fill):**
```
Background: #F7C846 amber
Text: #0E121A navy (all text inverted)
Status chip: navy bg @ 20%, navy text "AWAITING"
Title: Barlow Bold 16/22, navy
Footer: navy @ 70%
```

**Bet Card — Win (mint fill):**
```
Background: #8AE98D mint
Text: #0E121A navy
Status chip: "YOU WON 🏆"
```

**Bet Card — Disputed (coral fill):**
```
Background: #FC574E coral
Text: #F0F0F0 off-white
Status chip: off-white @ 20% bg, off-white text "DISPUTED"
```

### FAB (Create Bet)
```
Position: fixed bottom-right
  right: 24px (fab-margin)
  bottom: 83px (tab bar) + 16px gap = 99px
Size: 56×56px, radius/xl (40px)
Fill: amber #F7C846
Icon: "+" 28px, navy colour
Shadow: 0 4px 16px rgba(247,200,70,0.4) — amber glow
```

### Tab bar (83px total)
```
Background: surface-1 #151B26
Top border: border/subtle 1px
Content area: 49px (34px safe area padding-bottom)
5 items: House | MagnifyingGlass | [FAB gap] | Bell | User
Active icon: amber fill
Inactive: text/tertiary (muted blue-grey)
Labels: Barlow Semi Bold 10px below icon (active=amber, inactive=muted)
Labels: Feed | Search | — | Alerts | Profile
```

---

## S10 — Feed Pull-to-Refresh

Same as S09 with:
- Amber spinner at top (custom, matches brand)
- "Checking for new bets…" caption Inter Regular 12px muted, below spinner

---

## S11 — Bet Detail

**Purpose:** Full detail of a single bet. Join from here.

**Layout:**

### Status bar + Back header
```
Left: ← back arrow (44×44, muted)
Centre: "Bet" (Barlow Bold 17px, off-white)
Right: Share icon (muted) | ⋮ more icon (muted)
```

### Scrollable content:

**Hero section (card at top, full-width minus 20px gutter each side):**
```
Background: surface-2 (or status fill if not active)
Radius: radius/lg 32px
Padding: 20px
Gap: 16px between elements

Author row: same as feed card but larger (avatar 40px)
Title: Barlow Bold 22/28, off-white
Type pill: "Prediction" chip (surface-3, text/secondary)
```

**Side distribution:**
```
Section label: "SIDES" overline (amber, Barlow Semi Bold 11px)
Two rows:
  Side A: [Violet bar 10px tall] 62%  ·  3 people
  Side B: [Coral bar 10px tall]  38%  ·  2 people
Avatar stacks: 24px overlapping avatars (−8px overlap) per side
               "Join Side A" / "Join Side B" below each stack
```

**Details grid (2 columns):**
```
┌──────────────┬──────────────┐
│ Deadline     │ Stakes       │
│ 03/15/2026   │ $5 per side  │
├──────────────┼──────────────┤
│ Resolution   │ Group        │
│ Mutual       │ Sunday League│
└──────────────┴──────────────┘
Surface-2 bg, radius/sm, Barlow Bold labels, Inter values
```

**Timeline (events):**
```
Section: "TIMELINE" overline
List of events with dot + line connector:
  ● Bet created by @sam_bets · 2 days ago
  ● @abi joined Side A · 1 day ago
  ● @marcus joined Side B · 1 day ago
  ● Deadline: March 15
```

### Bottom action (fixed, above tab bar)
```
Background: bg/base, top border subtle
Two equal buttons side by side:
  [  SIDE A: YES  ] violet fill, off-white text, radius/lg
  [  SIDE B: NO   ] coral fill, off-white text, radius/lg
Height: 52px each
Padding: 20px horizontal, 16px bottom + safe area
```

---

## S12 — Side Selection Sheet (Bottom Sheet)

**Trigger:** Tapping either side button on Bet Detail.

**Layout:**
```
Overlay: #000000 @ 72%
Sheet slides up from bottom:
  Background: bg/sheet #121820
  Radius: radius/lg 32px top corners only
  Drag handle: 36×4px surface-3 pill, centred, 12px from top

Content (padding 24px):
  Overline: "CONFIRM YOUR SIDE" (amber)
  
  Bet title (Barlow Bold 18px, off-white):
  "Arsenal bottles it by March."

  Selected side (large, coloured):
    [Side A card] violet bg, radius/md
    "✓  YOU'RE TAKING YES" Barlow Bold 17px navy
    
  Stakes reminder:
    "$5 goes on your ledger if you lose"
    Inter Regular 13px, text/secondary

  Confirm button:
    Full-width, amber fill, "CONFIRM — SIDE A" Barlow Bold 17px navy
    radius/lg 32px, height 52px, Haptic: .heavy on tap
    
  "Cancel" text link below (text/secondary, Inter Regular 15px)
```

---

## S13 — Bet Confirmation (Post-join Peak)

**Purpose:** Small emotional reward after joining. Dismisses to Bet Detail with animated avatar appearing in the side stack.

**Layout:**
```
Sheet (same bg as S12):
  Large emoji: ⚔️ or 🤝 depending on whether another side exists
  
  Stamp text: "SIDE A LOCKED 🔒" Barlow Black 28px, violet
  
  Summary:
    "You're taking YES on"
    "'Arsenal bottles it by March.'"
    Inter Regular 15/22, off-white

  Stake confirmation:
    "$5 on the ledger · Settles when resolved"
    Inter Regular 13px, text/tertiary

  "Got it" button: surface-2 bg, off-white text (secondary action — don't over-celebrate here)
  
  Below: "Share this bet →" text link (amber, Inter Regular 13px)
```

---

## Navigation Architecture (Sprint 1)

```
AuthStack (not authenticated)
  └── Welcome (onboarding carousel)
      └── SignUp (S06)
          └── OTP (S07)
              └── ProfileSetup (S08)
                  └── [MainTabNavigator]

MainTabNavigator
  ├── Tab 1: FeedStack
  │   ├── Feed (S09) ← root
  │   ├── BetDetail (S11) ← push
  │   └── SideSelectionSheet (S12) ← bottom sheet (not a screen, modal)
  │       └── BetConfirmation (S13) ← sheet swap
  ├── Tab 2: HistoryStack (Sprint 3)
  ├── [FAB → CreateBetModal] (Sprint 2)
  └── Tab 3: ProfileStack (Sprint 3)
```

---

## Shared Components Needed (Sprint 1)

These will be extracted as Figma components in the next step:

| Component | Variants | Used on |
|-----------|----------|---------|
| `BetCard` | active, awaiting, win, loss, disputed, controversial | Feed, Detail |
| `TabBar` | default (5 items) | all main screens |
| `NavHeader` | back, title+actions, home | all screens |
| `SideBar` | two-tone bar, percentages | Card, Detail |
| `StatusChip` | active, live, awaiting, win, loss, disputed, controversial | Card |
| `Avatar` | 24px, 32px, 40px, 96px | everywhere |
| `PrimaryButton` | amber, disabled | everywhere |
| `BottomSheet` | drag handle + content | S12, S13 |
| `FilterChip` | active (amber), inactive | Feed |
| `OTPInput` | 6-digit, empty/filled/error | S07 |
| `PhoneInput` | flag + number field | S06 |
