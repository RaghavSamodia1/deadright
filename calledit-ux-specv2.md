# CalledIt — Complete Frontend UX Specification

**Version 1.0 · Frontend-focused · React Native + Expo**

---

## 1. Product Definition

CalledIt is a social platform for tracking informal bets, predictions, and dares among friends. It converts spontaneous group banter ("bet you won't", "I'm calling it now") into structured, trackable, replayable social objects — without any real-money transfer.

**The job-to-be-done:** *"When my friends and I make a claim about the future, help us capture it instantly, keep everyone honest, and make winning feel glorious."*

### Product Pillars (every screen must serve at least one)

1. **Capture speed** — a bet must go from spoken idea to published card in under 20 seconds
2. **Shared memory** — the group feed is the canonical record; nothing gets forgotten
3. **Playful accountability** — reputation (Cred Score) replaces money as the enforcement mechanism
4. **Social identity** — wins, streaks, and tags become part of how friends see each other

### What CalledIt is NOT (anti-goals)

- Not a gambling app — no payment rails, no odds-making for real stakes
- Not a prediction market — no strangers, no public markets in v1
- Not a chat app — conversation happens elsewhere; CalledIt is the *ledger of claims*

---

## 2. Information Architecture

```
Root
├── Auth Stack (unauthenticated)
│   ├── Welcome / Value proposition
│   ├── Sign Up (phone or email)
│   ├── OTP Verification
│   └── Profile Setup (name + avatar)
│
└── Main Tab Navigator (authenticated)
    ├── Tab 1: Feed (home)
    │   ├── Group Feed (default)
    │   ├── Bet Detail (push)
    │   ├── Resolution Flow (modal)
    │   └── Dispute / Voting (modal)
    ├── Tab 2: History
    │   ├── Resolved bets timeline
    │   └── Ledger view (filterable)
    ├── [Center FAB: Create Bet] (modal, always accessible)
    │   ├── Quick create form
    │   └── Preview & publish
    └── Tab 3: Profile
        ├── Own profile (stats, tags, ledger summary)
        ├── Other user profile (push)
        ├── Group management (push)
        └── Settings (push)
```

**IA principles applied:**
- **Three tabs maximum** — fewer top-level destinations = lower cognitive load (Hick's Law: decision time grows with number of choices)
- **Create is a FAB, not a tab** — creation is an *action*, not a *place*. The floating button is reachable by thumb (Fitts's Law: bigger + closer = faster to hit) and persists across Feed and History
- **Maximum navigation depth of 3** — no screen should be more than 3 taps from launch
- **Modals for transactions, pushes for browsing** — resolution/disputes are commitments and get modal treatment (focused, dismissible-with-confirmation); browsing flows use standard push navigation with back gestures

---

## 3. Complete User Flows

Every flow below is written as: trigger → steps → states → exits → edge cases.

---

### FLOW 1: First Launch & Onboarding

**Trigger:** Fresh install, first open.

**Steps:**
1. **Splash** (≤1.5s, logo animation) → auto-advance
2. **Welcome carousel** — 3 swipeable cards max:
   - Card 1: "Turn 'I told you so' into a system" (hero visual of a bet card)
   - Card 2: "Bet anything. Money on the ledger, dares, or secrets" 
   - Card 3: "Your Cred Score is your reputation. Protect it."
   - Persistent "Get Started" button + "Skip" text link top-right
3. **Sign up screen** — phone number primary (one field), "or continue with email" secondary link. Single input visible at a time.
4. **OTP screen** — 6-digit code, auto-advancing boxes, auto-submit on 6th digit, auto-read SMS where OS permits. Resend link with 30s countdown timer shown.
5. **Profile setup** — display name (required) + avatar (camera / library / "generate one for me" fallback). Both on one screen. "You can change this later" microcopy.
6. **Land on empty Feed** → see FLOW 2 (cold start).

**UX rules for this flow:**
- Never ask for notification permission on first launch. Ask contextually (see FLOW 11).
- Progressive disclosure: never show more than one decision per screen during onboarding
- Carousel must be skippable from card 1 (user control & freedom — Nielsen #3)
- Total onboarding target: under 60 seconds

**Edge cases:**
- OTP fails 3× → offer email fallback inline, never dead-end
- User backgrounds the app mid-onboarding → resume exactly where they left off (state persisted locally)
- No name entered → button disabled with hint text, not an error popup

---

### FLOW 2: Cold Start (No Groups, No Bets)

**Trigger:** Authenticated user with zero groups.

This is the most dangerous moment in the product — an empty feed is a delete-the-app moment. The empty state must *do work*.

**Empty Feed design:**
- Illustration + headline: "Bets need witnesses."
- Two equally weighted actions:
  - **"Create a group"** → FLOW 3
  - **"Join with invite code"** → input field appears inline (no navigation)
- Below: a *ghost bet card* (greyed sample card showing what a real bet looks like) — teaches the core object passively (recognition over recall — Nielsen #6)

**Edge cases:**
- User creates a group but invites no one → feed shows "It's quiet in here" state with a prominent share-invite-link card pinned to top until ≥2 members exist
- User taps Create Bet with no group → allowed! Bet is created in a "solo" pending state with a forced share step at the end ("A bet with no opponent is just a diary entry — send it to someone")

---

### FLOW 3: Create / Join Group

**Create path:**
1. Tap "Create a group" (from empty state, or Profile → Groups → +)
2. Single screen: group name + optional emoji/photo
3. On create → immediately land on share sheet with invite link + 6-char invite code displayed large ("Anyone with this code can join")
4. Group now appears as a section header in Feed

**Join path:**
1. Tap invite link (deep link → app opens directly to confirmation) OR enter code manually
2. Confirmation screen: group name, member avatars, member count, "Join group" button
3. On join → land in Feed scrolled to that group's section, with a one-time highlight animation on the section header (visibility of system status — Nielsen #1)

**Edge cases:**
- Invalid/expired code → inline error under the field ("That code doesn't match any group — codes are 6 characters"), field keeps focus, input preserved
- Already a member → skip confirmation, deep link straight to the group with toast "You're already in Sunday League"
- Deep link while logged out → store the pending invite, run auth flow, then auto-complete the join (never lose the user's intent)

---

### FLOW 4: Create a Bet (The Core Flow)

**Trigger:** FAB tap from Feed or History. Target time-to-publish: **under 20 seconds**.

**Steps:**
1. Modal slides up (full-screen sheet, drag-to-dismiss with confirmation if fields are dirty)
2. **Description field auto-focused, keyboard up immediately** — zero taps wasted
3. Fields in vertical order (matching the natural sentence a person would speak):
   - **What's the bet?** — free text, 1–140 chars, live character counter appears at 100+
   - **Type** — chip selector: Prediction / Dare / Open. Default: Prediction (most common case pre-selected = smart defaults)
   - **Stakes** — chip selector: Money (ledger) / Dare / Secret
     - Money selected → amount field appears (numeric pad, $ prefilled)
     - Dare selected → "loser must…" text field appears
     - Secret selected → "Only participants see the stake" hint appears
   - **Deadline** — chip shortcuts first (Tonight / This weekend / 1 week / Custom), date picker only behind Custom (progressive disclosure)
   - **Resolution** — chips: Mutual / Group vote / Judge. Default: Mutual. Judge selected → member picker appears
   - **Group** — defaults to the group the user was viewing when they tapped the FAB (context preservation); tappable to change
4. **Live preview card** at the bottom — renders the actual bet card as the user types (visibility of system status; WYSIWYG removes publish anxiety)
5. **"Called It 🔥" button** — disabled until description exists; everything else has a default
6. On publish → modal dismisses, feed scrolls to the new card, card animates in with a single satisfying pop, haptic feedback fires

**UX rules:**
- Only ONE field is truly required (description). Every other field has a sensible default. Required-field minimization is the single biggest driver of completion rate.
- Never validate while typing — validate on publish attempt only, scroll to the first problem field, shake it gently, show inline message
- The chip pattern repeats for every choice → consistency & standards (Nielsen #4): learn it once, use it everywhere

**Edge cases:**
- Drag-dismiss with content entered → action sheet: "Keep editing / Save draft / Discard". Drafts surface as a banner chip on next FAB tap ("Resume your draft?")
- Offline at publish → optimistic insert into feed with a small "sending" cloud icon on the card; sync on reconnect; failure converts the icon to a tap-to-retry state. Never lose a written bet.
- Duplicate-ish bet detected in the same group (fuzzy title match) → non-blocking hint above the button: "Similar bet exists — 'City wins derby'. Publish anyway?" (error *prevention*, not error punishment — Nielsen #5)

#### 4a. Smart placeholders & example bets (zero-AI, ship in v1)

The description field never shows a generic "Enter bet description…" placeholder. Instead it cycles rotating real examples from the Sample Bet Library (§9):

- *"Dave will be late to the wedding. By at least 20 minutes."*
- *"Loser eats whatever the group orders for them."*
- *"Order everyone gets engaged."*

Rules:
- Placeholder matches the currently selected **type chip** (select Dare → dare examples rotate in)
- A small **"Need ideas?" shuffle button** sits under the field → opens a sheet of tappable example bets, grouped by type; tapping one fills the field as *editable* text (never publishes directly)
- Contextual quick-fills elsewhere: the dare stake field suggests common forfeits as chips ("buys next round", "profile pic for a month"); evidence text fields in resolution suggest the pattern *"It got there at 29:58."* style of timestamped fact

This is recognition over recall applied to writing: people know a good bet when they see one, but freeze when staring at an empty field.

#### 4b. "Sharpen it" — AI text polish (one LLM call, big payoff)

A small ✨ **Sharpen** button appears next to the description field once the user has typed ≥15 characters.

**What it does:** sends the raw text to a lightweight LLM call that rewrites it into a sharp, *verifiable* claim — fixing vagueness, adding the missing testable condition, and trimming filler.

- Input: *"i bet the pizza guy is gonna take forever again lol"*
- Output: *"The pizza arrives more than 45 minutes after ordering."*
- Input: *"marcus cant do 10 pullups no way"*
- Output: *"Marcus completes 10 strict pull-ups in one set by Sunday."*

**Bonus extraction:** the same call returns structured suggestions — detected deadline ("by Sunday" → pre-fills the deadline chip) and detected type (sounds like a dare → highlights the Dare chip). Suggestions appear as dismissible hints, never auto-applied.

**Non-negotiable UX rules for the AI feature:**
- **Suggestion, never substitution** — the polished text appears as a preview card *below* the field with "Use this" / "Keep mine" buttons. The user's original is never overwritten without a tap.
- **One-tap revert** — after accepting, an "undo" toast for 5 seconds restores the original
- **Fast or invisible** — if the call takes >2s, fail silently to a shimmer-then-disappear; never block publishing on AI
- **Offline = button hidden**, not disabled (don't advertise what can't work)
- **No auto-fire** — polish runs only on explicit tap; surprise rewrites of someone's words is a trust-killer
- **Voice = same pipeline** — when voice input ships (v2), the speech-to-text output runs through this exact sharpen flow, making 4b the foundation of the voice feature rather than throwaway work

**Implementation note (frontend):** debounce the button, optimistic shimmer on the preview card, cache the last result per draft so toggling between "Use this"/"Keep mine" is instant. Single API route (Supabase Edge Function wrapping the LLM call) so the prompt lives server-side and can improve without app updates.

---

### FLOW 5: Discover & Join a Bet

**Trigger:** User sees a bet card in Feed.

**The bet card (anatomy, top to bottom):**
1. Type pill + status indicator (colored dot + label)
2. Title (the claim itself — largest text on the card)
3. Side distribution bars + percentages
4. Avatar stacks clustered per side (social proof — *who* is on each side matters more than how many)
5. Stake summary + deadline countdown

**Join steps:**
1. Tap card → Bet Detail screen (push)
2. Detail shows: full pool breakdown, every participant with their side, stake details, timeline of events (created → joined → …), resolution method
3. Two large side buttons at bottom: **side A** / **side B** (color-coded consistently with the bars)
4. Tap a side → confirmation sheet: "You're taking **YES** on 'City wins the derby' — stake: $5 on the ledger" with **Confirm** (single tap, no typing)
5. On confirm → user's avatar animates into the side's avatar stack, bars re-balance with a smooth width transition, haptic fires

**UX rules:**
- Joining must be ≤3 taps from feed (card → side → confirm)
- The confirmation sheet exists because joining creates a ledger obligation — *reversible actions need no confirmation; consequential ones do*
- Show "You" badge on the user's own avatar everywhere it appears (recognition of self in the system)

**Edge cases:**
- Bet deadline passed while user was viewing → side buttons replaced by "Betting closed" state the moment the countdown hits zero (real-time state via Supabase channel)
- User is the creator → can join their own bet (it's their claim after all) but card shows "Creator" tag
- Changing sides → allowed until the first *other* person joins the user's new side would create imbalance abuse; v1 rule: side changes allowed until deadline, each change is a visible timeline event ("Jordan switched to NO 👀") — social transparency is the abuse deterrent

---

### FLOW 6: Resolution — Mutual Agreement (Happy Path)

**Trigger:** Deadline passes, or any participant taps "Resolve" on an active bet.

**Steps:**
1. Bet enters **Awaiting** state — card gains an amber "Needs resolution" banner; all participants get a notification
2. Any participant opens the bet → "How did it end?" sheet with the two sides as large buttons + "It's complicated" tertiary link (→ dispute, FLOW 7). An optional "What happened?" evidence field carries timestamped-fact placeholder examples — *"It got there at 29:58."*, *"He showed up at 7:42, receipt attached."* — nudging users toward verifiable, citable resolutions.
3. First participant picks an outcome → state becomes "Pending agreement"; everyone else sees "Jordan says YES won — agree?" with **Agree** / **Dispute** buttons
4. When all participants on the *losing* side have agreed (winners' agreement is assumed) → bet resolves
5. **Resolution moment** — this is the product's emotional peak, spend design budget here:
   - Winners see a celebration screen (confetti burst, "CALLED IT" stamp animation, cred score ticking up)
   - Losers see a respectful loss screen ("You'll get the next one" + ledger entry if monetary + dare obligation if dare)
   - The bet card in the feed gets a permanent resolved treatment (victor's side highlighted, stamp overlay)
6. Ledger entries auto-generate for monetary bets in "pending settlement" state

**Edge cases:**
- Losing participant ignores the agreement request for 48h → auto-escalates to group vote with notification ("Resolution timed out — group votes now")
- All participants on one side → instant resolution available to anyone, no agreement needed
- Unanimous wrong-button regret → 5-minute undo window after resolution ("Resolved by mistake? Undo") shown only to the resolver — error recovery (Nielsen #9)

---

### FLOW 7: Dispute & Voting

**Trigger:** Any participant taps "Dispute" during resolution.

**Steps:**
1. Disputer must pick a reason (chips: "Didn't happen" / "Deadline issue" / "Stake unclear" / "Other" + optional text) — friction here is *intentional*; disputes should cost a little effort
2. Bet enters **Disputed** state — red accent treatment, all participants notified
3. Resolution method routes the dispute:
   - **Mutual bets** → escalate to group vote
   - **Vote bets** → straight to vote
   - **Judge bets** → judge gets a dedicated "Make the call" screen with both sides' evidence
4. **Voting UI:** every group member (including non-participants — they're the jury) gets a vote card: bet title, both claims, optional evidence attachments, two vote buttons. Votes are weighted by Cred Score. 24h time limit with visible countdown.
5. Live tally is **hidden until vote closes** (prevents bandwagon voting) — show "7 of 11 have voted" progress only
6. Vote closes → resolution moment plays (FLOW 6 step 5) with "Decided by group vote" attribution
7. If vote ties or quorum (50% of group) isn't reached → bet marked **Controversial** — a permanent state, styled with a torn/split visual treatment. Controversial is a real outcome, and the card proudly displays it ("The group will never agree on this one")

**UX rules:**
- Disputes are framed as *normal*, not hostile — microcopy matters: "Not how you saw it?" not "Report a problem"
- The disputer's identity is always visible (no anonymous disputes — accountability is the product)
- Evidence attachments: photos/screenshots only in v1, max 3, shown as a thumbnail strip

---

### FLOW 8: Ledger & Settlement

**Trigger:** History tab → Ledger filter, or Profile → ledger summary tap.

**Ledger screen:**
- Net position hero number at top (+$180, color-coded green/red)
- Grouped by person, not by bet: "Marcus owes you $35 (3 bets)" — because settlement happens *between people*
- Tap a person → breakdown of the individual entries
- Each pairwise balance has a **"Settle up"** button → both parties get a confirmation; when both confirm, entries mark settled with strikethrough + date

**UX rules:**
- The app *never* moves money. Microcopy on every ledger screen footer: "CalledIt tracks who owes what — settle however you like."
- Net positions auto-offset (you owe Marcus $20, he owes you $35 → display "Marcus owes you $15")
- Settled history is collapsible but never deleted (the shared memory pillar)

**Edge cases:**
- One party confirms settlement, other doesn't within 7 days → gentle nudge notification to the non-confirmer, max 2 nudges, then it just sits (the app must never become a debt collector)
- Disagreement on settlement → no in-app mechanism in v1; this is deliberately left to the friendship


---

### FLOW 9: Profile & Reputation

**Own profile:**
1. Avatar + name + **Cred Score** (the hero element — large, with a subtle ring that fills relative to the group's max)
2. Stats row: Wins / Losses / Active
3. Reputation tags (earned, never self-assigned): "Hot Streak 🔥", "Honest Judge", "No Disputes", "Called It ×3"
4. Ledger summary card → taps through to FLOW 8
5. Resolved bet history (reverse chronological)
6. Settings gear (top right)

**Other users' profiles:**
- Same layout minus settings, plus "Head-to-head" section: your record against this specific person ("You vs Marcus: 4–2") — this is the screen people will screenshot and send to each other

**Cred Score display rules:**
- Score changes animate with a count-up/down ticker at resolution moments only — never silently
- Tapping the score opens a plain-language explainer sheet: what raises it (resolving bets, honest judging, vote alignment), what lowers it (abandoned bets, lost disputes). **No hidden mechanics** — an opaque reputation system breeds paranoia (help & documentation, Nielsen #10, but inline)

---

### FLOW 10: History

- Reverse-chronological resolved bets across all groups
- Filter chips: All / Won / Lost / Controversial / per-group
- Each entry: compact card (title, group, date, outcome badge, stake result)
- Tap → full bet detail in its frozen resolved state, including the complete timeline (who joined when, who voted what once closed) — the *replayable memory* pillar

---

### FLOW 11: Notifications (Permission & Content)

**Permission ask — contextual, never on launch:**
The ask fires at the first moment a notification would obviously benefit the user:
- Right after publishing their first bet: "Want to know the moment someone joins your bet?" → then the OS prompt
- This sequencing (soft ask → OS ask) preserves the one-shot OS permission

**Notification taxonomy & throttling:**

| Event | Priority | Batched? |
|---|---|---|
| You were tagged in a bet | High | No |
| Someone joined your bet | Medium | Yes (digest if >3/hr) |
| Bet needs resolution | High | No |
| Dispute opened | High | No |
| Vote requested | High | No |
| Deadline in 24h (participant) | Medium | No |
| Ledger nudge | Low | Weekly max |

**Rules:**
- Every notification deep-links to the exact screen where the action happens (not the feed)
- In-app notification center (bell icon) mirrors everything, so users who deny OS permission lose nothing functionally
- Per-group mute available (long-press group header → Mute)

---

### FLOW 12: Errors, Offline & Loading (System-Wide)

**Loading:**
- Skeleton screens for feed/profile (shaped like the real content), never full-screen spinners
- Per-card shimmer max 1.5s before showing a retry state
- Pull-to-refresh on every scrollable list with the standard platform spinner

**Offline:**
- Persistent thin banner ("You're offline — showing what we've got") only when connectivity is actually lost, auto-dismisses on reconnect
- All reads served from local cache (Supabase + local persistence)
- All writes queue optimistically (see FLOW 4 edge cases) with visible per-item sync state

**Errors:**
- Inline and local, never modal alerts unless the user is about to lose something
- Every error message: (1) plain language, (2) what happened, (3) what to do — "Couldn't publish your bet. Check your connection and tap to retry." (Nielsen #9)
- Global failure (Supabase down) → full-feed friendly state with mascot, not a stack trace

---

### FLOW 13: Ordinal Bets (v1.5 — design the data model now)

**Concept:** Instead of picking a side, participants predict the *order* in which things happen — "order the group gets girlfriends", "who gets married first → last". Mechanically distinct from binary bets, and the strongest long-term retention engine in the product.

**Why it's different:**
- Each participant submits a **ranked list**, not a side → `Participation.predicted_order: array` instead of `side: string`
- **Partial resolution** — when one slot locks in ("Marcus got a girlfriend"), the bet stays alive. Every locked slot re-notifies the group, reshuffles the live standings, and fires a mini-celebration ("Dev called Marcus first 🔮"). One bet can generate engagement for years.
- Resolution is event-driven: any participant can "lock a slot" (subject + position), confirmed by the same mutual/vote/judge machinery as FLOW 6/7

**Create flow additions:**
1. New type chip: **Order** (appears alongside Prediction / Dare / Open)
2. Subject picker — choose group members (or free-text items) to be ranked
3. The creator does NOT set the answer — publishing opens the prediction window

**Join flow:**
1. Bet detail shows the subject list in neutral (shuffled) order
2. **Drag-to-rank interaction** — long-press lifts an item (haptic + scale-up), drag to reorder, drop snaps with a spring. Numbered badges update live.
3. Confirm sheet shows the final ranked list before submitting
4. Predictions are **hidden from other participants until the prediction deadline passes** (same anti-bandwagon principle as hidden vote tallies)

**Live state (the long game):**
- Bet detail becomes a **standings board**: locked positions at top (with who-called-it credit), open slots below
- Leaderboard tab inside the bet: whose prediction is scoring best so far
- **Scoring v1:** exact-position points (e.g. 3 pts per correct slot). Rank-correlation scoring deferred.

**Edge cases:**
- A subject leaves the group → their slot marks "withdrawn", scoring adjusts to remaining slots, timeline records it
- A subject objects to being ranked → subjects who are group members get a one-tap "leave this bet" right (consent matters when people are the content); their slot withdraws
- Ties in final scoring → shared win, both get the cred
- Drag-to-rank accessibility → every item also has up/down arrow buttons for switch-control and screen-reader users; VoiceOver announces "Marcus, position 2 of 5, double-tap and hold to reorder"

**UI component required:** draggable flat list (e.g. `react-native-draggable-flatlist` on top of reanimated) — budget a sprint for polish; this interaction must feel great or the feature dies.

---

### FLOW 14: Timers & Time-Based Bets

Time is already woven through the product (deadlines, countdowns, vote windows). This flow formalizes it and adds an in-app **stopwatch/timer instrument** for bets where the time *is* the outcome.

#### 14a. The three timer roles

| Role | Example | UI |
|---|---|---|
| **Deadline countdown** | "Bet closes Sunday 5pm" | Passive countdown on card + detail |
| **Stopwatch (count up)** | "Pizza arrives in under 30 min" · "Dave is 20+ min late" | Active instrument, started by a participant, result becomes evidence |
| **Timer (count down)** | "Eats the ghost pepper within 2 minutes" · "Holds a plank for 90 seconds" | Active instrument with a target; beats-the-clock outcome |

#### 14b. Creating a timed bet

1. In the create flow, if the description contains time patterns ("within X minutes", "under 30 min", "in 90 seconds"), the **Sharpen/extract pipeline (4b)** detects it and suggests attaching a timer: dismissible hint chip — *"Add a 30:00 timer to this bet?"*
2. Manual path: a **"Timed"** toggle in the create form (appears under deadline) → pick stopwatch or countdown + target time
3. Timed bets get a small clock glyph on their card next to the type pill

#### 14c. Running the timer (the live moment)

This happens with everyone in the room — design it like a shared sporting moment:

1. Any participant opens the bet → big **"Start timer"** button (only available once ≥2 participants, so there's a witness)
2. Full-screen timer view: huge mono-spaced digits, bet title above, **Stop** button below. Stays awake (screen lock disabled while running).
3. Starting fires a real-time event — every participant's card shows the timer running **live** (Supabase channel), with "Started by Jordan" attribution
4. **Stop** requires a second participant's confirmation tap within 30s ("Marcus, confirm the stop?") — two-person integrity keeps it honest without being heavy
5. On stop: result stamps into the bet timeline as structured evidence — *"It got there at 29:58."* — auto-formatted, tamper-proof (server timestamps, not device clock)
6. If the bet has a target (countdown), the outcome is auto-suggested: under target → "Side YES wins?" pre-selected in the resolution sheet. One tap from timer to resolved.

**The 29:58 moment is the product at its best:** a room full of people screaming at a phone as the clock runs out. The timer view must be glanceable from across a table — max digits, max contrast.

#### 14d. Timer rules & edge cases

- **Server time is truth.** Start/stop are server-stamped; the client clock only renders. Eliminates "your phone is fast" disputes by design.
- App backgrounded mid-timer → timer continues server-side; on return, display re-syncs. A live activity / notification shows the running clock (iOS Live Activities, Android foreground notification).
- Connectivity lost mid-timer → local display continues with an "unsynced" badge; server reconciles on reconnect. If start and stop both happened offline on one device, result is marked "unwitnessed" in the timeline (resolvable, but flagged for the group's judgment).
- Accidental start → 10-second grace window where the starter can cancel without trace
- Multiple stop attempts (chaos in the room) → first server-received stop wins, others get "Already stopped at 29:58"
- Disputed time → normal dispute flow (FLOW 7); the timeline shows raw server timestamps as evidence
- Accessibility: timer announces at meaningful intervals via screen reader (every minute, then 10s, then final 5 countdown); haptic pulse pattern at target approach for deaf users

#### 14e. Passive countdown display rules (system-wide)

- **>7 days:** show date ("Closes Mar 3") — counting down weeks creates false urgency
- **1–7 days:** "3d left"
- **<24h:** "14h left", card gains subtle amber accent
- **<1h:** live ticking "42:18", amber → red as it approaches zero
- **Zero:** state flips in real time on every connected device — betting closes the *second* it closes
- Vote windows (FLOW 7) use the same display ladder

#### 14f. Data model additions (design now, even if 14c ships v1.5)

```
Bet additions:
  timer_type: "none | stopwatch | countdown"
  timer_target_seconds: number | null

TimerEvent (new table):
  id, bet_id, action: "start | stop | cancel",
  user_id, confirmed_by: user_id | null,
  server_timestamp, synced: boolean
```

---

## 4. UX Heuristics — Applied Checklist

How Nielsen's 10 heuristics map to specific CalledIt decisions:

| # | Heuristic | Where it lives in CalledIt |
|---|---|---|
| 1 | Visibility of system status | Live status dots on bet cards; sync icons on offline writes; vote progress counters; countdown timers; cred ticker animations |
| 2 | Match system ↔ real world | Bets are written as natural claims; ledger grouped by *person*; "Called It" as the publish verb; no jargon ("resolve" not "adjudicate") |
| 3 | User control & freedom | Drag-dismiss with draft saving; 5-min resolution undo; side-switching before deadline; skippable onboarding; per-group mute |
| 4 | Consistency & standards | One chip pattern for all choices; one card anatomy everywhere; platform-native gestures (swipe back on iOS, hardware back on Android); color = side, always |
| 5 | Error prevention | Smart defaults on every optional field; duplicate-bet hint; deadline chips over raw date pickers; confirmation only for consequential actions |
| 6 | Recognition over recall | Ghost bet card in empty state; live preview while creating; avatar stacks (faces over names); "You" badges; visible invite codes |
| 7 | Flexibility & efficiency | FAB persists across tabs; deadline shortcuts; deep links everywhere; context-aware group default on create |
| 8 | Aesthetic & minimalist design | One required field to publish; 3 tabs; progressive disclosure for stake/judge/custom-date fields; hidden vote tallies |
| 9 | Error recovery | Inline retry on failed sends; resolution undo window; auto-escalation when agreement stalls; OTP → email fallback |
| 10 | Help & documentation | Cred Score explainer sheet; ledger footer disclaimer; contextual microcopy instead of a help section |

### Additional laws factored in

- **Fitts's Law** — primary actions (FAB, side buttons, Confirm) are large and bottom-anchored in the thumb zone; destructive actions are small and top-placed
- **Hick's Law** — never more than 3–4 chips per choice row; 3 tabs; one decision per onboarding screen
- **Peak-End Rule** — the resolution moment (peak) and celebration/loss screens (end of a bet's life) get disproportionate design investment; this is what users remember and retell
- **Zeigarnik Effect** — unresolved bets create open loops; the "Needs resolution" banner and awaiting states harness this for retention (and the 48h auto-escalation prevents it becoming anxiety)
- **Social Proof** — avatar stacks per side are the primary join motivator; *who* is betting matters more than the odds
- **Doherty Threshold** — every interaction responds in <400ms; anything slower gets optimistic UI or a skeleton

---

## 5. Interaction & Motion Guidelines

- **Haptics:** light impact on chip select; medium on join confirm; success notification haptic on resolution win. Never haptic on scroll or passive events.
- **Animation budget:** 200–300ms for transitions, spring curves for card entries, 60fps non-negotiable (use `react-native-reanimated`, run on UI thread)
- **One celebration only:** confetti fires on resolution wins. Nowhere else. Scarcity keeps it meaningful.
- **Reduced motion:** respect the OS accessibility flag — replace springs/confetti with fades

## 6. Accessibility Baseline (v1, non-negotiable)

- All touch targets ≥ 44×44pt
- Color is never the *only* signal — side bars carry labels + percentages; status dots carry text labels
- Contrast ≥ 4.5:1 for body text, 3:1 for large text (test the brand orange on dark)
- Full VoiceOver/TalkBack labels on cards: "Prediction bet: City wins the derby. 62 percent yes, 38 percent no. 7 participants. 3 days left."
- Dynamic Type support — layouts must survive 1.3× font scaling
- Reduced motion handling (see §5)

## 7. Content & Microcopy Voice

- **Voice:** confident friend, lightly competitive, never corporate. "Called It 🔥" not "Submit". "You'll get the next one" not "Bet lost."
- **Numbers are honest:** percentages always sum visibly; ledger math always shown, never just totals
- **No dark patterns:** no fake urgency, no guilt-trip notification copy, no hidden cred mechanics, easy mute/leave on everything

## 8. Frontend Build Priority (mapped to flows)

| Sprint | Build | Flows covered |
|---|---|---|
| 1 | Auth screens + tab shell + empty states | 1, 2 |
| 2 | Bet card component + Feed + Create modal (incl. smart placeholders 4a) | 4, 5 (read) |
| 3 | Bet detail + join flow + group create/join | 3, 5 |
| 4 | Resolution + dispute + voting UIs | 6, 7 |
| 5 | Profile, history, ledger | 8, 9, 10 |
| 6 | Notifications, offline states, "Sharpen it" AI polish (4b), polish, a11y pass | 11, 12, 4b |
| 7 (v1.5) | Ordinal bets: drag-to-rank, standings board, partial resolution | 13 |
| 8 (v1.5) | Live timer instrument: shared stopwatch/countdown, two-person stop, live activities | 14 |

Note: passive countdowns (14e) and the timer data model (14f) belong in v1 sprints 2 and 1 respectively — only the live shared instrument (14c) waits for v1.5.

The bet card component is the atom of the entire app — it appears in feed, detail, history, profiles, and previews. **Build it first, build it well, and make it a single component with variants**, not five lookalike components.

---

## 9. Sample Bet Library (seed content & in-app inspiration)

Use these as create-form placeholders, an empty-state "need inspiration?" shuffle, and ghost-card examples. The quality formula: a good bet is **verifiable, time-bound, and a little embarrassing for someone**.

### Predictions
- "Dave will be late to the wedding. By at least 20 minutes."
- "This relationship doesn't survive the holidays."
- "The group trip we're planning right now never actually happens."
- "Priya gets promoted before June."
- "The new restaurant everyone's hyping closes within a year."
- "Arsenal bottles it by March."
- "Mom will mention my haircut within 5 minutes of walking in."

### Dares (loser does the thing)
- Loser eats whatever the group orders for them, no questions
- Loser's profile pic gets chosen by the winner for one month
- Loser does karaoke first at the next night out — song picked by winners
- Loser gives a sincere 2-minute toast to the winner at the next dinner
- Loser wears the rival team's jersey to the next watch party
- Loser texts their crush a line written by the group

### Open challenges (anyone joins, anyone wins)
- First one to hit the gym 20 times this month
- Who can go the longest without ordering delivery
- Step count champion of the week
- First person to get a stranger to laugh today (evidence required)
- Lowest screen time this week takes the pot
- No one says "literally" for 48 hours — last survivor wins

### Ordinal bets (predict the order)
- Order the group gets girlfriends/boyfriends
- Order everyone gets engaged
- Who gets married first → last
- Order of first kid
- Order everyone moves out of their parents' place
- Order of buying a first car / first house
- Who hits 100k salary first, second, third
- Order everyone leaves their current job
- Who goes bald first
- Order of arrival to the party tonight
- Who taps out first on the group hike
- Order everyone falls asleep on the trip
- Fantasy league final standings, predicted before the season
- Who replies to this group chat message last

### Timed bets (built-in stopwatch/timer)
- "Pizza arrives in under 30 minutes" (stopwatch)
- "Dave shows up 20+ minutes late tonight" (stopwatch)
- "Marcus holds a plank for 90 seconds" (countdown)
- "Finishes the spicy ramen within 10 minutes" (countdown)
- "Solves the Rubik's cube in under 2 minutes" (countdown)
- "The meeting runs at least 15 minutes over" (stopwatch)

### Long-game classics (the legend builders)
- "Bet you $50 you two end up dating." (resolve in a year)
- "Jake will not finish the marathon he just signed up for."
- "I'll have a better Wordle average than you over 30 days."
- "By the next New Year's, at least two of us will have quit our jobs."
