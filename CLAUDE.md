# DeadRight (formerly CalledIt → StakeHouse) — Claude Code Instructions

## What this project is
DeadRight (renamed from CalledIt → StakeHouse → DeadRight, Jul 2026) is a social prediction/bet-tracking app (React Native + Expo). Friends capture informal bets ("bet you won't", "I'm calling it now"), track who was right, and build a Cred Score reputation. No real money — ledger only. Brand mark is "DeadRight 🔥"; "CALLED IT 🔥" remains the win-moment catchphrase.

## Current state (June 2026)
- Design system complete in Figma (file key: `koAtGAKmqAglbFqPNqER7s`)
- Backend complete as code: supabase/ migrations + edge functions, src/api client layer (see backend.md). Expo app not yet scaffolded.
- UX spec: `/Users/raghavsamodia/Calledit/calledit-ux-specv2.md`
- Design doc: `/Users/raghavsamodia/Calledit/design-system.md`
- Screen specs: `/Users/raghavsamodia/Calledit/screens/`

## Figma MCP
The Figma MCP server runs locally at `http://127.0.0.1:3845/mcp` (plugin ID `760d19f1-e60b-4b23-af48-feb05a41fbde`).
Use `mcp__760d19f1-e60b-4b23-af48-feb05a41fbde__use_figma` to execute plugin code.

## Design language — Sinport × CalledIt
Adapted from Sinport by Phenomenon Studio.
- **Background:** `#0E121A` navy (not flat black)
- **CTA / Awaiting:** `#F7C846` amber
- **Win:** `#8AE98D` mint
- **Disputed / Side B:** `#FC574E` coral
- **Side A:** `#6C63FF` violet
- **Brand:** `#FF5500` flame orange
- **Primary text:** `#F0F0F0` off-white
- **Surfaces:** `#151B26` / `#1C2534` / `#243042`
- **Borders:** `#283447`
- **Fonts:** Barlow Black (display/stamps), Barlow Bold (headlines), Barlow Semi Bold (overlines/labels), Inter Regular/Medium (body), Space Mono Bold (timers only)
- **Radius:** xs=8, sm=16, md=24, lg=32, xl=40, full=999
- **Card fill = card status** (Sinport signature: amber awaiting, coral disputed, mint win, navy active)

## Figma API rules (hard-won, do not break)
- `primaryAxisSizingMode`: use `"AUTO"` (hug) or `"FIXED"` — never `"HUG"`
- `counterAxisAlignItems`: use `"MIN"` — never `"FLEX_START"`
- `fontSize` must always be a **number**, never a string
- Move nodes by appending to new parent — no `removeChild()` method exists
- Always `await figma.loadFontAsync()` before setting `fontName`
- Root doc frames: set `ca:"FIXED"` + `resize(1440, 100)` then let auto-layout expand height
- **Never `resize()` a frame whose hug axis is `AUTO`** — it silently locks that axis collapsed (~10px) and children get clipped. Append children first; only resize FIXED axes.
- Auto-layout hug does **not recompute lazily across nested frames**. After building, run a recursive bottom-up relayout: for every AUTO frame, toggle `primaryAxisSizingMode = "FIXED"` then back to `"AUTO"`. Do the same check for `counterAxisSizingMode` on HORIZONTAL rows that look collapsed (height < content).
- Validate with `get_screenshot` after building a page — node heights can read plausible while content renders collapsed (overflow paints because `clipsContent` defaults false via API).
- **Pages are lazy-loaded (dynamic-page mode).** `page.children` on a never-visited page returns `[]` — this is NOT data loss. ALWAYS `await page.loadAsync()` (or `setCurrentPageAsync`) before reading a non-current page. Never rebuild a page because it "reads empty" — verify with `loadAsync()` first. (This explained every phantom "vanish" in this project.)
- `get_screenshot` renders the **server** copy, which can lag the plugin's live document by minutes (deleted nodes still render, node sizes differ). If a screenshot contradicts fresh plugin reads, trust the plugin DOM, wait, and re-screenshot before "fixing" anything.
- `figma.combineAsVariants(nodes, parent)` works with a row frame as parent; variants need unique `prop=value` signatures (dedupe first) and consistent property keys across all variants (fill missing keys before combining).

## Phone dimensions (iPhone 14/15)
- Frame: 390 × 844 px
- Status bar: 59px
- Tab bar: 83px (49 content + 34 safe area)
- Usable content: 702px
- Screen gutter: 20px each side
- Content width: 350px

## Figma variable collections
- `CalledIt / Colors` — 48 tokens
- `CalledIt / Spacing` — 19 tokens (space/1–12, touch-target, screen-gutter, fab-margin, bottom-safe, status-bar)
- `CalledIt / Radius` — 7 tokens (none, xs, sm, md, lg, xl, full)
- `CalledIt / Motion` — 5 tokens (instant, fast, standard, emphasis, celebration)
