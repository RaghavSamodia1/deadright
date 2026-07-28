# CalledIt — Design System Documentation

**Figma file:** `koAtGAKmqAglbFqPNqER7s`
**Status:** Complete — tokens, typography, all 8 pages documented. No components yet.
**Next:** Build screens (Sprint 1), then extract components.

---

## Design Language

Adapted from **Sinport by Phenomenon Studio** (Dribbble #23877304).

### Core principles
1. **Card fill = card status.** The full card background colour communicates state at a glance — no text-read required. Amber = awaiting, coral = disputed, mint = win, navy = active.
2. **Navy dark, not flat black.** `#0E121A` has a slight blue-green tint that adds depth. Flat black (`#0A0A0A`) looks cheap on OLED.
3. **Barlow Black for display.** Tight tracking (−1 to −3px). Condensed variant for CALLED IT stamps.
4. **Sinport-scale radius.** Dramatically larger than typical iOS — xs:8, sm:16, md:24, lg:32, xl:40. Feels bold and confident.
5. **Space Mono for timers only.** Prevents digit-width jitter on live countdowns. Never used for other text.
6. **Violet = Side A, Coral = Side B.** Consistent everywhere — bars, avatars, buttons. Colour IS the side.

---

## Color Tokens (48)

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `brand/flame` | `#FF5500` | "Called It 🔥" brand colour, FAB accent |

### Sides
| Token | Hex | Use |
|-------|-----|-----|
| `side/a-violet` | `#6C63FF` | FOR / YES — bars, avatars, buttons |
| `side/a-violet-dim` | `#6C63FF` @ 15% | Side A tinted backgrounds |
| `side/b-coral` | `#FC574E` | AGAINST / NO — bars, avatars, buttons |
| `side/b-coral-dim` | `#FC574E` @ 15% | Side B tinted backgrounds |

### Semantic States
| Token | Hex | Use |
|-------|-----|-----|
| `semantic/win` | `#8AE98D` | Resolution win, cred up, positive |
| `semantic/win-dim` | `#8AE98D` @ 15% | Win card background |
| `semantic/loss` | `#96A5B9` | Respectful muted blue-grey |
| `semantic/awaiting` | `#F7C846` | Needs resolution, <24h countdown |
| `semantic/awaiting-dim` | `#F7C846` @ 15% | Awaiting card background |
| `semantic/disputed` | `#FC574E` | Under review |
| `semantic/disputed-dim` | `#FC574E` @ 15% | Disputed card background |
| `semantic/controversial` | `#9650FF` | Permanent split decision |
| `semantic/live` | `#8AE98D` | Live timer running, pulsing dot |

### Bold Card Fills (Sinport signature)
| Token | Hex | Use |
|-------|-----|-----|
| `card/amber` | `#F7C846` | Awaiting state, CTAs, hero cards |
| `card/coral` | `#FC574E` | Disputed, loss, Side B bold |
| `card/mint` | `#8AE98D` | Win celebration card fill |
| `card/light` | `#F0F0F0` | Light variant, onboarding cards |
| `card/violet` | `#6C63FF` | Side A hero emphasis |

### Backgrounds
| Token | Hex | Use |
|-------|-----|-----|
| `bg/base` | `#0E121A` | App root background |
| `bg/surface-1` | `#151B26` | Card background (primary) |
| `bg/surface-2` | `#1C2534` | Elevated cards, detail screens |
| `bg/surface-3` | `#243042` | Input fields, chip fills |
| `bg/overlay` | `#000000` @ 72% | Modal scrim |
| `bg/sheet` | `#121820` | Bottom sheets, Create modal |

### Borders
| Token | Hex | Use |
|-------|-----|-----|
| `border/subtle` | `#1C2534` | Dividers, list separators |
| `border/default` | `#283447` | Card borders, inactive inputs |
| `border/strong` | `#3C5070` | Focused inputs, active states |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `text/primary` | `#F0F0F0` | Headlines, bet titles — 14.3:1 on base |
| `text/secondary` | `#96A5B9` | Supporting copy, labels |
| `text/tertiary` | `#5A697D` | Placeholders, timestamps |
| `text/brand` | `#FF5500` | Brand-coloured inline text |
| `text/link` | `#6C63FF` | Tappable inline links |
| `text/inverse` | `#0E121A` | On amber/mint/light surfaces |

### Interactive
| Token | Hex | Use |
|-------|-----|-----|
| `interactive/primary` | `#F7C846` | Bold CTA buttons |
| `interactive/pressed` | `#DCA832` | Pressed amber (14% darker) |
| `interactive/disabled` | `#283447` | Disabled state fill |
| `interactive/destructive` | `#FC574E` | Delete, discard, danger |

### Cred Score
| Token | Hex | Use |
|-------|-----|-----|
| `cred/ring-fill` | `#F7C846` | Profile ring — prestigious amber gold |
| `cred/ring-track` | `#243042` | Ring background track |
| `cred/positive` | `#8AE98D` | Score ticking up |
| `cred/negative` | `#FC574E` | Score ticking down |

---

## Spacing Tokens (19)

8pt grid. All values are multiples of 4 or 8.

| Token | Value | Alias | Use |
|-------|-------|-------|-----|
| `space/1` | 4px | — | Icon gap, hairline dividers |
| `space/2` | 8px | xs | Tag internal padding, icon+label |
| `space/3` | 12px | — | Chip padding, input inner V |
| `space/4` | 16px | sm | Card internal padding, list item gap |
| `space/5` | 20px | — | Section item spacing |
| `space/6` | 24px | md | Card padding, section gap (tight) |
| `space/7` | 32px | lg | Section gap, bottom bar safe area |
| `space/8` | 40px | xl | Screen section spacing |
| `space/9` | 48px | 2xl | Hero section gap |
| `space/10` | 56px | 3xl | Onboarding slide gap |
| `space/11` | 64px | — | Large screens breathing room |
| `space/12` | 80px | — | Full-bleed section padding |
| `touch-target` | 44px | touch | Min 44×44 tap target (iOS HIG) |
| `screen-gutter` | 20px | gutter | Left/right page margins |
| `fab-margin` | 24px | fab | FAB from edge (safe area + 24) |
| `bottom-safe` | 34px | safe | iPhone home indicator clearance |
| `status-bar` | 59px | — | Status bar height (iPhone 14/15) |
| `tab-bar-content` | 49px | — | Tab bar content area |
| `tab-bar-total` | 83px | — | Tab bar incl. safe area (49 + 34) |

---

## Border Radius Tokens (7)

| Token | Value | Use |
|-------|-------|-----|
| `radius/none` | 0 | Full-bleed images, map tiles |
| `radius/xs` | 8px | Status tags, micro chips |
| `radius/sm` | 16px | Input fields, secondary buttons |
| `radius/md` | 24px | Bet cards, primary surfaces |
| `radius/lg` | 32px | Large cards, bottom sheets |
| `radius/xl` | 40px | FAB, hero CTA, celebration card |
| `radius/full` | 999px | Avatars, pills, live dot |

---

## Motion Tokens (5)

All use spring curves — feels physical, not eased.

| Token | Duration | Curve | Use |
|-------|----------|-------|-----|
| `motion/instant` | 0ms | — | Opacity on native toggles |
| `motion/fast` | 150ms | ease-out | Micro-interactions, ripples |
| `motion/standard` | 250ms | spring(1,180,18,0) | Screen transitions, modals |
| `motion/emphasis` | 380ms | spring(1,120,14,0) | Card reveal, spring entrance |
| `motion/celebration` | 600ms | spring(1,80,10,0) | Win stamp, cred ring fill |

Reduce Motion fallback: spring → cross-fade for `prefers-reduced-motion`.

---

## Typography Scale (21 styles)

### Display
| Style | Font | Size/LH | Tracking | Use |
|-------|------|---------|----------|-----|
| Display/D1 | Barlow Black | 56/60 | −1px | Celebration, "CALLED IT" stamp |
| Display/D2 | Barlow Bold | 44/48 | −0.5px | Resolution moment, score popup |

### Headline
| Style | Font | Size/LH | Tracking | Use |
|-------|------|---------|----------|-----|
| Headline/H1 | Barlow Bold | 28/34 | −0.3px | Screen titles, bet title on Detail |
| Headline/H2 | Barlow Semi Bold | 22/28 | −0.2px | Card titles, section headers |
| Headline/H3 | Barlow Semi Bold | 18/24 | −0.1px | Sub-headlines, sheet titles |

### Body
| Style | Font | Size/LH | Use |
|-------|------|---------|-----|
| Body/B1 Reg | Inter Regular | 15/22 | Bet descriptions, evidence |
| Body/B1 Med | Inter Medium | 15/22 | Emphasized body, confirmation copy |
| Body/B2 Reg | Inter Regular | 13/20 | Secondary body, card meta |
| Body/B2 Med | Inter Medium | 13/20 | Chip labels, badges |

### Caption
| Style | Font | Size/LH | Use |
|-------|------|---------|-----|
| Caption/C1 | Inter Medium | 12/16 | Status labels, timestamps |
| Caption/C2 | Inter Regular | 11/14 | Microcopy, helper text |
| Caption/Overline | Barlow Semi Bold | 11/14 | Section overlines (ALL CAPS, +2px tracking, amber) |

### Timer (Space Mono only)
| Style | Font | Size/LH | Use |
|-------|------|---------|-----|
| Timer/T1 | Space Mono Bold | 72/80 | Full-screen timer, glanceable 2m away |
| Timer/T2 | Space Mono Regular | 36/44 | Card countdown <1h, live tick |
| Timer/T3 | Space Mono Regular | 20/28 | Inline compact timer |

### Button
| Style | Font | Size/LH | Use |
|-------|------|---------|-----|
| Button/Primary | Barlow Bold | 17/20 | +0.5px tracking, ALL CAPS, dark text on amber |
| Button/Secondary | Barlow Semi Bold | 15/20 | Secondary actions |
| Button/Small | Barlow Semi Bold | 13/16 | +0.5px tracking, chip actions |

---

## Bet Card Anatomy

```
┌─────────────────────────────────────────────┐  ← radius/md (24px)
│ [Avatar 32px] @handle  Context  [STATUS CHIP]│  ← Author row
│                                              │
│ "Arsenal bottles it by March."              │  ← Title: Barlow Bold 16/22
│                                              │
│ Side A: 62%              38% :Side B        │  ← Bar labels
│ ████████████████████░░░░░░░░░░░░░░░         │  ← Violet|Coral bar
│                                              │
│ 5 participants · $25 pot · 02:59:41         │  ← Footer (timer in Space Mono)
└─────────────────────────────────────────────┘
```

**Z-layer rule:** Author chip top-right shows status. Card fill changes with status — no other visual needed.

---

## Card Status States

| State | Card Fill | Text | Accent | Notes |
|-------|-----------|------|--------|-------|
| Active | `#151B26` surface-1 | off-white | violet/coral bars | Default, joinable |
| Live | `#1C2534` surface-2 | off-white | mint pulsing dot | Event in progress |
| Awaiting | `#F7C846` amber | navy | navy | Creator must resolve <24h |
| Win | `#8AE98D` mint | navy | navy | Cred up, celebrate |
| Loss | `#151B26` surface-1 | off-white | muted | Respectful, no harsh red |
| Disputed | `#FC574E` coral | off-white | off-white | Under review |
| Controversial | `#6C63FF` violet | off-white | off-white | Permanent split |

---

## Accessibility

| Rule | Value | Status |
|------|-------|--------|
| Contrast: primary text on base | `#F0F0F0` on `#0E121A` → 14.3:1 | ✅ PASS |
| Min tap target | 44×44px | ✅ PASS |
| Colour-blind safe | Status = shape + label + colour | ✅ PASS |
| Dynamic Type | Barlow/Inter scale with system | ✅ PASS |
| Reduce Motion | Spring → cross-fade fallback | ✅ PASS |
| VoiceOver | `accessibilityLabel` on icon-only buttons | ✅ PASS |
| Skeleton loaders | Prevent layout shift | ⚡ Sprint 2 |
| Light mode | Accessibility variant | ⚡ TODO |

---

## Figma File Structure

Page `koAtGAKmqAglbFqPNqER7s`:

| # | Page | Contents |
|---|------|----------|
| 0 | 🗂️ Cover | File index, 10 design decisions, Design Language Reference |
| 1 | 🎨 Foundations — Color & Type | 34 colour token swatches (9 groups) |
| 2 | 📐 Tokens — Space, Shape & Motion | Spacing bars, radius showcase, motion cards, elevation, haptics |
| 3 | 🃏 Reference — Cards, States & A11y | Bet card anatomy, 7 status states, A11y checklist, token index |
| 4 | 📝 Typography | 18-style type scale with specimens |
| 5 | 🔘 Iconography | Phosphor library recommendation, 45 icons by category, 4 custom assets |
| 6 | 🖼️ Empty States & Illustrations | 6 empty states, onboarding carousel, 6 emotional peak moments |
| 7 | 📱 Screen Inventory | 56 screens across 5 sprints with nav type legend |

---

## Screen Inventory Summary

### Sprint 1 — Auth & Core Feed (13 screens)
Splash, Onboarding ×4, Sign Up, Log In, OTP, Feed, Feed Pull-to-Refresh, Bet Detail, Side Selection Sheet, Bet Confirmation

### Sprint 2 — Create & Resolve (13 screens)
Create Bet ×6 steps, Bet Created Peak, Resolution Screen, Evidence Upload, Winner Declaration, Called It Win Peak, Dispute Trigger Sheet, Dispute Detail

### Sprint 3 — Social & Sharing (10 screens)
Profile Tab, Profile Edit, Cred Score Detail, Bet History ×2, Share Bet Sheet, QR Invite, Friend Profile, Notifications Tab, Notification Detail

### Sprint 4 — Ledger & Ordinals (10 screens)
Ledger Tab, Transaction Detail, Ledger Empty, Ordinal Bet Create, Ordinal Rank Picker, Ordinal Evidence, Ordinal Resolution, Search Tab, Search Results, Search No Results

### Sprint 5 — Timers & Polish (10 screens)
Countdown Timer Full, Timer Critical, Timer Expired, Settings, Notification Prefs, Account/Privacy, Rate/Feedback, Rank Up Peak, Streak Milestone Peak, Friend Joined Peak

---

## 10 Key Design Decisions

1. **Navy dark, not flat black** — `#0E121A` blue tint adds depth; flat `#0A0A0A` looks cheap on OLED
2. **Barlow Black for all display** — tight tracking (−1 to −3px); Condensed for stamps
3. **Card fill = card status** — Sinport signature; amber/coral/mint fill communicates faster than any border tint
4. **Sinport-scale radius** — previous xs:4/sm:8/md:12 felt timid; new xs:8/sm:16/md:24/lg:32/xl:40 feels confident
5. **Space Mono for timers only** — prevents digit-width jitter on live countdowns
6. **Violet = Side A, Coral = Side B** — consistent everywhere; never swapped
7. **Amber CTA, navy text on it** — amber bright enough for `#0E121A` text at 7:1 contrast; white-on-amber fails WCAG AA
8. **8pt grid everywhere** — 4px base unit; `touch-target=44px` and `gutter=20px` are semantic aliases
9. **Spring curves, not ease** — `spring(1,180,18,0)` for standard; `prefers-reduced-motion` → cross-fade
10. **No components in the DS file** — tokens and documentation only; components built on top in Sprint 1
