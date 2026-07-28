# Sprint 2 Screens — Create Bet & Resolution

Frame size: **390 × 844px** (iPhone 14/15)

---

## S14 — Create Bet Step 1: Title (Modal, auto-focus)

**Trigger:** FAB tap from Feed or History. Slides up as full-screen sheet.

**Layout:**
```
Handle: 36×4px surface-3 pill, 12px from top (drag-to-dismiss)
Header:
  Left: "Discard" text link (text/secondary)
  Centre: "New Bet" Barlow Bold 17px off-white
  Right: "Preview →" text link (text/link, disabled until field has text)

Progress dots: 6 dots (●○○○○○), first amber-filled

Main input:
  Label: "WHAT'S THE BET?" overline (amber)
  
  Text area: full-width, min 3 lines, surface-2 bg, radius/md
  Placeholder cycles through examples:
    "Dave will be late to the wedding. By at least 20 minutes."
    "Loser eats whatever the group orders for them."
  Placeholder style: text/tertiary, Inter Regular 15px
  
  Character counter: appears at 100+/140, right-aligned, text/tertiary
  
  Below field: [✨ Sharpen] button (surface-2, amber text, appears at 15+ chars)
  + "Need ideas? →" text link (text/link, right side)

Type chips (below field):
  "Prediction" (default amber chip) | "Dare" | "Open"
  Active: amber fill, navy text
  Inactive: surface-3 fill, text/secondary

Live preview card (bottom, card-shaped):
  Shows bet as it will appear in feed, updates as user types
  "PREVIEW" overline above it in muted
  Ghost card (surface-1, border default, radius/md, 80% opacity until title exists)

CTA (above keyboard):
  "NEXT →" Barlow Bold 17px, amber fill, navy text, full-width, radius/lg
  Disabled (surface-2, text/tertiary) until description entered
```

**AI Sharpen flow (inline):**
```
On ✨ Sharpen tap:
  Button shows shimmer loading state
  Below field: preview card slides in (surface-2, border/strong amber)
    "SUGGESTED" overline (amber)
    Sharpened text in off-white Barlow Bold 16px
    [Use this ✓] amber button | [Keep mine ×] surface-3 button
  Accepted → original replaced, "Undo" toast for 5 seconds
```

---

## S15 — Create Bet Step 2: Category & Stakes

**Progress:** ●●○○○○

**Layout:**
```
Stakes chips (mutually exclusive):
  "Money on ledger" (default) | "Dare" | "Secret"
  
  Money selected → amount field slides in:
    "$ [5.00]" numeric keyboard, surface-3, radius/sm
    "$5 will appear on the ledger for both sides"
    
  Dare selected → dare field:
    "Loser must..." text input
    Quick-fill chips: "buys next round" · "profile pic for a month" · "their choice"
    
  Secret selected:
    "Only participants see the stake" hint, dimmed

Deadline chips:
  "Tonight" | "This weekend" | "1 week" | "Custom..."
  Custom → compact inline date/time picker (native DateTimePicker)

Bottom: NEXT →
```

---

## S16 — Create Bet Step 3: Resolution Method

**Progress:** ●●●○○○

**Layout:**
```
Section: "HOW DOES IT RESOLVE?" overline

Resolution chips:
  "Mutual" (default) | "Group vote" | "Judge"
  
  Judge selected → member picker appears:
    "Who decides?" label
    Scrollable avatar list with names, tap to select
    Selected shows amber check overlay on avatar

Privacy chips:
  "Group only" (default) | "Anyone with link"

NEXT →
```

---

## S17 — Create Bet Step 4: Group & Participants

**Progress:** ●●●●○○

**Layout:**
```
"WHICH GROUP?" overline

Group list (surface-1 rows):
  Each row: group emoji + name + member count
  ● Sunday League (4 members)   ← pre-selected if from feed
  ○ Work Crew (6 members)
  ○ Family (3 members)
  [+ Create new group]

"VISIBLE TO" section:
  "All group members" (default)
  Toggle: invite specific people → member picker

NEXT →
```

---

## S18 — Create Bet Step 5: Review

**Progress:** ●●●●●○

**Layout:**
```
"REVIEW YOUR BET" overline

Full bet card preview (full-width, non-interactive):
  Shows exactly how it will look in the feed
  All 5 status chip, side bars, footer filled in

Edit links next to each section:
  "Edit" text link (text/link) → navigates back to relevant step

Stake: "$5 per side on the ledger"
Group: "Sunday League · 4 members"
Deadline: "March 15, 2026 at 11:59 PM"
Resolution: "Mutual agreement"
```

---

## S19 — Create Bet Step 6: Final CTA

**Progress:** ●●●●●●

**Layout:**
```
(Same as S18 review but CTA changes to publish)

"CALLED IT 🔥" button:
  Full-width, amber fill, navy text, Barlow Bold 17px
  Height: 60px (slightly taller for the climactic action)
  Radius: radius/xl 40px (the biggest radius reserved for this moment)
  Haptic: .heavy
  
Below: "By publishing you agree your word is your bond."
  Inter Regular 11px, text/tertiary, centred
```

**On publish:**
- Modal dismisses (slide down)
- Feed scrolls to new card (animated entrance: scale 0.9→1.0, fade in)
- Haptic fires (.success)

---

## S20 — Bet Created Peak ✧

**Purpose:** Quick emotional reward after publishing. 1.5s auto-dismiss or tap to dismiss.

**Layout:**
```
Background: #6C63FF violet (full screen)
Lottie: sword clash animation (300×300px, centre)
Stamp: "BET PLACED ⚔️" Barlow Black 48px, off-white, −1px tracking
Sub: "Shared with Sunday League · Waiting on sides"
     Inter Regular 15/22, off-white @ 75%
     
Bottom: "See it in feed →" text link, off-white
Tap anywhere to dismiss
```

---

## S21 — Resolution Screen (Modal)

**Trigger:** Deadline passed → any participant taps "Resolve" on Awaiting card.

**Layout:**
```
Handle + "How did it end?" Barlow Bold 22px

Bet title reminder (surface-2 card, compact):
  "Arsenal bottles it by March."

Two large side buttons:
  [  ✓  YES — Side A won  ]  violet fill, off-white text, height 64px, radius/md
  [  ✓  NO — Side B won   ]  coral fill, off-white text, height 64px, radius/md
  8px gap between

Evidence field (optional, below buttons):
  "What happened? (optional)"
  Placeholder: "It got there at 29:58." / "He showed up at 7:42, receipt attached."
  Surface-3 bg, radius/sm, Inter Regular 15px

"It's complicated →" tertiary link (text/link) → Dispute flow

Submit: full-width amber "RESOLVE" button, disabled until side selected
```

**After first participant picks:**
```
Others see: "Jordan says Side A won — agree?"
  [  Agree ✓  ] mint fill, radius/md
  [  Dispute ✗ ] coral fill, radius/md (requires reason if tapped)
```

---

## S22 — Evidence Upload

**Layout:**
```
Back header: "← Evidence"

"ADD EVIDENCE" overline (amber)
Sub: "Help everyone agree. Add a screenshot, photo, or note."

Upload area:
  Dashed amber border, radius/lg, 160px tall
  [📷] icon + "Tap to add photo or video" (Inter Regular 15px muted)
  Or drag from Files

Uploaded items list: thumbnail + filename + "×" remove

Text evidence:
  "Or describe what happened:"
  Text area, surface-2, radius/md

Continue button → back to Resolution
```

---

## S23 — Winner Declaration

**Layout:**
```
Surface-2 full screen (elevated feel)

"THE VERDICT" overline (amber)
Bet card (full preview, status=Awaiting transitioning to resolved)

Winner section: (mint tint)
  "Side A wins"
  Avatar stacks of winners

Loser section: (muted)
  "Side B"
  Greyed avatar stacks

Evidence submitted:
  Screenshot thumbnail or text summary

"Confirm Resolution →" amber button
"Dispute →" coral text link
```

---

## S24 — Called It Win Peak ✧

**Purpose:** The product's emotional peak. The hero moment.

**Layout:**
```
Background: #8AE98D mint (full bleed)
Lottie: fire confetti (300×300, looping 2×)

STAMP (Barlow Black 64px, navy, −2px tracking, diagonal −12°):
"CALLED IT 🔥"

Sub-stamp: "Arsenal DID bottle it." (Barlow Bold 24px, navy)

Stats row:
  +125 Cred  ·  3-bet streak  ·  $5 won
  Surface-1 pill, navy text, Barlow Bold 13px

Bottom:
  "Share your win" amber button (navy text)
  "See ledger →" text link (navy @ 70%)

Auto-dismiss after 4s or tap
```

---

## S25 — Dispute Trigger Sheet

**Trigger:** Any participant taps "Dispute" during resolution.

**Layout:**
```
Sheet slides up (bg/sheet #121820)
Handle

"RAISE A DISPUTE" overline (coral)
Headline: "What's the issue?" Barlow Bold 22px

Reason chips (mutually exclusive, required):
  "Didn't happen" | "Deadline issue" | "Stake unclear" | "Other"

Optional details:
  Text input, "Describe the issue…" placeholder, surface-3, radius/sm

Note (amber tint box):
  "⚠ Disputes are visible to the whole group."
  "Only raise one if you genuinely disagree."

Buttons:
  "Raise Dispute" coral fill, off-white text, full-width, radius/lg
  "Cancel" text link
```

---

## S26 — Dispute Detail

**Purpose:** View ongoing dispute, vote if group-vote resolution.

**Layout:**
```
NavHeader: "← Dispute"

Status card (coral fill, radius/lg):
  "DISPUTED ⚖️" overline
  Bet title
  "Raised by @marcus · Deadline issue · 2h ago"
  "Group is voting"

Evidence section:
  Original claim vs counter-evidence cards

Vote section (if group-vote resolution):
  "CAST YOUR VOTE" overline
  [  Side A won  ] violet | [  Side B won  ] coral
  Vote bar showing current tally (anonymous until deadline)

Resolution pending note:
  "Voting closes in 23:14:05" (Space Mono)
  "Majority decides. Ties go to the judge."
```
