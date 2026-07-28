# Heuristics Review — Nielsen's 10 (July 2026)

Scope: all 59 built screens + component library, evaluated against the UX spec's own
principles. ✅ = pass, ⚠️ = fixed during this review, ❌ = gap requiring new screens.

## H1 — Visibility of system status
- ✅ Card fill = status (Sinport pattern) — status readable without text
- ✅ Live timers (Space Mono, colour-shifts mint→amber→coral), pull-to-refresh state
- ✅ Progress dots on onboarding + create flow, OTP resend countdown
- ⚠️ **Fixed:** S14 had no draft-persistence indicator → added "Draft saved ✓" whisper

## H2 — Match between system and real world
- ✅ Copy speaks bettor language ("bottles it", "Called it", "Your word is your bond")
- ✅ Sentence-order create flow (what → stakes → deadline → who decides)

## H3 — User control and freedom
- ✅ Skip on onboarding card 1, Discard on create modal, Cancel on all sheets
- ✅ Drag-to-dismiss sheets with dirty-state action sheet
- ⚠️ **Fixed:** S24 Win peak lacked the spec's 5-minute undo (FLOW 6 edge case) →
  added "Resolved by mistake? Undo · 4:59" link (resolver only)

## H4 — Consistency and standards
- ✅ Chip pattern identical across create/filter/settings flows
- ✅ Violet=A / Coral=B never swapped; amber CTA everywhere
- ✅ All 44×44 touch targets, 20px gutters, 390×844 frames verified by audit

## H5 — Error prevention
- ⚠️ **Fixed:** duplicate-bet hint (FLOW 4 edge case) was specced but missing →
  added non-blocking hint above the CALLED IT button on S19
- ✅ Dispute friction is intentional (reason required), destructive actions coral

## H6 — Recognition rather than recall
- ✅ Rotating example placeholders + "Need ideas?" library in create flow
- ❌ **Ghost bet card on cold-start empty feed** (FLOW 2) — screen didn't exist → built S57

## H7 — Flexibility and efficiency
- ✅ Deadline chip shortcuts, quick-fill dare forfeits, "Own up" one-tap in Swear Jar
- ✅ Smart defaults: only description is required to publish

## H8 — Aesthetic and minimalist design
- ✅ One decision per onboarding screen; progressive disclosure (custom date behind chip)

## H9 — Help users recognise, diagnose, recover from errors
- ✅ OTP error state (coral boxes), inline field errors, retry toast
- ✅ Timer expiry auto-escalation messaging
- ⚠️ Offline "sending → tap-to-retry" card state exists in Toast/code but has no
  screen representation — acceptable (component-level state)

## H10 — Help and documentation
- ✅ Contextual microcopy throughout ("Anyone with this code can join", jar cap note)

## Missing flow screens found (all built in this pass)
| ID | Screen | Why it was missing |
|---|---|---|
| S57 | Empty Feed (cold start) | FLOW 2 — "the most dangerous moment in the product" |
| S58 | Create Group | FLOW 3 create path |
| S59 | Join Group confirm | FLOW 3 join path (deep link / code entry) |
| S60 | Blocked Users | Settings row dead-ended |
| S61 | Delete Account confirm | Danger-zone row dead-ended (typed-phrase confirm) |
| S62 | Default Resolution picker | Settings value rows dead-ended |

Settings flow is now fully navigable: every row on S50 leads somewhere real
(S28 Profile Edit, S51 Notifications, S52 Privacy, S60 Blocked, SJ03 Jar defaults,
S62 pickers, S53 Rate, S61 Delete).
