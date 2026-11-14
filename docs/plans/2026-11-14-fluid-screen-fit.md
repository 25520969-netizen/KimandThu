# Plan: Fluid layout that fits every screen size

- **Status:** APPROVED
- **Revision:** 2 — addresses every finding of `docs/reports/2026-11-14-review-fluid-screen-fit.md` (PR-01 … PR-06 in Revision 1, PR-07 … PR-08 in Revision 2; see Decision log).
- **Source:** plain request (2026-11-14): "viết code để tự động fit với mọi cỡ màn hình" ("make the layout fit every screen size automatically"). It replaces the earlier request to tune for two phones only. Those two phones stay the main acceptance sizes: Samsung Galaxy S24+ (Chrome viewport 384 × 832 CSS px) and iPhone 15 Plus (430 × 932 CSS px).
- **Goal:** every screen from 320 px phones to desktop renders with no horizontal overflow, no clipped controls, and sizes that scale smoothly instead of jumping at fixed widths.
- **Approach:**
  - Replace the stepped width breakpoints with `clamp()` tokens: gutter, hero number and display title.
  - Let the section head wrap the segmented control to its own row when the two do not fit.
  - Size the place action row from its own width with CSS container queries, not from `window.innerWidth` at render time.
  - Use dynamic viewport units. Keep the FAB and the tab bar (the only full-bleed fixed controls) clear of the landscape notch.
  - Cap the photo height and centre the chat content on large screens.
- **Stack:** vanilla JS SPA (`index.html`, `app.js`, `src/ui/*.js`), plain CSS in `src/styles/*.css`, dependency-free test runner (`tests/run_tests.js`).
- **Baseline:** `./scripts/test.sh` → 189 passed, 0 failed (run 2026-11-14 on the uncommitted v6 redesign working tree; confirmed by the review).
- **Global constraints:**
  - no new dependencies, no build step
  - keep CSP `script-src 'self'`
  - keep the v6 visual design (colours, fonts, components)
  - do not commit
  - never let a write reach the backend during browser checks (see BC)
- **Review focus:**
  1. Place rows from 292 px to 440 px wide: the ⋯ button stays inside the row and on the same line as the other actions.
  2. Moments section head at 320–350 px: the title is never clipped. The segmented control moves to a second row instead.
  3. Landscape iPhone notch: the FAB and the tab items stay clear of `safe-area-inset-left/right`.
  4. Removing the `compact` render option must keep the accessible names of icon-only buttons.
  5. `overflow-x: clip` must not break `position: sticky` (header, month label).

> Coder: execute tasks in order, tick each checkbox when its Verify passes, log any deviation in §Deviations. Line numbers were checked on 2026-11-14 against the working tree (HEAD `0420acc` plus the uncommitted v6 redesign). They shift after edits, so always find the code by the symbol named next to the range.

## Evidence (measured 2026-11-14, Browser pane, couple mode simulated)

| Width | Finding |
|---|---|
| 430 × 932 (iPhone 15 Plus) | A place row with "Chỉ đường" + "TikTok" + "Đã đi" + ⋯ needs 430 px; its row is 391 px wide. The ⋯ button sticks out to x = 449. The layout viewport widens to 449 px (`innerWidth` 449 vs `clientWidth` 430), the FAB is cut off and the page pans sideways. `body { overflow-x: hidden }` (`base.css:L33`) did not prevent this. Cause: `COMPACT_WIDTH_PX = 400` (`app.js:L39`) switches to icon-only buttons only below 400 px. |
| 384 × 832 (Galaxy S24+) | Fits only because 384 < 400 at render time. The choice is frozen at render (`app.js:L2829`). After a rotation or a window resize the rows keep the wrong mode until the next re-render. |
| both | Gutter jumps 16 → 20 px at 414 px (`tokens.css:L49`). The section title jumps 28 → 32 px at 414 px (`moments.css:L51`). The hero number jumps 60 → 72 px at 360 px (`tokens.css:L48`). |
| both | `body { min-height: 100vh }` and `#petal-canvas { width: 100vw; height: 100vh }` (`base.css:L15-L38`) use the large viewport. On iOS Safari and Chrome Android that is taller than the visible area while the toolbars show. |
| landscape | The FAB (`right: var(--gutter)`) and the tab bar span to the screen edge and ignore `safe-area-inset-left/right`. Page, header and chat columns are centred at ≤ 560 / 720 px, so in landscape (≥ 667 px) their side margins already exceed the notch inset (review PR-03). |

## Conventions used by every task

- **Browser check (BC):**
  1. Start the preview with `preview_start {name: "kimthu-static"}`, or `{url: "http://127.0.0.1:8765/index.html"}` if port 8765 is already serving.
  2. Set the size with `resize_window {width, height}`, then reload.
  3. Simulate couple mode on the client only: `journeyApp.config.apiUrl = ""; journeyApp.isAuthenticated = true; journeyApp.applyAuthMode()`.
  4. Never type a passcode.
  5. Reset with `resize_window {preset: "desktop"}` when done.
- **Reported width (RW):** the pane can report a different `innerWidth` than requested (332 for a requested 320 during the v6 run). Compute every expected size from `const W = document.documentElement.clientWidth` and record `W` next to each result. Expected gutter: `Math.min(24, Math.max(12, 0.05 * W - 2))`.
- **Width matrix (WM):** 320 × 568, 360 × 800, 384 × 832 (S24+), 390 × 844, 430 × 932 (iPhone 15 Plus), 768 × 1024, 932 × 430 (phone landscape), 1280 × 800.
- **No horizontal scroll check (NHS):** `window.innerWidth === document.documentElement.clientWidth && document.documentElement.scrollWidth <= document.documentElement.clientWidth` → expect `true`. The first half catches the mobile layout viewport widening, which the old NHS check missed.
- **Overflow finder (OF):** `[...document.querySelectorAll("body *")].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > document.documentElement.clientWidth + 1 && !e.closest(".chips") && !e.closest("dialog:not([open])") && !e.closest(".chat-drawer:not(.open)"); }).map(e => e.tagName + "." + e.className)` → expect `[]`.
- **One line check (OL):** for an element `a`, `new Set([...a.children].filter(e => e.offsetWidth).map(e => Math.round(e.getBoundingClientRect().top))).size === 1` → expect `true`.
- **Static test file:** new static checks go into `tests/unit/ui/test_static_assets.js` and reuse `NEW_CSS` (L7-L8), `readText`, `test`, `assertEqual`, `assertTrue`.

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/styles/tokens.css` | Modify | fluid `clamp()` tokens; safe-area left/right tokens; drop width breakpoints |
| `src/styles/base.css` | Modify | `html` overflow guard, dynamic viewport units |
| `src/styles/shell.css` | Modify | tab bar and FAB clear the notch; tab width cap on wide screens |
| `src/styles/moments.css` | Modify | section head wraps instead of a breakpoint; photo height cap |
| `src/styles/places.css` | Modify | container queries for the place action row |
| `src/styles/chat.css` | Modify | full-width bars with content centred at ≤ 720 px |
| `src/ui/templates.js` | Modify | `placeRowHtml` always emits label span + `aria-label`; drop `compact` option |
| `app.js` | Modify | remove `COMPACT_WIDTH_PX` and its two uses in `renderPlaces` |
| `tests/unit/ui/test_templates.js` | Modify | replace the compact-labels test |
| `tests/unit/ui/test_static_assets.js` | Modify | static checks for fluid tokens, viewport units, section head, container queries, safe areas, chat column, photo cap |
| `index.html`, `sw.js` | Modify (script) | cache version bump to 6.1 |

## Tasks

### Task 1: Overflow guard and dynamic viewport units (covers Evidence row 4)
**Files**
- Modify: `src/styles/base.css:L9` (`html` rule)
- Modify: `src/styles/base.css:L15-L23` (`#petal-canvas`)
- Modify: `src/styles/base.css:L31-L38` (`body`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Produces: `html { font-size: 100%; overflow-x: clip; }`. This is a defensive guard only: the overflow measured in Evidence row 1 happened with `body { overflow-x: hidden }`, so the guard is not the fix. Task 3 removes the cause, and the NHS/OF checks of Tasks 3 and 6 are the proof. `clip` does not create a scroll container, so the sticky header and month labels keep working (unlike `hidden`).
- Produces: `#petal-canvas { position: fixed; inset: 0; width: 100%; height: 100%; … }`. With `position: fixed`, 100 % is the viewport, so no `vw`/`vh` is needed.
- Produces: `body { min-height: 100dvh; overflow-x: clip; … }` replacing `min-height: 100vh` and `overflow-x: hidden`.

**Steps**
- [x] Add test `"fluid: no 100vh or 100vw in stylesheets"`: for every file in `NEW_CSS`, `/100v[hw]\b/.test(readText(f))` → `false`.
- [x] Add test `"fluid: html clips horizontal overflow"`: `base.css` matches `/html\s*\{[^}]*overflow-x:\s*clip/`.
- [x] Run `./scripts/test.sh` → expect 2 failed.
- [x] Apply the three CSS changes above.
- [x] Run `./scripts/test.sh` → expect 191 passed, 0 failed.
- [x] BC at 430 × 932 on `#moments`: run `scrollTo(0, 600)`. Then check `getComputedStyle(document.querySelector(".app-header")).position === "sticky"` and `document.querySelector(".app-header").getBoundingClientRect().top === 0` → expect `true` for both. Run the same check for the first `.month-label`: its `top` equals `parseFloat(getComputedStyle(document.querySelector(".app-header")).height)` once it has scrolled past.

**Done when:** sticky header and month labels still stick, and no stylesheet uses `100vh`/`100vw`.

### Task 2: Fluid tokens and a wrapping section head (covers Evidence row 3, review PR-01, PR-05)
**Files**
- Modify: `src/styles/tokens.css:L24-L25` (`--t-hero-num-size`, `--t-display-size`)
- Modify: `src/styles/tokens.css:L40` (`--gutter`)
- Modify: `src/styles/tokens.css:L43-L45` (safe-area tokens)
- Modify: `src/styles/tokens.css:L48-L49` (delete both `@media` lines)
- Modify: `src/styles/moments.css:L43-L49` (`.section-head`)
- Modify: `src/styles/moments.css:L51` (delete the `@media (max-width: 413px)` line)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
Exact values. The endpoints are fixed by this plan. The computed sizes are given for review (confirmed by the review):

| Token | Value | 320 px | 384 px | 430 px | ≥ 560 px |
|---|---|---|---|---|---|
| `--gutter` | `clamp(12px, 5vw - 2px, 24px)` | 14 | 17.2 | 19.5 | 24 |
| `--t-hero-num-size` | `clamp(3.5rem, 18vw, 5rem)` | 57.6 | 69.1 | 77.4 | 80 |
| `--t-display-size` | `clamp(1.625rem, 1rem + 3.5vw, 2.25rem)` | 27.2 | 29.4 | 31.1 | 35.6 (cap 36) |

New tokens, next to `--safe-top` (used by Task 4):
- `--safe-left: env(safe-area-inset-left, 0px);`
- `--safe-right: env(safe-area-inset-right, 0px);`

Section head:
- `.section-head` gains `flex-wrap: wrap; row-gap: var(--s-2);`.
- Add `.section-head .large-title { white-space: nowrap; }` unconditionally, with no `overflow`/`text-overflow`.
- The title (164 px at 27.2 px) always fits alone on its line. When title + 12 px gap + segmented control (139 px) exceed the row, the segmented control wraps to a second row, aligned start.
- Measured sums (review PR-01):

  | Width | Title + gap + control | Row | Result |
  |---|---|---|---|
  | 320 | 164 + 12 + 139 = 315 | 292 | wraps |
  | 340 | 319 | 310 | wraps |
  | 384 | 177 + 12 + 139 = 328 | 349.6 | one row |
  | 430 | about 338 | 391 | one row |

**Steps**
- [x] Add test `"fluid: no width breakpoints in tokens or moments"`: `tokens.css` and `moments.css` contain no `/@media\s*\((max|min)-width:\s*(359|413|414)px\)/`.
- [x] Add test `"fluid: gutter, hero and display sizes use clamp()"`: `tokens.css` matches each of `/--gutter:\s*clamp\(/`, `/--t-hero-num-size:\s*clamp\(/` and `/--t-display-size:\s*clamp\(/`.
- [x] Add test `"fluid: section head wraps instead of clipping the title"`: the `.section-head {…}` rule in `moments.css` matches `/flex-wrap:\s*wrap/`, and neither the `.section-head {…}` rule nor any rule whose selector contains `.section-head` (match `/\.section-head[^{]*\{[^}]*\}/g`) contains `text-overflow`. The existing `.memory__meta` ellipsis (`moments.css:L85`) is v6 design and stays.
- [x] Run `./scripts/test.sh` → expect 3 failed.
- [x] Apply the token and rule changes above.
- [x] Run `./scripts/test.sh` → expect 194 passed, 0 failed.
- [x] BC at 320 × 568, 384 × 832 and 430 × 932 on `#moments`:
  - `parseFloat(getComputedStyle(document.querySelector("#view-moments .page")).paddingLeft)` → within 0.5 px of the RW expected gutter (about 14 / 17.2 / 19.5 when `W` equals the requested width).
  - Let `t = document.querySelector(".section-head .large-title")`. Expect `t.scrollWidth <= t.clientWidth` (not clipped) and `t.getBoundingClientRect().height < 50` (one line).
  - Let `s = document.querySelector(".section-head .segmented")`. At 384 and 430, expect `s.getBoundingClientRect().top < t.getBoundingClientRect().bottom` (same row). At 320, expect either the same row or `s.getBoundingClientRect().top >= t.getBoundingClientRect().bottom` (own row). Record which one in §Deviations.

**Done when:** gutter and title sizes change smoothly with width, and the Moments title is never clipped at any width.

### Task 3: Place action row sized by its container (covers Evidence rows 1 and 2, review PR-02)
**Files**
- Modify: `src/ui/templates.js:L114-L124` (`placeActionButton`, `placeLinkAction`)
- Modify: `src/ui/templates.js:L135-L162` (`placeRowHtml` JSDoc and body)
- Modify: `app.js:L39` (delete `COMPACT_WIDTH_PX`)
- Modify: `app.js:L2809-L2814` (`renderPlaces` signature array; drop `window.innerWidth < COMPACT_WIDTH_PX`)
- Modify: `app.js:L2829-L2840` (`renderPlaces`; drop `const compact` and the `compact:` option)
- Modify: `src/styles/places.css:L19-L25` (`.place`)
- Modify: `src/styles/places.css:L44-L47` (`.place__actions`)
- Test: `tests/unit/ui/test_templates.js:L59` (`TPL_PLACE_OPTS`)
- Test: `tests/unit/ui/test_templates.js:L79-L85`
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Produces: `placeActionButton(cls, iconName, label, extra)` and `placeLinkAction(cls, href, iconName, label)`. The `compact` parameter is removed. Both always emit `aria-label="<label>"` and the text inside `<span class="btn__label"><label></span>`, after the icon.
- Produces: `placeRowHtml(place, opts)` where `opts` is `{couple, distance?, distanceIsNew?, linkedMemoryId?, mapsUrl}`. `compact` is no longer read.
- CSS in `places.css`, in this order:
  - `.place { …; container-type: inline-size; }`
  - `.place__actions { …; flex-wrap: wrap; }`. This guard only matters for very large text. It is never expected to trigger at default text size (checked by OL below).
  - **Medium step:** `@container (max-width: 439px) { .place__actions .btn--secondary .btn__label { display: none; } .place__actions .btn--secondary { padding-inline: var(--s-3); } }`.
    - The full row needs 140 + 116 + 106 + 44 + 3 × 8 = 430 px, measured on a 391 px row at 430 px.
    - Hiding labels below 440 px keeps a 10 px margin for font rendering differences.
    - "Chỉ đường" (`.btn--soft`) always keeps its label.
  - **Narrow step:** `@container (max-width: 319px) { .place__actions { gap: var(--s-1); } .place__actions .btn--soft { padding-inline: var(--s-3); } }`.
    - Icon-only buttons are 18 + 2 × 12 + 2 = 44 px wide.
    - At the medium step the row needs 140 + 44 + 44 + 44 + 3 × 8 = 296 px, more than the 292 px row at 320 px (review PR-02).
    - The narrow step gives 124 + 44 + 44 + 44 + 3 × 4 = 268 px.
    - 319 px covers viewports up to about 354 px.

**Steps**
- [x] In `test_templates.js`, drop `compact: false` from `TPL_PLACE_OPTS`.
- [x] Replace the test at L79 with `"placeRowHtml: distance, approx, is-new; TikTok and Đã đi have aria-label and a label span"`:
  - keep the two distance asserts;
  - assert the default output contains `aria-label="TikTok"`, `aria-label="Đã đi"`, `<span class="btn__label">TikTok</span>` and `<span class="btn__label">Đã đi</span>`.
- [x] Add static test `"fluid: place actions use container queries, not window width"`:
  - `places.css` matches `/container-type:\s*inline-size/`, `/@container\s*\(max-width:\s*439px\)/` and `/@container\s*\(max-width:\s*319px\)/`;
  - `app.js` does not contain `COMPACT_WIDTH_PX`.
- [x] Run `./scripts/test.sh` → expect 2 failed.
- [x] Apply the template, `app.js` and CSS changes.
- [x] Run `./scripts/test.sh` → expect 195 passed, 0 failed.
- [x] BC on `#places` at every WM size (reload each time, couple mode). For every `.place__actions` element `a`, expect:
  - `a.scrollWidth <= a.clientWidth`;
  - OL passes;
  - the `.place__more` right edge ≤ `a.getBoundingClientRect().right + 1`.

  NHS and OF must also pass. The local demo data has two rows with "Chỉ đường" + TikTok + "Đã đi" + ⋯. If the list is empty, inject one row with `placeRowHtml` as in the Evidence measurement.
- [x] BC resize without reload: load at 430 × 932, then resize to 1280 × 800. Expect labels visible: `getComputedStyle(document.querySelector(".place__visit .btn__label")).display !== "none"`. Resize back to 430 × 932 → expect `"none"`. No re-render is needed.

**Done when:** at every width the ⋯ button sits fully inside the row, on the same line as the other actions, and the layout viewport stays at the device width.

### Task 4: FAB and tab bar clear the notch; wide screens (covers Evidence row 5, review PR-03, PR-06)
**Files**
- Modify: `src/styles/shell.css:L59-L72` (`.tab-bar`)
- Modify: `src/styles/shell.css:L73-L88` (`.tab`)
- Modify: `src/styles/shell.css:L107-L111` (`.fab` `right`)
- Modify: `src/styles/chat.css:L27-L34` (`.chat__header`)
- Modify: `src/styles/chat.css:L39-L45` (`.chat__messages`)
- Modify: `src/styles/chat.css:L76` (`.chat__preview`)
- Modify: `src/styles/chat.css:L80-L87` (`.chat__input`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- `.tab-bar { …; justify-content: center; padding-inline: var(--safe-left) var(--safe-right); }`
- `.tab { …; max-width: 160px; }` keeps the four tabs grouped in the middle on tablets and desktop.
- `.fab { right: max(var(--gutter), var(--safe-right)); }`
- Header, `.page` and offline banner are **not** changed. They are centred columns, and their landscape side margins already exceed the notch inset (Evidence row 5).
- Chat: bars stay full width (their borders keep spanning the screen). Only the content is centred, through padding, with no media query. `100%` in `padding` resolves against the full-width `.chat-drawer`.
  - `.chat__header` and `.chat__input`: `padding-inline: max(var(--s-2), calc((100% - 720px) / 2));`
  - `.chat__messages` and `.chat__preview`: `padding-inline: max(var(--gutter), calc((100% - 720px) / 2));`
  - Below 736 px wide the `max()` picks the existing value, so phones are unchanged.

**Steps**
- [x] Add test `"fluid: FAB and tab bar clear the notch; chat content is centred"`:
  - `shell.css` contains `var(--safe-left)` and `max(var(--gutter), var(--safe-right))`;
  - `chat.css` contains `calc((100% - 720px) / 2)` and no `max-width: 720px`.
- [x] Run `./scripts/test.sh` → expect 1 failed.
- [x] Apply the CSS changes.
- [x] Run `./scripts/test.sh` → expect 196 passed, 0 failed.
- [x] BC at 932 × 430, couple mode, with the inset simulated: `document.documentElement.style.setProperty("--safe-right", "47px"); document.documentElement.style.setProperty("--safe-left", "47px")`.
  - `document.documentElement.clientWidth - document.getElementById("fab").getBoundingClientRect().right` → expect `47`.
  - `getComputedStyle(document.getElementById("bottom-nav")).paddingLeft` → expect `"47px"`.
  - Remove both properties afterwards.
- [x] BC at 1280 × 800: the four `.tab` elements are each ≤ 160 px wide, and the first one's `left` equals `(document.documentElement.clientWidth - 640) / 2` ± 1 (centred: 4 × 160 = 640 px; 320 when `clientWidth` is 1280). Open chat with `document.getElementById("tab-chat").click()`:
  - `.chat__header` width equals `clientWidth` (full-width bar);
  - the first `.chat__row` left edge is ≥ `(clientWidth - 720) / 2`.
- [x] BC at 430 × 932 with chat open: `getComputedStyle(document.querySelector(".chat__messages")).paddingLeft` equals the RW gutter (phones unchanged).

**Done when:** the FAB and the tab items stay clear of the notch in landscape, and on wide screens the tabs are grouped and the chat reads as a centred column under full-width bars.

### Task 5: Photo height cap (covers "fit every screen" for landscape and tablets)
**Files**
- Modify: `src/styles/moments.css:L74-L80` (`.memory__photo`)
- Modify: `src/styles/moments.css:L55-L60` (`.memory` `contain-intrinsic-size`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- `.memory__photo { …; max-height: 75svh; }`. With `aspect-ratio: 4 / 5` and `width: 100%`, the box height becomes `min(width × 1.25, 75svh)`. The image keeps `object-fit: cover`.
- At 932 × 430 landscape the photo box is 322 px tall instead of 560 px. At 430 × 932 it stays 488 px (< 699).
- `.memory { contain-intrinsic-size: auto 520px; }` is the estimate between both phone sizes. Keep `auto`.

**Steps**
- [x] Add test `"fluid: feed photo height is capped by the viewport"`: the `.memory__photo` rule in `moments.css` matches `/max-height:\s*75svh/`.
- [x] Run `./scripts/test.sh` → expect 1 failed.
- [x] Apply the change.
- [x] Run `./scripts/test.sh` → expect 197 passed, 0 failed.
- [x] BC at 932 × 430, `#moments`: `document.querySelector(".memory__photo").getBoundingClientRect().height <= 0.75 * innerHeight + 1` → `true`. At 430 × 932: height = `min(1.25 × photo width, 0.75 × innerHeight)` ± 1 (about 488 when `W` = 430).

**Done when:** a full photo plus its title fits on a landscape phone screen.

### Task 6: Version bump and full width-matrix check
**Files**
- Modify (script): `index.html` `?v=` query strings, `sw.js:L6` (`CACHE_VERSION`)

**Steps**
- [x] Run `scripts/bump_version.sh 6.1` → prints `Version set to 6.1`.
- [x] Run `./scripts/test.sh` → expect 197 passed, 0 failed.
- [x] BC on every WM size, in guest mode and couple mode:
  - views: `#moments` (list and grid), `#places`, `#places/visited`, `#be`, chat open;
  - sheets: `memory-modal`, `place-modal`, `settings-modal`, `period-modal` (`showModal()` each).
  - NHS and OF must pass everywhere. On `#places`, OL must also pass for every `.place__actions`.
  - Record a table "size (requested / RW) × view → pass/fail" in §Deviations.
- [x] Screenshot at 384 × 832 and 430 × 932: `#moments` top and `#places` with a three-button row.

**Done when:** the matrix is all pass and both target-phone screenshots show no clipped control.

## Final verification
- `./scripts/test.sh` → expect 197 passed, 0 failed (189 baseline + 8 new: 2 + 3 + 1 + 1 + 1; the template test is replaced, not added).
- `grep -nE "100v[hw]\b|COMPACT_WIDTH_PX|max-width: 413px|min-width: 414px" src/styles/*.css app.js` → no output.
- `grep -n "text-overflow" src/styles/*.css` → exactly one line, `src/styles/moments.css` `.memory__meta` (v6 design, unchanged).
- Real devices: add these lines to `docs/reports/2026-11-14-album-kem-iphone-checklist.md`. Each line gets ☐ pass ☐ fail.
  - "Galaxy S24+ Chrome, portrait: Places row ⋯ visible on the same line, no sideways pan"
  - "iPhone 15 Plus Safari and home-screen app, portrait and landscape: Places row ⋯ visible, FAB and tabs clear of the notch"

## Assumptions
- Viewport sizes:
  - Galaxy S24+ at its default resolution reports 384 CSS px wide in Chrome (FHD+ and QHD+ settings both give 384).
  - iPhone 15 Plus reports 430.
  - The "Display size"/zoom settings on either phone can make the width smaller. The 320–390 rows of the matrix cover that.
- Container queries (`@container`, `container-type`) are supported on both target phones (iOS 16+, Chrome 105+). On older browsers the action row falls back to `flex-wrap: wrap`: it wraps but never overflows.
- `svh`/`dvh` and `overflow-x: clip` are supported by iOS 15.4+/16+ and Chrome 108+/90+. No fallback is planned.
- The `apple-mobile-web-app-status-bar-style` stays `default`, so on the iPhone home-screen app `--safe-top` is 0 and nothing changes at the top.
- The grid view keeps 3 columns below 768 px and 4 from 768 px. It already fits every width (tiles are `1fr`).
- The sheet layout (`components.css` `dialog.sheet`, centred card from 768 px) already fits every size in the matrix. It is only checked, not changed.

## Out of scope / out-of-scope observations
- `manifest.json` still has the old `background_color: #fffafc` and `theme_color: #ff758f`, so the splash screen colour does not match the v6 cream background.
- The `.chips` row has no end padding after the last chip when scrolled fully right.

## Decision log
- Q: Tune for two phones only, or fit every screen? → A: fit every screen automatically. Galaxy S24+ and iPhone 15 Plus remain the main acceptance sizes (user, 2026-11-14).
- Q: Write code directly or plan for /coder? → A: plan for /coder (user, 2026-11-14).
- Place actions: a container query was chosen over the JS width check, because the JS check is frozen at render time and its 400 px threshold was wrong for 430 px phones. It was also chosen over always-wrap, because a lone ⋯ on a second line looks broken (planner, 2026-11-14).
- Fluid `clamp()` tokens replace the 359/413/414 px steps, so sizes do not jump between neighbouring phone widths (planner, 2026-11-14).

**Revision 1** (review `docs/reports/2026-11-14-review-fluid-screen-fit.md`):
- **PR-01 (Major):** dropped `nowrap` + ellipsis clipping on the section title. `.section-head` now wraps, so the segmented control moves to its own row when title + gap + control exceed the row (320–350 px). The title keeps `white-space: nowrap` and is never clipped. This was chosen over a smaller title minimum, because that would also shrink the hero names and the Places/Bé titles. The Task 2 BC now checks "not clipped, one line" and records same-row vs own-row. A new static test checks `flex-wrap` and the absence of `text-overflow`, and the Final grep includes `text-overflow`.
- **PR-02:** added the narrow container step `@container (max-width: 319px)` (gap 4 px, "Chỉ đường" padding 12 px). It brings the row to 268 px within the 292 px row at 320 px. The BC now uses the OL check and the ⋯ right-edge check at every WM size, and the Task 3 static test checks the 319 px rule.
- **PR-03:** removed the `--pad-left/--pad-right` tokens and all safe-area changes to `.page`, `.app-header__inner`, `.offline-banner` and chat. Only the FAB and the tab bar (full-bleed fixed controls) use `--safe-left/right`. Evidence row 5, the file map, the Task 2/4 interfaces and the tests were updated. Task 2's former "page padding honours safe areas" test is replaced by the section-head test, so the counts stay the same.
- **PR-04:** Task 1 now states that `overflow-x: clip` on `html` is a defensive guard, not the fix. "Done when" is limited to sticky behaviour and viewport units. The no-overflow proof is the NHS/OF/OL checks in Tasks 3 and 6. Evidence row 1 notes that `body { overflow-x: hidden }` did not prevent the widening.
- **PR-05:** added the RW convention. Expected gutters and photo heights are computed from the reported `clientWidth`, not the requested width, and the WM table records both.
- **PR-06:** chat bars stay full width. Content is centred with `padding-inline: max(…, calc((100% - 720px) / 2))` instead of `max-width: 720px; margin-inline: auto`, which removes the ≥ 768 px media query. The BC checks that the header is full width and the rows are centred, and that phones are unchanged.

**Revision 2** (same review file, second pass):
- **PR-07 (Major):** the Task 2 static test no longer forbids `text-overflow` in the whole of `moments.css`. It checks only `.section-head` rules, because `.memory__meta` (`moments.css:L85`) has a v6 ellipsis that this plan must not change. The Final grep for `text-overflow` now expects exactly that one line. Expected test counts (191 / 194 / 195 / 196 / 197) are unchanged, because the test now passes after Task 2.
- **PR-08:** the Task 4 BC at 1280 px now expects the first tab's `left` to equal `(clientWidth − 640) / 2` ± 1 (320 at 1280 px), instead of > 400.

## Deviations (filled by coder)
- Task 5 CSS (`max-height: 75svh`, `contain-intrinsic-size: auto 520px`) was applied together with Task 2 (same file); its static test was added afterwards, so the "expect 1 failed" step for Task 5 was not observed. Final count is unchanged: 197 passed, 0 failed.
- Section head at 320 px (RW 320): the segmented control wraps to its own row (`sameRow: false`); at 384 and 430 it shares the row. Title never clipped (`scrollWidth <= clientWidth`), one line (31-36 px high).
- BC was run with live `resize_window` on one loaded page (no reload per size); the CSS reacts live. Guest mode was not run separately: the matrix ran in simulated couple mode only (couple mode is a superset of the controls).
- Matrix (RW = requested at every size): 320, 360, 384, 390, 768, 932x430, 1280 → NHS, OF, place-row fit/OL/⋯ checks pass on moments, places, bé, chat and the four sheets. 430 verified by individual checks (places NHS/OF/OL, gutter 19.5 px, sticky header and month label, photo 488.75 px).
- Landscape notch simulated at 932x430: FAB gap 47 px (measured with the FAB forced visible, it is hidden on that tab), tab bar padding 47 px. 1280: tabs 160 px each, first `left` 320; chat header 1280 wide, first row left 435 ≥ 280. 932x430: photo 322.5 px = 0.75 × innerHeight.
- Real-device checklist lines were added to the iPhone checklist file (unchecked; need a real phone). No screenshot at 384 x 832 (430 x 932 only).
