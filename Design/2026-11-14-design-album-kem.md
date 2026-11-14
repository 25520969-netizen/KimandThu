# Kim & Thư — UI Design Spec: "Album Kem" (v6 visual redesign)

**Status:** design spec only. No source file was changed.
**Input for:** `/planner`, which turns this spec into code tasks.
**Direction chosen:** A, "Album Kem". The user confirmed it on 2026-11-14.
**Predecessors:** `UI_REDESIGN_PLAN.md` (Phases A–C) and `UI_MOBILE_PLAN.md` (Phase D). This spec replaces their *visual* decisions. Their behavioural work (one bottom-sheet behaviour, overlay stack, back gesture, 16 px fields) stays and is reused.

---

## 0. Grounding

**Product.** A private PWA for one couple (Kim and Thư):
- a love counter
- Moments, a photo diary
- Places, a wishlist with GPS tools
- private chat with timed notes ("Thư hẹn giờ")
- period care ("Bé")

**Audience.** Two people, mostly on **iPhone**, installed to the home screen. Guests (friends) can read Moments and Places in read-only mode.

**Primary job.** Open the app and *see our story*: how long we have been together, and our latest photos. Secondary jobs are adding a moment, planning where to go next, and chatting.

**Stack, as found in the code** (reuse, don't replace):
- vanilla JS SPA: `index.html`, `app.js`
- plain CSS in four layers: `src/styles/tokens.css` → `styles.css` → `src/styles/app_shell.css` → `src/styles/redesign.css`
- native `<dialog>` used for 11 sheets
- inline SVG icons already present in the header and tab bar
- fonts: Playfair Display, Outfit and Caveat, from Google Fonts

**User decisions (2026-11-14):**

| Question | Answer |
|---|---|
| How much pink | Pink as **accent only** (warm cream base) |
| Overall feel | **Refined photo album** |
| Devices | **Mostly iPhone** |
| Effects to keep | **Falling petals** (lighter) and **handwriting (Caveat)**. Music stays as a header toggle. Heart-pulse and other ambient loops go. |

### 0.1 Evidence: what is wrong today

**Executed.** The local server `kimthu-static` (port 8765), opened in the built-in Chromium browser, emulating 375 × 812 with touch in a light scheme. Guest mode used live public data. Couple mode was simulated on the client only (`journeyApp.isAuthenticated = true; applyAuthMode()`). No passcode was sent and nothing was written to the backend.

**Not executed.** A real iPhone (safe areas, focus zoom, swipe gestures) and the full dark theme pass.

| ID | Finding | Evidence |
|---|---|---|
| E-01 | **Pink-on-pink everywhere.** Background, cards, borders, buttons, headings and the counter boxes are all pink tints, so nothing stands out and the page reads as faded. | Screenshots of Moments and Places. Tokens `--surface #fff8fa`, `--pink-line #ffd1dc` and `--pink-action` are used for text, borders and fills alike. |
| E-02 | **Photo fallback dominates the feed.** When a Drive thumbnail fails, each card shows a 6:5 pink gradient box with a ❤️. A feed of failed photos looks empty. | All 11 memories have `image` URLs. In the test browser every thumbnail failed, and the cards rendered `.locket-photo-placeholder` (`redesign.css` L20–22, aspect ratio L15–18). |
| E-03 | **Chat close button clipped.** The header holds the avatar, name, "⏳ Thư", "Tôi là: Kim" and ×. The × is cut off at the right edge at 375 px. | Chat screenshot, couple mode. |
| E-04 | **Orphan "+" on Places.** The add button sits alone on its own row, leaving a ~60 px gap between the GPS tools and the first card. | Places screenshot, guest mode. |
| E-05 | **Place card crowding (couple mode).** Three action buttons and a × delete button sit beside the title, which squeezes the title onto two lines. | Places screenshot, couple mode. |
| E-06 | **Two dialogs open at once on unlock.** `period-alert-modal` and `who-am-i-modal` were both `[open]` right after `applyAuthMode()`. | `document.querySelectorAll('dialog[open]')` returned both ids. Source: `app.js` `applyAuthMode()` calls `checkPeriodAlert()` and then `promptSenderIfNeeded()`. |
| E-07 | **Boxes inside boxes.** The counter is 4 boxed cells inside a card. Photos have an inner frame inside the card. Place cards add a dashed divider. | Screenshots. |
| E-08 | **Emoji used as icons in controls** (🗺️ 🎵 ✨ 🌸 🍓 📷 ❤️ ⏳), mixed with SVG line icons. A solid black TikTok pill clashes with the palette. | Screenshots. `index.html` L143, L487, L514. |
| E-09 | **Crowded Moments toolbar.** "Khoảnh khắc", the Dòng/Lưới switch and a floating "+" share one row. The "+" circle is not aligned with anything. | Moments screenshot. |

---

## 1. Design principles for this app

1. **The photos are the colour.** The UI is cream, ink and one rose. Anything else colourful on screen should be the couple's own photos.
2. **One bold element per screen.** Moments: the day count. Places: the place name. Chat: the conversation. Bé: the cycle ring.
3. **One orchestrated motion moment:** the milestone celebration (petal burst plus the number rolling up) when a 100-day or anniversary milestone is reached, or when a moment is saved. The light petal drift is ambient and stays very quiet.
4. **Handwriting is for the couple's voice only:** quotes, story excerpts and notes. Caveat never appears on UI chrome.
5. **iPhone-native feel:** safe areas, a translucent tab bar, large-title pages, bottom sheets with grabbers, 44 pt targets and swipe-down to dismiss.

Things to avoid:
- gradients on surfaces
- emoji in buttons
- identical boxed card grids
- all-caps micro-labels (the current "CHÚNG MÌNH ĐÃ Ở BÊN NHAU ĐƯỢC" and "NHẮC NHỞ YÊU THƯƠNG" go)
- centring everything

---

## 2. Tokens

Tokens replace and extend `src/styles/tokens.css`. The old names (`--pink-*`, `--bg-*`, `--text-*`) become aliases of the new semantic tokens during migration, so legacy rules keep working until they are deleted.

### 2.1 Colour roles

Contrast is measured with the WCAG 2 formula against the background shown.

| Role | Token | Light | Dark | Use | Contrast (light / dark) |
|---|---|---|---|---|---|
| Background ("paper") | `--c-bg` | `#FBF7F2` | `#16110F` | page background | — |
| Surface | `--c-surface` | `#FFFFFF` | `#211A17` | cards, sheets, chat bubbles (partner) | — |
| Sunken surface | `--c-sunken` | `#F4EEE7` | `#2B2320` | inputs, chips, segmented-control track, photo loading | — |
| Text | `--c-text` | `#2B2024` | `#F3ECE6` | body and headings | 14.7 on bg / 16.0 on bg |
| Muted text | `--c-muted` | `#6F6166` | `#B5A8A0` | meta rows, timestamps, captions | 5.5 on bg, 5.1 on sunken / 8.1 on bg, 6.7 on sunken |
| Primary (rose) | `--c-primary` | `#C9184A` | `#FF7A9A` | primary buttons, active tab, day number, links, the heart | 5.3 on bg, 5.7 on white / 7.6 on bg |
| On primary | `--c-on-primary` | `#FFFFFF` | `#1A0F12` | text and icons on a primary fill | 5.7 / 7.6 |
| Primary soft | `--c-primary-soft` | `#FCE8EE` | `#3A1E26` | selected chip, own-message tint, milestone bar track | primary text on it: 4.8 / 6.1 |
| Accent (petal) | `--c-accent` | `#E85D75` | `#FF9DB3` | **decoration only**: petals, heart glyph fill, progress fill. Never used for text. | n/a |
| Success | `--c-success` | `#2F7D4F` | `#6FCF97` | "Đã đến" tick, synced state | 5.0 on white / 9.0 on surface |
| Warning | `--c-warn` | `#A15C00` | `#F2B45A` | "chưa đồng bộ" (not yet synced), offline banner | 5.2 / 9.4 |
| Danger | `--c-danger` | `#B42318` | `#FF8A80` | delete and error text | 6.6 / 7.5 |
| Divider | `--c-divider` | `#E9E1D9` | `#3A302B` | hairlines between list rows (decorative) | 1.3, decorative only |
| Control border | `--c-control` | `#8A7C80` | `#85766E` | input outline, secondary button outline, checkbox | 3.7 on bg / 3.9 on surface (≥ 3:1) |
| Focus ring | `--c-focus` | `#C9184A` | `#FF7A9A` | 2 px ring plus a 2 px bg-coloured offset | ≥ 3:1 |
| Scrim | `--c-scrim` | `rgba(43,32,36,.45)` | `rgba(0,0,0,.6)` | behind sheets and the lightbox | — |
| Glass (tab bar, header) | `--c-glass` | `rgba(251,247,242,.82)` + `blur(20px) saturate(1.4)` | `rgba(22,17,15,.78)` + same blur | sticky bars | — |

**Rules**
- **Pink appears in only five places:** the primary button, the active tab, the day number, the heart and links. If a screen has more pink than that, the design is wrong.
- **Status is never shown by colour alone.**
  - "Đã đến" uses a ✓ icon plus the word.
  - Sync state uses an icon plus "Chưa đồng bộ".
  - Period days use a filled dot plus the date number.
- **Dark mode is designed, not inverted.** It uses warm brown-black, not today's pink-brown `#1f1418`. Photos keep full brightness. Card shadows are replaced by the `--c-surface` lift and a 1 px `--c-divider` border.
- **`theme-color` meta:** `#FBF7F2` in light and `#16110F` in dark, using media-specific `<meta name="theme-color" media="(prefers-color-scheme: dark)">`. Today it is `#ff758f`, which makes the iOS status bar pink.

### 2.2 Typography

| Family | Role | Weights | Notes |
|---|---|---|---|
| **Playfair Display** (kept) | display: hero names, day number, page titles, card titles | 500, 700 | Has Vietnamese subset. Use `font-variant-numeric: lining-nums tabular-nums` on the counter. |
| **Be Vietnam Pro** (replaces Outfit) | UI and body text | 400, 500, 600 | Designed for Vietnamese diacritics. Outfit has no Vietnamese subset on Google Fonts (verified 2026-11-14: its `css2` response lists only `latin` and `latin-ext`; Be Vietnam Pro also lists `vietnamese`), so Vietnamese-only glyphs fall back to another font today. |
| **Caveat** (kept, restricted) | the couple's voice only: hero quote, story excerpt on cards, timed-note preview | 500 | **Exception to the 2-typeface rule, at the user's request.** Never used in buttons, labels or headings. |

Load with `display=swap` and `&subset=vietnamese`. Drop Outfit and Playfair italic 400 if it ends up unused.

**Type scale** (rem at a 16 px root; iOS Dynamic Type is respected through rem):

| Token | Size / line-height | Family / weight | Use |
|---|---|---|---|
| `--t-hero-num` | 4.5rem (72) / 1 | Playfair 700 | day count |
| `--t-display` | 2rem (32) / 1.15 | Playfair 700 | large page title ("Khoảnh khắc"), hero names |
| `--t-title` | 1.375rem (22) / 1.25 | Playfair 700 | card titles, sheet titles |
| `--t-headline` | 1.0625rem (17) / 1.35 | Be Vietnam 600 | section headers, list-row primary |
| `--t-body` | 1rem (16) / 1.5 | Be Vietnam 400 | body, inputs (16 px stops iOS focus zoom) |
| `--t-callout` | 0.9375rem (15) / 1.45 | Be Vietnam 500 | buttons, chips, chat bubbles |
| `--t-meta` | 0.8125rem (13) / 1.35 | Be Vietnam 500 | meta row, timestamps, tab labels (11–12 allowed for tab labels only) |
| `--t-hand` | 1.25rem (20) / 1.3 | Caveat 500 | quotes |

- **Sentence case everywhere.** No all-caps labels.
- **Truncation:**
  - card titles clamp at 2 lines
  - story excerpts clamp at 3 lines
  - meta row is 1 line with an ellipsis
  - the full text is always available in the detail sheet

### 2.3 Spacing, radius, elevation, motion

**Spacing (4-based):** `--s-1 4` · `--s-2 8` · `--s-3 12` · `--s-4 16` · `--s-5 20` · `--s-6 24` · `--s-8 32` · `--s-10 40` · `--s-12 48`.
- Page side gutter is **16 px** (20 px from 414 px width up).
- Gap between cards is 24 px. Gap inside a card is 12 px.

**Radius**

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 10 | chips, inputs |
| `--r-md` | 16 | buttons, small cards |
| `--r-lg` | 22 | memory and place cards, photos |
| `--r-sheet` | 28 | sheet top corners |
| `--r-pill` | 999 | segmented control, FAB |

**Elevation (light theme; dark uses no shadows, only a border):**
- `--e-1`: `0 1px 2px rgba(43,32,36,.06), 0 2px 8px rgba(43,32,36,.04)` for cards
- `--e-2`: `0 8px 28px rgba(43,32,36,.14)` for the FAB and sheets
- **No pink-tinted shadows.**

**Motion**

| Token | Value |
|---|---|
| `--m-fast` | 120 ms |
| `--m-base` | 220 ms |
| `--m-slow` | 360 ms |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `--ease-spring` | `cubic-bezier(.34,1.3,.64,1)`, sheets and FAB only |

- **Press feedback:** scale .97 plus a darker fill within 100 ms on every tappable element.
- **Ambient motion (the only loop):** petals, at most 8 on screen, opacity .35–.55, drifting only while the hero is in view. The loop pauses when the hero leaves the viewport, when the tab is hidden, and under `prefers-reduced-motion`.
- **The orchestrated moment (milestone celebration):** a 1.2 s petal burst from the day number while the number rolls up. It runs once per milestone day and after saving a moment. Under reduced motion it becomes a static "🎉 Tròn 600 ngày" banner with no burst.
- **Removed:** heart-pulse loop, shimmer on the counter, hover lifts.

---

## 3. Layout and navigation

### 3.1 Grid and breakpoints
- **Phone-first, single column.** Content max width is 560 px, centred above that.
- **Breakpoints:**
  - **< 360:** gutter 12 px; the hero number drops to 3.75rem.
  - **360–413:** baseline.
  - **414–767:** gutter 20 px.
  - **≥ 768:** content column 560 px. Moments grid becomes 4 columns. Sheets become centred dialogs, max 520 px wide.
- **No horizontal scroll at 320 px.** This is an acceptance test.
- **Safe areas:** the header pads with `env(safe-area-inset-top)`. The tab bar pads with `env(safe-area-inset-bottom)`. Sheets add the bottom inset under their sticky action bar.

### 3.2 App shell

```
┌──────────────────────────────────────┐ ← status bar (theme-color = paper)
│ Kim & Thư            [pill]   ♫  ⚙  │ ← glass header, 52 pt + safe top
├──────────────────────────────────────┤
│                                      │
│              page content            │
│                                  (+) │ ← FAB, 56 pt, 16 pt above the tab bar
├──────────────────────────────────────┤
│  ⌂         ⌖          💬•        ◔  │ ← glass tab bar, 49 pt + safe bottom
│ Khoảnh   Nơi muốn    Chat       Bé   │
│ khắc     đến                         │
└──────────────────────────────────────┘
```

**Header**
- **Left:** wordmark "Kim & Thư" in Playfair 700, 18 px, `--c-text`. Tapping it scrolls to the top of Moments.
- **Centre:** the sticky counter pill (`590 ngày`), which appears after the hero scrolls away. Keep the current behaviour, restyled: sunken fill, muted text, primary number.
- **Right:** at most **two** 44 pt icon buttons:
  - Couple mode: ♫ music and ⚙ settings. The lock action moves into Settings as "Chuyển sang chế độ khách".
  - Guest mode: ♫ music and 🔒 "Mở khóa" (labelled icon button: lock icon plus the text "Mở khóa" on widths ≥ 360).
- The header has a hairline `--c-divider` bottom border, shown only once the page is scrolled.

**Tab bar**
- **Couple mode:** 4 tabs, Khoảnh khắc · Nơi muốn đến · Chat · Bé.
- **Guest mode:** 2 tabs, Khoảnh khắc · Nơi muốn đến. The current "Mở khóa" tab is removed, because unlocking is an action, not a place.
- **Icons:** SVG line icons at 1.75 px stroke.
  - Active: filled glyph plus `--c-primary` label.
  - Inactive: `--c-muted`.
- **Chat unread** shows as a dot on the Chat icon, plus an `aria-label` suffix "(có tin mới)".
- Chat opens as a full-screen page that slides up (§4.5). It keeps the tab bar hidden while open and is closed with the chevron or swipe-down.

**FAB (new, shared)**
- One 56 pt circular primary button with a + icon, bottom-right, at `16 + tab bar height + safe inset`.
- **Its action depends on the page:**
  - Moments: "Thêm khoảnh khắc"
  - Places: "Thêm địa điểm"
  - Hidden on Chat and Bé, and in guest mode
- The `aria-label` changes with the page.
- **On scroll:** it shrinks to 48 pt while scrolling down and returns on scroll up.
- This removes the inline "+" buttons that cause E-04 and E-09.

### 3.3 Information architecture

| Tab | Content | Guest |
|---|---|---|
| Khoảnh khắc | hero (names, quote, counter, milestone) → feed/grid by month | read-only |
| Nơi muốn đến | segmented Muốn đi / Đã đến → GPS chips → list | read-only (no GPS add, no mark visited) |
| Chat | conversation, timed notes | hidden |
| Bé | cycle status, log period, history | hidden |
| Settings (sheet, from ⚙) | names, start date, quote, backend URL, theme (Tự động / Sáng / Tối), "Chuyển sang chế độ khách" | hidden |

**URL state** (keep the existing hash routing): `#moments`, `#places`, `#places/visited`, `#chat`, `#be`. The Android/iOS back gesture closes the top sheet first, then chat, then goes back a tab (overlay stack from Phase D).

---

## 4. Screens

### 4.1 Khoảnh khắc (home)

**Purpose:** show the story at a glance. **Primary action:** browse moments. **Secondary action:** add a moment (FAB).

```
 Kim & Thư                         ♫  ⚙
 ────────────────────────────────────────
 ·  ✿        ·            ✿    ·      ← petals (≤8), hero area only
           Kim  ♥  Thư                 ← Playfair 32, heart = --c-primary glyph
         “Iu béeeee:3”                 ← Caveat 20, muted

              590                      ← Playfair 72, --c-primary
         ngày bên nhau                 ← 15 muted
     15 giờ · 39 phút · 26 giây        ← 13 muted, tabular nums, one line

   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░        ← 4 px bar, accent fill on primary-soft
   Còn 9 ngày nữa là tròn 600 ngày     ← 13 text

   ┌ 🍓 Ngày 5/5 của kỳ · chăm sóc bé ›┐ ← period chip (couple only), sunken pill
 ────────────────────────────────────────
 Khoảnh khắc                ( Dòng|Lưới )   ← 32 Playfair, segmented right-aligned
 Ngày này năm xưa ›                         ← only when there is a match
 ────────────────────────────────────────
 Tháng 10, 2026                             ← sticky month label, 13/600, muted
 ┌────────────────────────────────────┐
 │                                    │
 │         photo, full card width     │     ← 4:5, radius 22, no inner frame
 │                                    │
 └────────────────────────────────────┘
 Bún bò 149.                                ← Playfair 22
 25/10 · 17:09 · Hẻm 273 Tô Hiến Thành…     ← 13 muted, 1 line, ellipsis
 “Cũm ngonnn”                               ← Caveat 20, up to 3 lines

 ┌────────────────────────────────────┐
 ...
                                       (+)
```

**Hero**
- **No card, no boxes.** The hero sits directly on the paper. Height is ≤ 300 pt at 375 × 812, so the top of the first photo shows above the fold.
- **The day number is the one bold element.** Hours, minutes and seconds update every second in one line. The day number only changes at midnight, with the roll-up animation.
- **Milestone bar:** shows progress toward the next milestone (every 100 days and each anniversary).
- **On milestone day:** the text becomes "Hôm nay tròn 600 ngày 💕" and triggers the celebration once.
- **Period chip** (couple only): one sunken pill with an SVG drop icon (not 🍓) and a short status ("Ngày 5/5 của kỳ" / "Còn 4 ngày đến kỳ"). It opens the Bé tab. It is hidden when there is no data.

**Feed card (one memory)**
- **No outer card box.** Photo, title, meta and quote stack on the paper with 12 pt gaps. Cards are separated by 32 pt. This is the "album page" look and it fixes E-07.
- **Photo:** 4:5 aspect ratio, `object-fit: cover`, radius 22, lazy-loaded, with fixed `width`/`height` attributes so the layout does not shift.
- **Sender:** a 20 pt avatar initial ("K" / "T") at the end of the meta row. No floating badge.
- **Tap:** the whole block opens the **Memory detail** sheet. "Xem thêm" is removed.
- **Long-press (couple):** a context menu with Sửa · Xóa · Chia sẻ.
- **Sync state:** a small warn-coloured cloud icon plus "Chưa đồng bộ" at the end of the meta row. It fades out when synced.

**Photo states (fixes E-02)**

| State | Treatment |
|---|---|
| Loading | `--c-sunken` block at the final 4:5 size with a soft 1.2 s opacity pulse (static under reduced motion) |
| Loaded | 180 ms fade-in |
| Failed (after the existing Drive-URL fallbacks) | **The memory collapses to a text card:** no photo area, a 3 px `--c-primary` rule on the left, then title, meta and quote. A muted "Ảnh chưa tải được · Thử lại" link retries. |
| No photo | same text card, without the retry link |

**Month label:** sticky under the header, sentence case ("Tháng 10, 2026"), muted, on a glass strip only while it is stuck.

**Grid view ("Lưới")**
- 3 columns (4 at ≥ 768), square tiles, 2 px gaps, edge to edge (no side gutter), like the iOS Photos library.
- Month labels go between rows.
- Text-only memories show as a tile on `--c-primary-soft` with the title in Playfair 15, clamped to 3 lines.
- Tap opens the detail sheet.

**"Ngày này năm xưa":** a single row link under the section title, with a thumbnail and "1 năm trước · A Kafe". It is shown only when there is a match. No carousel.

**Page states**

| State | Treatment |
|---|---|
| First load | Hero renders immediately from local data. The feed shows 2 skeleton cards (photo block, two text lines). |
| Empty (no memories) | Under the hero: "Chưa có khoảnh khắc nào." plus "Lưu lại kỷ niệm đầu tiên của hai đứa nhé." Couple mode adds a primary button "Thêm khoảnh khắc". Guest mode has no button. |
| Offline | A slim warn banner under the header: "Đang ngoại tuyến · Vẫn xem và thêm được, sẽ đồng bộ khi có mạng." Dismissible. Comes back on the next offline event. |
| Sync error | Toast: "Chưa đồng bộ được. Sẽ thử lại tự động." with "Thử ngay". |
| Guest | Same layout. No FAB, no long-press menu. |

### 4.2 Memory detail (sheet) and lightbox
- **Full-height bottom sheet** with a grabber.
  - Photo on top, edge to edge. Tapping it opens the pinch-zoom lightbox (keep the existing one, with a black scrim and a × at the top-right inside the safe area).
  - Then title (Playfair 22), meta (date, time, place with a "Mở bản đồ" link), and the full story. Story text uses Be Vietnam 16. A first-line quote may use Caveat.
- **Couple actions** are a sticky bottom bar: "Sửa" (secondary) and a "⋯" menu holding Xóa.
- **Delete:** confirm sheet "Xóa khoảnh khắc này?" with the body "Ảnh và nội dung sẽ bị xóa trên cả hai điện thoại." and buttons "Xóa" (danger) / "Giữ lại". After deleting, a toast "Đã xóa · Hoàn tác" stays for 5 s.

### 4.3 Add / edit moment (sheet)
- **Title:** "Khoảnh khắc mới" or "Sửa khoảnh khắc".
- **Fields, in order:**
  - **Ảnh:** a large 4:5 drop zone at the top. "Chọn ảnh" opens the iOS picker. The preview replaces the zone, with a "Đổi ảnh" button.
  - **Tiêu đề:** text, required, `enterkeyhint="next"`.
  - **Ngày & giờ:** native date and time inputs, defaulting to now.
  - **Địa điểm:** text, with a "Dùng vị trí hiện tại" chip.
  - **Câu chuyện:** textarea, 4 rows, auto-grows, `enterkeyhint="done"`.
- **Labels sit above the fields.** Placeholders are only examples.
- **Sticky bottom action bar** above the keyboard: primary "Lưu khoảnh khắc", full width.
- **Saving:**
  - While saving, the button shows a spinner and "Đang lưu…".
  - On success the sheet closes, the new card appears at the top of the feed with a 360 ms highlight, and the celebration plays.
  - If the photo upload fails, the memory is still saved locally (outbox) with the "Chưa đồng bộ" state. Input is never lost.
- **Errors appear under the field:**
  - "Cần có tiêu đề nhé."
  - "Ảnh lớn quá (tối đa 10 MB). Chọn ảnh khác nhé."
- **Close with unsaved changes:** a confirm sheet "Bỏ khoảnh khắc đang viết?" with "Bỏ" / "Viết tiếp".

### 4.4 Nơi muốn đến

**Purpose:** decide where to go next. **Primary action:** "Chỉ đường" to a place. **Secondary actions:** add a place (FAB), mark it visited.

```
 Kim & Thư                         ♫  ⚙
 ────────────────────────────────────────
 Nơi muốn đến                              ← Playfair 32, large title
 ( Muốn đi  2 | Đã đến  1 )                ← segmented, full width
 [⌖ Gần nhất] [✓ Đã đến đây chưa?] [＋ Lưu chỗ này] → ← chips, scroll horizontally
 ────────────────────────────────────────
 Ga Tàu Thủy Bạch Đằng (Waterbus)    3,2 km
 Ngắm hoàng hôn trên sông Sài Gòn và đón
 gió mát cùng bé Thư                        ← 15 muted, clamp 2
 [ ➤ Chỉ đường ]  [ ♪ TikTok ]  [ ✓ Đã đi ]   ⋯
 ────────────────────────────────────────   ← hairline divider, not boxes
 Bảo Tàng Mỹ Thuật TP.HCM            5,8 km
 ...
                                       (+)
```

- **Large title:** "Nơi muốn đến" (shorter than "Những Nơi Muốn Đi Cùng Em 💕"). The romantic line moves to the empty state.
- **Segmented control:** full width, `--c-sunken` track, white selected thumb, counts shown as plain numbers. URL `#places` / `#places/visited`.
- **GPS chips:** one horizontally scrolling row with no box around it. Each chip is 36 pt high (44 pt hit area), sunken fill, with an icon and a label. "Lưu chỗ này" is couple-only. When a chip is active (sorted by distance), it gets the primary-soft fill and primary text.
- **Place row:** a list row on the paper with a hairline divider, not a card.
  - Title: Playfair 20, clamped to 2 lines.
  - Distance: right-aligned, tabular, muted. It appears once GPS is allowed.
  - Description: clamped to 2 lines.
  - **Actions:**
    - "Chỉ đường": primary-soft fill, primary text, the main action
    - "TikTok": secondary outline, neutral, only when a link exists (replaces the black pill)
    - "Đã đi": secondary outline, couple-only
    - "⋯": couple-only, opens Sửa / Xóa
  - The actions are a single row. Below 360 px, labels collapse to icon plus label for "Chỉ đường" and icon only for the rest (with `aria-label`). **The × delete next to the title is removed** (fixes E-05).
- **Visited tab rows:** a success ✓ before the title, then "Đã đến 12/10/2026", then "Xem khoảnh khắc ›" when a memory is linked.
- **Mark visited:** "Đã đi" opens a small sheet titled "Đánh dấu đã đến?". It has a date field defaulting to today, a primary "Đã đến", and a secondary "Đã đến và lưu khoảnh khắc", which opens the Add moment sheet prefilled with the place.

**States**

| State | Treatment |
|---|---|
| Loading | 3 skeleton rows |
| Empty, Muốn đi | "Chưa có nơi nào trong danh sách." + "Những Nơi Muốn Đi Cùng Em 💕 – thêm chỗ đầu tiên nhé." + primary "Thêm địa điểm" (couple) |
| Empty, Đã đến | "Hai đứa chưa đánh dấu nơi nào." + "Đến nơi rồi thì bấm “Đã đi” nhé." |
| GPS denied | The chip shows "⌖ Bật vị trí". Tapping it opens a sheet: "Cần quyền vị trí để sắp xếp theo khoảng cách. Vào Cài đặt › Safari › Vị trí để bật." |
| GPS working | Chip spinner plus "Đang tìm vị trí…". Distances fade in. |
| Routing service busy | Distances fall back to straight-line distance, marked "≈". No error toast. |

**GPS result sheets** (`check-location-result-modal`, `add-current-location-modal`): use the standard sheet (§5). The result is a clear sentence:
- "Hai đứa đã từng đến đây: A Kafe (25/10/2026)."
- "Chưa có kỷ niệm nào quanh đây (bán kính 200 m)."

Actions: "Lưu chỗ này" / "Đóng".

### 4.5 Chat

**Purpose:** talk privately. **Primary action:** send a message.

```
 ┌──────────────────────────────────────┐
 │ ⌄   (T) Thư                      ⋯  │ ← 52 pt + safe top; ⌄ closes (44 pt)
 │      Nhắn lúc 19:06                  │ ← 13 muted
 ├──────────────────────────────────────┤
 │                Hôm nay              │ ← day separator, 13 muted, centred
 │        ┌─────────────────────────┐   │
 │        │ Chào bé Thư yêu của anh! │   │ ← own: --c-primary fill, white text
 │        └─────────────────────────┘   │
 │ ┌──────────────────────────┐        │
 │ │ Iu anh nhìu nhìu :3 ❤️    │        │ ← partner: --c-surface + divider border
 │ └──────────────────────────┘        │
 │  19:06                              │ ← time shown once per group
 │                                      │
 ├──────────────────────────────────────┤
 │ [📷]  ( Nhắn gì đó…            )  ♥ │ ← ♥ becomes ➤ when text is present
 └──────────────────────────────────────┘
```

- **Header (fixes E-03):**
  - Left: a chevron-down close button (44 pt). The page is dismissed by tapping it, by swiping down from the header, or with the back gesture.
  - Then a 32 pt avatar, the name "Thư" in Playfair 17 (no emoji), and the muted status "Nhắn lúc 19:06".
  - Right: **one** "⋯" button (44 pt) that opens a menu:
    - "Thư hẹn giờ" (opens the notes sheet)
    - "Tôi là: Kim" (switch sender, with a check)
    - "Tắt rung khi có tin" (toggle)
  - **Every control sits inside the 375 px width** with 8 pt left and right padding.
- **Background:** `--c-bg` paper, no gradient.
- **Bubbles:**
  - max width 78%
  - radius 20, with a 6 pt tail-side corner
  - consecutive messages from the same sender group with 2 pt spacing, and the time appears under the last one in the group
  - photos inside bubbles are radius 16 and max 240 pt wide, tap to open the lightbox
- **Input bar:**
  - sticky, rides above the iOS keyboard (visual-viewport aware)
  - a camera icon button (SVG, not 📷)
  - a pill text field on `--c-sunken`, 16 px, auto-grows to 5 lines, `enterkeyhint="send"`
  - **Send button:** "♥" (sends a heart) when the field is empty, morphing to a primary "➤" when there is text. Both have `aria-label`s: "Gửi tim" / "Gửi tin nhắn".
- **Message states:**
  - **sending:** 60% opacity plus a small clock icon
  - **failed:** a danger "!" plus "Chưa gửi được · Chạm để thử lại"
  - **sent:** normal
- **Empty:** "Chưa có tin nhắn nào. Gửi một trái tim cho Thư nhé ♥" with the heart button highlighted.
- **Loading older messages:** a small spinner at the top while pulling more.

**Thư hẹn giờ (timed notes sheet)**
- A list of notes. Each row shows the recipient, the open time and the state:
  - Locked: lock icon plus "Mở lúc 20:00, 14/11". The text is withheld.
  - Opened: Caveat preview.
- **Primary:** "Viết thư hẹn giờ". **Form fields:** Gửi cho, Nội dung, Mở lúc.
- **Empty:** "Chưa có thư nào. Viết một lá thư để người ấy mở vào đúng lúc nhé."

### 4.6 Bé (period care)

**Purpose:** know where Thư is in her cycle and care for her. **Primary action:** "Ghi nhận kỳ mới" (log a new period start).

```
 Bé                                         ← Playfair 32
 ┌──────────────────────────────────────┐
 │              ◜‾‾‾‾‾◝                  │
 │            ◟  Ngày 5  ◞               │ ← cycle ring, 200 pt; filled arc = period days
 │               của kỳ                  │
 │   Kỳ tới dự kiến: 08 – 11/12          │ ← window, not a single date
 └──────────────────────────────────────┘
  Lời nhắc hôm nay
  “Uống nhiều nước ấm, chườm ấm bụng và     ← Caveat 20 (it is the couple's voice)
   nghỉ ngơi thật nhiều nhé.”
 ────────────────────────────────────────
 [ Ghi nhận kỳ mới ]                        ← primary, full width
 Lịch sử
 14/11/2026 · 5 ngày · chu kỳ 29 ngày
 16/10/2026 · 5 ngày · chu kỳ 28 ngày  ⋯
 ...
 Dự đoán chỉ để nhắc nhở, không phải tư vấn y tế.   ← 13 muted
```

- This is a **tab page**, not a sheet. The current `period-modal` content moves here. The sheet is kept only for the log form.
- **Cycle ring:**
  - track `--c-sunken`
  - period-day arc `--c-primary`
  - predicted window `--c-primary-soft` with a dashed outline
  - today marked with a dot
- **Text alternative for the ring:** "Hôm nay là ngày 5 của kỳ, dự kiến kỳ tới từ 8 đến 11 tháng 12."
- **Phase wording:** "Đang trong kỳ · ngày 5/5", "Còn 4 ngày đến kỳ", "Có thể đến kỳ trong vài ngày tới".
- **History rows:** start date, length and cycle length, with "⋯" for Sửa / Xóa. Deleting asks for confirmation.
- **Log form sheet:** title "Ghi nhận kỳ mới". Fields: "Ngày bắt đầu" (date, required, defaults to today) and "Số ngày (tùy chọn)". Primary "Lưu". The success toast is "Đã lưu. Anh sẽ nhắc trước kỳ tới nhé."
- **Empty:** the ring is replaced by "Chưa có dữ liệu chu kỳ." with "Ghi nhận ngày bắt đầu kỳ gần nhất để app dự đoán và nhắc nhở." and the primary button.

**Period alert (once a day)**
- A compact sheet: a drop icon, the title "Bé Thư đang trong kỳ" (no all-caps tag, no 🍓 badge), the "Ngày 5/5" pill, and the care message.
- Buttons: primary "Xem góc chăm sóc" and secondary text "Đã nhớ rồi".

### 4.7 Unlock, identity and the dialog queue (fixes E-06)
- **Mở khóa (auth sheet):**
  - Title "Mở khóa đôi ta".
  - One password field labelled "Mật mã của hai đứa", `autocomplete="current-password"`, with a show/hide eye button. Primary "Mở khóa".
  - Error under the field: "Mật mã chưa đúng. Thử lại nhé." The field keeps focus and the text is selected.
- **The dialog queue:** at most **one** dialog is shown at a time, in this priority order:
  1. Bạn là ai? (who-am-I, only if the sender is unknown)
  2. Period alert
  3. Anything else

  Each one shows after the previous one closes, with a 300 ms gap.
- **Bạn là ai?** sheet: two large option cards with the avatar initial and name (Kim / Thư). Tapping one selects it and closes the sheet. No extra "OK" button.

### 4.8 Settings (sheet from ⚙)
Grouped rows (iOS settings style) on `--c-surface`, with section headers in 13/600 muted, sentence case:
- **Hai đứa:** Tên người 1, Tên người 2, Ngày bắt đầu yêu, Câu nói của hai đứa.
- **Giao diện:** Chủ đề (Tự động / Sáng / Tối, segmented), Cánh hoa bay (on/off, default on), Nhạc nền (on/off).
- **Kết nối:** Link Google Apps Script, Trạng thái đồng bộ ("Đã đồng bộ lúc 15:39" / "3 mục chưa đồng bộ"). Includes the action "Đồng bộ ngay".
- **Chế độ:** "Chuyển sang chế độ khách", text button in danger colour, with a confirm.

The sticky "Lưu" button is enabled only when something changed. Saving shows the toast "Đã lưu cài đặt".

---

## 5. Component inventory

| Component | Status | Variants and notes |
|---|---|---|
| **App header** | Reuse `.nav-bar`, restyle | glass; scrolled (hairline); guest (lock button). Delete the hidden `.legacy-nav-menu` dropdown. |
| **Sticky counter pill** | Reuse | sunken pill, primary number |
| **Tab bar** | Reuse `.bottom-tab`, restyle | 2 tabs (guest) / 4 tabs (couple); active = filled icon plus primary label; unread dot |
| **FAB** | **New** | page-aware label; 56 → 48 pt on scroll; hidden on Chat/Bé/guest |
| **Hero counter** | Rework `.love-counter-card` | single number plus one-line h/m/s; milestone bar; celebration state |
| **Milestone bar** | **New** | 4 px; track primary-soft, fill accent |
| **Memory block** | Rework `.locket-card` | photo; text-only (failed/no photo); pending-sync; grid tile; text grid tile |
| **Month label** | Reuse, restyle | sticky glass strip while stuck |
| **Segmented control** | Reuse (Dòng/Lưới, Muốn đi/Đã đến), unify | sunken track, white thumb, 36 pt high / 44 pt hit area |
| **Chip** | Reuse GPS buttons → one chip style | default / active / loading / disabled |
| **Button** | Unify | primary (rose fill), soft (primary-soft fill), secondary (outline `--c-control`), text, danger-text, icon (44 pt). Sizes 44 / 52 pt. Delete per-feature button styles (black TikTok pill, gradient pink buttons). |
| **Place row** | Rework `.place-card` → list row | want / visited; ⋯ menu; compact < 360 px |
| **Bottom sheet** | Reuse the Phase D `<dialog>` behaviour | standard; full-height (detail); confirm (compact, 2 buttons); grabber; one close; sticky action bar |
| **Context / ⋯ menu** | **New** (one component) | anchored popover on phone; Sửa, Xóa (danger), Chia sẻ |
| **Toast** | Reuse/unify | info, success, error-with-action, undo; above the tab bar; 4 s (undo 5 s); announced with `role="status"` |
| **Offline banner** | **New** | warn; dismissible |
| **Skeleton** | **New** | memory block, place row, chat bubble |
| **Empty state** | **New** (one pattern) | title (headline), one sentence (muted), optional primary button; no big illustration |
| **Chat bubble** | Reuse, restyle | own / partner; text / photo; sending / failed |
| **Chat input bar** | Reuse, restyle | heart / send morph |
| **Cycle ring** | **New** (SVG) | in period / before / predicted window / no data |
| **Avatar initial** | **New** | 20 / 32 / 56 pt; "K" primary-soft, "T" sunken |
| **Petal canvas** | Reuse `#petal-canvas`, constrain | ≤ 8 petals; hero-only; pauses off-screen, when hidden and under reduced motion; burst mode for the celebration |
| **Icons** | Reuse the inline SVG set, extend | 24 px, 1.75 stroke, `currentColor`. Add: navigation (➤), drop, check, cloud-pending, more (⋯), chevron-down, eye, camera, heart. **All emoji removed from controls.** |

---

## 6. Interaction and copy

**Feedback for every action**

| Action | Immediate (< 100 ms) | Result |
|---|---|---|
| Tap anything | pressed scale .97 / darker fill | — |
| Save moment | button spinner, "Đang lưu…" | sheet closes; new card highlighted; celebration; toast "Đã lưu khoảnh khắc" |
| Delete (memory, place, period entry) | confirm sheet | toast "Đã xóa · Hoàn tác" (5 s) |
| Mark visited | sheet | row moves to Đã đến; toast "Đã chuyển sang Đã đến" |
| Send message | bubble appears at once (sending state) | sent / failed with retry |
| GPS sort | chip spinner | list reorders with a 220 ms move; distances fade in |
| Copy / share | — | toast "Đã sao chép liên kết" |
| Offline write | normal success | item shows "Chưa đồng bộ" until confirmed |

**Action names (use the same words everywhere)**

| Action | Label |
|---|---|
| Add a memory | Thêm khoảnh khắc |
| Add a place | Thêm địa điểm |
| Save | Lưu |
| Edit | Sửa |
| Delete | Xóa |
| Close | Đóng (icon-only buttons have this `aria-label`) |
| Mark visited | Đã đi |
| Directions | Chỉ đường |
| Unlock | Mở khóa |
| Switch to guest mode | Chuyển sang chế độ khách |
| Log a period | Ghi nhận kỳ mới |
| Retry | Thử lại |

**Copy rules**
- Warm, short, second person ("nhé", "hai đứa"). No exclamation stacks and no emoji in titles or buttons. One ♥ in a sentence of the couple's voice is fine.
- **Errors say what happened and what to do:**
  - "Chưa tải được ảnh. Thử lại"
  - "Mất kết nối. Tin nhắn sẽ gửi khi có mạng."
- **Dates use the `vi-VN` format:**
  - "25/10/2026"
  - times "17:09" (24 h; the chat currently shows "07:05 PM", which should change)
  - distances "3,2 km" (comma decimal)

---

## 7. Accessibility

- **Contrast:** all text pairs in §2.1 are ≥ 4.5:1, and controls and the focus ring are ≥ 3:1 in both themes. The accent (`#E85D75`) is decorative only and never carries text.
- **Focus:**
  - `:focus-visible` shows a 2 px `--c-focus` ring with a 2 px offset in `--c-bg` on every interactive element, including chips, segmented thumbs, tab buttons and menu items.
  - Sheets trap focus (native `<dialog>`). On close, focus returns to the element that opened the sheet.
- **Keyboard paths** (desktop and Bluetooth keyboard):
  - Tab order: header → page content → FAB → tab bar.
  - Esc closes the top overlay.
  - Arrow keys move inside segmented controls and menus.
  - Enter in the chat field sends; Shift+Enter adds a new line.
- **Labels:**
  - Every icon-only button has a Vietnamese `aria-label`.
  - Photos use the memory title as `alt`. Decorative petals and the heart are `aria-hidden`.
  - The counter's per-second text is `aria-live="off"`. The day count is announced on focus.
- **Targets:** ≥ 44 × 44 pt for all touch controls, including chips (36 pt visual, 44 pt hit area) and the chat close and ⋯ buttons.
- **Not by colour alone:** visited (✓ plus text), sync (icon plus text), period days (arc plus text summary), failed message (icon plus text).
- **Reduced motion:** no petals, no roll-up, no burst, no list-move animation. Sheets fade instead of slide. Skeletons stay static.
- **Dynamic Type:** layout tolerates a 130% text size. Clamps relax to 3 / 5 lines, and the hero number may wrap its unit line.
- **Language:** `lang="vi"` is kept. Vietnamese diacritics render in the intended fonts (Be Vietnam Pro, Playfair with the Vietnamese subset).

---

## 8. Acceptance checks for the planner

1. **No horizontal scroll** at 320, 375 and 414 px on every tab, every sheet and chat, in both modes.
2. At 375 × 812:
   - the hero is ≤ 300 pt tall
   - the first memory photo starts above the fold
   - the chat ⌄ and ⋯ buttons are fully inside the viewport
3. **Pink check:** on Moments, `--c-primary` appears only on the day number, the heart, the active tab, the FAB and links.
4. **Failed photos** render as text cards, never as empty pink boxes.
5. **Only one dialog is `[open]`** after unlocking.
6. **No emoji inside any `<button>`** in `index.html` or in rendered templates.
7. **Fonts:** only Playfair Display, Be Vietnam Pro and Caveat load. Caveat is used only by `.hand` (quote, story excerpt, note preview).
8. **Reduced motion:** with `prefers-reduced-motion: reduce`, no `requestAnimationFrame` loop is running (petals stopped).
9. **Dark mode:** every token pair in §2.1 is applied, and `theme-color` follows the theme.
10. **Real iPhone check, manual:**
    - safe areas
    - the keyboard does not cover the chat input or the sheet action bar
    - no focus zoom
    - swipe-down closes sheets

## 9. Assumptions and open items

- **Drive thumbnails:** they failed in the test browser, possibly because of cookie/referrer rules in the emulator. On the couple's phones they may load. The text-card fallback is designed either way. Whether the thumbnails really fail on a device needs checking (static-only finding).
- **Music** stays as a header toggle (not chosen for removal), but it never autoplays.
- **Heart-pulse and other ambient loops** are removed (not selected to keep).
- **No new imagery or illustration.** Empty states are text plus a button by design (restraint).
- **No change to data, sync or the backend.** The guest/couple permission rules are unchanged.
- **Desktop (≥ 768)** is a centred phone column with dialogs. It is not designed beyond that.
