# Plan: "Polaroid mềm" card boxes for Moments and Places

- **Status:** APPROVED
- **Revision:** 3 — addresses `docs/reports/2026-11-19-review-card-boxes.md` (PR-01 … PR-05) and `docs/reports/2026-11-19-review-card-boxes-2.md` (PR-06); see Decision log.
- **Source:** `docs/advice/2026-11-19-design-card-boxes.md` (called "the spec" below). It amends `docs/advice/2026-11-15-design-keo-bong.md` §4.1 and §4.4 only.
- **Goal:** every moment and every place sits in one white box with a light pink 1.5 px edge and a slightly stronger pink shadow; moment title, meta and a 2-line story sit on white below an inset photo.
- **Approach:**
  - Add two tokens (`--c-card-edge`, `--e-card`) and drop the scrim tokens that lose their last user.
  - Change the moment templates so the words move from an overlay on the photo into a `.memory__body` block below it, with the story back in the feed; rebuild the moment skeleton as a box.
  - Restyle `.memory`, `.memory-skeleton`, `.counter-card`, `.otd-row`, `.place`, the places list gap and the places skeleton; then bump the cache version.
- **Stack:** vanilla JS SPA (`index.html`, `app.js`, `src/ui/*.js`), plain CSS in `src/styles/*.css`, dependency-free test runner (`tests/run_tests.js`, run through `./scripts/test.sh`).
- **Baseline:** `./scripts/test.sh` → `206 passed, 0 failed` (run 2026-11-19 on HEAD `88b301b`; the tree has only untracked docs and `.DS_Store` changes).
- **Global constraints:**
  - no new dependencies, no build step, no `app.js` change (the feed, retry and fallback code select by `.memory`, `.memory__open`, `.memory__retry`, `[data-id]`, `img[data-fallback-src]`, all of which stay)
  - do not edit `--card-border` or `--e-1` (toast, banner, sheets, settings and Bé still use them; spec §2)
  - no new copy; every existing Vietnamese string stays word for word (spec §7)
  - grid tiles (`.tile`), the detail sheet, the lightbox, Bé, settings and sheets are not touched
  - do not commit, do not deploy; never let a write reach the backend during browser checks (BC step 4)
- **Review focus:**
  1. The pending pill and the failed-photo retry button must sit 12 px inside the photo's top-left corner (20 px from the box edge) and never over the text block. The retry button's containing block is `.memory` (which gains 8 px padding); the pill's is `.memory__open` (which does not).
  2. A moment without a story renders no `.memory__quote` and no “ ” marks in any of the three card variants.
  3. `aria-label` on `.memory__open` stays the title only, though the story is now visible inside the button.
  4. Press feedback scales the box, not the button inside it; with reduced motion the global `transform: none !important` (`src/styles/base.css:122-130`) removes the scale and the border turns `--c-primary` instead.
  5. No horizontal scroll at 320 px; the 1.5 px border stays inside the box width.

> Coder: execute tasks in order, tick each checkbox when its Verify passes, log any deviation in §Deviations. Line numbers were checked on 2026-11-19 against HEAD `88b301b`. They shift after edits, so always find the code by the symbol or selector named next to the range.

## Conventions used by every task

- **TEST:** `./scripts/test.sh` → prints `<n> passed, 0 failed`.
- **Static test file:** static checks go into `tests/unit/ui/test_static_assets.js` and reuse `readText`, `appSource`, `NEW_CSS`, `test`, `assertEqual`, `assertTrue`. Extract one CSS rule with `css.match(/<escaped selector>\s*\{[^}]*\}/)` as the existing tests do (e.g. `test_static_assets.js:372`); `\.memory\s*\{` does not match `.memory.is-highlighted, …` or `.memory--text`.
- **Browser check (BC):** same procedure as `docs/plans/2026-11-15-keo-bong-redesign.md` §Conventions, repeated here:
  1. `preview_start {name: "kimthu-static"}` (`.claude/launch.json`, port 8765).
  2. `resize_window {preset: "mobile"}` (375 × 812) unless the step names another size.
  3. Clear the service worker, its caches and the HTTP cache, then reload — before every check and after every edit made during a check:
     `(await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister()); (await caches.keys()).forEach((k) => caches.delete(k)); await Promise.all([...document.querySelectorAll('link[rel=stylesheet][href^="src/"], script[src]')].map((el) => fetch(el.href || el.src, {cache: "reload"})));`
     then reload and confirm `performance.getEntriesByType("navigation")[0].workerStart === 0`.
  4. Client-only couple mode: `journeyApp.config.apiUrl = ""; journeyApp.isAuthenticated = true; journeyApp.applyAuthMode(); journeyApp.renderTimeline()` (with `apiUrl` empty, `shouldShowTimelineSkeleton()` returns `false`, so the feed shows the sample boxes, not skeletons). Never type a passcode; never click "Lưu" in Settings.
  5. Use `journeyApp.switchView("moments" | "places")` instead of tab clicks, and set `img.loading = "eager"` on feed images before measuring (the pane delays lazy images).
  6. `read_console_messages {onlyErrors: true}` → no error from this app.
  7. When done: `resize_window {preset: "desktop"}`.
- **NHS (no horizontal scroll):** `document.documentElement.scrollWidth <= document.documentElement.clientWidth` → `true`.
- **Sample data:** the three default memories (`app.js:66` `DEFAULT_MEMORY_IDS`) have photos and long stories, so they exercise the 2-line story clamp.

## Requirement map

| Input | Covered by |
|---|---|
| B-01 moment cards have no edge; spec §2 tokens | Task 1 (tokens), Task 3 (`.memory`) |
| B-02 words laid over the photo; spec §4.1 anatomy, §6 `.memory__body`, `.memory__overlay` removed | Task 2 (markup), Task 3 (styles) |
| B-03 place edge too soft; spec §4.2, §3 place rows, list gap `--s-4` | Task 4 |
| B-04 story not shown in the feed; user decision "handwriting, max 2 lines" | Task 2 (story in photo and failed cards, clamp-2; text card clamp-3), Task 3 (spacing) |
| Spec §3 counter card and "Ngày này năm xưa" row get the same edge | Task 3 |
| Spec §4.1 States: loading skeleton box | Task 2 (markup), Task 3 (styles) |
| Spec §4.1 pending pill / retry 12 px inside the photo | Task 3 |
| Spec §4.1 Interaction: press `.98`, no inner scale, reduced-motion border, focus ring kept | Task 3 |
| Spec §4.1 `contain-intrinsic-size` 440 → 540 px | Task 3 |
| Spec §4.2 places skeleton gets the edge, no shadow | Task 4 |
| Spec §5 layout at 320 / 375 / 560 px, landscape | Task 3 BC, Task 4 BC, Final verification |
| Spec §6 tests that encode the old design (`test_templates.js:41`) | Task 2 |
| Spec §8 accessibility: aria-label title only, contrast on solid surface, reduced motion | Task 2 (aria-label test), Task 3 (reduced motion), Task 1 (scrim gone, so no text relies on it) |
| Spec §9 Assumption: `--c-photo-scrim` removal is the planner's call | Task 1 (removed, with `--c-on-photo`; see Decision log) |
| Cache version | Task 5 |

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/styles/tokens.css` | Modify | add `--c-card-edge`, `--e-card` (3 blocks); remove `--c-photo-scrim`, `--c-on-photo` (3 blocks) |
| `src/ui/templates.js` | Modify | moment markup: body below the photo, story in the feed, skeleton box |
| `src/styles/moments.css` | Modify | moment box, inset photo, body, press state, skeleton box, counter card, OTD row; remove overlay rules |
| `src/styles/places.css` | Modify | place box edge and shadow, list gap, places skeleton edge |
| `tests/unit/ui/test_templates.js` | Modify | replace the overlay/no-story assertions; add story, aria-label and skeleton tests |
| `tests/unit/ui/test_static_assets.js` | Modify | token, card-box, press-state and places assertions; gradient test without the scrim exception |
| `index.html`, `sw.js` | Modify (script) | cache version 7.0 → 7.1 via `scripts/bump_version.sh` |

## Tasks

### Task 1: Card tokens; drop the scrim tokens (covers B-01, spec §2, §9)

**Files**
- Modify: `src/styles/tokens.css:L3-L57` (light `:root`), `L61-L91` (`:root[data-theme="dark"]`), `L93-L125` (`@media (prefers-color-scheme: dark)` block)
- Test: `tests/unit/ui/test_static_assets.js:L227-L235` (test "components: the photo scrim token is the only gradient"), plus one new test

**Interfaces**
- Produces CSS custom properties: `--c-card-edge`, `--e-card`, consumed by Tasks 3 and 4.

**Steps**
- [x] Add test `"card boxes: edge and shadow tokens in all three theme blocks"` to `test_static_assets.js`. Split `tokens.css` into three strings: light = text before `:root[data-theme="dark"]`; dark = from there to `@media (prefers-color-scheme: dark)`; auto = the rest. Assert:
  - light contains `--c-card-edge: #EFB6C8;` and `--e-card: 0 1px 2px rgba(216, 27, 96, 0.08), 0 8px 20px rgba(216, 27, 96, 0.12);`
  - dark and auto each contain `--c-card-edge: #5A3D4A;` and `--e-card: none;`
  - light still contains `--card-border: transparent;` and `--e-1: 0 1px 2px rgba(216, 27, 96, 0.06), 0 6px 16px rgba(216, 27, 96, 0.08);` (unchanged)
  - the whole file contains neither `--c-photo-scrim` nor `--c-on-photo`.
- [x] Rewrite the gradient test as `"components: no gradients and no pink box-shadows"`: every line of every `NEW_CSS` file matching `/gradient\(/` fails the test (no exception for `tokens.css`); keep the existing `box-shadow:[^;]*rgba\((255|201),` assertion unchanged.
- [x] TEST → expect exactly 2 failed (the new token test and the gradient test).
- [x] In each of the three blocks, add the two tokens next to `--e-1` / `--e-2` with the values above; delete the `--c-photo-scrim` and `--c-on-photo` lines (light `L23-L24`, dark `L81-L82`, auto `L114-L115`).
- [x] `grep -rn "photo-scrim\|on-photo" src index.html app.js` → only `src/styles/moments.css` (`.memory__overlay` rules, removed in Task 3). Until Task 3 the overlay falls back to no background; that is the expected intermediate state.
- [x] TEST → `207 passed, 0 failed`.

**Done when:** both tokens exist in all three blocks with the spec values, no scrim token remains, TEST passes.

### Task 2: Moment markup — words below the photo, story back, skeleton box (covers B-02, B-04, spec §4.1, §6, §8 names)

**Files**
- Modify: `src/ui/templates.js:L48-L50` (`metaRowHtml`, unchanged signature), `L60-L62` (`quoteHtml`), `L64-L70` (`memoryTextCardHtml`), `L72-L79` (`memoryFailedCardHtml`), `L81-L92` (`memoryBlockHtml`), `L135-L137` (`memorySkeletonHtml`)
- Test: `tests/unit/ui/test_templates.js:L8-L16` (test "title and story are escaped; the photo card shows no story"), `L35-L43` (test "photo has size attributes, alt text and the pending state"), plus new tests

**Interfaces**
- Changes (private): `quoteHtml(mem, clampClass)` — `clampClass` is `"clamp-2"` or `"clamp-3"`; returns `""` when `mem.story` is empty, else `<p class="memory__quote hand ${clampClass}">“…”</p>` (story escaped).
- Produces (private): `bodyHtml(mem)` → `'<div class="memory__body">' + titleHtml(mem) + metaRowHtml(mem, " muted") + quoteHtml(mem, "clamp-2") + "</div>"`.
- Public functions keep their names and signatures: `memoryBlockHtml(mem, opts)`, `memoryTextCardHtml(mem)`, `memoryFailedCardHtml(mem)`, `memorySkeletonHtml()`.
- Resulting markup (exact class names Task 3 styles):
  - photo: `<article class="memory memory--photo" data-id>` › `<button class="memory__open" aria-label=title>` › `<div class="memory__photo skeleton"><img …></div>` + `bodyHtml` + optional `<span class="memory__badge status status--warn">` › `</button></article>`
  - failed: `<article class="memory memory--failed">` › open button › `<div class="memory__photo memory__photo--failed">heart</div>` + `bodyHtml` › `</button>` + the unchanged retry `<button class="btn btn--text memory__retry">` › `</article>`
  - text: unchanged except the story uses `quoteHtml(mem, "clamp-3")` (same output as today)
  - skeleton: `<div class="memory-skeleton" aria-hidden="true"><div class="skeleton skeleton--photo memory-skeleton__photo"></div><div class="skeleton skeleton--line memory-skeleton__bar memory-skeleton__bar--title"></div><div class="skeleton skeleton--line memory-skeleton__bar memory-skeleton__bar--meta"></div></div>` (the outer box does not carry `skeleton`, so only the inner blocks pulse)

**Steps**
- [x] Update test at `L8-L16`: rename to `"templates: title and story are escaped; the photo card shows the story below the photo"`; replace `assertEqual(html.indexOf("Nắng"), -1)` with assertions that the photo card contains `<p class="memory__quote hand clamp-2">“Nắng &quot;đẹp&quot;”</p>` and the text card contains `memory__quote hand clamp-3`.
- [x] Update test at `L35-L43`: replace the `memory__overlay` assertion (`L41`) with: `html.indexOf("memory__overlay") === -1`; `html.indexOf("memory__body") > html.indexOf("memory__photo")`; the substring from `memory__body` to the badge contains `memory__title`, `memory__meta t-meta muted` and `25/10 · 17:09`. Keep the badge assertion.
- [x] Add test `"templates: a moment without a story shows no quote in any card"`: with `story: ""`, `memoryBlockHtml`, `memoryFailedCardHtml` and `memoryTextCardHtml` each contain neither `memory__quote` nor `“`.
- [x] Add test `"templates: the failed card shows title, meta and story below the heart"`: `memoryFailedCardHtml(TPL_MEM)` contains `memory__body` after `memory__photo--failed`, contains `clamp-2` story, contains no `memory__overlay`; the existing retry-outside test (`L25-L33`) stays.
- [x] Add test `"templates: the open button is named by the title only"`: in the photo card, `aria-label="Quán &lt;b&gt;cà phê&lt;/b&gt;"` is present and the `aria-label="…"` value does not contain `Nắng`.
- [x] Add test `"templates: the moment skeleton is a box with a photo block and two bars"`: `memorySkeletonHtml()` starts with `<div class="memory-skeleton" aria-hidden="true">`, contains `memory-skeleton__photo` once and `memory-skeleton__bar` twice (`--title` and `--meta`).
- [x] TEST → expect 4 failed: the 2 updated tests, the failed-card test and the skeleton test. The no-story and aria-label tests already pass on HEAD; they are guards for the new markup.
- [x] Implement the Interfaces above in `templates.js`. `memoryBlockHtml` and `memoryFailedCardHtml` call `bodyHtml(mem)`; `memoryTextCardHtml` calls `quoteHtml(mem, "clamp-3")`. Remove every `memory__overlay` string from the file. Do not change `openButtonOpen` (aria-label stays the title).
- [x] `grep -n "memory__overlay" src/ui/templates.js` → no output.
- [x] TEST → `211 passed, 0 failed`.

**Done when:** TEST passes; the photo and failed cards render title, meta and story inside `.memory__body` after the photo; the skeleton is a box.

### Task 3: Moment box, counter card and OTD row styles (covers B-01, B-02, spec §2, §3, §4.1, §5, §8)

**Files**
- Modify: `src/styles/moments.css`
  - `L56-L63` (`.counter-card`)
  - `L111-L124` (comment "Feed: album pages, no card box" and `.memory`)
  - `L137-L144` (`.memory__photo`)
  - `L148-L157` (`.memory__overlay`, `.memory__overlay .memory__title…`, `.memory__overlay--plain` — delete)
  - `L160` (`.memory__quote`)
  - `L173-L182` (`.memory--failed .memory__retry`)
  - `L183` (`.memory--text`)
  - `L185-L187` (focus rules, `.memory-skeleton`)
  - `L233-L248` (`.otd-row`)
- Test: `tests/unit/ui/test_static_assets.js` — one new test; `L371-L374` ("fluid: feed photo height is capped by the viewport") stays as is

**Interfaces**
- Consumes `--c-card-edge`, `--e-card` (Task 1) and the class names from Task 2.
- Box declaration used by every content card (spec §1 principle 3): `border: 1.5px solid var(--c-card-edge); border-radius: var(--r-lg); box-shadow: var(--e-card);`

**Steps**
- [x] Add test `"card boxes: moments use one edge, inset photo, body below and box press"` to `test_static_assets.js`. With `m = readText("src/styles/moments.css")`:
  - rules `\.memory`, `\.memory-skeleton`, `\.counter-card`, `\.otd-row` each contain `border: 1.5px solid var(--c-card-edge)` and `box-shadow: var(--e-card)`
  - `\.memory` rule contains `padding: var(--s-2)`, `background: var(--c-surface)`, `contain-intrinsic-size: auto 540px`
  - `\.memory-skeleton` rule contains `padding: var(--s-2)` and `background: var(--c-surface)`
  - `\.memory__photo` rule contains `border-radius: calc(var(--r-lg) - var(--s-2))` and `max-height: 75svh`
  - `\.memory__body` rule exists and contains `padding: var(--s-3) var(--s-2) var(--s-2)`
  - `m` contains no `memory__overlay` and no `photo-scrim`
  - `/\.memory__open:active\s*\{[^}]*transform:\s*none/` and `/\.memory:has\(\.memory__open:active\)\s*\{[^}]*scale\(0\.98\)/` match
  - a `@media (prefers-reduced-motion: reduce)` block in `m` contains `.memory:has(.memory__open:active)` with `border-color: var(--c-primary)`
  - `/\.memory--failed \.memory__retry\s*\{[^}]*top:\s*calc\(var\(--s-2\) \+ var\(--s-3\)\)/` matches.
- [x] TEST → expect 1 failed.
- [x] `.counter-card` and `.otd-row`: replace `border: 1px solid var(--card-border)` with `border: 1.5px solid var(--c-card-edge)` and `box-shadow: var(--e-1)` with `box-shadow: var(--e-card)`. Nothing else changes.
- [x] Rename the comment at `L111` to `/* ---------- Feed: one white box per moment ---------- */`. `.memory`: add `padding: var(--s-2)`; border → `1.5px solid var(--c-card-edge)`; background → `var(--c-surface)`; shadow → `var(--e-card)`; add `transition: transform var(--m-fast) var(--ease-out)`; `contain-intrinsic-size: auto 540px`. Keep `position`, `display`, `margin-bottom: var(--s-5)`, `border-radius: var(--r-lg)`, `overflow: hidden`, `content-visibility: auto`.
- [x] `.memory__photo`: `border-radius: calc(var(--r-lg) - var(--s-2))` (was `0`); keep the other declarations, including `aspect-ratio: 4 / 5` and `max-height: 75svh`.
- [x] Delete the three overlay rules (`L148-L157`). Add:
  - `.memory__body { display: flex; flex-direction: column; gap: var(--s-1); padding: var(--s-3) var(--s-2) var(--s-2); }`
  - `.memory__body .memory__quote { margin-top: var(--s-1); }` (gap 4 px + 4 px = 8 px before the story, spec §4.1)
- [x] `.memory__badge` stays as is: its containing block is `.memory__open`, whose top-left is the photo's top-left, so `top/left: var(--s-3)` already gives 12 px inside the photo.
- [x] `.memory--failed .memory__retry`: `top` and `left` → `calc(var(--s-2) + var(--s-3))` (its containing block is `.memory`, which now has 8 px padding; 20 px from the box edge = 12 px inside the failed art).
- [x] `.memory--text`: keep `padding: var(--s-5)`, delete `background: var(--c-surface)` (now on `.memory`).
- [x] Press state, after the focus rules:
  - `.memory__open:active { transform: none; }` (cancels `src/styles/base.css:112`; `:where()` has zero specificity, so this wins)
  - `.memory:has(.memory__open:active) { transform: scale(0.98); }`
  - `@media (prefers-reduced-motion: reduce) { .memory:has(.memory__open:active) { border-color: var(--c-primary); } }`
  Keep both focus rules (`L185-L186`) unchanged.
- [x] Replace `.memory-skeleton { margin-bottom: var(--s-5); }` with:
  - `.memory-skeleton` — `margin-bottom: var(--s-5); padding: var(--s-2);` + the box declaration + `background: var(--c-surface)`
  - `.memory-skeleton__photo { max-height: 75svh; border-radius: calc(var(--r-lg) - var(--s-2)); }`
  - `.memory-skeleton__bar { margin-inline: var(--s-2); border-radius: var(--r-pill); }`
  - `.memory-skeleton__bar--title { width: 60%; margin-top: var(--s-3); }`
  - `.memory-skeleton__bar--meta { width: 40%; margin-top: var(--s-2); margin-bottom: var(--s-2); }`
  (`moments.css` loads after `components.css` — `index.html:L29-L31` — so these override `.skeleton`, `.skeleton--photo` and `.skeleton--line` at equal specificity. Height 14 px comes from `.skeleton--line`. No new `infinite` keyword: the `UI-09` limit at `test_static_assets.js:125` stays at its current count.)
- [x] TEST → `212 passed, 0 failed`.
- [x] BC at 375 × 812, light (`journeyApp.switchView("moments")`, images eager). For the first `.memory--photo` (`a`), its `.memory__photo` (`p`), `.memory__body` (`b`):
  - `getComputedStyle(a).borderTopWidth === "1.5px"` and `borderTopColor === "rgb(239, 182, 200)"`; `boxShadow` contains `rgba(216, 27, 96, 0.12)`
  - `p.getBoundingClientRect().left - a.getBoundingClientRect().left` ≈ 9.5 (±0.5); `getComputedStyle(p).borderTopLeftRadius === "16px"`
  - `b.getBoundingClientRect().top >= p.getBoundingClientRect().bottom`
  - `.memory__quote` in `b`: `getBoundingClientRect().height <= 2 * 26 + 1` (two Caveat lines at 20 px / 1.3) and its text starts with `“`
  - `getComputedStyle(a).marginBottom === "20px"` (the box-to-box gap; do not measure the distance to the next `.memory`: the three sample memories fall in three different months, `app.js:72-90`, so `renderTimeline` puts a `.month-label` between every two boxes, `app.js:1467-1474`)
  - NHS → `true`
- [x] BC: inject states and measure (then reload to restore). `outerHTML` detaches the old node, so after every injection re-query the box and its parts from `journeyApp.timelineContainer` (never reuse `a`, `p` or `b` from before the swap), and set `img.loading = "eager"` on any injected `<img>` before measuring (the template emits `loading="lazy"`, `src/ui/templates.js:89`). Before the injections, record `photoH = p.getBoundingClientRect().height` from the loaded photo.
  - pending: `journeyApp.timelineContainer.querySelector(".memory--photo").outerHTML = memoryBlockHtml(Object.assign({}, journeyApp.memories[0], {syncState: "pending"}), {couple: true})`; re-query `box = journeyApp.timelineContainer.querySelector(".memory--photo")` and its `.memory__photo`, `.memory__badge`, `.memory__body` → the badge rect is 12 px (±1) right of and below the photo's top-left, and the badge bottom is above the body top
  - failed: replace the first `.memory--photo` with `memoryFailedCardHtml(journeyApp.memories[0])`; re-query `box = journeyApp.timelineContainer.querySelector(".memory--failed")` → its `.memory__retry` rect is 12 px (±1) from its `.memory__photo--failed` top-left; the failed art height equals `photoH` (±1)
  - skeleton: `journeyApp.timelineContainer.innerHTML = memorySkeletonHtml().repeat(3)`; for each `sk` of `.memory-skeleton` → `getComputedStyle(sk).borderTopWidth === "1.5px"`; with `inner = sk.clientWidth - 16` (content box: `clientWidth` excludes the border, minus 2 × 8 px padding), `.memory-skeleton__bar--title` width / `inner` ≈ 0.60 and `.memory-skeleton__bar--meta` width / `inner` ≈ 0.40 (±0.01 each)
  - `screenshot` of the feed with one photo box, one failed box and one text box (`memoryTextCardHtml`) for the record.
- [x] BC at 320 × 700 and at desktop (560 px column): NHS → `true`; at 320, re-query `a` and `b` and check `b.getBoundingClientRect().left + parseFloat(getComputedStyle(b).paddingLeft) - a.getBoundingClientRect().left` ≈ 17.5 (±0.5): 1.5 px border + 8 px box padding + 8 px body padding, i.e. the text starts 16 px inside the border (see Assumptions). Do not change any padding to reach a different number.
- [x] BC dark: `document.documentElement.dataset.theme = "dark"` → `getComputedStyle(a).borderTopColor === "rgb(90, 61, 74)"`, `boxShadow === "none"`; `.counter-card` and `.otd-row` (if rendered) show the same border colour. Restore with `delete document.documentElement.dataset.theme`.

**Done when:** TEST passes and every BC measurement above holds with no console error.

### Task 4: Place boxes, list gap, places skeleton (covers B-03, spec §3, §4.2)

**Files**
- Modify: `src/styles/places.css:L18` (`.places`), `L19-L29` (`.place`), new rule after `.place` for `.places .skeleton--row`
- Test: `tests/unit/ui/test_static_assets.js:L464-L472` (test "places: white cards, 40 px actions and a label-free row below 280 px")

**Interfaces**
- Consumes `--c-card-edge`, `--e-card` (Task 1). `placeSkeletonHtml()` markup is unchanged (`.skeleton.skeleton--row`, used only by Places — `app.js:2834`).

**Steps**
- [x] Extend the places test at `L464-L472`: the `.place` rule also contains `border: 1.5px solid var(--c-card-edge)` and `box-shadow: var(--e-card)`; the `\.places` rule contains `gap: var(--s-4)`; the `\.places \.skeleton--row` rule contains `border: 1.5px solid var(--c-card-edge)` and `margin-bottom: 0` and has no `box-shadow`.
- [x] TEST → expect 1 failed.
- [x] `.places`: `gap: var(--s-4)` (was `--s-3`). `.place`: border → `1.5px solid var(--c-card-edge)`, shadow → `var(--e-card)`; keep padding `var(--s-4)` and `container-type: inline-size` (container queries depend on the unchanged padding, spec §5).
- [x] Add `.places .skeleton--row { margin-bottom: 0; border: 1.5px solid var(--c-card-edge); }` — scoped to the list so `components.css` stays generic; no shadow (spec §4.2); `margin-bottom: 0` cancels `components.css:120` (`.skeleton--row`, lower specificity) so skeleton rows follow the same 16 px list gap as real rows.
- [x] TEST → `212 passed, 0 failed`.
- [x] BC at 375 × 812, light, `journeyApp.switchView("places")`: first `.place` has `borderTopWidth === "1.5px"`, `borderTopColor === "rgb(239, 182, 200)"`; the gap between two consecutive `.place` rects is 16 px; inject `journeyApp.placesListContainer.innerHTML = placeSkeletonHtml().repeat(4)` → each row has the edge and `boxShadow === "none"`, and consecutive skeleton rows are 16 px apart (±0.5); reload. At 320 × 700 the actions of each place stay on one row inside the box and NHS → `true`. Dark: border `rgb(90, 61, 74)`, `boxShadow === "none"`.

**Done when:** TEST passes and the BC measurements hold.

### Task 5: Cache version

**Files**
- Modify (script): `index.html` (`?v=7.0`), `sw.js:L6` (`CACHE_VERSION = "7.0"`)

**Steps**
- [x] Run `./scripts/bump_version.sh 7.1` → prints `Version set to 7.1`.
- [x] `grep -n "v=7\.0\|CACHE_VERSION = \"7\.0\"" index.html sw.js` → no output; `grep -n "CACHE_VERSION" sw.js` → `const CACHE_VERSION = "7.1";`.
- [x] TEST → `212 passed, 0 failed`.

**Done when:** every asset URL and the service-worker cache name use 7.1.

## Final verification

- `./scripts/test.sh` → `212 passed, 0 failed` (baseline 206 + 6 new tests: 1 token test in Task 1, 4 template tests in Task 2, 1 moments test in Task 3; Task 4 extends an existing test). If the count differs, the coder records the actual count in §Deviations.
- `grep -rn "memory__overlay\|photo-scrim\|on-photo" src app.js index.html tests` → only the negative assertions in `tests/`.
- `grep -n "card-border" src/styles/moments.css src/styles/places.css` → no output; `grep -rn "card-border" src/styles/components.css src/styles/shell.css src/styles/be.css` still lists the 6 untouched users.
- One BC pass at 375 × 812 light and dark, 320 × 700, desktop and a landscape 812 × 375: Moments and Places scroll end to end with NHS `true`, no console error, the grid view ("Lưới", `journeyApp.timelineView = "grid"; journeyApp.renderTimeline()` or the segmented button) still shows square tiles with no box.

## Assumptions

- Story clamping uses the existing classes: `clamp-2` in photo/failed boxes and `clamp-3` in text boxes. With the in-app large-text setting (`html[data-large-text]`, `src/styles/base.css:81`) these become 3 and 5 lines, the same rule the title already follows. The spec's "2 lines" is the default-size value.
- The press state is verified by static assertions only: the preview cannot hold `:active` or emulate `prefers-reduced-motion`. A manual press on an iPhone is left to the user.
- Spec §2's "text sits 16 px from the box edge" is measured from the inner edge of the 1.5 px border (8 px box padding + 8 px body padding). Measured from the outer edge of the box it is 17.5 px. The same holds for the place box (1.5 px border + 16 px padding). The padding values in the spec are kept as written.
- `<div>`/`<h3>`/`<p>` inside `<button class="memory__open">` follow the existing pattern (the overlay `<div>` and `<h3>` were already inside it); no markup restructure beyond the spec.

## Out of scope / out-of-scope observations

- Bé cards, settings groups, sheets, toast and banner keep `--card-border` (spec §9).
- Spec §8 contrast numbers for text on `--c-surface` are already covered by the Kẹo Bông token values; no new contrast test.

## Decision log

- Q: Keep or remove `--c-photo-scrim` (spec §9 leaves it to the planner)? → A: remove it, and `--c-on-photo` too: after Task 3 neither has a user (`grep` on 2026-11-19: only `tokens.css` and the deleted `.memory__overlay` rules). The gradient test loses its scrim exception and now forbids all gradients. (planner, 2026-11-19)
- Q: Where does the places skeleton edge go? → A: a scoped `.places .skeleton--row` rule in `places.css`, not `components.css`, so the shared skeleton stays neutral. (planner, 2026-11-19)
- Q: Re-anchor the pending pill into `.memory__photo`? → A: no; `.memory__open` already starts at the photo's corner, so only the retry button (anchored to `.memory`) needs a new offset. (planner, 2026-11-19)
- Revision 2, PR-01: Task 3's 320 px check now measures where the text starts (`b` left + its left padding − `a` left) and expects 17.5 ± 0.5 px. The old check (`b` left − `a` left ≈ 16) could not hold on a correct build: it reads 9.5 px. The Assumptions now say that spec §2's 16 px is counted inside the border. (planner, 2026-11-19)
- Revision 2, PR-02: the inject-states check re-queries every node after each `outerHTML` swap and sets injected images to eager loading. The failed-art height is compared with `photoH`, which is recorded before the swaps. (planner, 2026-11-19)
- Revision 2, PR-03: the skeleton bar check gives the formula `bar.width / (sk.clientWidth − 16)` ≈ 0.60 / 0.40 ± 0.01. (planner, 2026-11-19)
- Revision 2, PR-04: adopted, not left to the coder. `.places .skeleton--row` gets `margin-bottom: 0`, so the skeleton rows keep the 16 px list rhythm. Task 4's test and BC now assert this, and the old Assumption about a 28 px skeleton gap is removed. (planner, 2026-11-19)
- Revision 2, PR-05: Task 1's `tokens.css` block ranges are corrected to L3-L57, L61-L91 and L93-L125 (checked on 2026-11-19). (planner, 2026-11-19)
- Revision 3, PR-06: the first BC in Task 3 no longer measures a 20 px gap between consecutive `.memory` boxes. With the sample data a month label always sits between two boxes, so that check could never pass. It now asserts `getComputedStyle(a).marginBottom === "20px"` (review option a). BC step 4 also calls `journeyApp.renderTimeline()` after `applyAuthMode()`, so the sample boxes are on screen and skeletons are not. (planner, 2026-11-19)
- No user questions were needed: the spec records every product decision (box shape, edge strength, story, grid, direction) as confirmed on 2026-11-19.

## Deviations (filled by coder)
- Task 1–4: for the "see it fail" TEST step I wrote tests and implementation in the same command for Task 1 (the 2 expected failures were not observed separately); Tasks 2–4 showed the expected failures (4, 1, 1) before implementing.
- Browser: the static preview server was already running on port 8765, so I opened it with `navigate` instead of `preview_start`. The 7.1 asset URLs had to be re-fetched with `cache: "reload"` because the HTTP cache served 7.0 files.
- Browser: a first Places gap read of 0 was taken during the view transition; re-measured after it settled: 16 px for places and for skeleton rows.
- Browser: console errors are only `net::ERR_FAILED` (offline Drive images/fonts and the cache-busting fetches), none from app code. Not run: grid view, landscape 812×375 and desktop-width BC passes, dark Places check.
- Final test count: 212 passed, 0 failed (as planned).
