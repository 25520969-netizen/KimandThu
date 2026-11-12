# Kim & Thư — Phone-First UI Development Plan (Phase D, v4.9 baseline)

Goal: make the phone layout feel like a native app. Keep every feature and the pink-and-hearts identity.

**Status:** plan only; no source file was changed. Written per `Covan.md`: evidence first, in English, with verified sources.

**Predecessor:** `UI_REDESIGN_PLAN.md`. Its Phases A–C shipped in `15847bf`, `12f5531` and `0f6952c`. This plan audits what those phases actually delivered on a phone and defines the next phase.

---

## Section 1 — Executive Summary & Audit Scope

### 1.1 Where the phone UI stands
Phases A–C fixed most of the v4.6 problems:
- **Photos and metadata:** photo-first cards with a one-line meta row, and a working photo fallback (verified: failed Drive thumbnails were replaced by the pink placeholder).
- **Chat:** full screen, with a 247 px input (target ≥ 240 px: **met**).
- **Animation:** no `transition: all` left, every `:hover` rule guarded, and 4 infinite animations instead of 9 or more.

Three phone problems remain:

1. **One layout bug that breaks a screen.** On Places, a legacy two-column grid stretches the GPS chip row to 514 px inside a 351 px column. Two of the three GPS tools and the "Thêm địa điểm" button render off-screen, and the document is 556 px wide at every phone width tested (360, 375 and 414 px).
2. **Sheet mechanics that look done but aren't.**
   - **Two close buttons:** 9 of 10 bottom sheets show two × buttons, an injected one on top of the original.
   - **Swipe-to-close:** probably never fires on a real touchscreen. It uses `touch-action: pan-y`, which hands vertical drags to the browser, and the browser then cancels the pointer stream.
   - **Back button:** the Android back gesture doesn't close chat or sheets.
3. **Phone-native details are missing.**
   - **iOS zoom:** all 22 text fields use font sizes under 16 px, a size that iOS Safari is widely reported to auto-zoom on focus.
   - **No dark mode.**
   - **No design tokens:** the redesign lives as a third override stylesheet with 48 distinct hex colours and 71 `box-shadow` declarations.
   - **Height targets missed:** the first Moments card still starts below the Phase B target.

### 1.2 Five changes with the biggest effect on a phone
1. Fix the Places action grid (one CSS rule). This restores all GPS tools and stops the page from overflowing sideways.
2. Build one **`<BottomSheet>` behaviour**:
   - one × button only
   - drag on the handle with `touch-action: none`
   - snap-back animation
   - the Android back gesture and Esc close it
   - focus handled the native `<dialog>` way

   Chat becomes a real modal: `<dialog>`, or `inert` set on the background.
3. **Phone form ergonomics:**
   - 16 px fields
   - `enterkeyhint` and `inputmode`
   - a sticky primary button that stays above the keyboard
4. A **token layer** (`tokens.css`) with light and dark themes, used to fold the three stylesheets toward one source of truth.
5. A **thumb-first vertical rhythm:**
   - a hero no taller than 200 px (counter in one row, period chip merged into it)
   - month separators inline
   - first card visible above the fold on a 667 px tall phone (iPhone SE)

### 1.3 Scope inspected
| File | What was read |
|---|---|
| `README.md`, `UI_REDESIGN_PLAN.md`, `Covan.md` | in full |
| `src/styles/redesign.css` | in full (404 lines) |
| `src/ui/app_shell.js` | in full (173 lines) |
| `index.html` | L1–330, L480–500, L662–725 |
| `src/styles/app_shell.css` | L1–40, L395–440, grep for `safe-area` / `--safe-bottom` |
| `styles.css` | L57–82, L1162–1170, L1648–1664, L2218–2228, L2486–2497, L2530, L2687–2715. Repo-wide greps: `:hover`, `@media`, `infinite`, `box-shadow`, `!important`, custom properties, hex colours, `100vh`, `touch-action`, `prefers-color-scheme`, `focus-visible`. |
| `app.js` | `renderTimeline` L1400–1500, `switchView` / `applyView` L1820–2010, `calculateAllDistancesAndRoutes` L2253–2300, petals L2855–2930, merge/render paths L3050–3170 and L3355–3450, `promptSenderIfNeeded` L3289–3310, `toggleChatDrawer` L3556–3569, `attachImageFallbacks` L3665–3683 |
| `manifest.json`, `scripts/test.sh`, `.claude/launch.json` | in full |

### 1.4 Verification method

**Executed (dynamic)**
- **Unit tests:** `scripts/test.sh` → `97 passed, 0 failed`.
- **Local server:** served with `python3 -m http.server 8765 --bind 127.0.0.1` (the `kimthu-static` launch config).
- **Browser:** the built-in Chromium browser with device emulation at 375 × 812 (mobile preset, touch UA), 360 × 740 and 414 × 896, in a light colour scheme.
- **Guest mode:** live public timeline and places data from the deployed backend, read-only.
- **Couple mode:**
  - simulated client-side only, with `journeyApp.isAuthenticated = true; journeyApp.applyAuthMode()`
  - no passcode was sent and nothing was written to the backend
  - chat and period content are the built-in demo data
- **Measurements:**
  - layout: `getBoundingClientRect`, `scrollWidth` and computed styles
  - visible sheet close buttons: each `<dialog>` opened in turn
  - field font sizes: `getComputedStyle(...).fontSize` for every input, textarea and select
  - image state: `naturalWidth`, plus resource-timing entries
- **Screenshots:** home (guest), Places (guest), and the period-alert sheet over chat (couple).

**Static only**
- **Real touch behaviour:**
  - the swipe-to-close gesture (D-03)
  - iOS focus zoom (D-04)
  - Android back gesture (D-05)
  - safe-area insets

  These need a physical iPhone and Android phone, and neither was available. Each finding states its evidence level.
- **Frame timing:** the browser pane was in the background, so `requestAnimationFrame` was throttled (6 callbacks/s). No frame-timing numbers from this session are reported.

---

## Section 2 — Verified Findings (Phone UI Defect Report)

IDs use the `D-` prefix (Phase D), so they don't clash with `BUG-`, `UX-` and `UI-` from earlier audits.

### Critical

**[D-01] Places: GPS tools and the add button render off-screen; the document overflows sideways**
- **Severity & category:** Critical | Layout / Feature reachability
- **Location:**
  - `styles.css:2530` → `styles.css:2687-2692`, inside `@media (max-width: 768px)`
  - `src/styles/redesign.css:156-176`
- **Evidence:**
  - **Legacy rule:**
    ```css
    /* styles.css:2687 (inside @media (max-width: 768px)) */
    .places-action-btns { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    /* redesign.css:166 */
    .places-gps-menu-item { flex: 0 0 auto; white-space: nowrap; ... }
    ```
  - **Measured at 375 × 812, guest and couple:**
    - `.places-gps-dropdown-menu` is 514 px wide, and each chip is 504 × 44 px
    - `#open-add-place-modal-btn` is 22 px wide at `left: 534px`
    - `document.documentElement.scrollWidth = 556`
  - **Same result at 360 and 414 px:** `scrollWidth` stays 556.
  - **Screenshot:** only "Sắp xếp gần nhất" is visible, centred in an oversized chip. "Đã đến nơi này chưa?" and "Thêm nơi đang đứng" can't be seen.
- **Root cause & impact:**
  - **Cause:**
    - A `1fr` track means `minmax(auto, 1fr)`, so its minimum is the content's min-content width.
    - Phase A made the chips `nowrap` and `flex: 0 0 auto`, so the row's min-content width is the sum of all chip labels.
    - That widened the first grid column. Phase A changed `.places-controls-bar` but never overrode this grid.
  - **Impact:**
    - On a phone, two of the three GPS features can't be found. Only a hidden horizontal scroll inside the row reveals them.
    - `body { overflow-x: hidden }` (`styles.css:69`) stops `window.scrollTo(100, …)` in Chromium (verified: `scrollX` stayed 0).
    - The 556 px document width remains a sideways-panning risk on iOS Safari (not verified on a device).

### High

**[D-02] Nine bottom sheets show two × close buttons**
- **Severity & category:** High | Visual / Interaction
- **Location:**
  - `src/ui/app_shell.js:89-95` (injects `.sheet-close-btn` into every non-lightbox dialog)
  - `index.html`: 10 occurrences of `.modal-close-btn`, e.g. L267 and L487
  - `src/styles/redesign.css:297-317`
- **Evidence:**
  - Each dialog was opened at 375 px and the visible close buttons were listed: `memory-modal`, `place-modal`, `check-location-result-modal`, `add-current-location-modal`, `period-alert-modal`, `period-modal`, `settings-modal`, `auth-modal` and `notes-modal` all show `sheet-close-btn + modal-close-btn`.
  - The period-alert screenshot shows a bare × at the top-right corner, over a pink circled × just below it.
- **Root cause & impact:**
  - **Cause:** Phase B added a new × button without hiding the existing header × on phones.
  - **Impact:**
    - It looks like a bug.
    - Screen readers announce "Đóng" twice.
    - The two 44 px targets overlap.

**[D-03] Swipe-to-close is unlikely to work on touchscreens**
- **Severity & category:** High | Interaction (static analysis + spec evidence; not executed on a device)
- **Location:**
  - `src/styles/redesign.css:300`
  - `src/ui/app_shell.js:99-124`
- **Evidence:**
  - **The code:**
    ```css
    .custom-modal:not(.photo-lightbox-modal) .modal-card { position: relative; touch-action: pan-y; }
    ```
  - **The gesture handler:**
    - It listens to `pointerdown`, `pointermove` and `pointerup` / `pointercancel` on the card itself.
    - It never calls `setPointerCapture`.
    - It applies `translateY` without a transition, so a release snaps back abruptly.
  - **Browser behaviour:**
    - MDN `touch-action`: an application using Pointer events "will receive a `pointercancel` event when the browser starts handling a touch gesture", and `pan-y` lets the browser handle single-finger vertical panning.
    - WebKit's layout test `pointerevents/ios/touch-action-pointercancel-pan-y` asserts exactly this sequence: `pointerdown` → `pointercancel`.
- **Root cause & impact:**
  - **Cause:**
    - A vertical drag on a `pan-y` element is claimed by the browser.
    - `end()` then runs from `pointercancel` with `dy` ≈ 0–6 px, so the sheet never closes.
    - On desktop with a mouse it works, which is probably why it looked done.
  - **Impact:** the drag handle promises a gesture that doesn't happen.

**[D-04] All 22 form fields are under 16 px, so iOS Safari zooms on focus**
- **Severity & category:** High | Phone form ergonomics (measured sizes; zoom behaviour from documentation, not seen on a device)
- **Location:**
  - `styles.css:1653-1661`: `.form-group input/select/textarea { font-size: 0.95rem }` → 15.2 px
  - `styles.css:2488-2495`: `.chat-input-bar input[type="text"] { font-size: 0.88rem }` → 14.08 px
- **Evidence:**
  - **Computed sizes:** every visible field measured below 16 px (`memory-title-input` … `note-open-at-input` at 15.2 px, `chat-text-input` at 14.08 px).
  - **Viewport:** `index.html:5` doesn't set `maximum-scale`, which is correct for accessibility, so nothing suppresses the zoom.
- **Root cause & impact:**
  - **Cause:** iOS Safari zooms the page when a focused field renders below 16 px. This is widely documented by developers (see 4.1, row 6); Apple's own docs don't state it.
  - **Impact:**
    - Opening any sheet field zooms the page.
    - The sticky action bar and the × slide off-screen until the user pinches back.
    - In chat this happens on every message.

### Medium

**[D-05] Chat isn't a modal: the background stays focusable, and Back doesn't close it**
- **Severity & category:** Medium | Accessibility / Navigation
- **Location:**
  - `index.html:662` (`<div id="chat-drawer" class="chat-drawer couple-only" aria-hidden="true">`)
  - `app.js:3556-3569`
  - `src/ui/app_shell.js:129-148`
- **Evidence:** with chat open at 375 px:
  - **ARIA:** `role` = `null` and `aria-modal` = `null`.
  - **Background:** 27 visible focusable elements outside the drawer; `main.inert === false`.
  - **Focus:** `document.activeElement` is `body`, even though `toggleChatDrawer(true)` calls `.focus()`.
  - **History:** `toggleChatDrawer` never calls `history.pushState`, so the Android back gesture runs the page's `popstate` and switches tabs or leaves the app instead of closing chat.
- **Root cause & impact:**
  - **Cause:** the drawer is a styled `<div>`; only the tab bar is hidden (`redesign.css:269-271`).
  - **Impact:**
    - Screen-reader and keyboard users land behind the chat.
    - Android users lose their place when they press Back to close chat, which is the most common phone gesture.
    - The same Back problem applies to every bottom sheet.

**[D-06] Phase B/C height targets are missed on phones**
- **Severity & category:** Medium | Information hierarchy
- **Location:**
  - `index.html:103-140` (hero, counter, period chip)
  - `app.js:1426-1428` (month separator)
  - `src/styles/redesign.css:198-251` and `371-381`
- **Evidence (measured):**

  | Metric | Target (`UI_REDESIGN_PLAN.md` §5) | Measured |
  |---|---|---|
  | First card top, 375 × 812, guest | ≤ 400 px | **432 px** |
  | First card top, 375 × 812, couple | ≤ 400 px | **462 px** |
  | Card height | ≤ 460 px | 429 px at 360 px; **474 px** at 414 px; **486 px** at 375 px |
  | Places header | ≤ 200 px | 164 px ✓ |
  | Chat input | ≥ 240 px | 247 px ✓ |

  - **Couple hero:** 258 px; the period chip adds a 44 px row under the counter.
  - **Month separator:** "Tháng 10 · 2026" is a 32 px block between the header and the first card.
  - **Section title:** "Khoảnh Khắc Của Tụi Mình" is ellipsized (`scrollWidth 235 / clientWidth 212`) and shows as "Khoảnh Khắc Củ…" in the screenshot.
- **Root cause & impact:**
  - **Cause:** the compact hero only shrank the fonts. It kept four separate counter boxes plus a title row, a quote line, a milestone line and a separate chip.
  - **Impact:** on a 667 px tall iPhone SE, only the top ~140 px of the first photo is visible on load.

**[D-07] No token layer: three stylesheets override each other**
- **Severity & category:** Medium | Maintainability / Visual consistency
- **Location:** `styles.css` (2807 lines), `src/styles/app_shell.css` (569), `src/styles/redesign.css` (404)
- **Evidence:**
  - **Colours:** 48 distinct hex values.
  - **Shadows:** 71 `box-shadow` declarations (65 + 3 + 3).
  - **`!important`:** 17 (11 + 6).
  - **Missing tokens:** none of the tokens planned in `UI_REDESIGN_PLAN.md` §4.3 exist (`--surface`, `--shadow-1`, `--dur-fast`, …). The redesign hard-codes `#ffd1dc`, `#c9184a` and `rgba(201,24,74,.06)` (e.g. `redesign.css:10-12`).
  - **Breakpoints:** 640, 767, 768 and 380 px. At exactly 768 px, `styles.css`'s `max-width: 768px` applies while `redesign.css`'s `max-width: 767px` doesn't.
  - **Live D-01 trap:** a phone rule from 2025 in `styles.css` silently beat the 2026 rule in `redesign.css`.
- **Root cause & impact:**
  - **Cause:** each phase added an override layer instead of replacing rules.
  - **Impact:**
    - Regressions like D-01 are invisible until someone measures.
    - Dark mode (D-09) is impractical without tokens.

**[D-08] Places re-renders 2–3 times on every tab switch**
- **Severity & category:** Medium | Smoothness
- **Location:** `app.js:1951-1952`, `app.js:2269`, `app.js:2278-2284`
- **Evidence:**
  - `applyView("places")` calls `this.renderPlaces()` and then `this.calculateAllDistancesAndRoutes(false)`.
  - That calls `this.renderPlaces(forceSort)` again (L2269), and once more for each route that resolves (L2283).
  - This is the second half of the old `UI-07`, still open.
- **Root cause & impact:** the Places list is rebuilt with `innerHTML` 2–3 times during the 150 ms view-transition cross-fade. That risks dropped frames on mid-range phones (static analysis only; not measured).

### Low

**[D-09] No dark theme**
- **Location:** repo-wide. `grep prefers-color-scheme` = 0. `manifest.json:10` and `index.html:17` fix `theme_color` to `#ff758f`.
- **Impact:**
  - In a dark room, on a phone in system dark mode, the app is a bright white-pink screen with a pink status bar.
  - Light-on-dark isn't better for reading (see 4.1, Piepenbrock et al.), so this is about comfort and choice, not legibility.

**[D-10] The petal canvas isn't scaled for high-DPI screens and runs all the time**
- **Location:** `app.js:2864-2865` and `app.js:2915-2925`
- **Evidence:**
  - At 414 × 896 with DPR 2, the canvas backing store is 414 × 896, so it renders at half resolution and the petals look soft.
  - The `requestAnimationFrame` loop only pauses on `visibilitychange`. It doesn't pause while scrolling, a sheet or chat is open, or the canvas is behind them.
- **Impact:** small, constant GPU and battery cost, and soft visuals on Retina screens.

**[D-11] Phone keyboards get no hints**
- **Location:**
  - `index.html:701`: `<input type="text" id="chat-text-input" … autocomplete="off">` has no `enterkeyhint="send"`
  - the other fields have no `inputmode` or `enterkeyhint` either (grep = 0)
- **Impact:** the keyboard shows "return" instead of "send" in chat, and the URL fields (backend, TikTok, maps) get the full text keyboard.

**[D-12] The period-alert and settings sheets still stack two full-width buttons**
- **Location:**
  - `index.html:480+`: `period-alert-modal` shows "Đã Nhớ Rồi 💕" and "Xem Góc Chăm Sóc"
  - `settings-modal` and `auth-modal`: 2 visible actions each (measured)
- **Impact:** the old UI-06 rule (one primary action per sheet) was applied to only 4 of the sheets; these three still stack two buttons.

**[D-13] "Bạn là ai?" can now be dismissed**
- **Location:** `app.js:3289-3310` and `app_shell.js:81` (the injected × also lands in `who-am-i-modal`)
- **Impact:** a one-time required choice can be skipped by accident. It reappears on the next visit, so this is minor, but the × shouldn't be there.

---

## Section 3 — Remediation Plan (How to Fix)

| Defect | Proposed fix | Verification | Risk & mitigation |
|---|---|---|---|
| D-01 | In `redesign.css`, at the same 768 px breakpoint, set `.places-action-btns { display: flex; flex-direction: column; gap: 8px; }`, `.places-gps-dropdown-wrap { min-width: 0; width: 100%; }` and `.places-gps-dropdown-menu { max-width: 100%; }`. Keep the add-place button visually hidden for couples (the FAB proxies to it) and show a 44 px icon button for guests, as on Moments. | New static test: no `grid-template-columns: 1fr 1fr` without `minmax(0,1fr)` on `.places-action-btns`. Manual: `scrollWidth === innerWidth` on Places at 360, 375 and 414 px, and all 3 chips have `getBoundingClientRect().right ≤ innerWidth` or are reachable by scrolling the chip row. | Low. Check the 641–768 px tablet range too. |
| D-02 | Pick one close button: keep the header `.modal-close-btn` (it already has an `aria-label` and sits in the header row) and **stop injecting** `.sheet-close-btn`. Wire the existing header × into `closeSheet`. Don't add a × to `who-am-i-modal` (fixes D-13). | Test: each `dialog.custom-modal` has exactly one `[aria-label="Đóng"], .modal-close-btn`. Visual: one × per sheet. | Low. |
| D-03 | Rewrite the drag as a **handle-only** gesture: a visible 48 px tall `.sheet-handle` element with `touch-action: none` replaces the `::before` pseudo-element. Call `setPointerCapture` on `pointerdown`, apply `translateY` in a `requestAnimationFrame`, and on release animate the snap-back or dismiss with `transition: transform var(--dur-med)`. Leave the card body as `touch-action: auto`, so form scrolling is untouched. Optionally, when the card is scrolled to the top, also allow drag-from-body using `touchstart`/`touchmove` with `{passive:false}` and `preventDefault()` only when `dy > 0 && scrollTop === 0`. | On a real iPhone and Android phone: dragging the handle 40 % closes; 20 % snaps back with animation; scrolling a long form doesn't move the sheet. | Medium: `touch-action: none` disables pinch-zoom on the handle only (MDN notes this for WCAG 1.4.4), which is acceptable for a 48 px strip. |
| D-04 | Set `font-size: 16px` (1 rem) for `.form-group input, select, textarea` and `.chat-input-bar input`. Shrink the placeholder visually with `::placeholder { font-size: 15px }` if the larger size feels heavy. Never add `maximum-scale=1`. | Test: computed `font-size ≥ 16px` for every field (the same script used in this audit). On an iPhone, focusing a field doesn't zoom. | Low. Fields get ~1 px taller. |
| D-05 | Make chat a `<dialog id="chat-drawer">` opened with `showModal()`. The browser then makes the background inert, moves focus into the dialog, and closes it with Esc. On open, `history.pushState({ overlay: "chat" }, "")`. In the existing `popstate` handler, close the top overlay before switching tabs. Use the same overlay stack for every bottom sheet. Optionally, where available, use `CloseWatcher` (MDN marks it "Limited availability") as a progressive enhancement for the Android back gesture. | Back on Android closes chat and then sheets, one at a time, before changing tabs. With chat open, Tab never reaches the page behind it. `role="dialog"` is reported by `read_page`. | Medium. A `<dialog>` in the top layer needs its CSS moved from `.chat-drawer.open` to `dialog[open]`. Keep the `body.chat-open` class for hiding the tab bar. `pushState` must not stack duplicate entries when chat is toggled quickly: check `history.state` first. |
| D-06 | (a) **Hero ≤ 200 px:** title and quote on one line ("Kim ❤️ Thư · Iu béeee"), the counter as one strip (`587 ngày · 14:22:07`, with the day number at 32 px), and the milestone and period chip as two inline chips in one row. (b) Fold the month label into the first card's meta row, or render it as a 20 px sticky label. (c) Shorten the section title to "Khoảnh khắc" on phones, with the full text in `aria-label`. (d) Use a 4:5 photo aspect ratio in the feed, and keep 6:5 only if the user prefers it. | At 375 × 812, first card top ≤ 360 px (guest) and ≤ 380 px (couple). At 375 × 667, at least 50 % of the first photo is visible. The section title isn't truncated. | Medium: the counter's `aria-label` must still read naturally. Keep the separate `count-*` IDs, because `app_shell.js:157-159` reads them. |
| D-07 | Add `src/styles/tokens.css`, loaded first, with the §4.3 tokens from the previous plan plus the dark set below. Then migrate in small batches: replace the hex colours and `box-shadow` values in `redesign.css`, then `app_shell.css`, then `styles.css`, one component per commit. Settle on **2 breakpoints**: `--bp-phone: 640px` and `--bp-tablet: 1024px`, and drop 767/768/380. Longer term, put the stylesheets in `@layer base, legacy, shell, redesign;` so the order is explicit and no longer depends on file order. | Static test: `redesign.css` and `app_shell.css` contain 0 raw hex colours outside `tokens.css`; distinct `box-shadow` values ≤ 3. `@media` widths ⊆ {640, 1024}. | Medium: visual regressions. Mitigate with before/after screenshots at 375 px, one per component. |
| D-08 | In `applyView`, call `renderPlaces()` only if `this.placesDirty` is set (by merges and edits). Call `calculateAllDistancesAndRoutes` only when `lastUserPosition` changed by more than 50 m or the place set changed. Batch route results with a `requestAnimationFrame` debounce, so only one `renderPlaces` runs per frame. | Instrument `renderPlaces` with a counter: switching Moments → Places → Moments → Places triggers ≤ 1 render after the first. | Low. |
| D-09 | In `tokens.css`, add `@media (prefers-color-scheme: dark)` with a warm plum-dark palette that keeps the pink accents (e.g. surface `#1f1418`, card `#2a1b21`, text `#f6e9ee`, action `#ff8fab`). Add `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1f1418">` and `<meta name="color-scheme" content="light dark">`. Add a manual Light / Dark / Auto setting in Settings, stored per device. | Contrast test (extend `tests/unit/ui`): every text/surface pair ≥ 4.5:1 in both themes. Screenshot both themes at 375 px. | Medium: photo cards and the lightbox should keep light borders in dark mode, so photos don't bleed into the background. |
| D-10 | Size the canvas to `innerWidth × DPR` and `ctx.scale(dpr, dpr)`. Pause the loop while `body.chat-open`, while any `dialog[open]` is showing, and for 200 ms after the last `scroll` event. | Petals look sharp on a DPR-2 screenshot. No `requestAnimationFrame` callbacks while chat is open (counter). | Low. |
| D-11 | Chat: `enterkeyhint="send"`. URL fields: `type="url" inputmode="url"`. Passcode: `enterkeyhint="go"`. Titles: `enterkeyhint="next"`, `autocapitalize="sentences"`. | Visual check on a phone keyboard. | Low. |
| D-12 | One primary action per sheet. Period alert: primary "Xem góc chăm sóc"; "Đã nhớ rồi" becomes the × or a swipe, and dismissing still counts as acknowledged. Settings: primary "Lưu", with "Đặt lại mặc định" as a text link behind a confirm step. | Each sheet shows ≤ 1 full-width button (same measurement script). | Low. |

---

## Section 4 — Research-Backed Phone Design Direction

### 4.1 Literature and references reviewed (this session)
| # | Title | Authors, year | Venue | URL | Relevance to this app |
|---|---|---|---|---|---|
| 1 | Modeling the Functional Area of the Thumb on Mobile Touchscreen Surfaces | Bergstrom-Lehtovirta & Oulasvirta, 2014 | ACM CHI 2014, pp. 1991–2000 | https://doi.org/10.1145/2556288.2557354 (record: https://dblp.org/rec/conf/chi/Bergstrom-LehtovirtaO14.html) | A model of the screen area the holding hand's thumb can reach. Its inputs are surface size, hand size and grip position, fitted on 20 participants. → Frequent actions (send, FAB, sheet primary button, tab bar) belong in the lower part of the screen, and destructive or rare ones (delete, reset, lock) go higher or behind a menu. *Abstract and bibliographic record only; full text not read.* |
| 2 | `touch-action` (CSS) | MDN Web Docs | Web platform docs | https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action | Read in full (first 100 k characters). States that the app "will receive a `pointercancel` event when the browser starts handling a touch gesture", that `pan-y` hands vertical panning to the browser, and that `touch-action: none` can block zoom (WCAG 1.4.4). → Root cause and fix for D-03. |
| 3 | WebKit layout test `touch-action-pointercancel-pan-y` | WebKit project | Source repository | https://webkit.googlesource.com/WebKit/+/master/LayoutTests/pointerevents/ios/touch-action-pointercancel-pan-y.html | Seen through search: it checks that a vertical pan over a `pan-y` element yields `pointerdown` → `pointercancel` on iOS. *A direct fetch failed (connection refused).* → Corroborates D-03 on iOS specifically. |
| 4 | Dialog (Modal) Pattern | W3C WAI-ARIA Authoring Practices Guide | W3C | https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/ | Content under a modal is inert, focus moves into the dialog and is contained there, and it returns to the invoking control on close. → D-05: make chat a real modal. *Via search summaries of the APG; the page itself was not fetched.* |
| 5 | `CloseWatcher` | MDN Web Docs | Web platform docs | https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher | Read. Lets custom overlays respond to platform close requests (Esc; the Android back button). Marked **"Limited availability"**, not Baseline. → D-05: use it only as a progressive enhancement, on top of a `history.pushState` fallback. |
| 6 | Preventing iOS Textbox Auto-Zooming and ViewPort Sizing | Rick Strahl, 2023 | Industry blog | https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing | Inputs under 16 px trigger zoom on focus in iOS Safari. Recommends 16 px fields over `maximum-scale=1`, which hurts accessibility. *No official Apple documentation was found, so treat this as well-attested developer knowledge.* → D-04. |
| 7 | Positive display polarity is advantageous for both younger and older adults | Piepenbrock, Mayr, Mund & Buchner, 2013 | *Ergonomics* 56(7): 1116–1124 | https://doi.org/10.1080/00140139.2013.790485 | Dark-on-light gave better acuity and proofreading in both age groups, which the authors attribute to display luminance. → D-09: keep **light as the default**, and offer dark for comfort in dim rooms, not as a legibility upgrade. *Abstract only.* |
| 8 | Bottom sheets (Material Design 3) | Google | Design guidance | https://m3.material.io/components/bottom-sheets/overview | **Secondary sources only** (Flutter's API docs and component READMEs that cite it): there are modal and standard variants, and the drag handle at the top is always draggable. A 48 dp handle target comes from a third-party blog and is unverified. → D-03: a handle-only drag with a 48 px target. |
| 9 | Reinecke et al. 2013 (CHI); Lavie & Tractinsky 2004 (IJHCS); Parhi, Karlson & Bederson 2006 (MobileHCI) | — | — | see `UI_REDESIGN_PLAN.md` §4.1 | **Carried over, not re-verified this session.** Less visual complexity → better first impressions; classical order plus an expressive skin; thumb targets ≥ 9.2–9.6 mm (≈ 44 px). |

### 4.2 Phone design principles for Phase D
1. **Thumb zone first** (row 1). Rank every control by how often it's used:
   - **Bottom 40 % of the screen:** tab bar, FAB, chat send, the sheet's primary button.
   - **Top bar:** music, lock and settings.
   - **Behind a ⋯ menu:** delete and reset.
2. **Every overlay closes the same 4 ways** (rows 4, 5, 8): a single ×, a swipe on the handle, Back or Esc, and a backdrop tap. **One component implements all of it**, so no sheet can drift from the others again (D-02, D-03, D-05, D-12).
3. **Native-feeling forms** (row 6):
   - 16 px fields
   - the right keyboard for each field
   - the primary button pinned above the keyboard, using `visualViewport` to lift the sticky bar on iOS
4. **Tokens before tweaks** (D-07). No new hex colour or shadow outside `tokens.css`, which also makes dark mode a theme switch instead of a rewrite.
5. **Light by default, dark on request** (row 7).

### 4.3 Token additions (`src/styles/tokens.css`)
```css
:root {
  --surface:#fff8fa; --surface-card:#fff; --pink-tint:#ffeef3; --pink-line:#ffd1dc;
  --pink-heart:#ff4d6d; --pink-action:#c9184a; --on-action:#fff;
  --text:#3d2b35; --text-soft:#7a5f6c;
  --shadow-1:0 1px 2px rgb(201 24 74 / .06),0 4px 12px rgb(201 24 74 / .06);
  --shadow-2:0 8px 24px rgb(201 24 74 / .16);
  --r-chip:999px; --r-card:16px; --r-photo:14px; --r-sheet:24px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px;
  --dur-fast:150ms; --dur-med:240ms; --dur-slow:400ms; --ease:cubic-bezier(.2,.8,.2,1);
  --field-font:16px; --tap:44px; --handle:48px;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface:#1f1418; --surface-card:#2a1b21; --pink-tint:#3a2229; --pink-line:#4a2c35;
    --pink-action:#ff8fab; --on-action:#2a0f18; --text:#f6e9ee; --text-soft:#c9adb9;
    --shadow-1:0 1px 2px rgb(0 0 0 / .4); --shadow-2:0 8px 24px rgb(0 0 0 / .5);
  }
}
:root[data-theme="dark"] { /* same values as the dark block, for the manual toggle */ }
```
The dark values are a proposal. The contrast test (D-09) must confirm 4.5:1 or better before they ship.

### 4.4 Phone layout target (375 × 812)
```
┌───────────────────────────────────┐
│ ♥ Kim & Thư              ♫  ⋯     │ 52px header (⋯ = settings, lock)
├───────────────────────────────────┤
│ ╭───────────────────────────────╮ │
│ │ Kim ❤️ Thư · “Iu béeee:3”      │ │
│ │ 587 ngày   14:22:07            │ │ hero ≤ 200px
│ │ (💞 12 ngày → 600) (🍓 ngày 2/5)│ │ two inline chips
│ ╰───────────────────────────────╯ │
│ Khoảnh khắc · T10/2026  [▤][▦]    │ one line, month inline
│ ╭───────────────────────────────╮ │ first card top ≈ 330px
│ │          PHOTO 4:5            │ │
│ │ 25/10 · 17:09 · 📍 Tô Hiến…    │ │
│ │ Bún bò 149.                   │ │
│ │ “Cũm ngonnn”    ♡   Xem   ⋯   │ │
├───────────────────────────────────┤
│  📷        📍     (♥)    💌    🍓   │ 64px + safe area
└───────────────────────────────────┘

Places:   [ Muốn đi 2 | Đã đến 1 ]                      segmented, full width
          (◎ Gần nhất) (✓ Đã đến chưa?) (+ Nơi đang đứng) → one row, scrolls inside itself
Sheet:    ══ handle 48px ══   Title                    ×
          fields (16px) …
          [        Primary action (sticky)          ]   lifted above the keyboard
Chat:     <dialog> full screen · ← Back closes · input 16px · ⏎ "send"
```

---

## Section 5 — Phased Implementation Roadmap

### Phase D1 — Phone stabilisation (≈ 1 day)
- **Scope:** D-01, D-02, D-13, D-04, D-11.
- **KPIs at 360, 375 and 414 px:**
  - `scrollWidth === innerWidth` on every view
  - one close control per sheet
  - every field ≥ 16 px
  - `who-am-i-modal` has no ×
  - `scripts/test.sh` green, with the new static tests added

### Phase D2 — One overlay system (≈ 2–3 days)
- **Scope:** D-03, D-05, D-12, plus an `OverlayStack` in `src/ui/` used by chat and every sheet.
- **KPIs, on one iPhone and one Android phone:**
  - a handle drag closes the sheet at ≥ 30 % or on a fast flick, and snaps back with animation otherwise
  - Back closes the top overlay first
  - with chat open, Tab never leaves the chat
  - each sheet has ≤ 1 full-width button
  - **Unit-testable without a device:** the overlay-stack logic (push, pop, ignoring duplicates) as a pure module in `src/ui/`

### Phase D3 — Tokens, dark mode, vertical rhythm (≈ 3–4 days)
- **Scope:** D-07 (tokens + migrating `redesign.css` and `app_shell.css`), D-09, D-06.
- **KPIs:**
  - first card top ≤ 360 px (guest) and ≤ 380 px (couple) at 375 × 812
  - ≥ 50 % of the first photo visible at 375 × 667
  - 0 raw hex colours outside `tokens.css` in the two newer stylesheets
  - ≤ 3 distinct shadows
  - text contrast ≥ 4.5:1 in both themes
  - 2 breakpoints

### Phase D4 — Smoothness on real hardware (≈ 1–2 days)
- **Scope:** D-08, D-10, and the `styles.css` token migration, component by component.
- **KPIs:**
  - ≤ 1 `renderPlaces` per tab switch after the first
  - no petal `requestAnimationFrame` while chat or a sheet is open
  - Chrome remote-debugging trace on a mid-range Android phone: < 5 % dropped frames scrolling 30 memories and switching tabs 10 times (baseline to be measured first)

### Feature-preservation checklist (run after every phase)
Reuse the checklist in `UI_REDESIGN_PLAN.md` §5 unchanged. In addition:
- **GPS chips:** all 3 visible or reachable on Places.
- **Back button:** closes chat, then sheets, then switches tabs.
- **Camera:** stops on every sheet-close path (×, swipe, Back, backdrop, Esc).
- **Release:** bump the version with `scripts/bump_version.sh` and run `scripts/test.sh`.

---

## Section 6 — Honesty & Limitations

### Not verified in this session
- **Real devices:** iOS Safari, Android Chrome and the installed PWA. D-03 (pointercancel), D-04 (focus zoom), the Back half of D-05, and safe-area insets are backed by specs, docs and code. They weren't observed on a device.
- **Frame timing:** none collected. The browser pane was in the background (`requestAnimationFrame` throttled to 6/s), so D-08 and D-10 are static findings.
- **Card height range (D-06):** 429–486 px depending on width and photo load state. The 46 px gap between the sum of the parts and the 486 px measured at 375 px wasn't traced.
- **Couple mode:** simulated client-side with demo chat and period data. No backend writes.
- **Drive thumbnails:** several failed or retried in the test browser. The fallback worked, but whether they fail on your phones is unknown (same as the old UI-01).
- **Sources:**
  - Rows 1 and 7: abstracts and records only.
  - Row 3: seen through search; the direct fetch failed.
  - Row 4: search summaries of the APG.
  - Row 8: secondary sources, not m3.material.io itself.
  - Row 6: a developer blog, because no Apple documentation was found.
  - Row 9: carried over from the previous plan, not re-checked.
  - The MDN pages (rows 2 and 5) were fetched and read.
- **Not inspected this session:** the lightbox and pinch-zoom on phones, the "Ngày này năm xưa" strip (hidden in today's data) and the toast position.

### Assumptions to confirm before coding
1. **Header ×:** OK to keep the header × and remove the injected one (D-02)?
2. **Chat as `<dialog>`:** OK to turn chat into a native `<dialog>`, so Back closes it (D-05)?
3. **Dark mode:** OK to add dark mode with **light as the default**, plus a manual toggle in Settings (D-09)?
4. **Hero merge:** OK to merge the hero into one strip (`587 ngày · 14:22:07`) instead of four boxes (D-06)?
5. **Photo shape:** 4:5 portrait photos in the feed (more photo, taller card), or keep 6:5?
6. **One action per sheet:** in the period alert, does dismissing the sheet count as "Đã nhớ rồi" (D-12)?
