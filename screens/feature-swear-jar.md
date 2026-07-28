# Feature — Cookie Jar (formerly Swear Jar)

Group jar: members pay into the pot when they break a group rule. No real money —
ledger only, settles like bets. Serves pillar 3 (playful accountability).

## Flow

1. **Jar tab entry** — from Group screen → "Cookie Jar" card, or Feed group header
2. **Jar screen (SJ01)** — jar total hero, violation feed, [+ Add violation] FAB-style CTA
3. **Add violation (SJ02, sheet)** — pick member → pick rule (chips w/ amounts) → confirm.
   Haptic .heavy. The violator gets a notification with a "Fair / Dispute" choice.
4. **Jar rules (SJ03)** — group-editable rule list ("Swearing $1", "Late $5"), add/remove.
   Only group admins remove rules; anyone can propose.
5. **Settle up** — jar empties into a group event (pizza night); creates ledger entries
   proportional to contributions. "Empty the jar" is a group-vote action.

## Rules

- Adding a violation against someone ≠ instant — they can dispute within 24h (same
  dispute machinery as bets, FLOW 7)
- Self-reporting is one tap and skips confirmation ("Own up" button — social reward:
  own-ups show a 😇 badge in the feed)
- Jar cap optional per group ($50 default) — hitting the cap forces a settle-up

## Screens

| ID | Screen | Nav |
|---|---|---|
| SJ01 | Cookie Jar main | push from group |
| SJ02 | Add Violation | bottom sheet |
| SJ03 | Jar Rules | push |
| S50 | Settings | push from Profile |

## Components

- `JarCard` — bag-drop hero: jar emoji, big total (Barlow Black), contribution count
- `ViolationRow` — avatar + member + rule + amount + time; 😇 badge on own-ups
- `SettingsRow` — icon + label + right slot (value / chevron / toggle)
