# Plan: "Album Kem" v6 visual redesign

- **Status:** APPROVED
- **Revision:** 1 — addresses every finding of `docs/reports/2026-11-14-review-album-kem-redesign.md` (PR-01 … PR-16, see Decision log).
- **Source:** `Design/2026-11-14-design-album-kem.md` (design spec, direction A, confirmed 2026-11-14). Section numbers (§) below refer to that spec.
- **Goal:** Re-skin and restructure the Kim & Thư PWA to the "Album Kem" spec (cream paper, ink text, one rose), fix E-01…E-09, and add the behaviours the spec introduces, without changing the backend or the data model.
- **Approach:** Seven phases, each ending in a testable, shippable state. G1 replaces the tokens and keeps the old token names as aliases, so the whole app turns cream at once. G2–G4 rebuild the shell and each screen in new stylesheets with new class names, deleting the legacy rules they replace as they go. G5–G6 add the new behaviours (detail sheet, edit, undo, mark-visited, period history editing, sync feedback). G7 deletes the three legacy stylesheets and runs the acceptance checks. Pure logic goes into small new modules under `src/` with unit tests. DOM work stays in `app.js` / `src/ui/app_shell.js`.
- **Stack:** Vanilla JS SPA (`index.html`, `app.js`, `src/**`), plain CSS, native `<dialog>`, service worker `sw.js`. Tests: dependency-free runner `tests/run_tests.js` via `scripts/test.sh` (Node or macOS `jsc`). Browser checks: preview server `kimthu-static` from `.claude/launch.json` (port 8765).
- **Baseline:** `scripts/test.sh` → `112 passed, 0 failed` (run 2026-11-14).
- **Global constraints:**
  - No backend change: `google-apps-script.js` stays as it is. No new data fields are sent to the backend. Local-only fields (for example a UI flag) must never be put into a backend payload.
  - No new dependencies, no build step, no inline scripts or inline event handlers (CSP `script-src 'self'`, checked by `tests/unit/ui/test_static_assets.js`).
  - Every new local file referenced by `index.html` is added to `SHELL_FILES` in `sw.js`. Every new testable source file is added to `SOURCE_FILES` in `tests/run_tests.js`, and its test file to `TEST_FILES`.
  - Guest/couple permission rules stay the same: every write path keeps its `this.isAuthenticated` check.
  - Every `:hover` rule stays inside `@media (hover: hover)` (test UI-08). No `transition: all` (test UI-10).
  - User-visible copy is exactly as written in the spec (Vietnamese). Copy not given in the spec is written in the same register (short, warm, "nhé", no emoji in buttons or titles).
  - Work on a branch (suggested `feat/v6-album-kem`). Commit only when the user asks. Bump the cache version once, in Task 27.
- **Review focus:**
  1. Legacy CSS interfering with the new components before G7 deletes it (check every phase at 375 px in light and dark).
  2. Deleting the legacy nav menu (`index.html` L51–96): `app.js` binds real handlers to those buttons. Every handler must be moved, not lost.
  3. Undo delete: a delete must never be lost or sent twice when the app is closed during the 5 s undo window.
  4. Dialog queue and overlay stack: exactly one `dialog[open]` after unlock (E-06); the back gesture still closes the top overlay, including after an unsaved-changes veto ("Viết tiếp") and for the photo lightbox.
  5. iOS-only behaviour (safe areas, keyboard over the chat input and sheet action bar, focus zoom) cannot be verified in Chromium. It goes on the manual checklist in Task 28.

> Coder: execute tasks in order, tick each checkbox when its Verify passes, log any deviation in §Deviations. Line numbers were checked on 2026-11-14 against commit `0420acc`. They shift after edits, so always find the code by the symbol named next to the range.

## Conventions used by every task

- **Browser check (BC):** start the preview with `preview_start {name: "kimthu-static"}`, emulate 375 × 812 (`resize_window {preset: "mobile"}`), reload, then run the JS given in the task with `javascript_tool`. Couple mode is simulated on the client only: `journeyApp.isAuthenticated = true; journeyApp.applyAuthMode()`. Never type a passcode and never let a write reach the backend: before simulating couple mode, run `journeyApp.config.apiUrl = ""`.
- **No horizontal scroll check (NHS):** `document.documentElement.scrollWidth <= window.innerWidth` → expect `true`.
- **Legacy grep (LG):** `grep -nE "<pattern>" styles.css src/styles/app_shell.css src/styles/redesign.css` → expect no output after the task deletes the legacy rules it replaced. Delete whole rule blocks, including the ones inside `@media` blocks. Remove a `@media` block when it becomes empty.
- **Static test file:** new static checks go into `tests/unit/ui/test_static_assets.js`, using the existing `test`, `assertEqual`, `assertTrue`, `readText` globals.
- **New stylesheets list (NEW_CSS):** static checks that scan stylesheets before Task 27 scan only the new files that exist at that point: `["src/styles/tokens.css", "src/styles/base.css", "src/styles/components.css", "src/styles/shell.css", "src/styles/moments.css", "src/styles/places.css", "src/styles/chat.css", "src/styles/be.css"]`, filtered with a `try { readText(f) } catch {}` guard so a file not created yet is skipped. Define this list once at the top of `test_static_assets.js` as `const NEW_CSS = …` in Task 4 and reuse it. Legacy files are excluded from these counts until Task 27 deletes them.
- **Declaration counting:** a "`backdrop-filter` declaration" is counted with `/(^|[^-])backdrop-filter:\s*(?!none)/gm` (unprefixed, value not `none`), so `-webkit-backdrop-filter` and resets do not count.

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/styles/tokens.css` | Rewrite | §2 tokens, light + dark, legacy aliases (removed in Task 27) |
| `src/styles/base.css` | Create | reset, type scale, page layout and gutters, focus ring, press feedback, `.hand`, reduced motion |
| `src/styles/components.css` | Create | buttons, icon button, chip, segmented control, sheet, confirm sheet, action menu, toast, offline banner, skeleton, empty state, avatar |
| `src/styles/shell.css` | Create | glass header, sticky counter pill, tab bar, FAB |
| `src/styles/moments.css` | Create | hero, milestone bar, period chip, memory block, text card, grid, month label, on-this-day row, memory detail and add/edit sheets |
| `src/styles/places.css` | Create | places header, chips row, place row, mark-visited sheet, GPS result sheets |
| `src/styles/chat.css` | Create | chat page, header, bubbles, input bar, notes sheet |
| `src/styles/be.css` | Create | Bé page, cycle ring, history rows, period alert sheet, log form |
| `styles.css`, `src/styles/app_shell.css`, `src/styles/redesign.css` | Shrink, then delete (Task 27) | legacy layers |
| `src/ui/icons.js` | Create | inline SVG icon strings for JS templates |
| `src/ui/route.js` | Create | hash ⇄ route parsing (`#moments`, `#places`, `#places/visited`, `#chat`, `#be`) |
| `src/ui/dialog_queue.js` | Create | at most one queued dialog open, in priority order, 300 ms gap |
| `src/ui/confirm_sheet.js` | Create | promise-based confirm/info sheet replacing `window.confirm` |
| `src/ui/action_menu.js` | Create | anchored ⋯ / long-press menu |
| `src/ui/petal_canvas.js` | Create | petal drift (≤ 8, hero-only) and celebration burst, extracted from `app.js` |
| `src/ui/cycle_ring.js` | Create | cycle ring SVG and its text alternative (pure) |
| `src/ui/chat_layout.js` | Create | day separators, sender groups, message state (pure) |
| `src/ui/templates.js` | Create | HTML for memory block, text card, grid tile, on-this-day row, place row, skeletons (pure) |
| `src/utils/escape_html.js` | Create | `escapeHtml` shared by `app.js` and templates |
| `src/utils/vi_format.js` | Create | vi-VN date, 24 h time, month label, comma-decimal distance |
| `src/services/undo_queue.js` | Create | delayed commit with cancel and flush (undo delete) |
| `src/services/milestones.js` | Modify | progress fraction for the milestone bar, new copy |
| `src/services/period_history.js` | Modify | history rows, remove/replace a start date |
| `src/services/sync_engine.js` | Modify | `retryNow(key)`, `onRetry` hook |
| `src/ui/app_shell.js` | Modify | drop proxies, tab bar → routes, FAB, sheets use grabber, chat state |
| `src/ui/overlay_stack.js` | Modify | optional URL per overlay (for `#chat`) |
| `src/ui/theme_init.js` | Modify | two `theme-color` metas, new colours |
| `index.html` | Modify | markup of every screen and sheet |
| `app.js` | Modify | renderers, routing, new behaviours |
| `sw.js` | Modify | precache list |
| `tests/run_tests.js` | Modify | register new sources and tests |
| `tests/unit/ui/test_static_assets.js` | Modify | update legacy checks, add acceptance checks |
| `tests/unit/ui/test_route.js`, `test_dialog_queue.js`, `test_cycle_ring.js`, `test_chat_layout.js`, `test_templates.js`, `test_icons.js` | Create | unit tests |
| `tests/unit/utils/test_vi_format.js`, `test_escape_html.js` | Create | unit tests |
| `tests/unit/services/test_undo_queue.js` | Create | unit tests |
| `tests/unit/services/test_milestones.js`, `test_period_history.js`, `test_sync_engine.js` | Modify | new cases |
| `docs/reports/2026-11-14-album-kem-iphone-checklist.md` | Create (Task 28) | manual real-iPhone checklist and results |

## Tasks

---

## Phase G1 — Foundation (tokens, fonts, base styles)

### Task 1: Semantic tokens with legacy aliases (covers §2.1, §2.3, E-01)
**Files**
- Rewrite: `src/styles/tokens.css` (whole file, 84 lines)
- Modify: `styles.css:L5-L43` (`:root` block) — delete the colour, shadow, radius and font custom properties. Keep nothing in it; delete the block.
- Modify: `src/styles/app_shell.css:L6-L12` (`:root` block) — move `--bottom-nav-height` and `--safe-bottom` into `tokens.css`, delete the block.
- Modify: `src/styles/redesign.css:L481-L484` (dark `--action-fill` override) — delete.
- Modify: `src/styles/redesign.css:L333-L342` (`body::before` pink radial gradients) — delete the rule (PR-07).
- Test: `tests/unit/ui/test_static_assets.js` (`UX-03` test at L74–84, `D-09` test at L166–177, `D-07/D-09` test at L159–164)

**Interfaces**
- Produces, in `:root` (light), `:root[data-theme="dark"]`, and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="dark"]) }`:
  - every colour token of §2.1 (`--c-bg` … `--c-glass`) with the exact light/dark values of the table
  - `--t-*` type tokens of §2.2 as `font` shorthands or size/line-height pairs: `--t-hero-num-size: 4.5rem` and so on (use two tokens per row: `--t-<name>-size`, `--t-<name>-lh`)
  - `--s-1` … `--s-12`, `--r-sm` … `--r-pill`, `--e-1`, `--e-2` (dark: `none`), `--m-fast`, `--m-base`, `--m-slow`, `--ease-out`, `--ease-spring` exactly as §2.3
  - `--font-display: "Playfair Display", Georgia, serif`, `--font-body: "Be Vietnam Pro", -apple-system, system-ui, sans-serif`, `--font-hand: "Caveat", cursive`
  - `--gutter: 16px` (12 px under 360, 20 px from 414, set with `@media` in `tokens.css`), `--header-h: 52px`, `--tabbar-h: 49px`, `--safe-top: env(safe-area-inset-top, 0px)`, `--safe-bottom: env(safe-area-inset-bottom, 0px)`, `--bottom-nav-height: calc(var(--tabbar-h) + var(--safe-bottom))`
  - **Legacy aliases** (one line each, both themes inherit through `var()`): `--bg-primary: var(--c-bg)`, `--bg-secondary: var(--c-sunken)`, `--bg-card: var(--c-surface)`, `--bg-card-hover: var(--c-surface)`, `--bg-glass: var(--c-glass)`, `--surface: var(--c-bg)`, `--surface-card: var(--c-surface)`, `--surface-glass: var(--c-glass)`, `--surface-tint: var(--c-sunken)`, `--pink-lightest: var(--c-sunken)`, `--pink-light: var(--c-divider)`, `--pink-soft: var(--c-divider)`, `--pink-line: var(--c-divider)`, `--pink-primary: var(--c-primary)`, `--pink-accent: var(--c-primary)`, `--pink-deep: var(--c-primary)`, `--pink-action: var(--c-primary)`, `--action-fill: var(--c-primary)`, `--pink-gradient: var(--c-primary)`, `--text-main: var(--c-text)`, `--text-muted: var(--c-muted)`, `--text-soft: var(--c-muted)`, `--border-delicate: var(--c-divider)`, `--border-focus: var(--c-focus)`, `--shadow-subtle: var(--e-1)`, `--shadow-card: var(--e-1)`, `--shadow-hover: var(--e-1)`, `--shadow-glow: none`, `--shadow-1: var(--e-1)`, `--shadow-2: var(--e-2)`, `--font-handwriting: var(--font-hand)`, `--radius-sm: var(--r-sm)`, `--radius-md: var(--r-md)`, `--radius-lg: var(--r-lg)`, `--radius-pill: var(--r-pill)`, `--r-card: var(--r-lg)`, `--r-photo: var(--r-lg)`, `--dur-fast: var(--m-fast)`, `--dur-med: var(--m-base)`, `--ease: var(--ease-out)`, `--transition-smooth: background-color var(--m-base) var(--ease-out), color var(--m-base) var(--ease-out), transform var(--m-base) var(--ease-out), opacity var(--m-base) var(--ease-out)`.
- Dark-mode values are written once per theme block (light `:root`, the dark attribute block, the dark media block), like today.

**Steps**
- [x] Rewrite the `UX-03` test as `"Album Kem: §2.1 text pairs meet 4.5:1 and controls 3:1 (light and dark)"`. It parses `--c-*` hex values from `src/styles/tokens.css` (light block and `[data-theme="dark"]` block) and asserts: `--c-text`, `--c-muted`, `--c-primary`, `--c-danger`, `--c-success`, `--c-warn` on `--c-bg` ≥ 4.5; `--c-muted` on `--c-sunken` ≥ 4.5; `--c-on-primary` on `--c-primary` ≥ 4.5; `--c-primary` on `--c-primary-soft` ≥ 4.5; `--c-control` on `--c-bg` and on `--c-surface` ≥ 3; `--c-focus` on `--c-bg` ≥ 3. (`--c-success`/`--c-warn`/`--c-danger`: assert against `--c-surface` in dark, as in the spec table.)
- [x] Rewrite the `D-09` test to `"dark tokens are warm brown-black, not pink-brown"`: dark `--c-bg` is `#16110F` and the file no longer contains `#1f1418`.
- [x] Keep the `D-07/D-09` test (light/dark blocks, loads first) unchanged.
- [x] Run `scripts/test.sh` → expect the 2 rewritten tests to fail (tokens not written yet).
- [x] Write `tokens.css` as described. Delete the three legacy `:root` blocks listed under Files.
- [x] Run `scripts/test.sh` → expect `112 passed, 0 failed` (same count: 2 rewritten, none added).
- [x] BC: `getComputedStyle(document.body).backgroundColor` → expect `rgb(251, 247, 242)` (if a legacy rule still paints `body`/`main` pink through a hard-coded hex, replace that hex with the matching token and log it in §Deviations). `applyTheme("dark")` → `rgb(22, 17, 15)`. `getComputedStyle(document.body, '::before').backgroundImage` → `"none"` (no pink radial tint). Screenshot Moments in light and dark.

**Done when:** the app renders on cream paper in light mode and warm brown-black in dark mode, with no pink surface tints, and tests pass.

### Task 2: Fonts — Be Vietnam Pro, Caveat only via `.hand` (covers §2.2, acceptance 7)
**Files**
- Modify: `index.html:L22-L24` (Google Fonts `<link>`)
- Modify: `styles.css:L981` (the only `font-family: var(--font-handwriting)` rule, inside the `.locket-story-text` block) — change to `font-family: inherit` (it is deleted in Task 15 anyway).
- Create: `src/styles/base.css` (only the `.hand` rule in this task; Task 4 adds the rest)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Produces: CSS class `.hand { font-family: var(--font-hand); font-weight: 500; font-size: var(--t-hand-size); line-height: var(--t-hand-lh); }`. It is the **only** rule in the code base that references `--font-hand` or `Caveat`.
- Font URL (exact): `https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Caveat:wght@500&family=Playfair+Display:wght@500;700&display=swap&subset=vietnamese`

**Steps**
- [x] Add tests: `"fonts: only Playfair Display, Be Vietnam Pro and Caveat load"` (the `fonts.googleapis.com/css2` URL in `index.html` has exactly those three `family=` values and no `Outfit`); `"fonts: Caveat is used only by .hand"` (across all `*.css` files and `app.js`, the strings `Caveat`, `--font-hand` and `--font-handwriting` appear only in `src/styles/tokens.css` definitions and the `.hand` rule of `base.css`).
- [x] Run tests → expect 2 failed.
- [x] Replace the font `<link>`. Add `<link rel="stylesheet" href="src/styles/base.css?v=5.2">` after `redesign.css` (L29). Add `"src/styles/base.css"` to `SHELL_FILES` in `sw.js`.
- [x] Write the `.hand` rule. Change `styles.css` L981.
- [x] Run tests → expect `114 passed, 0 failed`.
- [x] BC: `document.fonts.check('16px "Be Vietnam Pro"', 'Đã đến')` after `await document.fonts.ready` → expect `true`.

**Done when:** Vietnamese text renders in Be Vietnam Pro, and Caveat is reachable only through `.hand`.

### Task 3: `theme-color` follows the theme; theme labels (covers §2.1 rules, §4.8, acceptance 9)
**Files**
- Modify: `index.html:L17` (`<meta name="theme-color">`)
- Modify: `src/ui/theme_init.js:L10-L16` (`applyTheme`)
- Modify: `index.html:L609-L616` (theme choice buttons: "Theo máy" → "Tự động")
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Markup: `<meta name="theme-color" content="#FBF7F2" media="(prefers-color-scheme: light)">` and `<meta name="theme-color" content="#16110F" media="(prefers-color-scheme: dark)">`.
- `applyTheme(choice)`: for `"light"` / `"dark"` sets **both** metas' `content` to that theme's colour (`#FBF7F2` / `#16110F`); for `"auto"` restores light meta `#FBF7F2` and dark meta `#16110F`. The default stays `"light"` (existing test "theme defaults to light" is kept).

**Steps**
- [x] Add test `"theme-color: two media metas with paper colours, no pink"`: `index.html` has both metas above; neither `index.html` nor `theme_init.js` contains `#ff758f` or `#1f1418`.
- [x] Run tests → expect 1 failed. Implement. Run → expect `115 passed`.
- [x] BC: `applyTheme("dark"); [...document.querySelectorAll('meta[name=theme-color]')].map(m => m.content)` → expect `["#16110F", "#16110F"]`; `applyTheme("auto")` → `["#FBF7F2", "#16110F"]`.

**Done when:** the iOS status bar takes the paper colour in both themes.

### Task 4: Base and component styles (covers §2.2 scale, §2.3 motion/press, §5 Button/Chip/Segmented/Toast/Skeleton/Empty/Avatar, §7 focus and targets)
**Files**
- Modify: `src/styles/base.css` (add to the `.hand` rule from Task 2)
- Create: `src/styles/components.css`
- Modify: `index.html` (add `<link>` for `components.css` after `base.css`), `sw.js` (`SHELL_FILES`)

**Interfaces** (class names every later task uses; do not rename)
- `base.css`: `html { font-size: 100% }`, `body { background: var(--c-bg); color: var(--c-text); font: 400 var(--t-body-size)/var(--t-body-lh) var(--font-body); }`, `.page` (content column: `max-width: 560px; margin-inline: auto; padding-inline: var(--gutter)`), `.large-title` (Playfair 700, `--t-display`), `.t-title`, `.t-headline`, `.t-meta`, `.muted`, `.clamp-2`, `.clamp-3` (line clamps driven by `--clamp-title: 2` and `--clamp-excerpt: 3`; under `html[data-large-text]` they become 3 and 5 — `app_shell.js` sets that attribute at start-up when `parseFloat(getComputedStyle(document.documentElement).fontSize) >= 20.8`, i.e. 130 % of 16 px), `.visually-hidden`, `[hidden] { display: none !important; }` (many later tasks toggle the `hidden` attribute on elements whose class sets `display`), the access rules moved from `styles.css` L2741–2749: `body.is-guest .couple-only { display: none !important; }` and `body:not(.is-guest) .guest-only { display: none !important; }`, `:focus-visible { outline: 2px solid var(--c-focus); outline-offset: 2px; box-shadow: 0 0 0 2px var(--c-bg); }`, press feedback `:where(button, a, [role="button"], .tappable):active { transform: scale(.97); }` with `transition: transform var(--m-fast) var(--ease-out)`, and `@media (prefers-reduced-motion: reduce)` that removes transforms, transitions and animations except opacity fades.
- `components.css`:
  - Buttons: `.btn` (44 px min height, `--r-md`, `--t-callout`, 600), `.btn--primary` (fill `--c-primary`, text `--c-on-primary`, `:active` darker via `filter: brightness(.92)`), `.btn--soft` (`--c-primary-soft` / `--c-primary`), `.btn--secondary` (1 px `--c-control` outline, `--c-text`), `.btn--text`, `.btn--danger-text` (`--c-danger`), `.btn--lg` (52 px), `.btn--block` (full width), `.btn[aria-busy="true"]` shows a 16 px spinner before the label.
  - `.icon-btn` (44 × 44, transparent, `--c-text`, 24 px svg).
  - `.chip` (36 px visual height inside a 44 px hit area via `::before` inset −4 px, `--c-sunken`, `--r-pill`, icon + label), `.chip[aria-pressed="true"]` (`--c-primary-soft` / `--c-primary`), `.chip[aria-busy="true"]` (spinner replaces icon), `.chip:disabled`.
  - `.segmented` (track `--c-sunken`, `--r-pill`, 36 px tall, 44 px hit area), `.segmented__option` (`role="tab"` or `aria-pressed`), selected option = `--c-surface` thumb with `--e-1`.
  - `.empty` (title `.t-headline`, one `.muted` sentence, optional `.btn--primary`; left aligned, `padding-block: var(--s-8)`).
  - `.skeleton` (`--c-sunken` block, 1.2 s opacity pulse, static under reduced motion), `.skeleton--photo` (4:5), `.skeleton--line`, `.skeleton--row` (place row: title line, notes line, action pill), `.skeleton--bubble` (chat bubble: 60 % width, 40 px tall, radius 20; `.skeleton--bubble.is-own` aligned end).
  - `.avatar` (circle, initial letter, Be Vietnam 600), sizes `.avatar--20`, `.avatar--32`, `.avatar--56`; `.avatar--k` (`--c-primary-soft` / `--c-primary`), `.avatar--t` (`--c-sunken` / `--c-text`).
  - `.journey-toast` restyle (the element `showToast` creates, `app.js:L605-L631`): `--c-text` fill, `--c-bg` text, `--r-md`, bottom `calc(var(--bottom-nav-height) + var(--s-4))`, `.toast-action` as a text button in `--c-primary-soft`.
  - `.offline-banner` (warn: 1 px `--c-warn` left rule, `--c-surface`, warn icon + text + close `.icon-btn`).
  - `.status` helpers: `.status--success`, `.status--warn`, `.status--danger` (icon + text colour only).
- No colours outside tokens. No gradients. No pink shadows.

**Steps**
- [x] Add the `NEW_CSS` constant (see Conventions) at the top of `test_static_assets.js`.
- [x] Add test `"components: no gradients and no pink-tinted shadows in the new stylesheets"`: every file in `NEW_CSS` contains no `gradient(` and no `rgba(255,` / `rgba(201,` inside `box-shadow`.
- [x] Run → 1 failed. Write both files. Add links and precache entries. Run → `116 passed`.
- [x] LG with pattern `\.journey-toast|\.toast-action` → no output (the toast is now styled only by `components.css`).
- [x] BC: insert a temporary test element `document.body.insertAdjacentHTML('beforeend','<button class="btn btn--primary" id="t">Lưu</button>')`; `getComputedStyle(t).minHeight` → `"44px"`; `getComputedStyle(t).backgroundColor` → `rgb(201, 24, 74)`. Remove it.

**Done when:** the shared component classes exist and render with tokens only.

### Task 5: Icon set for templates (covers §5 Icons, §6 no emoji in controls)
**Files**
- Create: `src/ui/icons.js`
- Test: `tests/unit/ui/test_icons.js`
- Modify: `index.html` (add `<script src="src/ui/icons.js?v=5.2">` before `src/ui/overlay_stack.js`, L779), `sw.js`, `tests/run_tests.js`

**Interfaces**
- Produces: `function icon(name: string, opts?: { size?: number, filled?: boolean, label?: string }) -> string` on the global object. Returns `<svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">…</svg>`. With `filled: true` the glyph uses `fill="currentColor"` (tab bar active state). With `label`, it drops `aria-hidden` and adds `role="img" aria-label="…"`.
- Names (all required): `home`, `pin`, `chat`, `drop`, `plus`, `music`, `settings`, `lock`, `navigation`, `check`, `cloud-pending`, `more`, `chevron-down`, `chevron-right`, `eye`, `eye-off`, `camera`, `heart`, `send`, `close`, `clock`, `alert`, `share`, `edit`, `trash`, `locate`, `tiktok` (a neutral play/note glyph, not the brand logo).
- Unknown name → throws `Error("Unknown icon: <name>")`.

**Steps**
- [x] Write tests: every name returns a string starting with `<svg` containing `stroke-width="1.75"` and `currentColor`; `filled` adds `fill="currentColor"`; `label` adds `aria-label`; unknown name throws.
- [x] Run → fail (file missing). Implement. Run → `120 passed` (4 new tests).

**Done when:** templates can render every control icon without emoji.

---

## Phase G2 — App shell, routing, sheets, dialog queue

### Task 6: Hash routes (covers §3.3 URL state)
**Files**
- Create: `src/ui/route.js`
- Test: `tests/unit/ui/test_route.js`
- Modify: `index.html` (script tag before `app_shell.js`), `sw.js`, `tests/run_tests.js`

**Interfaces**
- `parseRoute(hash: string) -> { view: "moments"|"places"|"be", placesFilter: "unvisited"|"visited", chat: boolean }`
  - `""`, `"#"`, `"#moments"`, unknown → `{view:"moments", placesFilter:"unvisited", chat:false}`
  - `"#places"` → places/unvisited; `"#places/visited"` → places/visited; `"#be"` → be; `"#chat"` → `{view:"moments", chat:true}`
- `buildHash(route) -> string`: moments → `""` (clean URL, as today in `applyView`), places/unvisited → `"#places"`, places/visited → `"#places/visited"`, be → `"#be"`.

**Steps**
- [x] Write tests for every case above plus round-trip `parseRoute(buildHash(r))` for the four views.
- [x] Run → fail. Implement. Run → pass (`+3` tests).

### Task 7: Header and tab bar; remove the legacy menu and proxies (covers §3.2 Header/Tab bar, §5 App header/Tab bar, E-08 partly)
**Files**
- Modify: `index.html:L36-L98` (`<nav class="nav-bar">`): new header markup; delete `.legacy-nav-menu` (L51–96).
- Modify: `index.html:L667-L671` (`#floating-chat-btn`): delete.
- Modify: `index.html:L757-L765` (`<nav class="bottom-nav">`): new tab bar.
- Modify: `index.html:L258-L262` (`<footer class="app-footer">`): delete the `.footer-heart` div; keep the sentence as `<p class="muted t-meta">`.
- Modify: `app.js:L218-L378` (`initDOM`): update the element lookups listed below.
- Modify: `app.js:L397-L412` (`initAuth`, unlock/lock handlers): keep logic, remove `navDropdownWrap` lines.
- Modify: `app.js:L574-L603` (`applyAuthMode`): remove `floatingChatBtn`, `authUnlockNavBtn`/`authLockNavBtn` `style.display` toggling (visibility is now CSS: `.couple-only` / `.guest-only`).
- Modify: `app.js:L1097-L1142` (`initEvents`, nav dropdown block): delete.
- Modify: `app.js:L1817-L1845` (`initPlaces`, nav buttons, logo, popstate, initial view): replace (see Task 8 for `switchView`).
- Modify: `app.js:L2986-L3060` (`toggleMelody`/`playMelody`/`stopMelody`): drop `this.musicStatus` text writes; set `aria-pressed` on `#music-toggle-btn` instead.
- Modify: `app.js:L3481-L3530` (`initChat`): delete `floatingChatBtn` and `openChatDropdownBtn` lookups/handlers; bind the chat tab (`#tab-chat`) to the same auth-checked `toggleChatDrawer(true)` logic.
- Modify: `app.js:L3445-L3447` (`mergeChat` unread) and `app.js:L3590` (`toggleChatDrawer`): use `#tab-chat-dot` (`hidden` attribute) instead of `#chat-unread-dot`; also toggle `#tab-chat`'s `aria-label` between `"Chat"` and `"Chat (có tin mới)"`.
- Modify: `src/ui/app_shell.js:L31-L38` (`bindProxyButtons`), `L41-L48` (`bindFab`), `L63-L80` (`mirrorChatDot`, `mirrorMusicState`): delete; `L51-L61` (`bindViewState`): keep, extend to `be`; `L155` (`bindChatState`, the `background()` selector list `"main, .nav-bar, .bottom-nav, footer"`): change to `"main, .app-header, .tab-bar, footer, .fab"` so the new header, tab bar and FAB become inert while chat is open (PR-06c).
- Create: `src/styles/shell.css` (+ `<link>` after `components.css`, `sw.js`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Header markup (inside `<header class="app-header" id="app-header">`, replacing `nav.nav-bar`):
  - `<button type="button" class="wordmark" id="nav-logo-btn">Kim &amp; Thư</button>` — the text node is filled by `renderProfile` through `#nav-couple-names` (rename: put `id="nav-couple-names"` on this button and delete the `.logo-heart` span). Tap (handler at `app.js:L1830-L1834`, `navLogoBtn`): `switchView("moments")`, then `window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" })` — scroll to the top even when Moments is already the active view (§3.2, PR-14).
  - `#sticky-counter-pill` (kept).
  - Right group: `#music-toggle-btn.icon-btn` (`aria-label="Bật hoặc tắt nhạc"`, `aria-pressed`), `#edit-profile-btn.icon-btn.couple-only` (`aria-label="Cài đặt"`), `#auth-unlock-nav-btn.btn.btn--text.guest-only` (lock icon + `<span class="unlock-label">Mở khóa</span>`; the label is hidden under 360 px and the button gets `aria-label="Mở khóa"`).
  - The old lock-to-guest header button and `#auth-lock-nav-btn` move into Settings (Task 20). Until Task 20, keep a hidden `<button id="auth-lock-nav-btn" class="couple-only" hidden>` inside `#settings-modal` so `initAuth` still binds.
- Tab bar (`<nav class="tab-bar" id="bottom-nav" aria-label="Điều hướng chính">`): four `<button type="button" class="tab" data-view="…">` with `icon()`-equivalent inline SVG (home, pin, chat, drop) and labels "Khoảnh khắc", "Nơi muốn đến", "Chat", "Bé". Chat: `id="tab-chat"`, class `couple-only`, contains `<span class="tab-dot" id="tab-chat-dot" hidden></span>`, no `data-view`. Bé: `data-view="be"`, class `couple-only`. No FAB inside the bar, no guest "Mở khóa" tab.
- `app_shell.js bindViewState` toggles `body.view-<name>` for `moments|places|be` and `aria-current="page"` on the matching `.tab`. Tab clicks: `.tab[data-view]` → `root.journeyApp.switchView(tab.dataset.view)`.
- `shell.css`: glass header (`--c-glass` + `backdrop-filter: blur(20px) saturate(1.4)`), height `calc(var(--header-h) + var(--safe-top))`, `padding-top: var(--safe-top)`; hairline `border-bottom: 1px solid var(--c-divider)` only when `body.is-scrolled` (set by `app_shell.js` with a passive scroll listener, `scrollY > 4`). Tab bar: glass, `height: var(--bottom-nav-height)`, `padding-bottom: var(--safe-bottom)`, tabs evenly spread, label 11–12 px, inactive `--c-muted`, active `--c-primary` with filled icon (CSS: `.tab[aria-current="page"] svg { fill: currentColor }`). Sticky pill: `--c-sunken` fill, `--c-muted` text, number in `--c-primary`.
- Blur on phones: Phase D removed the bar blur on ≤ 768 px for scroll smoothness (`redesign.css:L344-L352`, "Solid bars on phones"). The spec asks for glass bars, so this task brings the blur back for the header and tab bar only (the LG below deletes that Phase D rule because it targets `.nav-bar`/`.bottom-nav`). The month label strip (Task 15) and the sheet scrim get **no** blur. If the real-iPhone check (Task 28) reports scroll jank, the follow-up is to drop the two `backdrop-filter` declarations and raise the `--c-glass` alpha to 0.94; record the outcome in §Deviations.
- Static test "backdrop-filter is limited…" (`test_static_assets.js:L86-L89`) currently reads `styles.css` only. Rewrite it as `"backdrop-filter only on the header and tab bar"`: across `NEW_CSS`, the count of `backdrop-filter` declarations (see Conventions: unprefixed, not `none`) is at most 2 (PR-01a). Legacy files are not scanned; Task 27 deletes them.

**Steps**
- [x] Add tests: `"shell: legacy nav menu and floating chat button are gone"` (`index.html` has no `legacy-nav-menu`, `nav-dropdown`, `floating-chat-btn`, `bottom-fab-btn`, `data-proxy`); `"shell: guest tab bar has no unlock tab"` (no `.tab` with class `guest-only`); `"shell: header has at most two icon buttons per mode"` (count `.icon-btn` in the header markup: `music-toggle-btn` + `edit-profile-btn`).
- [x] Update the `"UI-03: the FAB proxy targets still exist"` test: delete it here (the FAB calls app methods after Task 8; Task 8 adds its own test).
- [x] Update `"D-10: petal canvas … pauses under overlays"` only if it breaks (it should not: `chat-open` is still used).
- [x] Run → new tests fail. Implement markup, `app.js`, `app_shell.js`, `shell.css`.
- [x] LG with pattern `\.nav-bar|\.nav-container|\.logo|\.nav-dropdown|\.dropdown-item|\.circle-menu-btn|\.floating-chat-btn|\.chat-btn-icon|\.chat-badge-pulse|\.bottom-nav|\.bottom-tab|\.bottom-fab|\.header-icon-btn|\.header-actions|\.app-footer|\.footer-heart|\.legacy-nav-menu` → expect no output.
- [x] Run `scripts/test.sh` → all pass.
- [x] BC (guest): `[...document.querySelectorAll('.tab')].filter(t => t.offsetParent).length` → `2`; NHS → `true`. BC (couple, simulated): → `4`; click `#tab-chat` → `document.body.classList.contains('chat-open')` → `true`; Back (`history.back()`) → `false`. Chat open → `document.querySelector('.app-header').inert && document.querySelector('.tab-bar').inert` → `true`. Scroll down, tap the wordmark → `scrollY` → `0` (after the smooth scroll ends). The `#be` route is checked in Task 8, where `applyView` learns the third view (PR-06a).

**Done when:** header and tab bar match §3.2 in both modes, no control is lost, and the back gesture still closes chat first.

### Task 8: View switching for three views; FAB (covers §3.2 FAB, §3.3 routes, E-04, E-09)
**Files**
- Modify: `app.js:L1912-L1987` (`switchView`, `applyView`): generalise.
- Modify: `app.js:L1646-L1662` (`initPlaces` step 3, add-place click handler): extract into `openPlaceDialog()`.
- Modify: `index.html:L157-L163` (`#open-add-memory-modal-btn`), `L239-L246` (`#open-add-place-modal-btn`): delete.
- Modify: `app.js:L236-L237`, `L319` (`initDOM` lookups of those two buttons) and `L943` (`openAddMemoryBtn` listener): delete.
- Modify: `index.html` (add `<div id="view-be" class="app-view" role="region" aria-label="Trang chăm sóc bé" hidden></div>` after `#view-places`, filled in Task 19; add the FAB before `</body>` scripts: `<button type="button" class="fab couple-only" id="fab" aria-label="Thêm khoảnh khắc">` + plus icon).
- Modify: `src/ui/app_shell.js` (new `bindFab()`)
- Modify: `src/ui/overlay_stack.js:L25-L29` (`open`): optional third parameter `url`.
- Modify: `app.js:L3584-L3597` (`toggleChatDrawer`) and `src/ui/app_shell.js:L151-L185` (`bindChatState`): chat overlay pushes `#chat`.
- Modify: `index.html:L104`, `L176` (`#view-moments`, `#view-places`): drop `class="… active"` and the inline `style="display: none;"`; visibility is the `hidden` attribute only.
- Modify: `src/styles/shell.css` (FAB)
- Test: `tests/unit/ui/test_overlay_stack.js`, `tests/unit/ui/test_static_assets.js`

**Interfaces**
- `JourneyApp.switchView(viewName: "moments"|"places"|"be", updateHistory = true, opts?: { placesFilter?: "unvisited"|"visited" })`: same view-transition wrapper as today.
- `JourneyApp.applyView(viewName, updateHistory, opts)`: hides every `.app-view` except `#view-<name>` (use the `hidden` attribute, not inline `style.display`), saves/restores `this.viewScroll[name]`, dispatches `journey:viewchange` with `{view}`, renders the view (`renderPlaces()` + `calculateAllDistancesAndRoutes(false)` for places, `renderBePage()` for be — a no-op stub until Task 19), and pushes `buildHash({view, placesFilter})` when `updateHistory`. A guest asking for `be` is sent to `moments` and shown `openAuthModal()`.
- `popstate` handler: `if (appShell.consumeBack()) return; const r = parseRoute(location.hash); if (r.chat) { this.toggleChatDrawer(true); return; } this.placesFilter = r.placesFilter; this.switchView(r.view, false);`. Initial load uses the same parse (chat deep link opens chat only when authenticated).
- `JourneyApp.openPlaceDialog(prefill?: { place?: Place })`: body of today's add-place click handler (auth check, reset form, background GPS, `placeModal.showModal()`). `prefill` is used by Task 25 (edit mode); ignore it here.
- `OverlayStack.open(token, close, url?)`: `history.pushState({ overlay: true }, "", url)` when `url` is given, otherwise as today. `closed()` / `handlePop()` unchanged.
- FAB (`app_shell.js bindFab`): click → `journeyApp.openMemoryDialog()` on moments, `journeyApp.openPlaceDialog()` on places. `aria-label` is "Thêm khoảnh khắc" / "Thêm địa điểm". Hidden (`hidden` attribute) on `be`, while chat is open, and in guest mode (`.couple-only`). Shrinks to 48 px (`.fab.is-compact`) while `scrollY` increases, back to 56 px when it decreases (passive listener, compare with last `scrollY`, threshold 8 px).
- FAB CSS: 56 px circle, `--c-primary`, `--e-2`, `position: fixed; right: var(--gutter); bottom: calc(var(--s-4) + var(--bottom-nav-height))`, transition on `width/height` with `--ease-spring`, no transition under reduced motion.

**Steps**
- [x] Add overlay-stack test `"OverlayStack: open with a url pushes that url"` (fake history records the third `pushState` argument).
- [x] Add static test `"FAB: one page-aware add button; no inline + buttons"`: `index.html` contains `id="fab"` and no `open-add-memory-modal-btn` / `open-add-place-modal-btn`; `app_shell.js` references `openMemoryDialog` and `openPlaceDialog`.
- [x] Run → 2 failed. Implement. Run → all pass.
- [x] LG with pattern `\.btn-add-memory|\.btn-add-place|\.app-view|viewFadeIn` → no output (the legacy `.app-view { display: none }` / `.app-view.active` rules at `styles.css:L1042-L1054` would otherwise keep `#view-be` invisible; PR-06b).
- [x] BC (couple): click the Bé tab → `location.hash` → `"#be"` and `document.getElementById('view-be').hidden` → `false` (moved here from Task 7, PR-06a). On moments `fab.getAttribute('aria-label')` → `"Thêm khoảnh khắc"`; `switchView('places')` → `"Thêm địa điểm"` and `location.hash` → `"#places"`; `switchView('be')` → `fab.hidden` → `true`. Navigate to `/#places/visited` and reload → `journeyApp.placesFilter` → `"visited"`. Places page: `document.querySelector('#places-list-container').getBoundingClientRect().top - document.querySelector('.places-chips, .places-controls-bar').getBoundingClientRect().bottom` → `< 32` (E-04: no orphan row).

**Done when:** one FAB adds the right thing per page, routes match §3.3, and the inline "+" buttons are gone.

### Task 9: Dialog queue (covers §4.7 dialog queue, E-06, acceptance 5)
**Files**
- Create: `src/ui/dialog_queue.js`
- Test: `tests/unit/ui/test_dialog_queue.js`
- Modify: `app.js:L3318-L3338` (`promptSenderIfNeeded`), `app.js:L1386-L1396` (`checkPeriodAlert`, the `setTimeout(… showModal …, 650)` block), `app.js:L126-L181` (constructor: create `this.dialogQueue`)
- Modify: `index.html`, `sw.js`, `tests/run_tests.js`

**Interfaces**
- `class DialogQueue { constructor({ setTimeout, gapMs = 300 }); request(id: string, priority: number, show: () => HTMLDialogElement | null): void; get activeId(): string | null }`
  - Only one requested dialog is shown at a time. Lower `priority` number shows first. A request with an id already queued or active is ignored.
  - `show()` returns the dialog it opened (or `null` if it decided not to open). The queue listens for that dialog's `close` event, then waits `gapMs` and shows the next one.
  - If nothing is active, the first request is shown on the next tick (`setTimeout(…, 0)`), so requests made in the same tick are ordered by priority.
- Priorities (constants in `app.js`): `DIALOG_PRIORITY = { whoAmI: 1, periodAlert: 2, other: 3 }`.
- `promptSenderIfNeeded()` → `this.dialogQueue.request("who-am-i", 1, () => { …existing setup…; modal.showModal(); return modal; })`.
- `checkPeriodAlert()` → replace the 650 ms timeout with `this.dialogQueue.request("period-alert", 2, () => { if (this.periodAlertModal.open) return null; this.periodAlertModal.showModal(); return this.periodAlertModal; })`. Remove the `spawnHeartBurst` call there.

**Steps**
- [x] Write tests with a fake timer and fake dialogs (`{ open, addEventListener, close() }`): two requests in one tick show priority 1 first; the second shows only after the first closes **and** after 300 ms; duplicate ids are ignored; `show()` returning `null` moves on to the next request.
- [x] Run → fail. Implement and wire. Run → pass.
- [x] BC: set `localStorage` so the sender is unknown and a period alert is due (`localStorage.removeItem("journey_chat_sender_chosen_v1"); localStorage.removeItem("journey_period_alert_seen_v1")`, and set `journeyApp.period.startDate` to today), simulate couple mode, wait 100 ms → `document.querySelectorAll('dialog[open]').length` → `1` and its id → `"who-am-i-modal"`. Click "Kim", wait 400 ms → one open dialog, id `"period-alert-modal"`.

**Done when:** unlocking never shows two dialogs at once.

### Task 10: Sheets, overlay contract, confirm sheet, action menu, segmented keys, toast (covers §5 Bottom sheet/Confirm/Context menu/Toast/Segmented, §6 feedback table, §7 keyboard paths)
**Files**
- Create: `src/ui/confirm_sheet.js`, `src/ui/action_menu.js`
- Modify: `index.html` (add `<dialog id="confirm-sheet" class="sheet sheet--confirm custom-modal" aria-labelledby="confirm-sheet-title"><div class="sheet__card">…title, body, two buttons…</div></dialog>`; add `<div id="action-menu" class="action-menu" role="menu" hidden></div>` before the scripts)
- Modify: `index.html` (every existing `<dialog class="custom-modal …">` except `#photo-lightbox`): add class `sheet` to the dialog and class `sheet__card` to its `.modal-card` child (keep `modal-card`/`custom-modal` until Task 27 so legacy selectors keep matching). `#photo-lightbox` gets neither.
- Modify: `src/ui/overlay_stack.js` (`open`, `handlePop`; new `has`) — see Interfaces (PR-04).
- Modify: `src/ui/app_shell.js:L83-L148` (`bindSheets`) — see Interfaces (PR-03, PR-04); the inserted handle becomes the visible grabber (`.sheet__grabber`, 36 × 5 px pill in `--c-control` at 40 % opacity, 44 px tall drag area). Keep the drag/dismiss maths unchanged. Under reduced motion sheets fade (CSS) instead of slide.
- Modify: `src/ui/app_shell.js` (new `bindSegmented()`, PR-14)
- Test: `tests/unit/ui/test_overlay_stack.js`
- Modify: `app.js:L605-L631` (`showToast`): default duration 4000 ms; toast element gets `role="status"` and `aria-live="polite"` once at creation; action toasts default to 5000 ms.
- Modify: `app.js:L1509` (`renderTimeline` delete confirm) and `app.js:L2718` (`deletePlace` confirm): replace `confirm()` with `await confirmSheet({...})` using the §4.2 copy for memories ("Xóa khoảnh khắc này?" / "Ảnh và nội dung sẽ bị xóa trên cả hai điện thoại." / "Xóa" danger / "Giữ lại") and, for places, "Xóa địa điểm này?" / "Địa điểm sẽ bị xóa trên cả hai điện thoại." / "Xóa" / "Giữ lại". Keep `app.js:L488` (`applyApiUrlParam` security prompt) as `window.confirm` — it runs before the UI is ready.
- Modify: `src/styles/components.css` (sheet, confirm, action menu styles)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- **Sheet contract (PR-03):** a sheet is `dialog.sheet` whose movable content is its `.sheet__card` child. Every sheet in `index.html` (existing and new: `#confirm-sheet`, Task 22 `#memory-detail-modal`, Task 25 `#mark-visited-modal`) follows it. Task 27 removes `modal-card`/`custom-modal` but keeps `sheet`/`sheet__card`.
- **`bindSheets()` (rewrite of `app_shell.js:L83-L148`):**
  - **Overlay registration** for `dialog:not(#who-am-i-modal)` — every dialog, including `#photo-lightbox`: the existing `MutationObserver` on `open` calls `this.overlays.open(dialog.id, () => this.requestClose(dialog))` / `this.overlays.closed(dialog.id)`. Keep the literal `:not(#who-am-i-modal)` in the selector (test D-13). The who-am-i sheet stays out of the stack (it must not close on Back or backdrop).
  - **Sheet behaviour** (backdrop tap, grabber drag, Esc) for `dialog.sheet:not(#who-am-i-modal)`, using `dialog.querySelector(".sheet__card")` as the card; a sheet without a `.sheet__card` is a bug — throw `Error("sheet without .sheet__card: #" + dialog.id)` so it shows up in the console during BCs.
  - Esc: listen for the dialog's `cancel` event, call `event.preventDefault()`, then `this.requestClose(dialog)`.
  - The lightbox closes on Back through the overlay registration (`requestClose` falls back to `dialog.close()`), on its × button, and on backdrop tap (handler added in Task 22).
- **`AppShell.requestClose(dialog: HTMLDialogElement) -> Promise<void>`** — the single close path for every dialog:
  1. If `typeof dialog.beforeClose === "function"`, `const ok = await dialog.beforeClose();` — `false` means "keep open" (unsaved-changes veto, used by Tasks 23 and 25).
  2. On veto: if `dialog.open && !this.overlays.has(dialog.id)` (the Back gesture already popped its entry), re-register with `this.overlays.open(dialog.id, () => this.requestClose(dialog))`. Return.
  3. Otherwise run today's close: click the dialog's `[id^="cancel-"]` button if present, then `if (dialog.open) dialog.close()`.
- **`OverlayStack` changes (PR-04):**
  - `has(token) -> boolean`.
  - `open(token, close, url?)`: when `this.pendingBacks > 0` (a `history.back()` issued by `closed()` has not been consumed yet), do not call `pushState` now; record the item and remember `this.deferredPushes += 1` (with its `url`). `handlePop()` performs the deferred `pushState` calls when it consumes the last pending back. This stops the asynchronous `history.back()` of a just-closed confirm sheet from eating the entry that the vetoed sheet re-registered.
  - `url` (third argument) is the Task 8 feature; both changes live in the same method.
- `confirmSheet({ title: string, body?: string, confirmLabel: string, cancelLabel?: string, danger?: boolean }) -> Promise<boolean>`: fills `#confirm-sheet`, shows it, resolves `true` on confirm, `false` on cancel/backdrop/Esc/swipe. With no `cancelLabel` it is an info sheet with one button (used for the GPS-denied message in Task 17). Focus returns to the element that was focused before opening.
- `actionMenu.open({ anchor: Element, items: Array<{ label: string, icon?: string, danger?: boolean, checked?: boolean, onSelect: () => void }> })`, `actionMenu.close()`. Popover positioned under the anchor (flipped above when it would leave the viewport, clamped to the gutter), `role="menuitem"` / `menuitemcheckbox` buttons, Arrow Up/Down moves focus, Esc and outside tap close, focus returns to the anchor. It registers with `appShell.overlays` so Back closes it.
- Sheet CSS (`components.css`): `dialog.sheet` is a bottom sheet on < 768 px (`--r-sheet` top corners, `--c-surface`, `--e-2`, max height `calc(100dvh - var(--safe-top) - 24px)`), a centred dialog max 520 px on ≥ 768 px. `.sheet__header` (title `.t-title` left, one close `.icon-btn` with `aria-label="Đóng"` right), `.sheet__body` (scrolls), `.sheet__actions` (sticky bottom bar, `padding-bottom: calc(var(--s-4) + var(--safe-bottom))`). `::backdrop { background: var(--c-scrim) }`. `.sheet--full` = full height (detail sheet). `.sheet--confirm` = compact, two buttons side by side.
- **`bindSegmented()` (PR-14, §7 "Arrow keys move inside segmented controls"):** for every `.segmented`, roving `tabindex` (selected option `0`, others `-1`); ArrowLeft/ArrowRight (and Home/End) move focus to the previous/next option and `click()` it, wrapping at the ends. Called once at start-up and again by any renderer that rebuilds a segmented control (none do today).

**Steps**
- [x] Add overlay-stack tests: `"OverlayStack: has() reports registered tokens"`; `"OverlayStack: a veto during Back re-registers the sheet"` (open `sheet`; `handlePop()` runs a close callback that re-calls `stack.open("sheet", …)` → `stack.size === 1`, `h.pushed === 2`); `"OverlayStack: open while a back is pending defers pushState"` (open `confirm`, `closed("confirm")` → `pendingBacks 1`; `open("sheet")` → `h.pushed` unchanged; `handlePop()` → returns `true` and `h.pushed` incremented by 1; next `handlePop()` closes `sheet`).
- [x] Run → fail. Implement `OverlayStack`, `bindSheets`, `requestClose`, `confirmSheet`, `actionMenu`, `bindSegmented`, sheet CSS. Run → pass.
- [x] Update test `D-03` (`test_static_assets.js:L149-L153`) in this task, because the handle class changes here: read `src/styles/components.css`, assert `/\.sheet__grabber\s*\{[^}]*touch-action:\s*none/`, and assert no `.sheet__card { … touch-action: pan-y` rule. LG with pattern `\.sheet-handle` → no output (legacy rules at `redesign.css:L424-L462`).
- [x] (The "no `window.confirm`" static test moves to Task 20, where the reset handler with the second `confirm()` at `app.js:L1060` is deleted — PR-01b.)
- [x] BC (couple): `document.querySelectorAll('dialog.sheet:not(:has(.sheet__card))').length` → `0`. Delete a memory → `document.querySelector('#confirm-sheet').open` → `true`; click "Giữ lại" → memory still rendered. Open the action menu from the console on any button, press Escape → menu `hidden` → `true`. Focus the Dòng/Lưới control, press ArrowRight → grid view is active.

**Done when:** every destructive action uses the confirm sheet, and the menu/toast components are ready for later tasks.

---

## Phase G3 — Moments

### Task 11: Milestone progress and copy (covers §4.1 Milestone bar, milestone day text)
**Files**
- Modify: `src/services/milestones.js:L42-L58` (`nextMilestone`, `milestoneText`)
- Test: `tests/unit/services/test_milestones.js` (L15, L22 assertions)

**Interfaces**
- `nextMilestone(start, now)` additionally returns `fromDays: number` (the previous milestone in days: previous 100-multiple or previous anniversary day count, 0 if none) and `targetDays: number`.
- `milestoneProgress(milestone, days) -> number` in `[0, 1]`: `(days - fromDays) / (targetDays - fromDays)`; `1` on milestone day.
- `milestoneText(m)`: `daysLeft === 0` → `"Hôm nay tròn 600 ngày 💕"` (label substituted); otherwise `"Còn 9 ngày nữa là tròn 600 ngày"`. No leading emoji.

**Steps**
- [x] Update L15 expected value to `"Còn 19 ngày nữa là tròn 600 ngày"` and L22 to `"Hôm nay tròn 500 ngày 💕"`. Add tests for `fromDays`/`targetDays` (day 591 → from 500, target 600; progress 0.91) and an anniversary case.
- [x] Run → fail. Implement. Run → pass.

### Task 12: vi-VN formatters (covers §6 dates/times/distances)
**Files**
- Create: `src/utils/vi_format.js`
- Test: `tests/unit/utils/test_vi_format.js`
- Modify: `index.html`, `sw.js`, `tests/run_tests.js`

**Interfaces**
- `formatTime24(date: Date) -> "17:09"` (pad to 2 digits, 24 h; do not rely on `toLocaleTimeString`, because `jsc` lacks full ICU).
- `formatDateVi(date: Date | "YYYY-MM-DD") -> "25/10/2026"`; `formatDayMonth(date) -> "25/10"`.
- `formatMonthLabel("YYYY-MM") -> "Tháng 10, 2026"`.
- `formatDistanceVi(km: number, { approx?: boolean }) -> "3,2 km" | "850 m" | "≈ 3,2 km"`. Rule (PR-12): `const m = Math.round(km * 1000)`; if `m < 1000` → `` `${m} m` ``; otherwise `` `${(Math.round(km * 10) / 10).toFixed(1).replace(".", ",")} km` ``. `approx` prefixes `"≈ "`. Invalid input (`null`, `NaN`) → `""`.
- `formatDaySeparator(date, now) -> "Hôm nay" | "Hôm qua" | "25/10/2026"`.

**Steps**
- [x] Write tests for each function, including: `formatTime24` at 00:05 → `"00:05"`; `formatDistanceVi(3.26)` → `"3,3 km"`; `formatDistanceVi(12.04)` → `"12,0 km"`; `formatDistanceVi(0.85)` → `"850 m"`; `formatDistanceVi(0.9996)` → `"1,0 km"` (rounds to 1000 m, so the km branch); `formatDistanceVi(3.2, { approx: true })` → `"≈ 3,2 km"`; `formatDistanceVi(NaN)` → `""`. Avoid `x.x5` inputs in tests (binary floating point makes their rounding direction unreliable).
- [x] Run → fail. Implement. Run → pass.
- [x] Replace `formatDistance` (`app.js:L2245-L2251`) with a call to `formatDistanceVi`; replace the `toLocaleTimeString` calls in `updateChatPresence` (`app.js:L3350`) and `renderChatMessages` (`app.js:L3666`) with `formatTime24`.

### Task 13: Shared escaping and templates (covers §4.1 Feed card/Grid/Photo states, §4.4 place row markup used later)
**Files**
- Create: `src/utils/escape_html.js`, `src/ui/templates.js`
- Test: `tests/unit/utils/test_escape_html.js`, `tests/unit/ui/test_templates.js`
- Modify: `app.js:L3756-L3768` (`escapeHTML`): delegate to `escapeHtml`.
- Modify: `index.html`, `sw.js`, `tests/run_tests.js` (templates depend on `safeUrl`, `resizeDriveThumbnail`, `icon`, `formatDayMonth`, `formatTime24` — list them before `templates.js` in `SOURCE_FILES`)

**Interfaces**
- `escapeHtml(value) -> string` (same mapping as today's `escapeHTML`; `null`/`undefined` → `""`).
- `memoryBlockHtml(mem, { couple: boolean, senderInitial?: "K"|"T" }) -> string`:
  ```
  <article class="memory" data-id> 
    <button type="button" class="memory__open" aria-label="<title>">   ← whole block opens the detail sheet
      <div class="memory__photo"><img class="memory__img" src alt="<title>" width="800" height="1000" loading="lazy" decoding="async" data-fallback-src></div>
      <h3 class="memory__title t-title clamp-2">
      <p class="memory__meta t-meta muted">25/10 · 17:09 · <place> [<span class="status status--warn">cloud-pending icon + Chưa đồng bộ</span>] <span class="avatar avatar--20 avatar--k">K</span></p>
      <p class="memory__quote hand clamp-3">“<story>”</p>     ← omitted when story is empty
    </button>
  </article>
  ```
  When `mem.image` is not a safe URL, render `memoryTextCardHtml(mem, { retry: false })` instead.
- `memoryTextCardHtml(mem, { retry: boolean })`: same block without `.memory__photo`, with class `memory memory--text` (3 px `--c-primary` left rule). With `retry`, append `<button type="button" class="btn btn--text memory__retry" data-id>Ảnh chưa tải được · Thử lại</button>` **outside** `.memory__open` (no nested buttons).
- `gridTileHtml(mem)`: `<button type="button" class="tile" data-id aria-label="<title>">` with a square `<img>` (400 px thumbnail) or, without a photo, `<span class="tile__text">` (Playfair 15, clamp 3) on `--c-primary-soft`.
- `monthLabelHtml("YYYY-MM")`: `<h2 class="month-label t-meta">Tháng 10, 2026</h2>`.
- `onThisDayHtml(hit)`: single row link `<button type="button" class="otd-row" data-id>` with a 40 px thumbnail, "Ngày này năm xưa", and "1 năm trước · <location>" plus `chevron-right` icon.
- `memorySkeletonHtml()`: photo block + two lines.
- The place row template and `placeSkeletonHtml()` are added in Task 17; `chatSkeletonHtml()` in Task 18.
- The location text in meta is plain text: strip any URL with the existing `formatLocationBadge` logic but output text only (the "Mở bản đồ" link lives in the detail sheet, Task 22). Implement as a pure helper `locationLabel(locationStr) -> string` in `templates.js`, and keep `formatLocationBadge` for the detail sheet.

**Steps**
- [x] Tests: escaping of `<b>` and quotes in title/story; no `<button>` inside `.memory__open`; a memory with `image: ""` renders `memory--text`; `width="800" height="1000"` present; `alt` equals the title; pending sync renders "Chưa đồng bộ"; `locationLabel("Quán (https://maps.google.com/?q=1,2)")` → `"Quán"`; no emoji characters in any template output except inside user text (regex `\p{Extended_Pictographic}` on output built from emoji-free fixtures → no match).
- [x] Run → fail. Implement. Run → pass. Existing `formatLocationBadge` tests in `test_journey_app.js` must still pass.

### Task 14: Hero, counter, milestone bar, period chip (covers §4.1 Hero, §1 principle 2, E-07 counter, acceptance 2 hero height, acceptance 3)
**Files**
- Modify: `index.html:L106-L144` (`<header class="hero-section">`)
- Modify: `app.js:L1158-L1187` (`updateCounter`, `renderMilestone`), `app.js:L1292-L1299` (`updatePeriodExtras` chip text), `app.js:L218-L232` (`initDOM` counter lookups)
- Modify: `src/ui/app_shell.js:L208-L229` (`bindStickyCounter`)
- Create: `src/styles/moments.css` (+ `<link>`, `sw.js`)

**Interfaces**
- Markup (`<section class="hero" id="hero" aria-label="Chuyện của hai đứa">`, no card, no boxes):
  - `<h1 class="hero__names large-title"><span id="partner-one-name">Kim</span> <span class="hero__heart" aria-hidden="true">heart icon, filled, --c-primary</span> <span id="partner-two-name">Thư</span></h1>`
  - `<p class="hero__quote hand muted" id="hero-custom-quote">`
  - `<p class="hero__days" tabindex="0" id="hero-days" aria-label="590 ngày bên nhau"><span class="hero__num" id="count-days">0</span><span class="hero__unit">ngày bên nhau</span></p>` — `aria-label` updated when the day changes.
  - `<p class="hero__clock t-meta muted" aria-live="off" aria-hidden="true"><span id="count-hours">00</span> giờ · <span id="count-minutes">00</span> phút · <span id="count-seconds">00</span> giây</p>`
  - `<div class="milestone"><div class="milestone__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow id="milestone-bar"><span id="milestone-fill"></span></div><p class="t-meta" id="milestone-line"></p></div>`
  - `<button type="button" class="period-chip couple-only" id="period-chip" hidden>` drop icon + `<span id="period-chip-text">` + chevron-right. Click → `switchView("be")`. Hidden when there is no period data.
- `updateCounter()` (PR-13): the day number is `daysTogether(this.config.startDate, now)` (calendar days, `src/services/milestones.js:L21-L24`), so it changes at local midnight and always agrees with the milestone line. Hours/minutes/seconds stay the clock time elapsed since the start time-of-day, i.e. `(now − start) mod 24 h` (today's arithmetic at `app.js:L1159-L1173` with the day part dropped). The day count is written with `Number(days).toLocaleString("vi-VN")` **only when it changes** (so the roll-up in Task 16 can hook in); h/m/s every second. `renderMilestone(days)` sets `milestone-line` text, `milestone-fill` width `%` and `aria-valuenow`.
- Period chip text: `"Ngày 5/5 của kỳ"` during a period, `"Còn 4 ngày đến kỳ"` before, from `computePeriodStatus`. Hidden when `!this.period.startDate`.
- Sticky pill text: `"590 ngày"` (number wrapped in `<strong>`), no emoji, no clock. Observe `#hero-days` instead of `.love-counter-card`.
- `moments.css` hero: `padding-block: var(--s-6) var(--s-4)`, left-aligned names and number (principle "avoid centring everything": align start), `.hero__num` Playfair 700 `--t-hero-num-size` (3.75rem under 360 px), `font-variant-numeric: lining-nums tabular-nums`, `--c-primary`. Milestone bar 4 px, track `--c-primary-soft`, fill `--c-accent`. Period chip: `--c-sunken` pill. Total hero height ≤ 300 px at 375 × 812.

**Steps**
- [x] Implement markup, JS and CSS.
- [x] LG with pattern `\.hero-section|\.hero-title|\.hero-heart-pulse|\.hero-quote|\.love-counter-card|\.counter-header|\.counter-title|\.counter-grid|\.counter-box|\.counter-number|\.counter-unit|\.clock-icon|\.milestone-line|\.period-chip|\.sticky-counter-pill|heartBeat|gentlePulse` → no output (delete the keyframes too).
- [x] Update `"UI-09: at most 4 infinite animations"` (`test_static_assets.js:L115-L119`) to count `infinite` across `NEW_CSS` only and allow at most 3 (skeleton pulse, button spinner, chip spinner from Task 4). Legacy files are not scanned (their remaining `spinGps`/`pulseDistance` loops at `styles.css:L1281`, `L1463`, `L1872` are deleted in Tasks 17, 23 and 27) — PR-01c.
- [x] Add a `test_journey_app.js` case `"updateCounter uses calendar days"`: with a stub `daysTogether` result and a fixed clock at 08:00 on the day after a 19:00 start, the day count written is 1 (calendar days), not 0. (If `updateCounter` cannot run without the DOM, extract the arithmetic into a method `counterParts(startDate, now) -> { days, hours, minutes, seconds }` and test that instead.)
- [x] Run `scripts/test.sh` → all pass.
- [x] BC (375 × 812, guest): `document.getElementById('hero').getBoundingClientRect().height` → `≤ 300`; `document.querySelector('.memory, .memory--text').getBoundingClientRect().top` → `< 812`. Pink check (acceptance 3): run
  `[...document.querySelectorAll('#view-moments *')].filter(e => e.offsetParent && [getComputedStyle(e).color, getComputedStyle(e).backgroundColor].includes('rgb(201, 24, 74)')).map(e => e.id || e.className)` → only the day number, the hero heart, links, active tab and FAB (FAB/tab are outside `#view-moments`, so expect `count-days`, `hero__heart`, and link elements only).

**Done when:** the hero is one bold number on paper and fits above the first photo.

### Task 15: Feed, grid, photo states, month labels, page states (covers §4.1 Feed card/Photo states/Month label/Grid/Ngày này năm xưa/Page states, E-02, E-07, E-09, acceptance 4)
**Files**
- Modify: `index.html:L146-L172` (`#on-this-day-card`, `#timeline` section header and list)
- Modify: `app.js:L1402-L1531` (`renderTimeline`), `app.js:L1544-L1560` (`renderOnThisDay`), `app.js:L1562-L1580` (`initTimelineViewToggle`), `app.js:L3695-L3711` (`attachImageFallbacks`), `app.js:L148` (`showAllMemories`: delete), `app.js:L1088-L1092` (`dblclick` heart burst: delete)
- Modify: `src/styles/moments.css`

**Interfaces**
- Section header markup: `<div class="section-head page"><h2 class="large-title">Khoảnh khắc</h2><div class="segmented" role="group" aria-label="Kiểu hiển thị"><button id="timeline-view-feed-btn" class="segmented__option" aria-pressed>Dòng</button><button id="timeline-view-grid-btn" …>Lưới</button></div></div>` then `<div id="on-this-day-card" hidden></div>` (single row under the title) then `<div id="timeline-list-container"></div>`. No pill tag, no "t-full/t-short" titles.
- `renderTimeline()`:
  - sorts newest first, renders **all** memories (decision: no 6-item limit).
  - inserts `monthLabelHtml` before the first memory of each month (feed and grid). In grid mode the container is `.grid` (3 columns, 4 at ≥ 768, 2 px gaps, no side gutter) and month labels span all columns.
  - feed uses `memoryBlockHtml`; grid uses `gridTileHtml`.
  - empty: `.empty` with "Chưa có khoảnh khắc nào." + "Lưu lại kỷ niệm đầu tiên của hai đứa nhé." + (couple) `.btn--primary` "Thêm khoảnh khắc" → `openMemoryDialog()`.
  - first load: two `memorySkeletonHtml()` only while every memory id is in `DEFAULT_MEMORY_IDS` (`app.js:L33`) **and** `this.firstSyncDone !== true` (flag set in `syncFromBackend`'s `finally`, see Task 17); otherwise render data at once. `syncFromBackend` re-renders the timeline when it sets the flag.
  - click on `.memory__open` / `.tile` / `.otd-row` → `openMemoryDetail(mem)` (Task 22; until then call the existing `openMemoryLightbox(mem)`).
  - delete buttons and "Xem thêm" are removed from cards (delete moves to the detail sheet and long-press menu, Tasks 22/24).
- `attachImageFallbacks(root)`: keep the one retry with the original URL. On the second failure, replace the whole `article.memory` with `memoryTextCardHtml(mem, { retry: true })` (feed) or swap the tile to its text variant (grid). `.memory__retry` click → re-render that memory with the photo again (`data-retried` cleared). Chat images keep a neutral sunken placeholder (no heart) — `chat.css` handles it in Task 18.
- Photo loading: `.memory__photo` has `--c-sunken` background and `aspect-ratio: 4/5` with the skeleton pulse until the image `load` event adds `.is-loaded` (180 ms opacity fade-in).
- Month label: `position: sticky; top: calc(var(--header-h) + var(--safe-top))`; gets a `--c-glass` background strip (colour only, no `backdrop-filter` — see Task 7) only when stuck (`app_shell.js`: one `IntersectionObserver` with `rootMargin` = `-(header height + 1px)` toggling `.is-stuck`).
- Feed spacing: no card box; 12 px between photo, title, meta, quote; 32 px between memories; `content-visibility: auto; contain-intrinsic-size: auto 560px` on `.memory`.

**Steps**
- [x] Add static test `"moments: no pink heart placeholder for failed photos"`: `app.js` and `templates.js` do not contain `locket-photo-placeholder`; `attachImageFallbacks` references `memoryTextCardHtml`.
- [x] Run → fail. Implement. Run → pass.
- [x] LG with pattern `\.locket-|\.timeline-month-sep|\.timeline-toggle-wrapper|\.view-toggle|\.pill-tag|\.section-title|\.t-full|\.t-short|\.on-this-day|\.section-header|\.timeline-section` → no output.
- [x] BC: force failures `document.querySelectorAll('.memory__img').forEach(i => { i.dataset.retried = '1'; i.src = 'https://drive.google.com/invalid-' + Math.random(); })`, wait 2 s → `document.querySelectorAll('.memory--text').length` equals the number of memories that had photos, and `document.querySelectorAll('.locket-photo-placeholder').length` → `0`. Toggle Lưới → `getComputedStyle(document.querySelector('#timeline-list-container')).gridTemplateColumns.split(' ').length` → `3`. NHS at 320, 375, 414 → `true`.

**Done when:** the feed reads as album pages, failed photos become text cards, and the grid mirrors iOS Photos.

### Task 16: Petals and the celebration (covers §2.3 ambient/orchestrated motion, §4.1 milestone day, acceptance 8)
**Files**
- Create: `src/ui/petal_canvas.js`
- Modify: `app.js:L2869-L2954` (`initPetalsCanvas`): replace body with `this.petals = new PetalCanvas({ canvas, hero: document.getElementById('hero') }); this.petals.start();`
- Modify: `app.js:L2959-L2984` (`spawnHeartBurst`, `spawnHeartConfetti`): delete both; add `celebrate({ reason: "milestone" | "save" })`.
- Modify: every caller of the deleted functions (`grep -n "spawnHeart" app.js` listed 14 call sites on 2026-11-14: L431 unlock, L531, L991 memory save, L1052 settings save, L1090 double-tap (removed in Task 15), L1225 and L1243 period form, L1393 period alert (removed in Task 9), L1748 place save, L2409 location check, L2643 current-location save, L3278 note, L3607 sender switch, L3650 chat send): the memory save (L991) calls `this.celebrate({ reason: "save" })`; every other call is deleted.
- Modify: `app.js:L1158-L1187` (`updateCounter`): on milestone day, call `celebrate({ reason: "milestone" })` once per day (localStorage key `journey_celebrated_v1` = local date).
- Modify: `index.html`, `sw.js`, `tests/run_tests.js` (if `PetalCanvas` exposes a pure helper, test it; the canvas itself is checked in the browser)
- Test: `tests/unit/ui/test_static_assets.js` (`"UI-09: petal count is 6"` at L121–123)

**Interfaces**
- `class PetalCanvas { constructor({ canvas: HTMLCanvasElement, hero: Element, count = 6, enabled = () => boolean }); start(); stop(); burst(originX: number, originY: number, durationMs = 1200) }`
  - Drift: `count` ≤ 8 petals, opacity 0.35–0.55, colour from `getComputedStyle(document.documentElement).getPropertyValue('--c-accent')`, drawn only inside the hero's bounding box.
  - The rAF loop runs only while the hero intersects the viewport (`IntersectionObserver`), the document is visible, no `dialog[open]` / `body.chat-open`, `enabled()` is true and `prefers-reduced-motion` is not `reduce`. When any condition fails, it cancels the frame (no idle loop) and clears the canvas.
  - `burst()` draws ~24 petals radiating from the origin for `durationMs`, then returns to drift (or stops). Under reduced motion `burst` is a no-op.
  - `enabled()` reads the Settings toggle `localStorage["kimthu_petals"] !== "off"` (Task 20 adds the toggle).
- `JourneyApp.celebrate({ reason })`: if reduced motion → show a static banner `<p class="celebrate-banner" role="status">🎉 Tròn 600 ngày</p>` under the milestone line for 4 s (milestone only; for `save` show nothing extra). Otherwise `this.petals.burst(x, y)` from the centre of `#count-days`, and on milestone day roll the number (the `daysTogether` value from Task 14) up from `days - 30` to `days` over 1200 ms with `requestAnimationFrame` (one-off, not a loop).
- Static test update: `"petals: at most 8 and the loop is gated"`: `petal_canvas.js` contains `count = 6` (or a literal ≤ 8), `IntersectionObserver`, `prefers-reduced-motion`, `visibilitychange`; `app.js` no longer contains `PETAL_COUNT`, `spawnHeartBurst` or `spawnHeartConfetti`.

**Steps**
- [x] Update the static test. Run → fail. Implement. Run → pass.
- [x] BC: scroll so `#hero` is off-screen, then patch `const orig = requestAnimationFrame; let n = 0; window.requestAnimationFrame = (f) => { n++; return orig(f); };`, wait 1 s → `n` → `0`. Scroll back to the top, wait 1 s → `n > 0`.
- [x] Reduced motion: the preview tools cannot emulate `prefers-reduced-motion`, so this path is covered by the static test above. Record "static only" in §Deviations.

**Done when:** petals drift only around the hero, stop when not visible, and the only big motion is the celebration.

---

## Phase G4 — Places, Chat, Bé, Settings, Auth

### Task 17: Places screen (covers §4.4, E-04, E-05, E-08 TikTok pill)
**Files**
- Modify: `index.html:L176-L256` (`#view-places`)
- Modify: `app.js:L1583-L1628` (`initPlaces` step 0, GPS dropdown toggle): delete. `L1629-L1638` (step 1, `.place-tab` filter): bind the segmented control instead and push `#places` / `#places/visited`.
- Modify: `app.js:L2301-L2330` (`reloadPlacesByGps`): chip states (`aria-busy`, label "Đang tìm vị trí…"), denied → chip label "Bật vị trí" and `confirmSheet({ title: "Cần quyền vị trí", body: "Cần quyền vị trí để sắp xếp theo khoảng cách. Vào Cài đặt › Safari › Vị trí để bật.", confirmLabel: "Đóng" })`; success toast removed (the list reorder is the feedback).
- Modify: `app.js:L2733-L2866` (`renderPlaces`): use `placeRowHtml`; empty states; distances; bind row actions.
- Modify: `app.js:L2493-L2541` (`showCheckLocationResult`) and `index.html:L405-L480` (both GPS result dialogs): standard sheet markup and §4.4 result sentences.
- Modify: `src/ui/templates.js` (add `placeRowHtml`), `tests/unit/ui/test_templates.js`
- Create: `src/styles/places.css` (+ `<link>`, `sw.js`)

**Interfaces**
- Places markup: `<h2 class="large-title page">Nơi muốn đến</h2>`; `<div class="segmented segmented--full" role="tablist" aria-label="Lọc địa điểm">` with `<button role="tab" id="tab-places-unvisited" data-filter="unvisited" aria-selected>Muốn đi <span id="count-places-unvisited">0</span></button>` and the visited twin; `<div class="chips" role="toolbar" aria-label="Công cụ vị trí">` with `#reload-places-gps-btn.chip` (locate icon, "Gần nhất"), `#check-visited-gps-btn.chip` (check icon, "Đã đến đây chưa?"), `#add-current-location-btn.chip.couple-only` (plus icon, "Lưu chỗ này"); `#places-list-container` as a list (`role="list"`). Chips row scrolls horizontally inside its own box (`overflow-x: auto`, no page overflow), with no surrounding box. Drop `.section-desc`.
- `placeRowHtml(place, { couple, distance?: { km: number, approx: boolean }, distanceIsNew?: boolean, linkedMemoryId?: string, mapsUrl: string, compact: boolean }) -> string` (PR-10): the template reads the TikTok link from `place.tiktokUrl` itself and runs it through `safeUrl()` (as `renderPlaces` does today at `app.js:L2797`); it also passes `mapsUrl` through `safeUrl()`. An unsafe URL produces no link element at all. Every attribute and text value goes through `escapeHtml`.
  - `<article class="place" role="listitem" data-id>`: row 1 title `h3.place__title` (Playfair 20, clamp 2; visited rows prefix a success `check` icon) + distance `span.place__distance` (right, tabular, muted, `formatDistanceVi`); row 2 notes `p.place__notes clamp-2 muted`; visited rows: `p.t-meta` "Đã đến · 12/10/2026" (from `place.updatedAt`, see Assumptions) and, with `linkedMemoryId`, `button.btn--text.place__memory` "Xem khoảnh khắc ›".
  - Actions row (one line): `a.btn.btn--soft` navigation icon + "Chỉ đường" (`href=mapsUrl`, `target=_blank`, `rel=noopener noreferrer`); TikTok `a.btn.btn--secondary` (only with `tiktokUrl`); couple + unvisited: `button.btn.btn--secondary.place__visit` check icon + "Đã đi"; couple: `button.icon-btn.place__more` (`aria-label="Thêm thao tác"`, more icon). With `compact` (viewport < 360 px) the TikTok and "Đã đi" buttons are icon-only with `aria-label`. No × next to the title.
- Distance: route distance if known (`approx: false`), else straight-line (`approx: true`). Drop the duration and the 🚗/📍 emoji badges, "Gần nhất" tag and "Đang tìm toạ độ..." badge (resolving shows nothing until a distance exists).
- Distance fade-in (PR-14, §4.4 "Distances fade in"): `renderPlaces` keeps `this.shownDistanceIds` (a `Set`); a row whose distance appears for the first time gets `distanceIsNew: true`, which adds class `is-new` to `.place__distance` (CSS: 220 ms opacity 0 → 1; none under reduced motion); then the id is added to the set.
- "Gần nhất" chip active state (PR-14, §4.4): after a successful GPS sort set `this.placesSortedByDistance = true` and `#reload-places-gps-btn[aria-pressed="true"]` (primary-soft fill via `.chip[aria-pressed="true"]`). It stays pressed until the page reloads; adding a place re-sorts only when it is pressed. Include `placesSortedByDistance` in the `placesRenderSignature` array.
- Loading (PR-14, §4.4 "3 skeleton rows"): `placeSkeletonHtml()` in `templates.js` returns one `.skeleton--row`; `renderPlaces` renders 3 of them while `this.places` is still the untouched default set (`DEFAULT_PLACE_IDS`, `app.js:L34`) and the first `syncFromBackend` has not finished (`this.firstSyncDone !== true`; set it in `syncFromBackend`'s `finally`). The moments skeleton in Task 15 uses the same `firstSyncDone` flag with `DEFAULT_MEMORY_IDS`.
- Row actions (bound in `renderPlaces`): `.place__visit` → `togglePlaceVisited(id)` (Task 25 replaces with the mark-visited sheet); `.place__more` → `actionMenu.open` with "Sửa" (Task 25; until then hidden) and "Xóa" (danger) → `deletePlace(id)`; `.place__memory` → `openMemoryLightbox` (Task 22 swaps to detail).
- Empty states exactly as the §4.4 table (Muốn đi with couple button "Thêm địa điểm" → `openPlaceDialog()`; Đã đến without button).
- GPS result sheet sentences: visited → `Hai đứa đã từng đến đây: <name> (<dd/mm/yyyy>).`; nothing near → `Chưa có kỷ niệm nào quanh đây (bán kính 200 m).` Actions "Lưu chỗ này" (couple) / "Đóng". Delete the emoji status tag and icon spans.
- GPS sort: after `sortPlacesByDistance`, animate rows with FLIP (record `getBoundingClientRect().top` per `data-id` before render, `transform: translateY(delta)` then transition to 0 over 220 ms; skip under reduced motion).

**Steps**
- [x] Template tests: row without TikTok has no TikTok link; a `tiktokUrl` of `javascript:alert(1)` produces no TikTok link and the output contains no `javascript:`; a place name with `<b>` and `"` is escaped; guest row has no `.place__visit` and no `.place__more`; approx distance renders `≈ 3,2 km`; `distanceIsNew` adds `is-new`; no `×`/`&times;` in output; `compact` renders `aria-label` on icon-only buttons; `placeSkeletonHtml()` contains `skeleton--row`.
- [x] Run → fail. Implement. Run → pass.
- [x] LG with pattern `\.place-card|\.place-tab|\.places-filter-tabs|\.places-controls-bar|\.places-action-btns|\.places-gps|\.btn-gps-utility|\.btn-place-|\.place-delete-btn|\.place-distance-tag|\.place-status-tag|\.place-meta-row|\.place-card-top|\.places-grid|\.check-result-|\.check-match-|\.current-loc-|\.coords-pill|\.sync-pending-badge|placePulseHighlight|pulseDistance` → no output. Remove the `D-01` static test (`test_static_assets.js:L134-L137`, it checks a deleted legacy rule) and replace it with `"places: chip row scrolls inside itself"` (`places.css` has `.chips` with `overflow-x: auto`).
- [x] BC (couple, 375 px): first `.place__title` → `getComputedStyle(el).webkitLineClamp` → `"2"` and the row's actions are on one line (`new Set([...row.querySelectorAll('.place__actions > *')].map(e => e.getBoundingClientRect().top)).size` → `1`). At 320 px NHS → `true`. Stub the position (`journeyApp.getUserPosition = (ok) => { journeyApp.lastUserPosition = { lat: 10.77, lng: 106.70 }; ok(); }`), tap "Gần nhất" → `#reload-places-gps-btn` `aria-pressed` → `"true"` and at least one `.place__distance.is-new`. Stub `getUserPosition = (ok, err) => err({ code: 1 })`, reload, tap → chip text contains "Bật vị trí" and `#confirm-sheet` is open.

**Done when:** places is a calm list with one main action per row and no crowding.

### Task 18: Chat page (covers §4.5 header/bubbles/input/states, E-03, §6 24 h time)
**Files**
- Modify: `index.html:L673-L719` (`#chat-drawer`)
- Modify: `app.js:L3481-L3582` (`initChat`), `L3599-L3621` (`toggleChatSender`, `updateChatHeaderLabels`), `L3629-L3660` (`sendChatMessage`), `L3662-L3682` (`renderChatMessages`), `L3340-L3352` (`updateChatPresence`), `L3313` and `L3442` (vibrate calls)
- Modify: `src/ui/app_shell.js:L179-L184` (`bindChatState` has-text toggle; add textarea auto-grow and Enter/Shift+Enter)
- Modify: `src/ui/templates.js` (add `chatSkeletonHtml()`), `tests/unit/ui/test_templates.js`
- Modify: `src/services/sync_engine.js` (add `retryNow`)
- Create: `src/ui/chat_layout.js`, `tests/unit/ui/test_chat_layout.js`, `src/styles/chat.css` (+ `<link>`, `sw.js`, `run_tests.js`)
- Test: `tests/unit/services/test_sync_engine.js`, `tests/unit/ui/test_static_assets.js` (D-04 at L139–143, D-11 at L145–147)

**Interfaces**
- Header: `<header class="chat__header">` with `#close-chat-btn.icon-btn` (chevron-down, `aria-label="Đóng"`), `.avatar.avatar--32` (initial of the receiver), `<h2 id="chat-receiver-name" class="chat__name">Thư</h2>` (Playfair 17, no emoji), `<p id="chat-status-text" class="t-meta muted">Nhắn lúc 19:06</p>`, `#chat-more-btn.icon-btn` (more icon, `aria-label="Thêm tùy chọn"`). Header padding 8 px left/right; nothing overflows 375 px. Delete `#open-notes-btn` and `#switch-chat-sender-btn` from markup; their functions move to the menu.
- `#chat-more-btn` → `actionMenu.open` with: "Thư hẹn giờ" → `openNotes()`; "Tôi là: Kim" (`checked: true`) and "Tôi là: Thư" → choose that sender (reuse `toggleChatSender` logic but set explicitly: new method `setChatSender(name)`); "Tắt rung khi có tin" (`checked` = `localStorage["journey_chat_vibrate_v1"] === "off"`) → toggles it.
- Vibrate guard: new method `vibrate()` that returns without vibrating when the key is `"off"`; replace both `navigator.vibrate(VIBRATE_PATTERN_MS)` call sites.
- Presence: `"Nhắn lúc 19:06"` (same day) or `"Nhắn lúc 25/10/2026"`; with no partner message: `""` (hide the line).
- `chat_layout.js`: `layoutMessages(messages, { me: string, now: Date, pendingKeys: Set<string>, failedKeys: Set<string> }) -> Array<{ kind: "day", label } | { kind: "msg", msg, own: boolean, groupStart: boolean, groupEnd: boolean, showTime: boolean, state: "sent"|"sending"|"failed" }>`: a day separator before the first message of each local day (`formatDaySeparator`); consecutive messages from one sender within 5 minutes form a group; `showTime` only on the group's last message; `state` = `failed` when `chat:<id>` is in `failedKeys`, `sending` when in `pendingKeys`, else `sent`.
- `renderChatMessages()` builds from `layoutMessages`: own bubble `--c-primary` fill + `--c-on-primary` text, partner `--c-surface` + 1 px `--c-divider`; radius 20 with a 6 px tail-side corner on `groupEnd`; 2 px gap inside a group; photo `img.chat-msg-img` radius 16, max 240 px; time `formatTime24`; sending = 60 % opacity + clock icon; failed = danger alert icon + `<button type="button" class="btn--text chat__retry" data-key>Chưa gửi được · Chạm để thử lại</button>` → `this.syncEngine.retryNow(key)`. `failedKeys` = engine entries with `attempts >= 1`.
- Chat skeleton (PR-14, §5 "Skeleton … chat bubble"): `chatSkeletonHtml()` returns three `.skeleton--bubble` (partner, own, partner). `renderChatMessages()` shows it instead of the list while every message id is one of the sample ids in `DEFAULT_CHAT_MESSAGES` (`app.js:L70`) and `this.firstSyncDone !== true`.
- `SyncEngine.retryNow(key: string) -> Promise<void>`: if the entry exists, set `nextAttemptAt = 0`, persist, then `flush()`.
- Input bar: camera `label.icon-btn` (camera icon, `aria-label="Gửi ảnh"`) for `#chat-image-file-input`; `<textarea id="chat-text-input" rows="1" enterkeyhint="send" placeholder="Nhắn gì đó…" aria-label="Tin nhắn">` on `--c-sunken` pill, 16 px, auto-grows to 5 lines; `#chat-quick-heart-btn.icon-btn` (heart icon, `aria-label="Gửi tim"`) shown when empty; `#chat-send-btn.icon-btn--primary` (send icon, `aria-label="Gửi tin nhắn"`) shown when `#chat-form.has-text`. Enter submits, Shift+Enter inserts a newline (keydown handler in `app_shell.js`). The input bar sticks above the keyboard using `visualViewport` (`resize` → set `--kb-offset` on `#chat-drawer` to `innerHeight - visualViewport.height - visualViewport.offsetTop`).
- Empty conversation: `.empty` "Chưa có tin nhắn nào. Gửi một trái tim cho Thư nhé ♥" and the heart button gets `.is-highlighted`.
- Background `--c-bg` (no gradient). Chat full-screen page slides up (`--ease-spring`, fade under reduced motion); tab bar hidden while open (already via `body.chat-open`).
- Notes sheet (`index.html:L733-L755`, `renderNotes` `app.js:L3282-L3299`): rows show recipient, lock icon + "Mở lúc 20:00, 14/11" (locked, text withheld) or `.hand` preview (opened); primary "Viết thư hẹn giờ"; form labels "Gửi cho" (read-only text: the partner's name; the backend has no recipient field — see Assumptions), "Nội dung", "Mở lúc"; empty "Chưa có thư nào. Viết một lá thư để người ấy mở vào đúng lúc nhé."
- Static tests: update D-04 to read `chat.css`: `#chat-text-input { … font-size: 16px` (regex on `chat.css`); keep D-11 (the textarea keeps `id="chat-text-input"` and `enterkeyhint="send"` — the regex matches any tag). Update `"D-05: chat is announced as a modal dialog"` only if the attributes move (they must stay on `#chat-drawer`).

**Steps**
- [x] Write `chat_layout` tests (day separators, grouping by sender and 5-minute window, `showTime` on last, states), a `chatSkeletonHtml()` test (three `skeleton--bubble`), and a `SyncEngine.retryNow` test (entry with future `nextAttemptAt` is sent immediately after `retryNow`).
- [x] Run → fail. Implement. Run → pass.
- [x] LG with pattern `\.chat-header|\.chat-user-info|\.chat-avatar|\.chat-online-dot|\.chat-title-wrap|\.chat-header-actions|\.chat-sender-toggle-btn|\.chat-close-btn|\.chat-msg-row|\.chat-bubble|\.chat-msg-sender-name|\.chat-msg-time|\.chat-attach-btn|\.chat-quick-heart-btn|\.chat-send-btn|\.chat-input-bar|\.chat-drawer|\.chat-messages-container|\.chat-img-preview-box|\.chat-remove-img-btn|\.chat-status-text|\.note-item|\.notes-list` → no output (`chat.css` styles the kept `#chat-img-preview-box` preview: 64 px thumbnail, radius 12, remove `.icon-btn` with `aria-label="Bỏ ảnh"`).
- [x] BC (couple, 375 px): open chat; `[...document.querySelectorAll('#close-chat-btn, #chat-more-btn')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.width >= 44 && r.height >= 44; })` → `true`. Message times match `/^\d{2}:\d{2}$/`. Type text → `#chat-send-btn` visible and heart hidden.

**Done when:** chat fits 375 px, has one menu, and shows message states.

### Task 19: Bé tab page, cycle ring, log form, period alert (covers §4.6, §3.3 Bé tab)
**Files**
- Create: `src/ui/cycle_ring.js`, `tests/unit/ui/test_cycle_ring.js`, `src/styles/be.css` (+ `<link>`, `sw.js`, `run_tests.js`)
- Modify: `src/services/period_history.js` (add `historyRows`, `removePeriodStart`, `replacePeriodStart`), `tests/unit/services/test_period_history.js`
- Modify: `index.html` (`#view-be` content), `index.html:L510-L557` (`#period-modal` → log form sheet), `index.html:L482-L508` (`#period-alert-modal` → compact sheet)
- Modify: `app.js:L1191-L1247` (`initPeriodTracker`), `L1308-L1340` (`renderPeriodTracker` → `renderBePage`), `L1345-L1397` (`checkPeriodAlert` copy and buttons), `L1262-L1274` (`recordPeriodStart`: accept optional duration)

**Interfaces**
- `cycleRingModel({ cycle: { isDuring, periodDay, daysUntilNext, windowStart: Date, windowEnd: Date }, cycleLength: number, durationDays: number, today: Date }) -> { phase: "during"|"before"|"soon"|"none", dayInCycle: number, arcs: { period: [startDeg, endDeg], window: [startDeg, endDeg] }, todayDeg: number, title: string, subtitle: string, summary: string }`
  - `title`/`subtitle`: during → `"Ngày 5"` / `"của kỳ"`; before → `"Còn 4 ngày"` / `"đến kỳ"`; soon (≤ 3 days or inside the window) → `"Sắp đến kỳ"` / `"trong vài ngày tới"`.
  - `summary` (text alternative): `"Hôm nay là ngày 5 của kỳ, dự kiến kỳ tới từ 8 đến 11 tháng 12."` / `"Còn 4 ngày đến kỳ, dự kiến từ 8 đến 11 tháng 12."`.
  - Phase line for the page: `"Đang trong kỳ · ngày 5/5"`, `"Còn 4 ngày đến kỳ"`, `"Có thể đến kỳ trong vài ngày tới"`.
- `cycleRingSvg(model, { size = 200 }) -> string`: `<svg role="img" aria-label="<summary>">` with a `--c-sunken` track circle, `--c-primary` period arc, `--c-primary-soft` window arc with a dashed `--c-primary` outline, a today dot, and the title/subtitle as centred `<text>` (Playfair for the title). Uses `var(--c-*)` in `stroke`/`fill` so it follows the theme.
- Get `windowStart`/`windowEnd` from the existing `computePeriodStatus` / `predictCycle` result (`app.js:L1285-L1290`); extend `computePeriodStatus` to return them as `Date`s if it only returns `windowText` today.
- `historyRows(history: string[]) -> Array<{ start: "YYYY-MM-DD", cycleDays: number | null }>` newest first; `cycleDays` = days to the next (later) start, `null` for the latest.
- `removePeriodStart(history, date) -> string[]`, `replacePeriodStart(history, oldDate, newDate) -> string[]` (sorted, de-duplicated, via `normalizeHistory`).
- `#view-be` markup: `<h2 class="large-title page">Bé</h2>`; `<section class="be-status">` with `#cycle-ring` (SVG injected), `<p id="be-phase" class="t-headline">`, `<p id="be-window" class="muted">Kỳ tới dự kiến: 08 – 11/12</p>`; `<section class="be-care"><h3 class="t-headline">Lời nhắc hôm nay</h3><p id="be-care-text" class="hand"></p></section>`; `<button id="be-log-btn" class="btn btn--primary btn--block btn--lg">Ghi nhận kỳ mới</button>`; `<h3 class="t-headline">Lịch sử</h3><ul id="be-history" class="be-history"></ul>`; `<p class="t-meta muted">Dự đoán chỉ để nhắc nhở, không phải tư vấn y tế.</p>`. Empty state per §4.6 (ring replaced by text + the primary button).
- History row: `"14/11/2026 · chu kỳ 29 ngày"` (latest row: `"14/11/2026 · kỳ gần nhất"`) and a `more` icon button (couple) whose menu is added in Task 26. Per-period length is not stored (see Decision log), so rows do not show "5 ngày".
- Care text: during → "Uống nhiều nước ấm, chườm ấm bụng và nghỉ ngơi thật nhiều nhé."; soon → "Kỳ sắp tới rồi, nhớ mang theo đồ cần thiết và giữ ấm bụng nhé."; before → "Uống đủ nước, ngủ đủ giấc và cười thật nhiều nhé."
- `#period-modal` (log form): title "Ghi nhận kỳ mới"; fields "Ngày bắt đầu" (`#period-start-date-input`, required, default today) and "Số ngày (tùy chọn)" (`#period-duration-input`, number 2–10, placeholder = current `durationDays`); primary "Lưu". Delete the status card, the cycle-length input, the "Đánh dấu hôm nay" button, the disclaimer and accuracy lines (the disclaimer moves to the page). Submit → `recordPeriodStart(start, this.period.cycleLength, duration)` → `renderBePage()` → close → toast "Đã lưu. Anh sẽ nhắc trước kỳ tới nhé."
- `recordPeriodStart(startVal, cycleVal, durationVal?)`: when `durationVal` is a number, set `this.period.durationDays = durationVal` before `queuePeriod()`.
- `be-log-btn` and the old `#period-nav-btn` entry points open the log form; the Bé tab itself now opens `#view-be` (Task 7/8 routes it). Delete `periodNavBtn`, `periodNavLabel`, `periodPhaseText`, `periodStatusMessage`, `periodCycleLengthInput`, `setPeriodTodayBtn`, `periodAccuracy` lookups and their uses; `updatePeriodExtras` keeps only the chip update.
- Period alert sheet: drop icon, title "Bé Thư đang trong kỳ" (during) or "Sắp đến kỳ của bé Thư" (soon), a `.chip`-styled pill "Ngày 5/5" / "Còn 2 ngày", the care text, buttons primary "Xem góc chăm sóc" (→ close, `switchView("be")`) and `.btn--text` "Đã nhớ rồi". No emoji tag, no ×-plus-buttons duplication: keep the header × (`aria-label="Đóng"`).

**Steps**
- [x] Tests: `cycleRingModel` for during/before/soon/none with fixed dates; `cycleRingSvg` contains `aria-label` equal to `summary` and `var(--c-primary)`; `historyRows`, `removePeriodStart`, `replacePeriodStart` cases.
- [x] Run → fail. Implement. Run → pass.
- [x] LG with pattern `\.period-modal-status-card|\.period-icon-wrap|\.period-strawberry-icon|\.period-info|\.period-badge-row|\.period-pill-badge|\.period-phase-text|\.period-status-message|\.period-disclaimer|\.period-accuracy|\.period-alert-` → no output.
- [x] BC (couple): `switchView('be')` → `document.querySelector('#cycle-ring svg').getAttribute('aria-label')` starts with `"Hôm nay là ngày"` or `"Còn"`; NHS → `true`. Guest: navigate to `/#be` → view is moments and the auth sheet is open.

**Done when:** Bé is a tab page with a readable ring and the sheet is only the log form.

### Task 20: Settings sheet (covers §4.8, decision "keep magic link, drop reset")
**Files**
- Modify: `index.html:L559-L624` (`#settings-modal`)
- Modify: `app.js:L996-L1053` (`initEvents`: settings open/submit), `L1055-L1083` (reset handler: delete), `L252-L272` (`initDOM`: drop `resetDataBtn`), `L404-L412` (`authLockNavBtn` handler: add confirm)
- Modify: `app.js:L3212-L3229` (`syncFromBackend`): record `this.lastSyncAt = Date.now()` after a successful `applyPulledData`, persist under `journey_last_sync_at`.
- Modify: `src/ui/app_shell.js:L188-L200` (`bindThemeChoice`): segmented styling only.

**Interfaces**
- Grouped rows on `--c-surface`, section headers `h3.t-meta` 600 muted sentence case:
  - **Hai đứa:** "Tên người 1" (`#cfg-him-name`), "Tên người 2" (`#cfg-her-name`), "Ngày bắt đầu yêu" (`#cfg-start-date`), "Câu nói của hai đứa" (`#cfg-quote`).
  - **Giao diện:** "Chủ đề" segmented (Tự động / Sáng / Tối, existing `data-theme-choice` buttons), "Cánh hoa bay" switch (`#cfg-petals`, `role="switch"`, `aria-checked`; writes `localStorage["kimthu_petals"]` = `"on"`/`"off"` immediately and calls `journeyApp.petals.start()` / `.stop()`), "Nhạc nền" switch (`#cfg-music`, mirrors `isPlayingMelody`; toggles via `toggleMelody()`).
  - **Kết nối:** "Link Google Apps Script" (`#cfg-api-url`), "Trạng thái đồng bộ" row text: `"Đã đồng bộ lúc 15:39"` (`formatTime24(lastSyncAt)`, or date if not today) or `"3 mục chưa đồng bộ"` when `syncEngine.keys().length > 0`, with `.btn--text` "Đồng bộ ngay" → `syncFromBackend()` then refresh the row; "Link tự mở khóa" (`#copy-secret-link-btn`, `.btn--secondary`, share/copy icon, label "Sao chép link tự mở khóa") with the existing helper text shortened to one muted sentence: "Gửi riêng cho người ấy, đừng đăng công khai."
  - **Chế độ:** `#auth-lock-nav-btn.btn--danger-text` "Chuyển sang chế độ khách" → `confirmSheet({ title: "Chuyển sang chế độ khách?", body: "Trên máy này sẽ chỉ xem được khoảnh khắc và địa điểm cho đến khi mở khóa lại.", confirmLabel: "Chuyển", cancelLabel: "Ở lại", danger: true })` → existing lock logic → close settings.
- Sticky `.sheet__actions` with one `.btn--primary.btn--block` "Lưu", `disabled` until any field in the "Hai đứa" or "Kết nối" groups changes (compare against the values filled on open). Submit keeps today's logic, then toast "Đã lưu cài đặt" (no confetti). Theme and the two switches apply immediately and do not need "Lưu".
- Delete: `#reset-default-data-btn` and its handler, the `💑`/emoji titles, inline `style=` attributes in this dialog, the "🟢/🔴" status HTML (replaced by the sync status row).

**Steps**
- [x] Add static test `"settings: no reset-to-defaults button; lock action lives in settings"`: `index.html` has no `reset-default-data-btn`; `id="auth-lock-nav-btn"` appears inside the `settings-modal` block.
- [x] Add static test `"no window.confirm except the API-link prompt"` (moved here from Task 10, PR-01b): `app.js` matches `/\bconfirm\(/g` exactly once — the `applyApiUrlParam` prompt (`app.js:L488`). It passes only once this task deletes the reset handler's `confirm()` (`app.js:L1060`).
- [x] Run → fail. Implement. Run → pass.
- [x] LG with pattern `\.theme-choice` → move the rule to `components.css` as `.segmented` usage, then expect no output.
- [x] BC (couple): open settings → "Lưu" `disabled` → `true`; type in `#cfg-quote` → `false`. Toggle "Cánh hoa bay" off → `localStorage.kimthu_petals` → `"off"`.

**Done when:** settings matches §4.8 and guest mode is one confirmed tap away.

### Task 21: Unlock sheet and "Bạn là ai?" (covers §4.7)
**Files**
- Modify: `index.html:L626-L652` (`#auth-modal`), `index.html:L721-L731` (`#who-am-i-modal`)
- Modify: `app.js:L422-L450` (`authForm` submit: error handling), `app.js:L550-L572` (`openAuthModal`, `closeAuthModal`), `app.js:L3318-L3338` (`promptSenderIfNeeded` choose buttons)

**Interfaces**
- Auth sheet: title "Mở khóa đôi ta"; optional context line `#auth-modal-desc` (muted, one sentence; callers' custom messages are shortened in `openAuthModal` callers to plain sentences without emoji — see the `openAuthModal(…, "…")` call sites from `grep -n "openAuthModal(" app.js`); field label "Mật mã của hai đứa", `<input type="password" id="auth-passcode-input" autocomplete="current-password" enterkeyhint="go" required>` with an eye `.icon-btn` (`aria-label="Hiện mật mã"` ⇄ `"Ẩn mật mã"`, toggles `type`); error `<p id="auth-error-msg" class="field-error" role="alert" hidden>Mật mã chưa đúng. Thử lại nhé.</p>`; on error keep focus in the field and `select()` its text; primary "Mở khóa" (full width); secondary `.btn--text` "Xem chế độ khách" (`#cancel-auth-btn`).
- "Bạn là ai?" sheet: title "Bạn là ai?", one muted sentence "Chọn một lần để tin nhắn trên máy này luôn đúng tên.", two large option buttons `#who-first-btn` / `#who-second-btn` (`.who-option`: `.avatar--56` initial + `<span class="who-option__name">` name, full width, 72 px tall). `promptSenderIfNeeded` sets `first.dataset.name = this.config.partnerOne || "Kim"` and `second.dataset.name = this.config.partnerTwo || "Thư"`, fills the name span and the initial from it, and `choose(button.dataset.name)` replaces `choose(first.textContent)` at `app.js:L3332-L3333` — `textContent` would read "KKim" once the avatar initial is inside the button (PR-15). Tapping selects and closes. No other buttons. It still cannot be dismissed by backdrop tap (test D-13 stays green).
- `.field-error` (in `components.css`): `--c-danger` text, alert icon, `--t-meta`, shown under the field.

**Steps**
- [x] Add static test `"auth: password field with current-password autocomplete"`: `index.html` has `id="auth-passcode-input"` with `type="password"` and `autocomplete="current-password"`.
- [x] Run → fail. Implement. Run → pass (D-13 still passes).
- [x] BC: open the auth sheet; type `x`, submit with `apiUrl` empty so verification fails locally (check `verifyPasscode` path; if it needs the network, stub `journeyApp.verifyPasscode = async () => false` first) → `#auth-error-msg` visible, `document.activeElement.id` → `"auth-passcode-input"`, `getSelection` covers the text (`el.selectionStart === 0 && el.selectionEnd === el.value.length`).

**Done when:** unlocking and identity choice match §4.7 and the password manager can fill the field.

---

## Phase G5 — New behaviours: Moments

### Task 22: Memory detail sheet (covers §4.2)
**Files**
- Modify: `index.html` (new `<dialog id="memory-detail-modal" class="sheet sheet--full custom-modal" aria-labelledby="memory-detail-title"><div class="sheet__card">…</div></dialog>` after `#memory-modal` — follows the Task 10 sheet contract; keep `#photo-lightbox` for zoom, restyled: black scrim, × top-right inside `--safe-top`)
- Modify: `app.js:L1533-L1541` (`openMemoryLightbox` → used only for photo zoom: show the image only, hide caption), add `openMemoryDetail(mem)`; `app.js:L1085` (`closeLightboxBtn` listener in `initEvents`): also close the lightbox on a tap on the dialog element itself (backdrop).
- Modify: every caller that opens a memory (`renderTimeline` clicks, `renderOnThisDay`, `place__memory` in `renderPlaces`) → `openMemoryDetail(mem)`
- Modify: `app.js:L3713-L3724` (`formatLocationBadge`, PR-11): output `<a class="map-link" …>Mở bản đồ</a>` (or `""` when there is no safe URL) for the detail sheet; drop the `locket-loc-badge`/`locket-loc-link` classes and the 📍/↗ emoji. The plain place name comes from `locationLabel()` (Task 13). Keep the escaping and `safeUrl` checks so the existing `formatLocationBadge` tests in `tests/unit/app/test_journey_app.js` still pass; update their expectations only where they assert on the label text (they assert on `<a `, `href`, and escaping — these stay).

**Interfaces**
- Detail markup: grabber; edge-to-edge photo `<button type="button" class="detail__photo" aria-label="Phóng to ảnh"><img alt="<title>"></button>` (absent for text memories); `h2#memory-detail-title.t-title`; meta `p.t-meta.muted` "25/10/2026 · 17:09 · <locationLabel>" + the `formatLocationBadge` output ("Mở bản đồ" link, styled `.btn--text`) when it is not empty; story `p` Be Vietnam 16 (when the story's first line is wrapped in quotes, that line renders with `.hand`); sticky `.sheet__actions` (couple only): `.btn--secondary` "Sửa" and `.icon-btn` more → action menu with "Chia sẻ" and "Xóa" (danger).
- `openMemoryDetail(mem: Memory) -> void`: fills and `showModal()`s the sheet; stores `this.detailMemoryId`.
- Photo tap → `openMemoryLightbox(mem)` (stacked on top). The lightbox is in the overlay stack because Task 10's `bindSheets` registers every dialog except who-am-i (PR-03), so Back closes the lightbox first, then the detail sheet.
- "Sửa" → close detail, `openMemoryDialog({ edit: mem })` (Task 23). "Xóa" → `deleteMemory(id)` (Task 24). "Chia sẻ" → `shareMemory(mem)` (Task 24).

**Steps**
- [x] Add static test `"detail: memories open the detail sheet, not the lightbox"`: `renderTimeline` and `renderOnThisDay` source (slice of `app.js` between their method names) contain `openMemoryDetail` and not `openMemoryLightbox`; `app.js` contains no `locket-` string.
- [x] Run → fail. Implement (temporarily wire "Sửa"/"Xóa"/"Chia sẻ" to existing behaviour or a `showToast` placeholder that Tasks 23–24 replace in the same phase). Run → pass.
- [x] BC: tap the first memory → `#memory-detail-modal` open; tap its photo → `#photo-lightbox` open; `history.back()` → lightbox closed, detail still open; `history.back()` → detail closed.

### Task 23: Add / edit moment sheet (covers §4.3, decision "edit keeps the photo")
**Files**
- Modify: `index.html:L266-L356` (`#memory-modal`)
- Modify: `app.js:L910-L941` (`openMemoryDialog`), `L943-L956` (open/close handlers), `L958-L994` (`memoryForm` submit), `L637-L711` (`initPhotoUpload`), `L712-L723` (`processUploadedFile`), `L724-L766` (`startInAppCamera`, `stopInAppCamera`, `captureInAppPhoto`: delete), `L787` (`autoFetchGpsLocation`: called only from the location chip)
- Modify: `app.js:L284-L302` (`initDOM` photo lookups: drop camera/in-app ones)

**Interfaces**
- Markup order: sheet header (title `#memory-modal-title` "Khoảnh khắc mới" / "Sửa khoảnh khắc", close `.icon-btn`); **Ảnh**: `.photo-drop` 4:5 zone with `button#btn-gallery-trigger.btn--secondary` "Chọn ảnh" (opens `#memory-file-input`, `accept="image/*"`), preview `#upload-preview-wrapper` replaces the zone with `button#remove-preview-btn` "Đổi ảnh"; in edit mode the zone shows the existing photo and **no** "Đổi ảnh"/"Chọn ảnh" button, plus a muted line "Ảnh đã lưu không đổi được khi sửa." (only when the memory has a photo); error `p.field-error#memory-photo-error`. **Tiêu đề** label + `#memory-title-input` (`enterkeyhint="next"`, required) + `#memory-title-error`. **Ngày & giờ** label + `#memory-date-input` (`datetime-local`, default now). **Địa điểm** label + `#memory-location-input` + `button.chip#btn-refresh-gps` "Dùng vị trí hiện tại" (locate icon; `aria-busy` while locating). **Câu chuyện** label + `textarea#memory-story-input rows="4" enterkeyhint="done"` auto-growing. Sticky action bar: `button[type=submit].btn--primary.btn--block.btn--lg` "Lưu khoảnh khắc". Delete the "Hủy" button (the header × and swipe close it), the camera button/input and the in-app camera markup.
- `openMemoryDialog(opts?: { prefill?: { title, location, placeId }, edit?: Memory })`: existing callers pass `{ prefill }` (update `openMemoryForPlace`, `app.js:L2698-L2706`); no automatic GPS on open. Stores `this.editingMemoryId` and a snapshot of field values for the dirty check.
- `processUploadedFile(file)`: if `file.size > 10 * 1024 * 1024` → show "Ảnh lớn quá (tối đa 10 MB). Chọn ảnh khác nhé." in `#memory-photo-error` and stop.
- Submit:
  - empty title → "Cần có tiêu đề nhé." in `#memory-title-error`, focus the field, stop.
  - set the submit button `aria-busy="true"` and its label "Đang lưu…".
  - **create**: as today (`id: "mem-" + Date.now()`, `syncState: "pending"`, `queueMemory`).
  - **edit**: find the memory by `editingMemoryId`, update `title`, `date`, `location`, `story` only (keep `image`, `placeId`, `id`), `persistMemories()`, `queueMemory(mem)` (backend upserts by id).
  - then `renderTimeline()`, close, scroll the new/edited `.memory[data-id]` into view and add `.is-highlighted` for 360 ms; create → `celebrate({ reason: "save" })` and toast "Đã lưu khoảnh khắc"; edit → toast "Đã lưu thay đổi". When `apiUrl` is empty keep the existing "only on this device" warning toast, reworded: "Chưa có link đồng bộ trong Cài đặt nên khoảnh khắc chỉ lưu trên máy này."
- Close with unsaved changes (× / swipe / backdrop / Back): if any field differs from the snapshot → `confirmSheet({ title: "Bỏ khoảnh khắc đang viết?", confirmLabel: "Bỏ", cancelLabel: "Viết tiếp", danger: true })`; on "Viết tiếp" keep the sheet open. Use the `dialog.beforeClose = async () => boolean` hook of Task 10's `AppShell.requestClose` (PR-04): `app.js` sets it on `#memory-modal` (and on `#place-modal` in Task 25); it returns `true` when nothing changed or the user picked "Bỏ". The header × (`#close-memory-modal-btn`, listener at `app.js:L949-L952`) must call `window.appShell.requestClose(this.memoryModal)` instead of `this.memoryModal.close()`, so every close path (×, swipe, backdrop, Esc, Back) goes through the hook. After a successful save the code closes the dialog with `dialog.close()` directly (no prompt).

**Steps**
- [x] Add static test `"add moment: labels above fields, no in-app camera, 10 MB guard"`: `index.html` `#memory-modal` block has `<label for="memory-title-input"` and no `btn-camera-trigger` / `inapp-camera`; `app.js` contains `10 * 1024 * 1024` and no `startInAppCamera`.
- [x] Run → fail. Implement. Run → pass. The existing `BUG-10` behaviour (camera stops on close) no longer applies; remove any test that references `stopInAppCamera` if present (`grep -rn stopInAppCamera tests` → today: none).
- [x] LG with pattern `\.photo-select-box|\.photo-action-buttons-grid|\.photo-source-card|\.source-card-|\.inapp-camera|\.camera-controls-bar|\.btn-shutter-capture|\.btn-close-camera-view|\.upload-preview-wrapper|\.remove-preview-btn|\.btn-circular-reset|\.label-with-action|\.modal-actions|\.modal-header|\.modal-close-btn|\.modal-card|\.custom-modal|modalPop|sheetUp` → only rules still needed by sheets not yet migrated may remain; list them in §Deviations (all must be gone by Task 27).
- [x] BC (couple, `apiUrl` empty): FAB → fill title, Lưu → sheet closed, first `.memory` title equals the typed title and has `.is-highlighted`. Open detail → Sửa → change title → Lưu → same `data-id`, new title. Open FAB, type a title, press Escape → confirm sheet open. Veto path (PR-04): open FAB, type a title, `history.back()` → confirm sheet open; click "Viết tiếp" → `#memory-modal` still open; wait 300 ms, `history.back()` again → the confirm sheet opens again (the sheet is still in the overlay stack) and `location.hash` is unchanged; click "Bỏ" → `#memory-modal` closed and the current tab is unchanged.

### Task 24: Long-press menu, share, delete with undo (covers §4.1 long-press, §4.2 delete, §6 undo toast)
**Files**
- Create: `src/services/undo_queue.js`, `tests/unit/services/test_undo_queue.js` (+ `index.html`, `sw.js`, `run_tests.js`)
- Modify: `app.js:L1495-L1530` (`renderTimeline` delete block) → new method `deleteMemory(id)`
- Modify: `src/ui/app_shell.js` (long-press binding on `#timeline-list-container`)
- Modify: `app.js:L126-L181` (constructor: `this.undo = new UndoQueue({ setTimeout, clearTimeout })`; `pagehide` and `visibilitychange` (hidden) → `this.undo.flushAll()`)

**Interfaces**
- `class UndoQueue { constructor({ setTimeout, clearTimeout }); schedule(key: string, commit: () => void, ms = 5000): void; cancel(key: string): boolean; flushAll(): void; has(key): boolean }` — `schedule` on an existing key commits the old one first; `cancel` returns `true` when it stopped a pending commit; `flushAll` commits everything now.
- `this.pendingDeleteIds = { memory: new Set(), place: new Set() }` (constructor). `mergeMemories` (`app.js:L3385-L3396`) passes `tombstones: this.deletedMemoryIds.concat(Array.from(this.pendingDeleteIds.memory))`, so a pull during the undo window cannot bring the memory back (PR-08). Task 25 does the same in `mergePlaces` (`app.js:L3412-L3424`, `tombstones: this.deletedPlaceIds…`).
- `deleteMemory(id)` (PR-08 timing made explicit):
  1. auth check → `confirmSheet` (§4.2 copy); stop on "Giữ lại".
  2. Keep the removed object; `this.pendingDeleteIds.memory.add(id)`; remove it from `this.memories`; **`persistMemories()` now** (a reload during the window does not show it); re-render.
  3. Toast "Đã xóa" with action "Hoàn tác" (5 s); `this.undo.schedule("memory:" + id, commit)`.
  4. `commit`: `this.pendingDeleteIds.memory.delete(id)`; filter `this.memories` again by id (in case a merge re-added it) and `persistMemories()` if it changed; push the id to `deletedMemoryIds` and save; `sendToBackend({ type: "delete_memory", id })`.
  5. "Hoàn tác": `if (this.undo.cancel("memory:" + id))` → `pendingDeleteIds.memory.delete(id)`; re-insert the kept object **only if** no memory with that id is in `this.memories`; sort, `persistMemories()`, re-render.
  - Nothing reaches the backend before `commit`. `pagehide`/hidden `visibilitychange` runs `flushAll()`, so closing the app commits. If iOS kills the app without either event, the memory is gone locally but still on the server, and the next pull brings it back: the failure mode is "delete not applied", never data loss.
- Long-press (couple only): `pointerdown` on `.memory__open`/`.tile` starts a 500 ms timer; cancelled by `pointerup`, `pointercancel`, or moving > 10 px; on fire → `navigator.vibrate?.(10)` (respect the chat vibrate setting) → `actionMenu.open({ anchor: block, items: [Sửa, Xóa (danger), Chia sẻ] })`, and the following `click` is suppressed. `contextmenu` on these elements is prevented (iOS callout) with `-webkit-touch-callout: none` in CSS.
- `shareMemory(mem)`: text = `${title}\n${formatDateVi(date)}${location ? " · " + locationLabel(location) : ""}${story ? "\n\n" + story : ""}`; if `navigator.share` → `navigator.share({ title, text })` (ignore `AbortError`); else `navigator.clipboard.writeText(text)` → toast "Đã sao chép". (The spec's "Đã sao chép liên kết" assumes a per-memory link, which does not exist; see Assumptions.)

**Steps**
- [x] `UndoQueue` tests with a fake timer: commit after 5000 ms; `cancel` prevents commit; re-schedule same key commits the previous one; `flushAll` commits pending ones once and not again later.
- [x] Run → fail. Implement. Run → pass.
- [x] BC (couple, `apiUrl` empty): delete a memory → confirm → it disappears and the toast shows "Hoàn tác"; click it → memory back; delete again, wait 5.5 s → `journeyApp.deletedMemoryIds.includes(id)` → `true`. Undo-window merge: delete a memory, then within 5 s call `journeyApp.mergeMemories([{ ...keptCopy }], [])` → the memory is still not rendered; click "Hoàn tác" → exactly one `.memory[data-id="<id>"]`. Long-press simulation: dispatch `pointerdown` on a `.memory__open`, wait 600 ms → `#action-menu` not hidden.

**Done when:** delete is reversible for 5 s and never lost on app close.

---

## Phase G6 — New behaviours: Places, period history, sync feedback

### Task 25: Mark visited, place edit, place delete with undo (covers §4.4 mark visited / visited rows / ⋯, decision "use updatedAt for the visited date")
**Files**
- Modify: `index.html` (new `<dialog id="mark-visited-modal" class="sheet sheet--confirm custom-modal" aria-labelledby="mark-visited-title">`), `index.html:L358-L403` (`#place-modal`: sheet markup, title "Thêm địa điểm" / "Sửa địa điểm", primary "Lưu", no "Hủy", no emoji)
- Modify: `app.js:L2673-L2696` (`togglePlaceVisited` → `markPlaceVisited(id, { thenAddMemory })` and `unmarkPlaceVisited(id)`), `L2708-L2731` (`deletePlace` → undo flow), `L1708-L1815` (`placeForm` submit: edit mode), `openPlaceDialog` (Task 8: handle `prefill.place`), `L2651-L2671` (`highlightPlaceInList`: new selectors `.place[data-id]`, segmented state, `.is-highlighted` 360 ms)
- Modify: `app.js:L2733-L2866` (`renderPlaces` row actions), `app.js:L3412-L3424` (`mergePlaces`: pending-delete tombstones)
- Modify: `app.js:L1667-L1677` (`initPlaces` step 4, place-modal close handlers): the × calls `window.appShell.requestClose(this.placeModal)` so the `beforeClose` guard runs.

**Interfaces**
- Mark-visited sheet (`.sheet__card` inside, Task 10 contract): title "Đánh dấu đã đến?", the place name as body, primary "Đã đến", secondary "Đã đến và lưu khoảnh khắc". No date field (decision: the backend has no visited-date column).
- `markPlaceVisited(id, { thenAddMemory: boolean })`: set `visited = true`, `updatedAt = Date.now()` (local only, never put in the payload — `sendPlaceToBackend` already sends an explicit field list), save, `sendPlaceToBackend`, `highlightPlaceInList(id, "visited")`, toast "Đã chuyển sang Đã đến"; with `thenAddMemory` → `openMemoryForPlace(place)`.
- `unmarkPlaceVisited(id)`: `visited = false`, same save/send, toast "Đã chuyển về Muốn đi".
- `.place__more` menu items: unvisited rows → "Sửa", "Xóa" (danger); visited rows → "Sửa", "Chuyển về Muốn đi", "Xóa" (danger).
- "Sửa" → `openPlaceDialog({ place })`: fills name, map link, TikTok, notes; submit updates the same object (same `id`, keep `visited`, `createdAt`, recompute coordinates only when the map field changed) and calls `sendPlaceToBackend`. Unsaved-changes guard as in Task 23 (`beforeClose`), copy "Bỏ thay đổi?" / "Bỏ" / "Sửa tiếp".
- `deletePlace(id)`: same five steps as `deleteMemory` in Task 24, with `this.places`, `pendingDeleteIds.place`, `saveData("journey_places_v2", this.places)` as the immediate persist, key `"place:" + id`, and commit = filter again + `deletedPlaceIds` + save + `sendToBackend({ type: "delete_place", id })`. `mergePlaces` gets the pending-delete tombstones (see Task 24).
- Visited date text in the row: `"Đã đến · " + formatDateVi(new Date(place.updatedAt))` when `place.updatedAt` is a valid number; otherwise just "Đã đến".

**Steps**
- [x] Add template test: visited row with `updatedAt` renders "Đã đến · " and a date; visited row without it renders "Đã đến" only.
- [x] Add static test `"places: no visited-date field is sent to the backend"`: the `sendPlaceToBackend` body (slice of `app.js`) does not contain `updatedAt` or `visitedAt`.
- [x] Run → fail. Implement. Run → pass.
- [x] BC (couple, `apiUrl` empty): "Đã đi" on the first unvisited row → sheet → "Đã đến" → segmented shows Đã đến, the row has a ✓ and "Đã đến · <today>". ⋯ → "Chuyển về Muốn đi" → back in Muốn đi. ⋯ → Sửa → change notes → Lưu → row shows the new notes. Delete → Hoàn tác → row back.

### Task 26: Period history actions, sync error toast, offline banner (covers §4.6 history ⋯, §4.1 Offline/Sync error states, §6 offline write)
**Files**
- Modify: `app.js` (`renderBePage` history rows from Task 19: bind ⋯ menu)
- Modify: `app.js:L1262-L1274` (`recordPeriodStart`): end with `this.commitPeriodChange(history)` instead of its own `startDate`/`updatedAt`/`saveData`/`queuePeriod` lines (PR-05).
- Test: `tests/unit/app/test_journey_app.js` (`commitPeriodChange`)
- Modify: `src/services/sync_engine.js:L89-L95` (`scheduleRetry`): call `this.onRetry(entry)` after rescheduling; constructor accepts `onRetry`.
- Modify: `app.js:L3061-L3079` (`initSync`: pass `onRetry`), `app.js:L3099-L3107` (`bindSyncTriggers`: `online`/`offline` banner)
- Modify: `index.html` (add `<div class="offline-banner" id="offline-banner" role="status" hidden>` right after the header)
- Test: `tests/unit/services/test_sync_engine.js`

**Interfaces**
- **`JourneyApp.commitPeriodChange(history: string[]) -> void`** (PR-05) — the only way the period record changes: `this.period.history = normalizeHistory(history)`; `this.period.startDate = history[history.length - 1] || ""` (latest start); `this.period.updatedAt = Date.now()`; `this.saveData("journey_period_v1", this.period)`; `this.queuePeriod()`. Bumping `updatedAt` is what lets the partner's phone accept the change (`mergePeriod`, `app.js:L3451-L3458`, ignores a server record whose `updatedAt` is not newer). `recordPeriodStart` keeps its prediction-log and `cycleLength`/`durationDays` updates, then calls `commitPeriodChange(addPeriodStart(…))`.
- History ⋯ menu (couple): "Sửa" → reuse `#period-modal` with title "Sửa ngày bắt đầu", start date prefilled; save → `commitPeriodChange(replacePeriodStart(this.period.history, old, new))` → `renderBePage()` → toast "Đã lưu"; "Xóa" (danger) → `confirmSheet({ title: "Xóa lần ghi này?", body: "Dự đoán kỳ tới sẽ được tính lại.", confirmLabel: "Xóa", cancelLabel: "Giữ lại", danger: true })` → `commitPeriodChange(removePeriodStart(this.period.history, date))` → `renderBePage()` → toast "Đã xóa". (No undo: the period record is a single last-writer-wins row; see Assumptions.) Deleting the only entry is not offered (the item is hidden when `history.length === 1`).
- `SyncEngine` deps gain `onRetry?: (entry) => void`, called once per failed attempt after the retry is scheduled.
- `app.js` `onRetry`: when `this.config.apiUrl` is set (PR-09: with no link, `postToBackend` always rejects and the "chỉ lưu trên máy này" toast already explains it) and `entry.attempts === 1` and no sync toast was shown in the last 60 s and `navigator.onLine` → toast "Chưa đồng bộ được. Sẽ thử lại tự động." with action "Thử ngay" → `this.syncEngine.retryNow(entry.key)`. Also call `renderChatMessages()` when `entry.key` starts with `chat:` (shows the failed state).
- Offline banner: `offline` event (and `!navigator.onLine` at start) → show "Đang ngoại tuyến · Vẫn xem và thêm được, sẽ đồng bộ khi có mạng." with a close `.icon-btn` (`aria-label="Đóng"`); close hides it until the next `offline` event; `online` hides it.
- Pending items keep showing "Chưa đồng bộ" (Task 13 template) until `handleWriteConfirmed` clears `syncState`; the badge fades out (`transition: opacity var(--m-base)`) — implemented by re-render, no extra code needed beyond CSS on `.status--warn`.

**Steps**
- [x] Add `test_sync_engine` case: a failing `send` triggers `onRetry` once with `attempts === 1`.
- [x] Add `test_journey_app.js` cases (prototype instance with stubbed `saveData`/`queuePeriod` recorders and `normalizeHistory` from `period_history.js` passed into the `new Function` wrapper like the existing globals): `"commitPeriodChange bumps updatedAt, sets startDate to the latest start, saves and queues"` for an edit (`replacePeriodStart`) and for a delete (`removePeriodStart`); `updatedAt` strictly greater than before, `saveData` called with `"journey_period_v1"`, `queuePeriod` called once.
- [x] Run → fail. Implement. Run → pass.
- [x] BC: `dispatchEvent(new Event('offline'))` → `#offline-banner` visible; close it → hidden; `dispatchEvent(new Event('online'))` → still hidden. Couple + Bé: note `const before = journeyApp.period.updatedAt`; history row ⋯ → Xóa → confirm → row removed and `journeyApp.period.updatedAt > before`; ⋯ → Sửa → change the date → Lưu → `journeyApp.period.startDate` equals the latest history entry. With `apiUrl` empty, create a memory → no "Chưa đồng bộ được" toast appears within 3 s.

**Done when:** every write gives feedback, and history entries can be corrected.

---

## Phase G7 — Cleanup and acceptance

### Task 27: Delete the legacy stylesheets; bump the version (covers §5 "Delete per-feature button styles", spec §2 migration end)
**Files**
- Delete: `styles.css`, `src/styles/app_shell.css`, `src/styles/redesign.css`
- Modify: `index.html:L27-L29` (remove the three `<link>`s), `sw.js` (`SHELL_FILES`), `src/styles/tokens.css` (delete the legacy alias block from Task 1)
- Modify: `index.html` / `app.js` / `src/ui/*.js`: remove the class `custom-modal` and other legacy class names still present only for old CSS (`grep -nE "custom-modal|modal-card|modal-form|form-group|form-row|btn-primary|btn-outline|btn-secondary|btn-sm|btn-text-link" index.html app.js src/ui/*.js`), replacing them with the new classes (`sheet__body`, `field`, `btn btn--primary` …). `sheet` and `sheet__card` stay (Task 10 contract); `bindSheets` already selects on them, so only selectors that still mention `custom-modal`/`modal-card` change.
- Modify: `tests/unit/ui/test_static_assets.js` — every test that reads a legacy file or a legacy class (PR-02; lines as of `0420acc`):
  - `UI-10` (L91–95) and `UI-08` (L97–108): iterate over `NEW_CSS` instead of the three legacy files.
  - `backdrop-filter` (L86–89, rewritten in Task 7) and `UI-09` infinite (L115–119, rewritten in Task 14): already on `NEW_CSS`; now that the legacy files are gone, no change except removing the `try/catch` skip from `NEW_CSS` (every listed file must exist).
  - `D-02` (L125–128): `sheet-close-btn` absent from `src/ui/app_shell.js` and from `src/styles/components.css` (instead of `redesign.css`).
  - `D-03` (L149–153): already moved to `components.css` / `.sheet__grabber` in Task 10; no change.
  - `D-04` (L139–143): first assertion already moved to `chat.css` in Task 18; the second becomes `/\.field (input|textarea|select)[^{]*\{[^}]*font-size:\s*16px/` on `components.css` (the rule must cover `input`, `textarea` and `select` inside `.field`).
  - `D-07/D-09` (L159–164): keep the two `tokens.css` regexes; change the order check to `indexHtml.indexOf("src/styles/tokens.css") < indexHtml.indexOf('href="src/styles/base.css')` (the `styles.css` link no longer exists, so the old `indexOf` would be −1).
- Run: `scripts/bump_version.sh 6.0`

**Steps**
- [x] Before deleting, list every selector still in the three files: `grep -hoE "^\s*[.#][a-zA-Z][a-zA-Z0-9_-]*" styles.css src/styles/app_shell.css src/styles/redesign.css | sort -u`, and for each one `grep -c` it in `index.html`, `app.js`, `src/ui/*.js`. Any selector still used must already have a rule in a new stylesheet; if not, port it (tokens only) and log it in §Deviations.
- [x] Delete the files and links, remove the aliases, update tests and selectors.
- [x] Add static test `"no legacy token names remain"`: none of `--pink-`, `--bg-`, `--text-main`, `--text-muted`, `--text-soft`, `--shadow-card`, `--font-handwriting` appears in any stylesheet, `index.html` or `app.js` (inline `style="…var(--text-muted)…"` in `index.html` must be gone too).
- [x] `scripts/bump_version.sh 6.0` → "Version set to 6.0".
- [x] Run `scripts/test.sh` → all pass (the "one cache version everywhere" and precache tests confirm the new file set). Also `grep -n 'styles.css\|app_shell.css\|redesign.css' tests/unit/ui/test_static_assets.js` → only `src/ui/app_shell.js` reads remain (no stylesheet with those names).
- [x] BC: screenshot every tab and sheet in light and dark at 375 px; compare with the earlier phase screenshots — no unstyled element.

**Done when:** only the new stylesheets ship and the app looks the same as at the end of G6.

### Task 28: Acceptance checks (covers spec §8 checks 1–10, §7)
**Files**
- Modify: `tests/unit/ui/test_static_assets.js`
- Create: `docs/reports/2026-11-14-album-kem-iphone-checklist.md`

**Interfaces**
- Static tests:
  - `"acceptance 6: no emoji inside any <button>"`: for every `<button …>…</button>` in `index.html`, and every `<button` … `</button>` literal in `app.js` and `src/ui/templates.js`, the inner text has no `\p{Extended_Pictographic}` match. (Use `/\p{Extended_Pictographic}/u`; if `jsc` lacks Unicode property escapes, fall back to the range `/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u`.)
  - `"acceptance: every icon-only button has an aria-label"`: every `<button` in `index.html` whose content is only an `<svg>` has `aria-label`.
  - `"acceptance: sentence case, no all-caps labels"`: `index.html` contains neither `CHÚNG MÌNH ĐÃ Ở BÊN NHAU ĐƯỢC` nor `text-transform: uppercase` in any stylesheet.
  - `"acceptance 9: dark tokens cover every §2.1 role"`: each `--c-*` name in the light block also appears in the dark block.
- Browser acceptance script (run with `javascript_tool`, record results in the report):
  1. For widths 320, 375, 414 (`resize_window {width, height: 812}`), in guest and couple mode, for each of `moments`, `places`, `places/visited`, `be`, chat open, and each sheet opened in turn (`memory-modal`, `memory-detail-modal`, `place-modal`, `mark-visited-modal`, `settings-modal`, `auth-modal`, `notes-modal`, `period-modal`, `confirm-sheet`): NHS → `true`.
  2. 375 × 812: hero height ≤ 300; first `.memory` top < 812; chat `#close-chat-btn` / `#chat-more-btn` inside the viewport.
  3. Pink check as in Task 14.
  4. Failed photos as in Task 15.
  5. One open dialog after unlock as in Task 9.
  6. Covered by the static test above (emoji in buttons).
  7. `performance.getEntriesByType('resource').filter(r => r.name.includes('fonts.gstatic.com'))` — family names in the CSS response cover only the three families (inspect the stylesheet request with `read_network_requests`).
  8. Reduced motion: if the pane cannot emulate `prefers-reduced-motion`, mark as "static only" (Task 16 test) in the report.
  9. Dark: `applyTheme("dark")`, screenshot every tab; theme-color metas as in Task 3.
- Manual iPhone checklist (`docs/reports/…-iphone-checklist.md`): safe areas (header, tab bar, sheet action bar, lightbox ×), keyboard does not cover the chat input or any sheet action bar, no focus zoom on any field, swipe-down closes sheets, back-swipe closes the top overlay first, Drive thumbnails load on the couple's phones (spec §9 open item), Be Vietnam Pro diacritics, Dynamic Type at 130 %, scroll smoothness of a long Moments feed with the blurred header and tab bar (PR-14: Phase D had removed that blur for performance; if it stutters, apply the Task 7 fallback). Each line has "Result: ☐ pass ☐ fail · notes" for the user to fill.

**Steps**
- [x] Add the static tests. Run → fix any failures in markup/templates. Run → all pass.
- [x] Run the browser acceptance script; write the results (executed vs not executed) into the report.
- [x] Write the manual checklist into the same report under "Not executed — needs a real iPhone".

**Done when:** all static tests pass, every browser check is recorded as passed or explained, and the manual checklist is ready for the user.

## Final verification
- `scripts/test.sh` → all pass; count = 112 baseline − removed legacy tests (UI-03, D-01) + every new test listed above (expect roughly 165; the exact number is recorded by the coder).
- `grep -rnE "Outfit|#ff758f|#1f1418|spawnHeart|legacy-nav-menu|locket-" index.html app.js src sw.js` → no output.
- `ls styles.css src/styles/app_shell.css src/styles/redesign.css 2>&1` → "No such file or directory" for all three.
- Browser acceptance script of Task 28 → all recorded checks pass.

## Spec coverage

| Spec item | Task(s) |
|---|---|
| E-01 pink-on-pink | 1, 4, 14 |
| E-02 photo fallback | 13, 15 |
| E-03 chat close clipped | 18 |
| E-04 orphan "+" on Places | 8, 17 |
| E-05 place card crowding | 17 |
| E-06 two dialogs on unlock | 9 |
| E-07 boxes inside boxes | 14, 15, 17 |
| E-08 emoji icons, TikTok pill | 5, 7, 14, 17, 18, 28 |
| E-09 crowded Moments toolbar | 8, 15 |
| §2.1 colour, §2.3 tokens | 1, 4 |
| §2.2 typography | 2, 4 |
| §2.1 theme-color | 3 |
| §3.1 grid, breakpoints, safe areas | 1 (`--gutter`), 4, 7, 10 |
| §3.2 header, tab bar, FAB | 7, 8 |
| §3.3 IA and URL state | 6, 8, 19 |
| §4.1 Moments | 11–16, 24 |
| §4.2 detail + lightbox | 22, 24 |
| §4.3 add/edit | 23 |
| §4.4 Places | 17, 25 |
| §4.5 Chat + notes | 18, 26 |
| §4.6 Bé | 19, 26 |
| §4.7 unlock, identity, queue | 9, 21 |
| §4.8 Settings | 20 |
| §5 components | 4, 5, 10, 13, 16, 19 |
| §6 feedback, labels, copy, formats | 10, 12, 23–26 |
| §7 accessibility | 4, 10, 13, 18, 19, 21, 28 |
| §8 checks 1–10 | 28 (plus the per-task BCs) |

## Assumptions
- **Visited date** comes from the place's `updatedAt` (server value, or set locally on change). Any later edit of the place moves that date. Accepted by the user as the no-backend-change trade-off (Decision log).
- **Editing a memory keeps its photo** (`handleMemory_` in `google-apps-script.js` L183 keeps the stored image). The edit sheet hides "Đổi ảnh".
- **Per-period length** is not stored (the backend keeps one `durationDays` and a list of start dates), so history rows show the start date and cycle length only, and "Số ngày (tùy chọn)" updates the shared `durationDays`. Same trade-off as above.
- **Period history delete has no undo**: the period record is one last-writer-wins row; a confirm sheet protects it instead.
- **Timed notes "Gửi cho"** is display-only (the partner's name): the backend stores only the sender.
- **Share** sends text (title, date, place, story) through `navigator.share`, or copies it with the toast "Đã sao chép". There is no per-memory URL to share.
- **"Loading older messages"** (§4.5) is not built: the client already receives the full message list (`?since=` delta sync, no paging), so there is nothing older to pull.
- **Desktop in-app webcam capture is removed**: the spec's single "Chọn ảnh" uses the iOS picker, which already offers the camera. Desktop users can still pick a file.
- **Date and time** stay one native `datetime-local` field labelled "Ngày & giờ" (the iOS picker is native either way).
- **Location is no longer auto-detected** when the add sheet opens; the "Dùng vị trí hiện tại" chip does it (spec §4.3).
- **Day counter**: the big number is calendar days (`daysTogether`), so it changes at midnight and matches the milestone line; the h/m/s line is the time elapsed since the start time-of-day (mod 24 h). Near midnight the two can look "off by one" against a strict 24 h count; this follows spec §4.1 ("the day number only changes at midnight").
- **Skeletons** show only on a first load with untouched sample data and before the first sync finishes (`firstSyncDone`); afterwards local data renders at once.
- **Theme default stays "Sáng"** (existing behaviour and test); "Tự động" and "Tối" are opt-in.
- **Footer**: the closing sentence stays as muted text at the end of the page; the 💕 block goes.
- **Reduced motion** may not be emulatable in the built-in browser; then it is covered by static checks and marked "static only".

## Out of scope / out-of-scope observations
- Backend, data model and sync protocol (spec §9).
- New imagery, illustrations, or a desktop layout beyond the centred column (spec §9).
- Observation: `checkPeriodAlert` (`app.js:L1349-L1363`) re-assigns `onclick` handlers on every call; Task 19 rewrites it, but a reviewer should confirm no duplicate listeners are added with `addEventListener`.
- Observation: `applyApiUrlParam` (`app.js:L488`) still uses `window.confirm` by design (runs before the UI is ready).

## Decision log
- Q: Scope — visual only, or visual + new behaviours? → A: Both, in phases (visual first, behaviours after). (user, 2026-11-14)
- Q: Backend keeps the old memory image and has no visited-date column — change the backend or reduce the UI? → A: Keep the backend; edit keeps the photo; visited date uses `updatedAt`. (user, 2026-11-14) The same rule is applied to per-period length and timed-note recipient (planner, derived).
- Q: Settings — keep "Link tự mở khóa" and "Đặt lại mặc định"? → A: Keep the link (in "Kết nối"), drop reset. (user, 2026-11-14)
- Q: Feed — keep the 6-item limit with "Xem thêm"? → A: Show all memories (content-visibility + lazy images). (user, 2026-11-14)
- CSS migration: new stylesheets with new class names loaded after the legacy layers, legacy rules deleted per task (verified by grep), legacy files deleted in Task 27. Chosen over a fifth override layer (more cascade debt) and over deleting the legacy files first (breaks every screen until the end). (planner)
- Plan saved under `docs/plans/` per the planner workflow; the spec stays at `Design/2026-11-14-design-album-kem.md`. (planner)

**Revision 1 — fixes for `docs/reports/2026-11-14-review-album-kem-redesign.md` (planner, 2026-11-14)**
- PR-01 (Major): (a) `backdrop-filter` test counts only unprefixed, non-`none` declarations in `NEW_CSS`, limit 2 (Conventions, Task 7). (b) The "no `window.confirm`" test moved from Task 10 to Task 20, where the reset `confirm()` is deleted. (c) The `infinite` test counts `NEW_CSS` only, limit 3 (Task 14). A shared `NEW_CSS` list is defined in Task 4.
- PR-02 (Major): Task 27 now lists every legacy-reading test with its new assertion: UI-10, UI-08, D-02, D-04 (`.field` regex), D-07/D-09 (order check against `base.css`); D-03 moves earlier, to Task 10, because the handle class changes there.
- PR-03 (Major): Task 10 defines the sheet contract (`dialog.sheet` + `.sheet__card`), applied to every existing and new sheet; `bindSheets` registers every dialog except who-am-i with the overlay stack, so the lightbox closes on Back (Task 22 relies on it).
- PR-04 (Major): Task 10 adds `AppShell.requestClose()` with the `beforeClose` veto, re-registration after a veto, `OverlayStack.has()`, and deferred `pushState` while a `history.back()` is pending; three overlay-stack tests cover it. Tasks 23 and 25 route the × buttons through `requestClose` and add a Back-veto BC.
- PR-05 (Major): Task 26 adds `commitPeriodChange()` (history, latest `startDate`, `updatedAt = Date.now()`, save, queue), used by `recordPeriodStart`, history edit and delete, with unit tests.
- PR-06: `#be` BC moved to Task 8; Task 8 LG deletes legacy `.app-view` rules; Task 7 updates the chat inert selectors.
- PR-07: Task 1 deletes the `body::before` pink gradients and checks `::before` `backgroundImage`.
- PR-08: Task 24 adds pending-delete tombstones, immediate local persist, re-filter on commit, and insert-only-if-absent on undo; Task 25 reuses it for places.
- PR-09: the sync-error toast is skipped when no backend link is set (Task 26).
- PR-10: `placeRowHtml` runs both URLs through `safeUrl` and escapes everything; test for a `javascript:` link (Task 17).
- PR-11: `formatLocationBadge` emits `map-link` "Mở bản đồ" without `locket-` classes or emoji (Task 22).
- PR-12: exact distance rounding rule and expected values (Task 12).
- PR-13: day number = `daysTogether()` (calendar days); h/m/s = elapsed time mod 24 h (Task 14, Assumptions).
- PR-14: places skeleton rows, chat bubble skeleton (`firstSyncDone` rule), "Gần nhất" pressed state, distance fade-in (Tasks 15, 17, 18); wordmark scroll-to-top (Task 7); arrow keys in segmented controls (Task 10); blur returns on header/tab bar only, with a fallback and an iPhone checklist line (Tasks 7, 28).
- PR-15: who-am-i reads the name from `data-name` (Task 21).
- PR-16: line references refreshed for the tests and `app_shell.js` ranges that the review listed.

## Deviations (filled by coder)
- Task 4: `.chip` 44 px hit area uses `::after` (not `::before`), because `::before` carries the busy spinner. `.journey-toast` centres with the `translate` property so the global reduced-motion `transform: none` does not break it.
- Task 6: the round-trip test is a separate test (4 new tests, not 3).
- Task 7: `#period-chip` click binds directly to `switchView("be")` in Task 7 (not Task 14) because its `data-proxy` was removed. The old period modal (`openModal`) has no trigger until Task 19 replaces it with the Bé page.
- Task 8: `renderBePage()` is an intentional empty stub until Task 19 (plan allows it).
- Task 9: both queued `show()` callbacks also return `null` when the user has locked to guest mode meanwhile.
- Task 10: PR-20 applied (`console.error` and skip a sheet without `.sheet__card`). PR-17 applied: the segmented-arrow BC is run in Task 15. Legacy sheet rules (`.custom-modal:not(.photo-lightbox-modal) …`, `.sheet-handle`, `.custom-modal .modal-actions`) were deleted in this task because the new `dialog.sheet` rules replace them.
- Task 15: memories have no author field, so `memoryBlockHtml` is called without `senderInitial` (no avatar on cards). `confirmDeleteMemory(memId)` was extracted (same copy as Task 10) so Tasks 22/24 can reuse it; until Task 22 no UI triggers it. The LG pruned `.pill-tag`, `.section-title`, `.section-header` and `.sync-pending-badge` as the plan lists, so the Places screen is unstyled in those spots until Task 17, and `formatLocationBadge` output (`locket-loc-badge`) is unstyled until Task 22. BC photo-failure count: only on-screen photos load (`loading=lazy` + `content-visibility`), so 5 of 11 turned into text cards in the check, 0 placeholders.
- Task 16: added `tests/unit/ui/test_petal_canvas.js` (pure `hexToRgb` helper, as the plan suggests) and registered it. Test D-10 now reads `petal_canvas.js` because the canvas code moved there. Reduced-motion paths are covered by the static test only (the preview tools cannot emulate `prefers-reduced-motion`). `.floating-click-heart` CSS was deleted with its JS.
- Task 17: `COMPACT_WIDTH_PX` is 400 (plan: 360), because at 375 px a one-line action row needs the TikTok and "Đã đi" buttons icon-only; with 400 the BC (all actions on one line at 375 px) passes. The two GPS result dialogs were reduced to title, one sentence and the actions (the old icon, status tag and place card were removed together with their ids). The "Sửa" menu item is not added (Task 25 adds it). Adding a place still calls the existing sort flow; only the "Gần nhất" chip state (`placesSortedByDistance`) was added. The BC "reload at 320 px NHS" was not run separately (375 px NHS = true).
- Tasks 18–26: `retryNow`, `chat_layout`, `cycle_ring`, `undo_queue` and templates were added as planned. Task 18 stores the chat vibration switch via `saveData` (JSON-encoded `"off"`); Task 20 stores `kimthu_petals` the same way (`"on"`/`"off"` as JSON strings) and calls `petals.update()` instead of `start()`/`stop()` (start would add the listeners twice). Task 19 history rows get their ⋯ menu in Task 26 (not earlier). Task 22 interim wiring was replaced in Tasks 23–24 (no placeholders remain). Task 23: `.field` (PR-19) was added to `components.css` and every `.form-group` in `index.html` became `.field`. Task 26: `commitPeriodChange` makes `updatedAt = max(now, old + 1)` so it is always strictly greater. The offline banner is bound in the constructor (not in `bindSyncTriggers`) so it does not wait for the sync start-up.
- PR-17…PR-22 (second review) applied: segmented-arrow BC ran in Task 15 (PR-17); photos use the `.skeleton` class (PR-18); `.field` exists (PR-19); `bindSheets` logs and skips a sheet without `.sheet__card` (PR-20); the pending-delete tombstone for a killed app was NOT added (PR-21: the note's gap is accepted, delete reaches the server only at the end of the 5 s window or on pagehide/hidden); the `Quán` assertion was replaced by `Mở bản đồ` and a `locationLabel` test (PR-22).
- Task 27: the legacy reset, `#petal-canvas`, `.main-content`, view-transition and reduced-motion rules were ported to `base.css` / `shell.css`; the footer got the `page` class. Version set to 6.0.
- Task 28: browser acceptance recorded in `docs/reports/2026-11-14-album-kem-iphone-checklist.md`; reduced motion is "static only".
- Browser checks: the service worker / HTTP cache serves stale files; checks are run on `http://127.0.0.1:8765` after unregistering the worker and `fetch(url, {cache:'reload'})` on each asset.
