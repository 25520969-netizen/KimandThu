# Kim & Thư — Mobile UI Redesign Plan (v4.6 baseline)

Goal: a prettier, calmer, smoother phone UI that keeps every existing feature and the pink-and-hearts identity.
Status: **plan only — no source file was changed.** Written per `Covan.md` (evidence first, English, verified sources).

---

## Section 1 — Executive Summary & Audit Scope

### 1.1 What the UI is today
After Phases 1–3 the app already has a bottom tab bar with a centre heart FAB, a sticky counter pill, feed/grid
Moments, bottom-sheet forms, 44 px targets and `prefers-reduced-motion` support. The remaining problems are
**density and hierarchy**, not missing features:

- **Late content:** the first memory photo only starts at y = 636 px on a 375 × 812 screen.
- **Cramped badges and buttons:** badges on top of the photo wrap onto 3 lines, the GPS tool buttons wrap onto
  5–6 lines, and the chat header is crowded.
- **Visual noise:** many decorative layers compete with the photos.

### 1.2 Five changes with the biggest effect
1. **Photo-first cards:** move the date, place and sender metadata off the photo into one line under it, merge the nested story frame into the card, and add a pink fallback when a photo fails to load.
2. **Compact headers:** a one-line section header and a compact hero card, so the first photo appears in the first screen.
3. **Single-line tool chips:** turn the Places GPS tools into one row of chips, and make chat full screen on phones.
4. **One design system:** colour roles, spacing, a type scale, two shadow levels and one icon style, all still pink with hearts as the signature.
5. **Smooth motion:** animate only transform and opacity, keep each tab's scroll position, and add soft cross-fades and swipe-to-close sheets.

### 1.3 Scope inspected
| File | What was read |
|---|---|
| `index.html` | all 769 lines |
| `src/styles/app_shell.css` | all 563 lines |
| `src/ui/app_shell.js` | all 99 lines |
| `styles.css` | targeted ranges: L57-82, L762-780, L826-885, L1005-1025, L2056-2075, plus grep for `transition: all`, `:hover`, `@keyframes`, `animation:`, `font-weight`, `background-attachment` |
| `app.js` | `applyAuthMode` L574-600, card template L1433-1473, `switchView` L1925-1985, petals L2874-2925, defaults L9-16 and L65 |
| `google-apps-script.js` | L131-135 (Drive sharing and thumbnail URL) |
| `sw.js` | precache list |

### 1.4 Verification method

**Executed (dynamic)**
- Served the repo locally with `python3 -m http.server 8765 --bind 127.0.0.1`.
- Opened it in the built-in Chromium browser with phone emulation at 375 × 812 and a light colour scheme.
- **Guest mode:** used the live public timeline data that the deployed backend returns without a passcode.
- **Couple mode:** simulated client-side only, with `journeyApp.isAuthenticated = true; journeyApp.applyAuthMode()`. No passcode was sent and no private data was read. Chat and period content shown are the built-in demo defaults (`app.js:65`).
- **Measurements:**
  - element sizes with `getBoundingClientRect`
  - image load state with `naturalWidth` and `new Image()`
  - frame times during a 90-frame programmatic scroll (`requestAnimationFrame`)
- **Screenshots:** home, scrolled feed, Places, the "Bạn là ai?" sheet, the new-moment sheet, the chat drawer and the period sheet.

**Static only**
- **Real phones:** iOS Safari and Android Chrome behaviour, safe areas and real GPU cost were not tested, because no device was available in this session.

---

## Section 2 — Verified Findings (UI Defect Report)

IDs use the `UI-` prefix so they don't clash with the earlier audit (`UX-`, `BUG-`).

### High

**[UI-01] Memory photos have no failure fallback**
- **Severity & category:** High | Visual reliability
- **Location:** `app.js:1433`
- **Evidence:**
  - The image is rendered as `<img src="${…imageUrl}" alt="${…title}" loading="lazy">` with no `onerror` handler.
  - In the test browser, all 6 Drive thumbnails (`https://drive.google.com/thumbnail?id=…&sz=w1200`) failed: `naturalWidth = 0`, and a fresh `new Image()` fired `onerror`.
  - Each card showed the browser's broken-image icon, and the alt text ("Bún bò 149.") overlapped the date badge.
- **Root cause & impact:**
  - **Cause not identified:** the files are shared publicly (`google-apps-script.js:131`), so the failure in this browser could be the Drive thumbnail endpoint's cookie or rate-limit behaviour. *Not verified on the phones.*
  - **Missing fallback (verified):** whenever a photo fails, for example offline or when Drive is throttled, the main content of the card looks broken.

**[UI-02] Photo overlay badges collide at phone width**
- **Severity & category:** High | Layout
- **Location:**
  - `styles.css:830-858` (`.locket-photo-overlay`, `.locket-sender-badge`, `.locket-loc-badge`)
  - `app.js:1442`
  - `src/styles/app_shell.css:349-357`
- **Evidence:** at 375 px, three pills share a 305 px row on top of the photo:
  - **Date chip:** 100 × 64 px, 3 lines.
  - **Sender badge:** 50 × 82 px. "Kim & Thư" breaks into 3 lines inside a grey `rgba(0,0,0,.52)` pill, the only grey surface in a pink UI.
  - **Location badge:** 143 × 63 px, 3 lines.
- **Root cause & impact:**
  - **Cause:** desktop-sized metadata is squeezed into a single flex row on the photo.
  - **Impact:** it covers about a quarter of the photo, is hard to read, and looks cluttered.

**[UI-03] Content starts too low, and each card fills a whole screen**
- **Severity & category:** High | Information hierarchy
- **Location:**
  - `index.html:102-160` (hero and section header)
  - `app.js:1453-1473` (story frame and footer)
  - `styles.css:883-885` (dashed inner frame)
- **Evidence (measured):**
  - **Home:** the hero is 263 px and the Moments section header is 190 px (pill tag + title + view toggle + "Gửi khoảnh khắc mới" button). The first card starts at y = 636 px. With the 64 px tab bar, only about 110 px of the first card is visible without scrolling.
  - **Card:** 567 px tall. That is a 325 px photo plus a second dashed card inside it, plus a filler footer "❤️ Lưu giữ theo thời gian" (`app.js:1471`).
  - **Places:** the header is 360 px tall, and each place card is 221 px.
- **Root cause & impact:**
  - **Cause:** desktop section headers kept on phones, a duplicate add button (the heart FAB already proxies to it, `src/ui/app_shell.js:37-44`), and nested card-in-card framing.
  - **Impact:** scrolling about 1 card per screen, which works against a photo-first app.

### Medium

**[UI-04] The Places GPS tools are squeezed into a narrow column**
- **Severity & category:** Medium | Layout
- **Location:**
  - `src/styles/app_shell.css:397-436`
  - `index.html:195-243`
- **Evidence:**
  - The wrapper renders 177 px wide beside the 166 px "Thêm địa điểm" button, even though the CSS asks for `flex: 1 1 100%`.
  - Each of the 3 tool buttons is 48–57 px wide and 110 px tall, and "Đã đến nơi này chưa?" wraps onto 6 lines (see screenshot).
- **Root cause & impact:**
  - **Cause:** the parent `.places-controls-bar` still lays the tools and the add button out side by side.
  - **Impact:** the labels are hard to read, and the row looks broken.

**[UI-05] The chat drawer is cramped on phones**
- **Severity & category:** Medium | Layout
- **Location:**
  - `src/styles/app_shell.css:194-203`
  - `index.html:661-706`
- **Evidence:**
  - The header is 100 px tall: the status line "💗 Thư nhắn lúc 2/4/2025" wraps onto 2 lines, and the "Tôi là: Kim" toggle (63 px) and the "⏳ Thư" button wrap their labels.
  - The text input is only 179 px wide, so the placeholder is cut off ("Nhắn gì đó cho người yê…").
  - The drawer is 359 × 560 px and floats over the page without a backdrop. The heart FAB of the tab bar sits against its bottom edge.
- **Root cause & impact:**
  - **Cause:** a desktop-style floating panel.
  - **Impact:** typing space is small, and two layers compete for attention.

**[UI-06] Bottom sheets stack redundant full-width buttons**
- **Severity & category:** Medium | Interaction
- **Location:**
  - `src/styles/app_shell.css:465-473`
  - `index.html:346-349`, `index.html:542-550`
- **Evidence:**
  - Every sheet shows a 48 px "Hủy" button above the 48 px primary button.
  - The period sheet stacks 3 full-width buttons: "Đánh dấu hôm nay", "Đóng" and "Lưu".
  - The drag handle (`::before`, L455-463) is purely decorative: there is no swipe-to-close.
- **Root cause & impact:**
  - **Cause:** desktop two-button footers were converted into a vertical stack.
  - **Impact:** about 110–170 px of each sheet is spent on actions, and the sheet affords a swipe it doesn't support.

**[UI-07] Switching tabs always jumps to the top and re-renders**
- **Severity & category:** Medium | Navigation smoothness
- **Location:** `app.js:1951-1954` and `app.js:1978`
- **Evidence:**
  - Both branches of `switchView` call `window.scrollTo({ top: 0, behavior: "smooth" })`.
  - The Places branch also calls `renderPlaces()` and `calculateAllDistancesAndRoutes(false)` on every switch.
- **Root cause & impact:**
  - **Impact:** after scrolling deep into Moments, a quick look at Places loses your place in the feed. The smooth-scroll animation also replays on every tab tap.

**[UI-08] Hover effects run on touch screens**
- **Severity & category:** Medium | Interaction polish
- **Location:** `styles.css`, e.g. L776 `.locket-card:hover { transform: translateY(-3px) … }`
- **Evidence:** 38 `:hover` rules in `styles.css`, and 0 `@media (hover: hover)` guards in either stylesheet.
- **Root cause & impact:**
  - **Cause:** mobile browsers apply `:hover` on tap, and it stays applied until the user taps elsewhere.
  - **Impact:** cards and buttons stay lifted or highlighted after a tap, which reads as a glitch.

**[UI-09] High visual complexity from competing decorations**
- **Severity & category:** Medium | Aesthetics
- **Location:**
  - **Petal canvas:** `app.js:2874` (`PETAL_COUNT = 12`)
  - **Infinite animations:** `styles.css` L126, 370, 518, 604, 971, 1406, 1967, 2041, 2124
  - **Shadows:** 54 `box-shadow` declarations in `styles.css`
  - **Emoji and SVG icons mixed:** `index.html:42-44`, `index.html:746-751` (emoji) vs `index.html:154`, `index.html:275` (SVG)
- **Evidence:**
  - Each section repeats pill tag + display title + description.
  - At least 9 elements pulse or beat forever.
- **Root cause & impact:**
  - **Cause:** decoration was added feature by feature without a shared system.
  - **Impact:** perceived visual complexity is the strongest predictor of first-impression appeal (Reinecke et al., 2013; see Section 4), so the clutter costs the "đẹp, thuận mắt" goal directly.

### Low

**[UI-10] `transition: all` in 9 places**
- **Severity & category:** Low | Smoothness
- **Location:** `styles.css` L724, 1076, 1112, 1147, 1247, 1637, 1779, 2159, 2696
- **Evidence:** grep count = 9.
- **Root cause & impact:** layout properties (width, padding, height) animate as well whenever they change, which can trigger layout and paint every frame. web.dev recommends animating only `transform` and `opacity`.

**[UI-11] Scroll-time paint cost**
- **Severity & category:** Low | Performance (static analysis only)
- **Location:**
  - `background-attachment: fixed` with 3 radial gradients: `styles.css:57-64`
  - Two always-visible `backdrop-filter` bars: `src/styles/app_shell.css:29-30` and `101-102`
  - A full-screen petal canvas
- **Evidence:**
  - Desktop Chromium scrolled smoothly: median 8.3 ms per frame, p95 9.1 ms, 0 of 89 frames over 20 ms.
  - This is **not** representative of a mid-range phone, so treat it as a risk, not a measured defect.
- **Root cause & impact:** fixed backgrounds and blur under scrolling content are well-known repaint hot spots on low-end GPUs.

**[UI-12] Emoji used as interface icons**
- **Severity & category:** Low | Visual consistency
- **Location:** `index.html:42-44` (⚙️ 🎵 🔒) and `index.html:746-751` (📸 📍 💌 🍓 🔐)
- **Evidence:** the screenshots show multicolour emoji in the chrome next to pink line-SVG icons inside the forms.
- **Root cause & impact:** emoji glyphs differ between iOS, Android and Windows and ignore the colour tokens, so the app chrome never looks unified.

**[UI-13] Oversized images**
- **Severity & category:** Low | Performance
- **Location:** `google-apps-script.js:135` (`sz=w1200`)
- **Evidence:**
  - The feed frame is 325 CSS px, about 650–975 device px.
  - Grid cells are about 115 CSS px but request the same 1200 px images.
- **Root cause & impact:** more data and slower decoding than needed, mostly in grid view.

**[UI-14] Font payload**
- **Severity & category:** Low | Performance
- **Location:** `index.html:22`
- **Evidence:**
  - **Loaded:** 3 families and 11 weight/style combinations (Caveat 500/700, Outfit 300–700, Playfair Display 500/700 plus italic 400/600).
  - **Used:** CSS only uses weights 400, 500, 600 and 700. Which family uses which weight was not fully traced.
- **Root cause & impact:** extra font downloads on first visit.

---

## Section 3 — Remediation Plan (How to Fix)

| Defect | Proposed fix | Verification | Risk & mitigation |
|---|---|---|---|
| UI-01 | Add an `error` listener when rendering cards. The CSP forbids inline handlers, so attach it in JS after `innerHTML`. On error, swap in a pink gradient placeholder with a heart and the title (the same style as `.locket-photo-placeholder`), and retry once with `sz=w800`. While loading, show a static pink "skeleton" tint, animated only when reduced motion is off. | Unit test: the render helper outputs a placeholder for an image that fails. Manual: block `drive.google.com` and confirm no broken-image icons. | Low. Keep the alt text for accessibility (`alt=""` plus a visually hidden title for the placeholder). |
| UI-02 | Remove the overlay pills from the photo. Add a **meta row** under the photo: `📅 25/10 · 17:09 · 📍 Tô Hiến Thành` on one line with ellipsis, and a small "K♥T" sender avatar on the right. Keep one floating chip on the photo (date) in grid view only. The location stays a link. | At 360/375/414 px, no meta element is taller than 24 px (one line). | Medium: the location link must stay tappable at ≥ 44 px height, so pad the row's hit area. |
| UI-03 | (a) **Hero card ≤ 190 px:** names + heart on one line, quote under it, the counter as one row with a large day number and smaller hh:mm:ss, the milestone line, and the period chip inside the card. (b) **Section header on one line:** "Khoảnh khắc" + an icon segmented toggle; remove the pill tag. Keep `#open-add-memory-modal-btn` in the DOM but visually hidden for couples, because the FAB proxies to it. Guests see a small "🔐 Mở khóa để thêm" link instead. (c) **Card:** one surface, no dashed inner frame, no filler footer, title + 3-line story + action row (♥, "Xem thêm", ⋯ menu for couples). | Target at 375 × 812: first card top ≤ 400 px, card height ≤ 460 px, Places header ≤ 200 px. Measure with the same `getBoundingClientRect` script. | Medium: the FAB proxy targets (`app_shell.js:41-42`) must still exist. Add a test that asserts both IDs are present. |
| UI-04 | Put the GPS tools in a full-width row of 3 one-line **chips** ("Gần nhất", "Đã đến chưa?", "Nơi đang đứng"), horizontally scrollable if needed. Remove the separate "Thêm địa điểm" button (the FAB covers it on Places; keep the hidden proxy target). | Each chip is a single line and ≥ 44 px tall at 360 px width. | Low. |
| UI-05 | On phones (≤ 640 px) make chat a **full-screen sheet** (`100dvh`, safe-area padding) with a backdrop, and hide the tab bar while it's open. Header 56 px: avatar, name, a one-line last-active text with ellipsis, a ⏳ icon button, and a ⋯ overflow holding "Tôi là: …". The ❤️ quick-heart and send buttons swap (send appears only when text is typed), so the input gets about 250 px. | Input width ≥ 240 px at 375 px. Header ≤ 60 px. Back gesture, Esc and the × button close it. | Medium: closing via the browser Back button needs a `history` state, which `switchView` already uses. Reuse that pattern. |
| UI-06 | Show only the primary button, full width, sticky at the bottom of the sheet. Close with ×, a backdrop tap, Esc or swipe-down (pointer events, `transform: translateY`, close past 30 % or fast flick). In the period sheet, put "Hôm nay" as a chip next to the date field and a − 28 + stepper for cycle length. Move "Đặt lại mặc định" to a small text link with a confirm step. | Sheet action area ≤ 72 px. Swiping down 40 % closes it; less snaps back. Esc still works (native `<dialog>`). | Medium: the memory sheet must stop the camera on every close path. Hook the dialog's `close` event, not the buttons. |
| UI-07 | Store `scrollY` per view in a map. On switch, restore it instantly (no smooth scroll). Only re-run distance calculation when the location or places changed, using the existing route cache. | Scroll Moments to 2,000 px, switch to Places and back, and confirm y is about 2,000. | Low. |
| UI-08 | Wrap every hover-only visual rule in `@media (hover: hover) and (pointer: fine)`. Add `:active { transform: scale(.97) }` press feedback for touch. | grep: 0 unguarded `:hover` rules that change transform or shadow. Tap a card on a phone and confirm it doesn't stay lifted. | Low. |
| UI-09 | Introduce the **design system** in Section 4.3: one accent role per region, two shadow levels, one icon style. Keep ambient motion to the hero heart beat, double-tap heart bursts and petals reduced to 6 (paused while scrolling or hidden). Drop the other infinite pulses. | Count of infinite animations ≤ 2. `box-shadow` values come only from tokens. | Low. Hearts stay as the signature, just used more selectively. |
| UI-10 | Replace `transition: all` with explicit lists, e.g. `transition: transform .2s, opacity .2s, background-color .2s`. | grep `transition: all` = 0. | Low. |
| UI-11 | Drop `background-attachment: fixed`: paint the gradient on a `position: fixed` pseudo-element instead, which composites as a layer. Make the header and tab bar solid at 97 % opacity, without blur, on small screens, or keep the blur only above `(min-width: 768px)`. | Chrome DevTools Rendering → Paint flashing on a phone: no full-page repaint while scrolling. | Low. Same look; the blur is barely visible at 96 % opacity anyway. |
| UI-12 | Replace the emoji in the header and tab bar with hand-drawn inline SVG line icons in the project (no external library, so the CSP stays the same). Use a filled pink heart for the active tab indicator and the FAB. Emoji stay in content: chat, stories and toasts. | Visual check on iOS and Android screenshots: the chrome icons look identical. | Low. Labels stay for accessibility. |
| UI-13 | Rewrite the Drive URLs client-side: `sz=w800` for the feed, `sz=w400` for the grid and "Ngày này năm xưa". No backend redeploy is needed, because the URLs stored in the sheets still work. | Bytes per grid image drop (measure in DevTools). | Low. |
| UI-14 | Trim the Google Fonts URL to the weights actually used, aiming for ≤ 6 files: Outfit 400/600/700, Playfair Display 700 + italic 400 (quote), Caveat 500. | Network panel: ≤ 6 font files. | Low. First check every `font-family` + `font-weight` pair. |

---

## Section 4 — Research-Backed Design Direction

### 4.1 Literature reviewed
| # | Title | Authors, year | Venue | URL | Relevance |
|---|---|---|---|---|---|
| 1 | Predicting users' first impressions of website aesthetics with a quantification of perceived visual complexity and colorfulness | Reinecke, Yeh, Miratrix, Mardiko, Zhao, Liu, Gajos, 2013 | ACM CHI 2013 | https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf | 450 sites rated by 548 volunteers. Complexity and colourfulness models explain about half the variance in appeal, and **visual complexity matters far more than colourfulness**. → Keep the pink, cut the clutter (UI-09, UI-03). |
| 2 | Assessing dimensions of perceived visual aesthetics of web sites | Lavie & Tractinsky, 2004 | Int. J. Human-Computer Studies 60(3) | https://doi.org/10.1016/j.ijhcs.2003.09.002 | Perceived aesthetics has two dimensions: **classical** (orderly, clear) and **expressive** (creative, original). → A classical, orderly layout grid with the expressive pink/heart layer on top. |
| 3 | Target size study for one-handed thumb use on small touchscreen devices | Parhi, Karlson, Bederson, 2006 | MobileHCI 2006 | https://dx.doi.org/10.1145/1152215.1152260 | Verified in the earlier audit: 9.2 mm (single targets) and 9.6 mm (serial targets). → Keep ≥ 44 px targets while compacting (UI-04, UI-05). |
| 4 | All You Need is Love: Current Strategies of Mediating Intimate Relationships through Technology | Hassenzahl et al., 2012 | ACM TOCHI | https://dblp.dagstuhl.de/pid/24/5118.html | Verified earlier: expressivity, gift giving and memories are core strategies. → Hearts stay meaningful (double-tap, FAB, active tab) rather than ambient everywhere. |
| 5 | The effect of skeleton screens | Mejtoft, Långström, Söderström, 2018 | ECCE 2018 (ACM) | https://nngroup.com/articles/skeleton-screens/ (summary) | Skeletons were rated higher than spinners for perceived speed. **Contested:** a 2017 Viget industry test found the opposite (https://viget.com/articles/a-bone-to-pick-with-skeleton-screens). → Use only a quiet, static pink tint for image slots, not shimmering skeletons everywhere (UI-01). |
| 6 | How to create high-performance CSS animations | Google web.dev | Industry guide | https://web.dev/articles/animations-guide | Animate only `transform` and `opacity`. In its demo, `top`/`left` dropped 50 % of frames vs 1 % with `transform`. Use `will-change` sparingly. → UI-10, UI-11, sheet and tab motion. |
| 7 | Navigation bar usage, Material 3 (via SAP Fiori for Android and the Jetpack Compose reference) | Google / SAP | Design guidance (secondary) | https://www.sap.com/design-system/fiori-design-android/v26-1/components/m3-standard-components/navigation-bar/usage | 3–5 destinations; with 4–5, the active item always shows its label. → The current 4 tabs + FAB fit. Keep labels short. |
| 8 | `Document.startViewTransition()` | MDN | Web platform docs | https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition | Marked "Baseline 2025, newly available". → Cross-fade between tabs as a progressive enhancement, with the current instant switch as the fallback. |

Items 1, 2, 5 and 7 were checked from abstracts or summaries, not full texts (see Section 6).

### 4.2 Design principles
1. **Photos first, chrome second.** The photo is the hero of every Moment. Metadata sits *under* it, never on it (UI-02, UI-03).
2. **Classical structure, expressive skin** (Lavie & Tractinsky): a strict 4 px spacing grid and one card style, then the pink tones, rounded shapes, handwriting font for stories, and hearts.
3. **Less, but louder** (Reinecke et al.): fewer simultaneous decorations, so the remaining hearts carry more emotion.
4. **Thumb zone:** every frequent action sits in the bottom half: tab bar, FAB, sheet primary button and chat send.
5. **Compositor-only motion** (web.dev): transform and opacity only, 150–300 ms, and everything respects reduced motion.

### 4.3 Design system (tokens to add in `src/styles/app_shell.css` or a new `src/styles/tokens.css`)
**Colour roles (pink kept)**

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--surface` | `#fff8fa` | page background, solid (replaces 3 fixed radial gradients) | — |
| `--surface-card` | `#ffffff` | cards and sheets | — |
| `--pink-tint` | `#ffeef3` | chips, selected states, image placeholders | — |
| `--pink-line` | `#ffd1dc` | borders and dividers | — |
| `--pink-heart` | `#ff4d6d` | decorative hearts and illustrations only, never small text | 3.21:1 on white, measured earlier |
| `--pink-action` | `#c9184a` | buttons, links, active tab, FAB | white text 5.66:1 (from the existing CSS note) |
| `--text` | `#3d2b35` | main text | — |
| `--text-soft` | `#7a5f6c` | secondary text | AA, from the existing UX-03 fix |

**Spacing:** 4, 8, 12, 16, 24, 32 px. Phone gutter 16 px.

**Radius:** chips 999 px, cards 16 px, photos 14 px, sheets 24 px at the top.

**Elevation, only two levels:**
- `--shadow-1: 0 1px 2px rgba(201,24,74,.06), 0 4px 12px rgba(201,24,74,.06)` for cards
- `--shadow-2: 0 8px 24px rgba(201,24,74,.16)` for the FAB and sheets

**Type scale** (Outfit for UI, Playfair Display for titles, Caveat for stories only):

| Role | Font | Size and weight |
|---|---|---|
| Hero names | Playfair Display | 28 px / 700 |
| Section title | Playfair Display | 20 px / 700 |
| Card title | Outfit | 17 px / 600 |
| Story | Caveat | 20 px / 500, 3-line clamp |
| Body | Outfit | 15 px / 400 |
| Meta and chips | Outfit | 13 px / 600 |
| Tab label | Outfit | 11 px / 600 |

**Icons:** one hand-drawn inline SVG set (2 px stroke, round caps, 24 px box) for the chrome. A filled heart is the only filled icon: FAB, active-tab dot and like.

**Motion:**

| Token | Duration | Used for |
|---|---|---|
| `--dur-fast` | 150 ms | press feedback, tab cross-fade |
| `--dur-med` | 240 ms | sheet in/out, chat open |
| `--dur-slow` | 400 ms | heart burst |

- **Easing:** `cubic-bezier(.2,.8,.2,1)`.
- **Ambient motion:** only the hero heart and 6 petals.

### 4.4 Screen-by-screen layout (375 px baseline)

```
Moments (couple)                     Places
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ ♥ Kim & Thư          ♫   ⋯      │ │ ♥ 582 ngày · 04:35:38    ♫  ⋯   │  header 52px (pill when scrolled)
├─────────────────────────────────┤ ├─────────────────────────────────┤
│ ╭─────────────────────────────╮ │ │ Nơi muốn đến                    │
│ │   Kim ♥ Thư    “Iu béeee”   │ │ │ [ Muốn đi 2 | Đã đến 1 ]        │  segmented, full width
│ │   582 ngày  04:35:38        │ │ │ (◎ Gần nhất)(✓ Đã đến chưa?)(+ Nơi…)│ chips, one line
│ │   💞 Còn 18 ngày → 600 ngày │ │ │ ╭─────────────────────────────╮ │
│ │   🍓 Dự kiến 08–12/11       │ │ │ │ Ga Tàu Thuỷ Bạch Đằng       │ │
│ ╰─────────────────────────────╯ │ │ │ Ngắm hoàng hôn… (2 lines)   │ │
│ Ngày này năm xưa  ▸ [▢][▢][▢]   │ │ │ 2.4 km · 9 phút             │ │
│ Khoảnh khắc            [▤][▦]   │ │ │ [Chỉ đường] [TikTok] [✓] [⋯]│ │
│ ╭─────────────────────────────╮ │ │ ╰─────────────────────────────╯ │
│ │        PHOTO 4:5            │ │ │                                 │
│ │                             │ │ │                                 │
│ ├─────────────────────────────┤ │ │                                 │
│ │ 📅 25/10 · 17:09 · 📍 Tô H… K♥T│ │                                 │
│ │ Bún bò 149.                 │ │ │                                 │
│ │ “Cũm ngonnn”  (Caveat)      │ │ │                                 │
│ │ ♡  Xem thêm            ⋯    │ │ │                                 │
│ ╰─────────────────────────────╯ │ │                                 │
├─────────────────────────────────┤ ├─────────────────────────────────┤
│ 📷Khoảnh khắc 📍Nơi  (♥)  💌Chat 🍓Bé │  tab bar 64px + safe area, SVG icons
└─────────────────────────────────┘ └─────────────────────────────────┘
```

- **Chat:**
  - Full-screen sheet with a 56 px header, the message list, and an input bar holding 📷, the text field and ♥/send.
  - Bubbles: own messages in `--pink-action` with white text, the partner's on `--pink-tint` with `--text`.
  - Messages from the same sender within 5 minutes are grouped, with the time shown once.
- **Sheets:** grab handle, title, ×, fields, then a sticky primary button. Swipe down to close.
- **Guest mode:** the same layout without the FAB or couple-only tabs. A soft "🔐 Mở khóa" tab replaces Chat/Bé (as now).

### 4.5 Smoothness techniques
- **Tab switch:** `document.startViewTransition(() => switchView(...))` when available. CSS `::view-transition-old/new(root)` cross-fades in 150 ms. Fall back to the current instant switch, with no scroll-to-top (UI-07).
- **Sheet motion:** `translateY(100%) → 0` and a backdrop `opacity 0 → .4`. Drag follows the finger via pointer events, and `will-change: transform` is set only while dragging.
- **Long feeds:** `content-visibility: auto; contain-intrinsic-size: 0 460px` on `.locket-card` lets the browser skip off-screen cards.
  - This is a progressive enhancement; browser support should be checked before relying on it, and wasn't verified in this session.
- **Images:** keep `loading="lazy"`, add `decoding="async"`, and size per view (UI-13). The frame has a fixed aspect ratio, so there is no layout shift.
- **Counter:** the existing once-per-second update is cheap. Keep `font-variant-numeric: tabular-nums` so the digits don't jiggle.

---

## Section 5 — Phased Implementation Roadmap

### Phase A — Quick fixes (about 1–2 days, CSS + small JS)
- **Scope:** UI-01, UI-02, UI-04, UI-06 (button stack only), UI-07, UI-08, UI-10.
- **KPIs at 375 × 812:**
  - No metadata pill or chip taller than one line.
  - GPS chips on one line.
  - Tab switch keeps the scroll position.
  - `grep "transition: all"` = 0.
  - 0 hover transforms outside `(hover: hover)`.
  - No broken-image icons when Drive is blocked.

### Phase B — Design system and layout (about 3–5 days)
- **Scope:** tokens (4.3), SVG icon set (UI-12), compact hero and one-line section headers (UI-03), card redesign, Places card actions, full-screen chat (UI-05), swipe-to-close sheets (UI-06), trimmed fonts (UI-14).
- **KPIs:**
  - First card top ≤ 400 px.
  - Card height ≤ 460 px.
  - Places header ≤ 200 px.
  - Chat input ≥ 240 px.
  - ≤ 6 font files.
  - All text ≥ 4.5:1 (extend the existing contrast test in `tests/`).
  - Every feature still reachable: checklist below.

### Phase C — Smoothness and polish (about 2–3 days)
- **Scope:** view transitions, ambient-motion reduction (UI-09), background and blur cleanup (UI-11), image sizing (UI-13), `content-visibility`, real-device pass.
- **KPIs:**
  - On one mid-range Android phone and one iPhone, scrolling a 30-memory feed drops < 5 % of frames (DevTools remote performance trace).
  - Paint flashing shows no full-page repaint on scroll.
  - Infinite animations ≤ 2.
  - Grid image bytes reduced vs `sz=w1200` (before/after measured).

### Feature-preservation checklist (run after every phase)
**Moments**
- Add a moment by camera, gallery or desktop webcam.
- GPS auto-location.
- Feed and grid views.
- Month separators.
- Lightbox.
- Double-tap hearts.
- Delete (couple).
- "Ngày này năm xưa".

**Counter**
- Live counter, sticky pill and milestone line.

**Places**
- Muốn đi / Đã đến filter.
- Sort by distance.
- "Đã đến chưa?".
- Add current location.
- Chỉ đường and TikTok links.
- Mark visited, which links to a moment.
- Delete.

**Chat**
- Text, image, quick heart, sender switch, last-activity line, unread dot, vibration.

**Couple and settings**
- Timed notes.
- Period care: status, history, prediction window, mark today, alert.
- Settings: names, start date, quote, auto-unlock link, backend URL, reset.
- Guest/couple lock and unlock.
- "Bạn là ai?" prompt.
- Music toggle.

**App**
- Offline shell (service worker).
- Back button between tabs.
- **After any change:** bump `CACHE_VERSION` and the `?v=` strings via `scripts/bump_version.sh`, and run `scripts/test.sh`.

---

## Section 6 — Honesty & Limitations

### Not verified
- **Real phones:** iOS Safari and Android Chrome were not tested. Everything was measured in desktop Chromium with 375 × 812 emulation. Safe-area insets, real GPU cost of blur and fixed backgrounds, and the iOS keyboard pushing the chat input were not observed.
- **Drive photo failure (UI-01):**
  - **Unknown:** the cause, and whether it happens on your phones.
  - **Certain:** the missing fallback.
- **Couple mode:** the UI was viewed by flipping the client flag only, with demo chat and period data. No real backend writes or reads happened in couple mode.
- **Scroll smoothness numbers:** desktop only (median 8.3 ms per frame). The phone KPIs in Phase C still need a baseline measurement.
- **Font weights:** which family uses which weight was not fully traced (UI-14).
- **`content-visibility` support:** browser support was not checked in this session.
- **Sources:**
  - Reinecke et al. 2013, Lavie & Tractinsky 2004 and Mejtoft et al. 2018 were checked from abstracts or summaries, not full texts.
  - The Material 3 navigation guidance came from secondary sources (SAP Fiori, Compose docs), not material.io.
  - The web.dev guide was fetched and read.

### Assumptions to confirm before coding
1. **SVG icons:** OK to replace the emoji icons in the header and tab bar with pink SVG line icons? Emoji stay in chat and stories, and hearts stay everywhere they carry meaning.
2. **Full-screen chat:** OK to make chat full screen on phones and hide the tab bar while it is open?
3. **No "Hủy" buttons:** OK to remove the "Hủy" buttons from sheets? You would close with ×, swipe down, a backdrop tap or Back.
4. **Less ambient animation:** OK to cut it to the hero heart plus 6 petals, and remove the other forever-pulsing elements?
5. **Delete in a menu:** OK to move delete buttons on cards into a "⋯" menu, so they're harder to tap by accident?
6. **No backdrop blur:** OK to drop the frosted-glass blur on the header and tab bar on phones, so they become solid near-white?
