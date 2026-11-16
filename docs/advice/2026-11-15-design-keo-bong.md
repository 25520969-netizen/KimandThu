# Kim & Thư — UI Design Spec: "Kẹo Bông" (v7 visual redesign)

**Status:** design spec only. No source file was changed.
**Input for:** `/planner`, which turns this spec into code tasks.
**Direction chosen:** A, "Kẹo Bông" (sweet, playful, soft). Confirmed by the user on 2026-11-15.
**Supersedes:** the *visual* decisions of `Design/2026-11-14-design-album-kem.md` ("Album Kem"). Its behavioural rules stay: one bottom-sheet behaviour, overlay stack, dialog queue, back gesture, 16 px fields, fluid layout (`docs/plans/2026-11-14-fluid-screen-fit.md`).

---

## 0. Grounding

**Product.** A private PWA for one couple (Kim and Thư): a love counter, Moments (photo diary), Places (wishlist with GPS tools) and Bé (period care). Guests can read Moments and Places.

**Audience and device.** Two people, mostly on iPhone, installed to the home screen.

**Primary job.** Open the app, feel "this is ours", see how long we have been together and our latest photos.

**Stack as found (reuse, do not replace).** Vanilla JS SPA (`index.html`, `app.js`), plain CSS in `src/styles/` (`tokens.css`, `base.css`, `shell.css`, `components.css`, `moments.css`, `places.css`, `be.css`, `chat.css`), native `<dialog>` sheets, inline SVG icons from `src/ui/icons.js`, a canvas ambient layer in `src/ui/petal_canvas.js`, Google Fonts allowed by the CSP (`style-src https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`).

**What is wrong today** (seen at 375 × 812, light theme, local server `kimthu-static`):

| ID | Finding |
|---|---|
| F-01 | The page is flat cream with almost no pink. It reads as cold and formal, not as a couple's app. |
| F-02 | Playfair Display at heavy weight looks like a newspaper headline; nothing feels soft or young. |
| F-03 | Photo, title, meta and quote are stacked as loose text on the page background. Cards have no edge, so the feed feels unfinished. |
| F-04 | The only ambient motion (6 petals, clipped to the hero) is nearly invisible. |
| F-05 | The tab bar and header are plain strips; nothing invites a tap. |

**User decisions (2026-11-15).**

| Question | Answer |
|---|---|
| How much pink | Pale blush-pink background, white cards, strong pink for buttons and hearts |
| Floating hearts | On every page, gentle, behind the content, replacing the petals |
| Typeface | Rounded, soft sans-serif instead of Playfair |
| Moment cards | Large photo with the text laid over the photo (dating-app style) |
| Direction | A, "Kẹo Bông" |
| Chat | **Removed** |
| Timed notes ("Thư hẹn giờ") | **Removed** together with chat |

---

## 1. Design principles

1. **Blush, white, one pink.** Background is pale pink, surfaces are white, and one strong pink carries every action. The couple's photos supply all other colour.
2. **One bold element per screen.** Moments: the two avatars joined by a heart, with the day count. Places: the place name. Bé: the cycle ring.
3. **Hearts are the motif, used in four places only:** the floating background, the heart between the avatars, the milestone marker, and the Moments tab icon. No heart bullets, no heart dividers, no emoji hearts in text.
4. **One orchestrated motion moment:** the heart burst when a moment is saved or a milestone is reached. The floating hearts are ambient and stay quiet.
5. **Soft shapes.** Pill buttons, 24 px card corners, pink-tinted shadows. No hard lines, no boxes inside boxes.
6. **Borrowed from dating apps:** full-bleed photo cards with overlaid text, a "match" style pair of avatars, a floating pill tab bar, one big pill call-to-action per sheet.

Avoid: gradients on surfaces (the photo scrim is the only gradient), emoji as icons, all-caps labels, centring anything except the hero and empty states.

---

## 2. Tokens

Edit `src/styles/tokens.css` in place. Token names stay; only values change, plus the new tokens marked **new**. Dark values go in both dark blocks, as today.

### 2.1 Colour roles

Contrast is WCAG 2, computed for this spec.

| Role | Token | Light | Dark | Use | Contrast (light / dark) |
|---|---|---|---|---|---|
| Background | `--c-bg` | `#FFF4F7` | `#1C1217` | page | — |
| Surface | `--c-surface` | `#FFFFFF` | `#2A1B22` | cards, sheets, tab bar | — |
| Sunken | `--c-sunken` | `#FFE9EF` | `#35232C` | inputs, segmented track, skeleton | — |
| Text | `--c-text` | `#3A1F2B` | `#FBEAF0` | body, headings | 13.9 on bg, 14.9 on surface / 15.8, 14.2 |
| Muted text | `--c-muted` | `#7A5C68` | `#C9A9B6` | meta, captions | 5.5 on bg, 5.9 on surface, 5.1 on sunken / 8.6, 7.7, 6.9 |
| Primary | `--c-primary` | `#D81B60` | `#FF7FA5` | primary button fill, active tab, day number, links | 4.6 on bg, 5.0 on surface / 7.7, 6.9 |
| On primary | `--c-on-primary` | `#FFFFFF` | `#2A0D18` | text and icons on a primary fill | 5.0 / 7.6 |
| Primary strong (**new**) | `--c-primary-strong` | `#B0124C` | `#FFA3BE` | pink text on `--c-primary-soft` or `--c-sunken` | 5.6 on soft, 6.0 on sunken / 7.2, 7.9 |
| Primary soft | `--c-primary-soft` | `#FFE0EA` | `#4A2233` | active tab pill, distance pill, soft button, photo fallback | text on it: 12.1 / 11.6 |
| Accent | `--c-accent` | `#FF7FA5` | `#FF9DBB` | **decoration only**: floating hearts, burst hearts, empty-state and photo-fallback illustrations. Never text, never a control, never the only carrier of information (2.4:1 on white). | n/a |
| Success | `--c-success` | `#2F7D4F` | `#6FCF97` | "Đã đến", synced | 4.7 on bg, 5.0 on surface / 8.6 |
| Warning | `--c-warn` | `#A15C00` | `#F2B45A` | "Chưa đồng bộ", offline banner | 4.8 on bg, 5.2 on surface / 9.0 |
| Danger | `--c-danger` | `#B42318` | `#FF8A80` | delete, error text | 6.1 on bg, 6.6 on surface / 7.2 |
| Divider | `--c-divider` | `#F6D3DD` | `#44303A` | hairlines (decorative) | 1.3, decorative only |
| Control border | `--c-control` | `#9C6F81` | `#A88795` | input and secondary-button outline, switch track off | 3.9 on bg, 4.2 on surface, 3.6 on sunken / 5.7, 5.1, 4.6 |
| Focus ring | `--c-focus` | `#D81B60` | `#FF7FA5` | 2 px ring + 2 px `--c-bg` offset | ≥ 3:1 |
| Scrim | `--c-scrim` | `rgba(58,31,43,.45)` | `rgba(0,0,0,.6)` | behind sheets, lightbox | — |
| Glass | `--c-glass` | `rgba(255,244,247,.82)` | `rgba(28,18,23,.78)` | header, tab bar (with `blur(20px) saturate(1.4)`) | — |
| Photo scrim (**new**) | `--c-photo-scrim` | `linear-gradient(to top, rgba(30,10,18,.78) 0%, rgba(30,10,18,.62) 55%, rgba(30,10,18,0) 100%)` | same | bottom of photo cards | white text ≥ 5.4 even on a white photo |
| On photo (**new**) | `--c-on-photo` | `#FFFFFF` | `#FFFFFF` | text over the photo scrim | see above |
| Toast (**new**) | `--c-toast` / `--c-on-toast` | `#3A1F2B` / `#FFF4F7` | `#4A2233` / `#FBEAF0` | toast fill and text; toast action text is `#FF9DBB` in both themes | 13.9, action 7.7 / 11.6, action ≥ 6 |

**Rules**
- `--c-primary` on `--c-primary-soft` is only 4.0:1. Pink text on a soft or sunken fill always uses `--c-primary-strong`.
- Danger red and primary pink are close in hue. A destructive action always carries a trash icon and the word "Xoá"; never colour alone.
- Status is never colour alone: "Đã đến" has a ✓ icon and the word; sync state has an icon and "Chưa đồng bộ".
- Dark mode is designed: a warm plum-black, not an inversion. Photos keep full brightness. Shadows are replaced by the surface lift and a 1 px `--c-divider` border.
- `theme-color` meta: `#FFF4F7` (light), `#1C1217` (dark). `manifest.json`: `background_color` `#FFF4F7`, `theme_color` `#FFF4F7`.

### 2.2 Typography

| Family | Role | Weights | Notes |
|---|---|---|---|
| **Nunito** (replaces Playfair Display) | display: names, day number, page titles, card titles, wordmark, buttons | 700, 800 | Rounded terminals; has a Vietnamese subset. `font-variant-numeric: tabular-nums` on the counter and clock. |
| **Be Vietnam Pro** (kept) | body, inputs, meta, labels | 400, 500, 600 | — |
| **Caveat** (kept, restricted) | the couple's voice only: hero quote, story text in the detail sheet, "Lời nhắc hôm nay" | 500 | Carried-over exception to the two-typeface rule (user decision of 2026-11-14). Never on buttons, labels or headings. |

`--font-display: "Nunito", -apple-system, system-ui, sans-serif`. Remove Playfair Display from the Google Fonts URL; keep `display=swap` and the Vietnamese subset.

| Token | Size / line-height | Family / weight | Use |
|---|---|---|---|
| `--t-hero-num` | `clamp(3.5rem, 18vw, 5rem)` / 1 | Nunito 800 | day count |
| `--t-display` | `clamp(1.5rem, 1rem + 2.6vw, 1.875rem)` / 1.2 | Nunito 800 | page titles |
| `--t-title` | 1.25rem (20) / 1.25 | Nunito 800 | card titles, sheet titles |
| `--t-headline` | 1.0625rem (17) / 1.35 | Nunito 700 | section headers, row titles, names under avatars |
| `--t-body` | 1rem (16) / 1.5 | Be Vietnam 400 | body, inputs |
| `--t-callout` | 0.9375rem (15) / 1.45 | Nunito 700 on buttons; Be Vietnam 500 on chips | buttons, chips |
| `--t-meta` | 0.8125rem (13) / 1.35 | Be Vietnam 500 | meta rows, tab labels (12 allowed on tab labels) |
| `--t-hand` | 1.25rem (20) / 1.3 | Caveat 500 | quotes |

Sentence case everywhere. Truncation: card titles clamp at 2 lines, meta rows 1 line with ellipsis, place notes 2 lines; the full text is always in the detail sheet.

### 2.3 Spacing, radius, shadow, motion

- **Spacing:** unchanged 4/8 scale (`--s-1` … `--s-12`). Gap between feed cards: `--s-5` (20 px), so the background and its hearts show between cards.
- **Radius:** `--r-sm: 12px`, `--r-md: 18px`, `--r-lg: 24px` (cards, photos), `--r-sheet: 28px`, `--r-pill: 999px` (buttons, chips, tab bar).
- **Shadow (light only; dark stays `none`):**
  - `--e-1: 0 1px 2px rgba(216,27,96,.06), 0 6px 16px rgba(216,27,96,.08)` — cards
  - `--e-2: 0 10px 30px rgba(216,27,96,.18)` — tab bar, FAB, sheets
- **Motion:** `--m-fast: 120ms`, `--m-base: 220ms`, `--m-slow: 360ms`, `--ease-out`, `--ease-spring` unchanged. New: `--m-beat: 600ms` (heart beat).
- **Layout tokens:** `--tabbar-h: 60px`; `--bottom-nav-height: calc(var(--tabbar-h) + 8px + var(--safe-bottom))`.

### 2.4 The floating hearts (ambient background)

Reuse `src/ui/petal_canvas.js` and the `#petal-canvas` element; change what it draws and where.

| Property | Value |
|---|---|
| Shape | filled heart (same path as the `heart` icon), drawn once to an offscreen sprite |
| Count | 12 on phones, 16 at ≥ 768 px wide |
| Size | 10–22 px, random per heart |
| Colour | `--c-accent`, opacity 0.14–0.26 (light), 0.12–0.22 (dark) |
| Movement | rises from below the viewport to above it at 12–28 px/s; sways sideways on a sine curve, amplitude 10–24 px, period 4–7 s; tilts ±15° with the sway |
| Area | the whole viewport on **every** view (Moments, Places, Bé), no longer clipped to the hero |
| Layer | fixed, behind all content (`z-index: 0`, `pointer-events: none`). Cards, sheets and bars are opaque or glass, so hearts never sit on top of text or photos; they show in the hero, the gutters and the gaps between cards. |
| Runs when | the tab is visible, no `<dialog>` is open, the setting is on, and reduced motion is off. No "hero visible" condition any more. |
| Reduced motion | draw one static frame of 8 hearts and stop the loop (today the canvas is hidden; change that rule in `base.css`) |
| Setting | Settings row renamed "Trái tim bay"; same switch, same storage key `kimthu_petals`, default on |
| Performance | DPR cap 2 (as today); one `requestAnimationFrame` loop; cancel it when any "runs when" condition fails |

**Celebration burst** (the one orchestrated moment): the existing `burst(x, y, ms)` draws 24 hearts instead of petals, at full `--c-accent`, radiating from the trigger point for 1200 ms. Triggers: a moment is saved; a milestone day is reached; the user taps the heart between the avatars (a small burst of 8 hearts). No burst under reduced motion.

---

## 3. Layout and navigation

- **Grid:** one column. Content max-width 560 px, centred (existing). Gutter `--gutter: clamp(12px, 5vw - 2px, 24px)` (existing).
- **Breakpoints:** `< 360px` compact (unlock label hidden, avatars 56 px); `360–767px` phone (default); `≥ 768px` wide (Moments grid 4 columns, tab bar max-width 420 px centred). No horizontal scroll at 320 px.
- **Header (sticky, glass, 52 px):** wordmark "Kim & Thư" (Nunito 800, `--c-text`) on the left; sticky counter pill in the middle once the hero scrolls away; music toggle and settings (couple) or "Mở khóa" (guest) on the right.
- **Tab bar (floating pill):** fixed, 12 px from each side, `8px + safe-bottom` from the bottom edge, height 60 px, `--r-pill`, glass background, `--e-2`. Tabs: **Khoảnh khắc** (heart icon), **Nơi muốn đến** (pin icon), **Bé** (droplet icon, couple only). Guests see two tabs. The active tab has a `--c-primary-soft` pill behind the icon and label, a filled icon and `--c-primary-strong` text; inactive tabs are `--c-muted` with outline icons. The label is always shown (state is not colour alone).
- **FAB (couple only):** 56 px circle, `--c-primary` fill, white plus icon, `--e-2`. Sits `12px` above the tab bar, aligned to the right gutter. Hidden on Bé (existing). Shrinks to 48 px while scrolling down (existing `is-compact`).
- **Bottom padding:** `main` gets `padding-bottom: calc(var(--bottom-nav-height) + 16px)`, plus 68 px more on views with the FAB, so neither bar ever covers the last card or a focused element.
- **Routes (unchanged):** `""` → Moments, `#places`, `#places/visited`, `#be`. `#chat` is removed and falls through to Moments. Back gesture closes the top sheet first (existing overlay stack).

### 3.1 Removed from the product

Chat and timed notes leave the UI completely. The planner should remove:

- the Chat tab (`#tab-chat`) and the chat drawer (`#chat-drawer`)
- the "Bạn là ai?" sheet (`#who-am-i-modal`) and the prompt that opens it after unlock
- the "Thư hẹn giờ" sheet (`#notes-modal`) and the "thư vừa mở" notice
- `src/styles/chat.css`, `src/ui/chat_layout.js`, `chatSkeletonHtml` in `templates.js`, the `chat` field in `route.js`, the `chat-open` body-class checks (`petal_canvas.js`, `overlay_stack.js`, `app_shell.js`), the chat and note code in `app.js`, the matching entries in `sw.js` and the tests that cover them
- the client's reading and sending of `messages` and `notes` in sync

Not in scope: the Apps Script backend and the existing "Messages" and "Notes" sheets. Old data stays where it is; the app just stops showing it.

---

## 4. Screens

### 4.1 Moments (home)

**Purpose:** see how long we have been together and our latest photos. **Primary action:** open a moment (everyone); add a moment via the FAB (couple).

```
┌─────────────────────────────────────┐
│ Kim & Thư                  ♪   ⚙   │  header (glass)
├─────────────────────────────────────┤
│        ♡            ♡               │  floating hearts behind
│           (K) ♥ (T)                 │  avatars 64px, heart 28px
│           Kim    Thư                │
│   ♡   “Iu béeeee:3”                 │  quote, Caveat, muted
│ ┌─────────────────────────────────┐ │
│ │             592                 │ │  counter card (white, r-lg, e-1)
│ │        ngày bên nhau            │ │
│ │   02 giờ · 48 phút · 38 giây    │ │
│ │  ━━━━━━━━━━━━━━━━━━━━━━━♥───    │ │  milestone bar, heart marker
│ │  Còn 8 ngày nữa là tròn 600 ngày│ │
│ └─────────────────────────────────┘ │
│  [ ◌ Kỳ của bé: còn 5 ngày ]        │  period chip (couple only)
│                                     │
│ Khoảnh khắc            [Dòng|Lưới]  │
│ Tháng 10, 2026                      │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │            photo 4:5            │ │  memory card
│ │                                 │ │
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ │  photo scrim
│ │ Bún bò 149                      │ │  title, white, Nunito 800
│ │ 25/10 · 17:09 · Hẻm 273 Tô Hi…  │ │  meta, white
│ └─────────────────────────────────┘ │
│                               (+)   │  FAB
│  ╭───────────────────────────────╮  │
│  │ (♥ Khoảnh khắc)   ⌖ Nơi   ◌ Bé│  │  floating tab bar
│  ╰───────────────────────────────╯  │
└─────────────────────────────────────┘
```

**Hero**
- Sits directly on the page background (no card), centred. This is the only centred block on the screen.
- **Avatar pair:** two 64 px circles showing the initials (first letter of each name, Nunito 800, 26 px). Person 1: `--c-primary` fill, `--c-on-primary` letter. Person 2: `--c-surface` fill, `--c-primary-strong` letter, 2 px `--c-primary` ring. Both have a 3 px `--c-bg` outer ring and overlap by 10 px. A 28 px heart in `--c-primary` on a 36 px `--c-surface` circle (`--e-1`) sits over the overlap (5.0:1 light, 6.9:1 dark, because it is a control).
- The heart is a button (`aria-label="Thả tim"`, 44 px hit area): tap gives a beat and a small heart burst. On page load it beats twice (`scale 1 → 1.18 → 1`, `--m-beat`, `--ease-spring`), then rests. No endless pulse.
- Names under each avatar (`--t-headline`), then the quote (`--t-hand`, `--c-muted`, max 2 lines; hidden when empty).
- **Counter card:** white, `--r-lg`, `--e-1`, padding `--s-6`. Day number in `--c-primary` (`--t-hero-num`), "ngày bên nhau" (`--t-headline`, `--c-text`), clock line (`--t-meta`, `--c-muted`, tabular numbers).
- **Milestone bar:** 8 px track in `--c-primary-soft`, fill in `--c-primary` (4.0:1 against the track), both `--r-pill`; a 16 px `--c-primary` heart marks the end of the fill. Line below in `--t-meta`. Remove the 💞 emoji from the line; the heart marker replaces it.
- **Sticky counter pill** (header): `--c-surface` pill, small heart icon in `--c-primary`, "592 ngày" in `--c-primary-strong`.

**Memory card (feed, "Dòng")** — replaces the loose photo + text block
- One `<button>` per card (existing `memory__open`). Photo fills the card, aspect 4:5, `--r-lg`, `--e-1`, `object-fit: cover`.
- Bottom overlay: `--c-photo-scrim` over the lower 45 %. Title (`--t-title`, `--c-on-photo`, clamp 2) and meta row (`--t-meta`, `--c-on-photo`, 1 line: date · time · place), padding `--s-4`. Add `text-shadow: 0 1px 2px rgba(0,0,0,.35)`.
- The story text is no longer shown in the feed; it lives in the detail sheet.
- Pressed: `scale(.98)` for `--m-fast`. Focus: 2 px `--c-focus` ring with a 2 px `--c-bg` offset outside the card.

| State | Design |
|---|---|
| Loading (first load) | 3 skeleton cards, 4:5, `--c-sunken` with the existing shimmer; same size as real cards, so nothing shifts |
| Photo loading | card at final size with the `--c-sunken` skeleton; title and meta already shown on the scrim |
| Photo failed | `--c-primary-soft` fill, outline heart icon (48 px, `--c-accent`) in the centre, title and meta in `--c-text` / `--c-muted` at the bottom (no scrim), text button "Ảnh chưa tải được · Thử lại" |
| No photo (text-only moment) | white card, `--r-lg`, `--e-1`, padding `--s-5`: title, meta, then the story (clamp 3, `--t-hand`) |
| Not synced | white pill at the top-left of the photo: cloud icon + "Chưa đồng bộ" in `--c-warn` on `--c-surface` |
| Empty (couple) | centred outline heart (64 px), "Chưa có khoảnh khắc nào", "Lưu tấm ảnh đầu tiên của hai đứa nhé.", primary button "Thêm khoảnh khắc" |
| Empty (guest) | same heart, "Hai đứa chưa đăng khoảnh khắc nào." No button. |
| Error | "Không tải được khoảnh khắc. Kiểm tra mạng rồi thử lại." + secondary button "Thử lại" |
| Offline | existing banner; cached cards stay visible |

**Grid ("Lưới"):** 3 columns (4 at ≥ 768 px), 6 px gap, square tiles, `--r-md`. Text-only tiles: `--c-primary-soft` fill with the title in `--c-primary-strong` (clamp 3).

**Month label:** `--t-headline`, `--c-muted`, left aligned, `--s-6` above, `--s-3` below. No pill, no heart.

**"Ngày này năm xưa" row:** white card, `--r-lg`, `--e-1`: 48 px rounded thumb, two text lines, chevron. Unchanged content.

### 4.2 Moment detail sheet (`#memory-detail-modal`)

**Purpose:** read one moment in full. **Primary action:** view the photo full screen (tap); "Sửa" (couple).

```
┌─────────────────────────────────────┐
│ ‹                              ⋯    │  back; more (couple): Sửa, Xoá
│ ┌─────────────────────────────────┐ │
│ │           photo (natural        │ │  r-lg, tap → lightbox
│ │           ratio, max 70vh)      │ │
│ └─────────────────────────────────┘ │
│ Bún bò 149                          │  t-display
│ 25/10/2026 · 17:09                  │  t-meta muted
│ ⌖ Hẻm 273 Tô Hiến Thành  ›          │  place link → maps
│ “Cũm ngonnn”                        │  t-hand
└─────────────────────────────────────┘
```

States: photo loading (skeleton at the stored aspect), photo failed (same fallback as the card + "Thử lại"), not synced (status line under the meta). Delete asks in the confirm sheet ("Xoá khoảnh khắc này?" / "Xoá" / "Giữ lại") and shows the undo toast (existing undo queue).

### 4.3 Add / edit moment sheet (`#memory-modal`)

**Primary action:** "Lưu khoảnh khắc".

```
┌─────────────────────────────────────┐
│              ▁▁▁                    │  grabber
│ Khoảnh khắc mới                 ✕   │
│ ┌─────────────────────────────────┐ │
│ │   ♡  Chọn ảnh từ thư viện       │ │  dashed 1.5px --c-control, r-lg,
│ └─────────────────────────────────┘ │  --c-primary-soft fill
│ Tiêu đề                             │
│ [                                 ] │
│ Ngày & giờ                          │
│ [                                 ] │
│ Địa điểm                            │
│ [                                 ] │
│ Câu chuyện                          │
│ [                                 ] │
│ (        Lưu khoảnh khắc          ) │  sticky at the sheet bottom
└─────────────────────────────────────┘
```

Form rules (apply to every sheet):
- Visible label above each field (`--t-meta`, 600, `--c-text`). Fields: `--c-surface` fill, 1.5 px `--c-control` border, `--r-md`, min-height 48 px, 16 px text. Focus: border `--c-primary` plus the focus ring.
- Error: message under the field in `--c-danger` with a warning icon, in plain words with the fix (for example "Nhập tiêu đề để lưu."). The field border turns `--c-danger`. Input is never cleared on error.
- The submit button stays enabled until the request starts; then it shows a spinner and "Đang lưu…" and is disabled. On failure it returns to its label and a toast explains ("Chưa lưu được. Thử lại nhé.").
- Keep the current input types and hints: `type="url" inputmode="url"` for links, `inputmode="numeric"` for the period length, `autocomplete="current-password"` for the passcode, `enterkeyhint` as today.
- Closing a sheet that has edited, unsaved fields (swipe down, ×, back) asks first in the confirm sheet: "Bỏ nội dung đang nhập?" / "Bỏ" / "Viết tiếp". Typed input is never lost silently.
- Photo chosen: preview at `--r-lg` with a "Đổi ảnh" secondary button.
- On success: sheet closes, heart burst from the new card, toast "Đã lưu khoảnh khắc".

### 4.4 Places

**Purpose:** decide where to go next. **Primary action:** "Chỉ đường" on a place; add a place via the FAB (couple).

```
┌─────────────────────────────────────┐
│ Nơi muốn đến                        │  t-display
│ [ Muốn đi 12 | Đã đến 5 ]           │  segmented, full width
│ (⌖ Gần tôi) (✓ Kiểm tra) (+ Chỗ này)│  chips, scroll sideways
│ ┌─────────────────────────────────┐ │
│ │ A Kafe                 (1,2 km) │ │  title Nunito 800 18; distance pill
│ │ Chủ nhật đi học bài.            │ │  notes, muted, clamp 2
│ │ (➤ Chỉ đường) (TikTok) (✓ Đã đi) ⋯│ │  actions
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Bún bò 149                    │ │  visited
│ │ Đã đến · 25/10/2026             │ │
│ │ Xem khoảnh khắc ›               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- **Place card:** white, `--r-lg`, `--e-1`, padding `--s-4`, `--s-3` between cards. No divider lines inside.
- **Distance pill:** `--c-primary-soft` fill, `--c-primary-strong` text, `--r-pill`, tabular numbers.
- **Actions:** "Chỉ đường" is the soft button (`--c-primary-soft` fill, `--c-primary-strong` text and icon); "TikTok" and "Đã đi" are secondary; "⋯" opens the existing action menu (Sửa, Xoá). Buttons are 40 px tall with 44 px hit areas. At < 360 px the secondary buttons show icons only (labels remain as `aria-label`).
- **Segmented control:** track `--c-sunken`, selected option `--c-surface` with `--e-1` and `--c-primary-strong` text, `--r-pill`.
- **Chips:** `--c-surface` fill, 1.5 px `--c-divider` border, `--r-pill`, 40 px tall; pressed/active chip: `--c-primary-soft` fill, `--c-primary-strong` text, plus `aria-pressed`.

| State | Design |
|---|---|
| Loading | 4 skeleton rows, 96 px tall, `--r-lg` |
| Empty "Muốn đi" | outline pin-with-heart icon, "Chưa có nơi nào muốn đi", "Thêm một quán hay một góc phố hai đứa muốn ghé.", primary button "Thêm địa điểm" (couple) |
| Empty "Đã đến" | "Chưa đến nơi nào", "Bấm “Đã đi” khi hai đứa ghé một nơi trong danh sách." |
| GPS working | the chip shows a spinner and "Đang tìm vị trí…" |
| GPS denied | toast "Chưa được phép dùng vị trí. Bật quyền vị trí trong Cài đặt của máy rồi thử lại." |
| GPS failed | toast "Không lấy được vị trí. Thử lại nhé." |
| Not synced | status line in the card: cloud icon + "Chưa đồng bộ" |
| Error | "Không tải được danh sách. Kiểm tra mạng rồi thử lại." + "Thử lại" |

"Đã đi" opens the existing confirm sheet (`#mark-visited-modal`); after confirming, toast "Đã đánh dấu đã đến". Delete confirms, then offers undo.

### 4.5 Bé (couple only)

**Purpose:** know where Thư is in her cycle and how to care for her today. **Primary action:** "Ghi nhận kỳ mới".

```
┌─────────────────────────────────────┐
│ Bé                                  │
│ ┌─────────────────────────────────┐ │
│ │            ◜‾‾‾◝                │ │  cycle ring, 200px
│ │           ( Ngày 12 )           │ │
│ │            ◟___◞                │ │
│ │     Giai đoạn nang trứng        │ │  t-headline
│ │  Kỳ tới dự kiến 02/12 – 06/12   │ │  muted
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Lời nhắc hôm nay                │ │  --c-primary-soft card
│ │ “Mua trà gừng cho bé nhé”       │ │  t-hand
│ └─────────────────────────────────┘ │
│ (        Ghi nhận kỳ mới          ) │
│ Lịch sử                             │
│ ┌─────────────────────────────────┐ │
│ │ 02/11/2026            5 ngày    │ │  rows, hairline between
│ │ 05/10/2026            5 ngày    │ │
│ └─────────────────────────────────┘ │
│ Dự đoán chỉ để nhắc nhở, không phải │
│ tư vấn y tế.                        │
└─────────────────────────────────────┘
```

- **Ring** (`cycle_ring.js`, reuse): track `--c-primary-soft`, period arc `--c-primary`, predicted window `--c-primary` at a dashed stroke (shape, not a second colour), today marker a white dot with a `--c-primary` ring. The centre text states the day in words, so the ring is never colour alone.
- **History:** one white card, rows separated by `--c-divider` hairlines; dates left, duration right with tabular numbers.

| State | Design |
|---|---|
| Loading | ring-sized circular skeleton + 2 skeleton lines |
| Empty | "Chưa có dữ liệu chu kỳ", "Ghi nhận kỳ gần nhất để app nhắc chăm bé.", the same primary button |
| Error | "Không tải được dữ liệu. Thử lại nhé." + "Thử lại" |
| Guest | the tab is not shown; `#be` falls back to Moments |

### 4.6 Sheets and overlays (shared look)

All existing `<dialog class="sheet">` keep their behaviour. New look:

- Surface `--c-surface`, top corners `--r-sheet`, `--e-2`, scrim `--c-scrim`. Grabber: 36 × 4 px, `--c-divider`, centred.
- Title `--t-title` on the left; close button (44 px, × icon, `aria-label="Đóng"`) on the right.
- One primary pill button per sheet, full width, 52 px, at the bottom above the safe area. A second action is a text button below it.
- **Unlock (`#auth-modal`):** a 56 px `--c-primary-soft` circle with the lock icon in `--c-primary-strong` above the title "Mở khóa đôi ta". Field "Mật mã của hai đứa" with the show/hide toggle. Wrong passcode: "Mật mã chưa đúng. Thử lại nhé." under the field. Checking: button shows a spinner and "Đang mở…". Offline: "Cần có mạng để mở khóa."
- **Settings (`#settings-modal`):** groups are white cards on `--c-bg` with hairline-separated rows. Group headings in sentence case (`--t-meta`, 600, `--c-muted`). The ambient row reads "Trái tim bay". Switch: 52 × 32 px, off track `--c-control`, on track `--c-primary`, white thumb. "Chuyển sang chế độ khách" stays a danger text button with an exit icon.
- **Confirm sheet:** title is the question; destructive confirm button uses `--c-danger` fill with white text and a trash icon.
- **Period alert (`#period-alert-modal`):** unchanged content; a 56 px `--c-primary-soft` circle with the droplet icon above the title.
- **Lightbox:** black scrim at 92 %, close button top-right with a 44 px hit area.
- **Toast:** `--c-toast` fill, `--c-on-toast` text, `--r-pill`, 1 px `--c-divider` border in dark; sits `12px` above the tab bar (above the FAB when both show); an optional action ("Hoàn tác") in `#FF9DBB`, 44 px hit area. `role="status"`.
- **Offline banner:** `--c-surface` card with a `--c-warn` icon and text in `--c-text`, `--r-md`, under the header.

---

## 5. Component inventory

| Component | Reuse / new | Variants and changes |
|---|---|---|
| Button `.btn` | reuse | `--primary` (pink fill, pill, `--e-1`), `--soft` (soft pink fill), `--secondary` (white, 1.5 px `--c-control` border), `--text`, `--danger-text`, **new** `--danger` (filled, confirm sheet only); sizes default 44 px, `--lg` 52 px, `--block`. Pressed: `scale(.97)`. Disabled: 45 % opacity, no shadow. Loading: spinner replaces the icon. |
| Icon button `.icon-btn` | reuse | 44 px hit area, pressed fill `--c-primary-soft` |
| Chip `.chip` | reuse | default, pressed (`aria-pressed`), busy |
| Segmented `.segmented` | reuse | pill track, `--full` |
| Avatar `.avatar` | reuse | **new** size `--64`; variants `--k` (filled) and `--t` (ringed) restyled as in 4.1 |
| Avatar pair `.couple` | **new** | two avatars + heart button; compact (56 px) below 360 px |
| Counter card `.counter-card` | **new** (wraps existing counter markup) | — |
| Milestone bar | reuse | **new** heart marker at the fill end |
| Memory card `.memory` | reuse, restyled | photo-overlay (default), text-only, photo-failed, skeleton, pending badge |
| Grid tile `.tile` | reuse | photo, text-only |
| Place card `.place` | reuse, restyled | default, visited, pending |
| Cycle ring | reuse | new colours only |
| Sheet `.sheet` | reuse | default, `--full`, `--confirm` |
| Switch `.switch` | reuse | new colours and size |
| Tab bar `.tab-bar` | reuse, restyled | floating pill; 2 tabs (guest) or 3 tabs (couple) |
| FAB `.fab` | reuse | default, `is-compact` |
| Empty state `.empty` | reuse | **new** outline heart / pin illustrations (inline SVG, `aria-hidden`) |
| Skeleton `.skeleton` | reuse | pink `--c-sunken` shimmer; photo, row, ring |
| Toast, offline banner | reuse | restyled as in 4.6 |
| Floating hearts (`PetalCanvas`) | reuse, changed | hearts instead of petals; whole viewport; static frame under reduced motion |
| Icons (`icons.js`) | reuse | **new** `heart-filled`, `heart-outline` if not present; the Moments tab uses the heart; remove the chat icon |
| Chat drawer, who-am-i sheet, notes sheet | **removed** | see 3.1 |

---

## 6. Interaction and copy

**Feedback for every action**

| Action | Feedback |
|---|---|
| Any tap on a button, card, chip or tab | pressed state within 100 ms (scale or soft fill) |
| Switch tab | active pill slides to the new tab (`--m-base`); view cross-fades (existing view transition) |
| Save moment / place / period | button spinner → sheet closes → toast ("Đã lưu khoảnh khắc", "Đã lưu địa điểm", "Đã ghi nhận kỳ mới"); moment save also fires the heart burst |
| Save while offline | item appears at once with "Chưa đồng bộ"; toast "Đã lưu trên máy, sẽ đồng bộ khi có mạng." |
| Sync fails | the badge stays; toast "Chưa đồng bộ được. Sẽ thử lại sau." Nothing is removed. |
| Delete | confirm sheet → item leaves → toast "Đã xoá · Hoàn tác" for 5 s |
| Mark visited | confirm sheet → card moves to "Đã đến" → toast "Đã đánh dấu đã đến" |
| Tap the hero heart | beat + small heart burst |
| Milestone reached | number rolls up + heart burst + toast "Tròn 600 ngày bên nhau" |
| Toggle "Trái tim bay" / theme / music | applies at once, no "Lưu" needed (existing) |
| Copy secret link | toast "Đã sao chép liên kết" |

**Action names (one name per action, everywhere):** Lưu · Sửa · Xoá · Hoàn tác · Thử lại · Đóng · Để sau · Mở khóa · Thêm khoảnh khắc · Thêm địa điểm · Chỉ đường · Đã đi (the button) / Đã đến (the state) · Ghi nhận kỳ mới.

**Voice:** warm, short, lower-key Vietnamese as the couple would say it ("hai đứa", "nhé"). No exclamation marks in errors. Errors say what happened and what to do next. Dates as `dd/MM/yyyy`, distances with a comma decimal ("1,2 km") through the existing `vi_format.js`.

**Emoji:** none in controls or status lines. The page `<title>` may keep its 💕.

---

## 7. Accessibility

- **Contrast:** every text pair in 2.1 is ≥ 4.5:1; control borders and focus rings are ≥ 3:1, in both themes. Text over photos always sits on the photo scrim (≥ 5.4:1 in the worst case).
- **Focus:** every interactive element shows a 2 px `--c-focus` ring with a 2 px offset on `:focus-visible`. On pink fills the offset ring is `--c-surface`, so the ring stays visible.
- **Keyboard:** header → main → FAB → tab bar in DOM order. Sheets trap focus while open and return it to the trigger on close (existing). The hero heart, memory cards and place actions are real buttons or links. Segmented controls and tabs keep their current roles and arrow-key behaviour.
- **Labels:** icon-only buttons keep `aria-label` (music, settings, close, more, FAB, hero heart "Thả tim"). Photos use the moment title as `alt`. The canvas and decorative hearts are `aria-hidden`.
- **No permission:** guests never see couple-only controls (FAB, Bé tab, edit, delete, settings); they see "Mở khóa" instead. Nothing is shown disabled without a reason.
- **Hit targets:** ≥ 44 × 44 px for everything tappable, including the 40 px-tall chips and place buttons (padding extends the hit area).
- **Colour independence:** active tab = pill + filled icon + label; visited = ✓ + word; pending = icon + word; errors = icon + message; destructive = icon + word.
- **Reduced motion:** floating hearts become one static frame; no burst, no heart beat, no pressed-scale, no tab-pill slide (instant change). Shimmer becomes a flat `--c-sunken` fill.
- **Hover:** nothing is revealed on hover only; hover styles stay behind `@media (hover: hover)` (existing guard).
- **Dark mode:** hearts drop to 0.12–0.22 opacity so they never glare; all tokens have designed dark values.

---

## 8. Assumptions and open points

1. **No "like" button on moment cards.** Direction A mentioned a heart button on the photo. The `Memories` sheet has no field to store a like, and backend changes are outside a design spec, so the heart moved to the hero (tap to beat and burst). A stored "thả tim" per moment can be a later feature.
2. **Avatars are initials.** There is no stored profile photo for either person. Photo avatars can replace the initials later without changing the layout.
3. **Caveat stays** as the restricted third typeface from the 2026-11-14 decision. If the user wants a stricter look, replace `--font-hand` with Be Vietnam Pro italic and drop the font.
4. **The story text leaves the feed card** to keep the overlay clean; it is shown in the detail sheet and on text-only cards.
5. **Old chat messages and timed notes are kept** in the Google Sheet and only hidden. Deleting that data is a separate decision for the user.
6. **Not verified on a real iPhone.** The current UI was reviewed in a 375 × 812 browser emulation only; safe areas with the floating tab bar need a device check after implementation.
7. **A single moment has no URL.** The detail sheet is not deep-linked today and this spec does not add it; tabs and the Places filter stay in the URL.
8. **The setting key `kimthu_petals` is reused** so each person's current on/off choice carries over to the hearts.
