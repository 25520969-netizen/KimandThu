# Kim & Thư — UI Design Spec: "Polaroid mềm" card boxes

**Status:** design spec only. No source file was changed.
**Input for:** `/planner`, which turns this spec into code tasks.
**Request (Thư, 2026-11-19):** "Mỗi khoảnh khắc, nơi muốn đến đều ở trong một cái box để dễ nhìn hơn."
**Direction chosen:** A, "Polaroid mềm". Confirmed by the user on 2026-11-19.
**Amends:** `docs/advice/2026-11-15-design-keo-bong.md` ("Kẹo Bông") §4.1 *Memory card* and §4.4 *Place card*. Everything else in Kẹo Bông stays (tokens, hero, sheets, Bé, motion, floating hearts). Kẹo Bông's user decision "Moment cards: large photo with the text laid over the photo" is **replaced** by this spec.

---

## 0. Grounding

**Product.** Private PWA for one couple: love counter, Moments (photo diary), Places (wishlist with GPS tools), Bé. Guests can read Moments and Places.

**Audience and device.** Kim and Thư, mostly iPhone, installed to the home screen. Light theme is the common case; dark is designed.

**Primary job on the affected screens.** Scroll the Moments feed and recognise each moment at a glance; scan Places and pick where to go next.

**Stack as found (reuse).** Vanilla JS SPA; plain CSS in `src/styles/` (`tokens.css`, `moments.css`, `places.css`, `components.css`); card markup from `src/ui/templates.js` (`memoryBlockHtml`, `memoryTextCardHtml`, `memoryFailedCardHtml`, `memorySkeletonHtml`, `placeRowHtml`, `placeSkeletonHtml`). Main column is capped at 560 px (`src/styles/base.css:50`, `src/styles/shell.css:22`).

**What is wrong today** (seen at 375 × 812, light theme, local server `kimthu-static`):

| ID | Finding | Evidence |
|---|---|---|
| B-01 | Moment cards have no visible edge. In light theme `--card-border` is `transparent` and the shadow is 6–8 % pink, so a pink `--c-sunken` card sits on the pink `--c-bg` page and the cards blur into each other and into the background. | `src/styles/tokens.css:28` (`--card-border: transparent`), `:31` (`--e-1`); `src/styles/moments.css:113-124` (`.memory` uses `--c-sunken`) |
| B-02 | Moment title and meta are laid over the photo. On bright photos, or while the photo is loading, the text block reads as a dark band rather than part of a card; there is no "box" around photo + words. | `src/ui/templates.js` `memoryBlockHtml` (`.memory__overlay`); `src/styles/moments.css:148-157` |
| B-03 | Place cards are white boxes, but with no border and the same faint shadow; their edge is soft against `--c-bg` (white on `#FFF4F7` is only 1.07:1, so the edge is carried by the faint shadow alone). | `src/styles/places.css:16-26` (`.place`) |
| B-04 | The story is not shown in the feed, so every moment looks like "photo + one line"; Thư has to open each card to remember it. | Kẹo Bông §4.1 "The story text is no longer shown in the feed" |

**User decisions (2026-11-19).**

| Question | Answer |
|---|---|
| Moment box shape | White box with a border; photo inset inside it; title, date · time · place **below** the photo |
| Edge strength (moments and places) | Light pink border plus a slightly stronger pink shadow |
| Story in the feed | Yes, handwriting, max 2 lines |
| Grid ("Lưới") tiles | Unchanged square tiles, no box |
| Direction | A, "Polaroid mềm" (not B, the date-stamp variant) |

---

## 1. Design principles for this change

1. **One box = one thing.** Every moment and every place is one white box with the same edge, radius and shadow. Nothing of that item sits outside its box; nothing else sits inside it.
2. **Words on white, not on photos.** Text is always on `--c-surface`, so it reads the same whatever the photo looks like. The photo scrim is no longer used in the feed.
3. **Same box everywhere on these two screens.** The counter card and the "Ngày này năm xưa" row on Moments use the same edge, so the screen has one card language.
4. **No boxes inside boxes.** The inset photo is a picture, not a second card: it has radius but no border and no shadow.
5. Restraint stays as in Kẹo Bông: the box adds no new colour; the only new values are one edge colour and one shadow.

---

## 2. Tokens

Edit `src/styles/tokens.css`. Add two **new** tokens to the light `:root` block and to **both** dark blocks (`:root[data-theme="dark"]` and the `prefers-color-scheme: dark` block), as Kẹo Bông does for every token.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--c-card-edge` (**new**) | `#EFB6C8` | `#5A3D4A` | 1.5 px border of content cards (§3). Decorative boundary. |
| `--e-card` (**new**) | `0 1px 2px rgba(216,27,96,.08), 0 8px 20px rgba(216,27,96,.12)` | `none` | shadow of content cards. Dark relies on the edge and the surface lift, as Kẹo Bông decided for dark. |

Computed contrast (WCAG 2 relative luminance): `--c-card-edge` light is 1.60:1 on `--c-bg` `#FFF4F7` and 1.72:1 on `--c-surface`; dark is 1.92:1 on `--c-bg` `#1C1217` and 1.72:1 on `--c-surface` (today's dark `--card-border` `#44303A` is 1.51:1). The edge is decorative: each card is identified by its photo and title, so WCAG 1.4.11 (3:1 for UI component boundaries) does not apply; the stronger value was chosen so the edge is visible on a phone in daylight without looking like a hard line.

Unchanged and **not** to be edited: `--card-border` (still used by the toast, offline banner, sheet top edge, settings groups and Bé cards; making it pink would put a pink line on the dark toast and on every sheet), `--e-1`. `--c-photo-scrim` has no user left after this change (its only use is `.memory__overlay`, `src/styles/moments.css:152`); see Assumptions.

Radius, spacing, type and motion use the existing scales only:

| Value | Token | Where |
|---|---|---|
| Card radius 24 px | `--r-lg` | moment box, place box, counter card, OTD row |
| Inset photo radius 16 px | none; write `calc(var(--r-lg) - var(--s-2))` | inset photo (outer radius − 8 px padding, so the two curves stay parallel) |
| Box padding around the photo 8 px | `--s-2` | moment box |
| Text block padding 12 / 8 / 8 px (top / sides / bottom) | `--s-3`, `--s-2` | moment text below the photo; text therefore sits 16 px from the box edge, the same as place cards |
| Gap between moment boxes 20 px | `--s-5` (unchanged) | feed |
| Gap between place boxes 16 px | `--s-4` (was `--s-3`) | places list, so the stronger edges do not crowd |

---

## 3. Which elements get the box

| Element | Selector today | Background | Border | Shadow | Radius | Padding |
|---|---|---|---|---|---|---|
| Moment, photo | `.memory.memory--photo` | `--c-surface` (was `--c-sunken`) | 1.5 px `--c-card-edge` | `--e-card` | `--r-lg` | `--s-2` |
| Moment, photo failed | `.memory.memory--failed` | `--c-surface` | same | same | same | `--s-2` |
| Moment, text only | `.memory.memory--text` | `--c-surface` | same | same | same | `--s-5` (unchanged) |
| Moment skeleton | `.memory-skeleton` | `--c-surface` | same | same | same | `--s-2` |
| Place | `.place` | `--c-surface` | same | same | same | `--s-4` (unchanged) |
| Place skeleton | `.skeleton--row` inside `#places` list | `--c-sunken` pulse (unchanged) | same | none | same | — |
| Counter card | `.counter-card` | unchanged | 1.5 px `--c-card-edge` (was 1 px `--card-border`) | `--e-card` | unchanged | unchanged |
| "Ngày này năm xưa" row | `.otd-row` | unchanged | 1.5 px `--c-card-edge` | `--e-card` | unchanged | unchanged |

Not boxed (unchanged): grid tiles (`.tile`), month labels, section head, segmented control, chips, the hero, Bé cards, settings groups, sheets, the detail sheet.

---

## 4. Screens

### 4.1 Moments feed ("Dòng")

**Purpose:** recognise moments at a glance. **Primary action:** tap a box to open the detail sheet. Secondary: FAB "Thêm khoảnh khắc" (couple).

375 × 812, light:

```
┌─────────────────────────────────────┐
│ ♥ 596 ngày              ♪   Mở khóa │  header (unchanged)
│                                     │
│ Khoảnh khắc            [Dòng|Lưới]  │
│ ╭─────────────────────────────────╮ │  OTD row: same edge + shadow
│ │ ▢  Ngày này năm xưa           › │ │
│ │    1 năm trước · Hẻm 273…       │ │
│ ╰─────────────────────────────────╯ │
│ Tháng 10, 2026                      │  month label (sticky, unchanged)
│ ╭─────────────────────────────────╮ │  box: white, 1.5px edge, r-lg, e-card
│ │ ╭─────────────────────────────╮ │ │  8px padding
│ │ │[☁ Chưa đồng bộ]             │ │ │  pending pill, 12px inside photo
│ │ │                             │ │ │
│ │ │          photo 4:5          │ │ │  r = 16px, object-fit cover
│ │ │                             │ │ │
│ │ ╰─────────────────────────────╯ │ │
│ │   Bún bò 149.                   │ │  t-title, --c-text, clamp 2
│ │   25/10 · 17:09 · Hẻm 273 Tô H… │ │  t-meta, --c-muted, 1 line
│ │   “Cũm ngonnn, lần sau gọi      │ │  hand, --c-text, clamp 2
│ │    thêm chả cua”                │ │
│ ╰─────────────────────────────────╯ │
│              20px gap               │  floating hearts show here
│ ╭─────────────────────────────────╮ │
│ │ ╭─────────────────────────────╮ │ │
│ │ │          photo 4:5          │ │ │
│                               (+)   │  FAB (unchanged)
│  ╭───────────────────────────────╮  │
│  │ (♥ Khoảnh khắc)  ⌖ Nơi muốn đến│ │  tab bar (unchanged)
└─────────────────────────────────────┘
```

**Moment box (photo)** — anatomy, top to bottom, all inside the one existing `<button class="memory__open">`:

1. **Inset photo** (`.memory__photo`): width 100 % of the box content, aspect 4:5, `max-height: 75svh` (keep; a test asserts it), radius `calc(var(--r-lg) - var(--s-2))`, `overflow: hidden`, background `--c-sunken` while loading. No border, no shadow. Image `object-fit: cover`, fade-in as today.
2. **Text block** (replaces `.memory__overlay`; suggested class `.memory__body`), padding `--s-3 --s-2 --s-2`, vertical gap `--s-1` between title and meta and `--s-2` before the story:
   - Title: `--t-title` (Nunito 800, 20 px / 1.25), `--c-text`, clamp 2.
   - Meta: `--t-meta`, `--c-muted`, one line with ellipsis: `25/10 · 17:09 · Place` (existing `metaTextHtml`, unchanged content).
   - Story (**back in the feed**): `.hand` (`--t-hand`, Caveat 20 px / 1.3), `--c-text`, wrapped in “ ” as today, **clamp 2**. Hidden entirely when the moment has no story (no empty line, no quote marks).
   - No text shadow, no scrim.
3. **Pending pill** (`.memory__badge`, only when `syncState === "pending"`): stays a `--c-surface` pill with cloud icon + "Chưa đồng bộ" in `--c-warn`, `--e-1`; positioned over the photo, 12 px (`--s-3`) from the photo's top-left corner, i.e. 20 px from the box edge. It must not overlap the text block.

Box height at 375 px wide: box ≈ 341 px wide (page gutter ≈ 17 px each side), photo ≈ 325 × 406 px, text block ≈ 70 px (title 1 line, no story) to ≈ 150 px (title 2 lines + story 2 lines). Update the `content-visibility` placeholder (`contain-intrinsic-size`) from `auto 440px` to `auto 540px` so the scrollbar does not jump.

**Moment box (text only)** — `memoryTextCardHtml`: same box values (white, edge, `--e-card`, `--r-lg`), padding `--s-5` as today. Title, meta (with the inline "Chưa đồng bộ" status as today), story clamp **3** (more room because there is no photo). Unchanged content.

**Moment box (photo failed)** — `memoryFailedCardHtml`: same box, padding `--s-2`. The inset photo area becomes the failed art: `--c-primary-soft` fill, 48 px outline heart in `--c-accent`, same 4:5 size and inner radius so the box does not change height. The text block below is exactly the photo box's text block (title, meta, story) — no `memory__overlay--plain` variant needed. The retry button "Ảnh chưa tải được · Thử lại" stays outside the open button (it is a separate control) and sits over the failed art at 12 px from its top-left, `--c-surface` pill, `--e-1`, min-height 44 px, as today.

**States**

| State | Design |
|---|---|
| Loading (first load) | 3 skeleton boxes: the full box (white, edge, `--e-card`, `--r-lg`, padding `--s-2`) containing a 4:5 `--c-sunken` pulsing block at the inner radius and two pulsing bars below it (14 px tall, 60 % and 40 % wide, `--r-pill`, 12 px and 8 px top margin, 8 px side inset). Same outer size as a real box with a one-line title and no story, so nothing shifts much on arrival. |
| Photo loading | box at final size; inset photo shows `--c-sunken`; title, meta and story already shown below |
| Photo loaded | image fades in (existing 180 ms opacity) |
| Photo failed | see above |
| No story | text block ends after the meta line; box is shorter. This is expected; boxes are not forced to equal height. |
| Long title / long place | title clamps at 2 lines; meta ellipsis on 1 line; full text in the detail sheet |
| Not synced | pending pill on the photo (photo box) or inline status in meta (text box) |
| Empty, error, offline | unchanged from Kẹo Bông §4.1 |
| Grid ("Lưới") | unchanged: square tiles, no box, no story |

**Interaction**

- Pressed: the whole box scales to `.98` for `--m-fast` (`--ease-out`), using `.memory:has(.memory__open:active)`. The inner `memory__open` must not scale on its own (cancel the global `:active { transform: scale(.97) }` from `src/styles/base.css:112` for `.memory__open`), so the photo and text do not shrink inside a still box. Reduced motion: no scale; instead the box border switches to `--c-primary` while pressed.
- Focus: keep the current ring on the box (`.memory:has(.memory__open:focus-visible)`: 2 px `--c-focus`, 2 px offset). It now draws outside a visible edge, which is fine.
- Highlight after save / deep link: keep `memory-highlight` (background pulse to `--c-primary-soft`); it now tints the white box around the photo, which reads better than before.
- Heart burst on save still starts from the new box.

### 4.2 Places

**Purpose:** decide where to go next. **Primary action:** "Chỉ đường" in a box. Only the box edge, shadow and list gap change; content and actions are exactly as Kẹo Bông §4.4.

```
┌─────────────────────────────────────┐
│ Nơi muốn đến                        │
│ [ Muốn đi 2 |  Đã đến 1 ]           │
│ (⌖ Gần nhất) (✓ Đã đến đây chưa?)   │
│ ╭─────────────────────────────────╮ │  box: white, 1.5px edge, r-lg, e-card
│ │ Ga Tàu Thuỷ Bạch Đằng   (1,2 km)│ │  16px padding (unchanged)
│ │ (Waterbus)                      │ │
│ │ Ngắm hoàng hôn trên sông Sài    │ │  notes, muted, clamp 2
│ │ Gòn và đón gió mát cùng bé Thư  │ │
│ │ (➤ Chỉ đường) (▶)               │ │
│ ╰─────────────────────────────────╯ │
│              16px gap               │
│ ╭─────────────────────────────────╮ │
│ │ Bảo Tàng Mỹ Thuật TP.HCM        │ │
│ │ …                               │ │
│ ╰─────────────────────────────────╯ │
└─────────────────────────────────────┘
```

| State | Design |
|---|---|
| Loading | 4 skeleton rows, 96 px, `--r-lg`, now with the 1.5 px `--c-card-edge` border (no shadow, so the pulse stays calm) |
| Visited ("Đã đến" tab) | same box; check icon in the title and the "Đã đến · date" line as today; no greyed-out box |
| Highlighted (scrolled to from elsewhere, `app.js` ~L2683-2687) | existing `place-highlight` pulse on the white box |
| Not synced, empty, GPS, error | unchanged from Kẹo Bông §4.4 |

The place box is not a button (its actions are), so it has no pressed state and no box-level focus ring; buttons keep their own focus styles.

---

## 5. Layout and responsive

- Column: unchanged, full width minus `--gutter`, capped at 560 px. At 560 px the inset photo is ≈ 542 × 678 px, capped by `max-height: 75svh` as today.
- 320 px wide: box ≈ 296 px, photo ≈ 280 × 350 px, text block keeps 16 px from the box edge. No horizontal scroll: the box has `box-sizing: border-box` (global) and the 1.5 px border is inside its width.
- Landscape phone (e.g. 812 × 375): `75svh` caps the photo at ≈ 281 px tall; with `aspect-ratio` and `width: 100%` this crops the photo vertically, the same as today. No new behaviour.
- `container-type: inline-size` on `.place` stays; the action-label container queries keep working because padding is unchanged.

---

## 6. Component inventory

| Component | Reuse / change | Notes |
|---|---|---|
| `.memory` box | **change** | white, `--c-card-edge`, `--e-card`, padding `--s-2` for photo/failed/skeleton variants |
| `.memory__photo` | **change** | inner radius; keep `aspect-ratio: 4/5` and `max-height: 75svh` |
| `.memory__overlay` | **remove from feed** | replaced by the text block below the photo; `memory__overlay--plain` also goes |
| `.memory__body` | **new** | text block: title, meta, story |
| `.memory__quote` | reuse | now also in photo boxes; clamp 2 there, clamp 3 in text-only boxes |
| `.memory__badge`, `.memory__retry` | reuse | re-anchored to the photo, not the box |
| `memorySkeletonHtml` | **change** | box + photo block + 2 bars (§4.1 Loading) |
| `.place` | **change** | edge + `--e-card` only |
| `.places` list | **change** | gap `--s-4` |
| `.skeleton--row` (places) | **change** | add edge |
| `.counter-card`, `.otd-row` | **change** | edge + `--e-card` |
| `.tile`, detail sheet, lightbox | reuse unchanged | |

Tests that encode the old design and must be updated by the planner (not by this spec): `tests/unit/ui/test_templates.js:41` asserts `memory__overlay` is present ("title and meta sit on the photo"); it must instead assert that title, meta and story render below the photo. `tests/unit/ui/test_static_assets.js:372-373` (`max-height: 75svh` on `.memory__photo`) stays valid.

---

## 7. Interaction and copy

No new actions and no new copy. Existing strings stay word for word: "Chưa đồng bộ", "Ảnh chưa tải được · Thử lại", "Ngày này năm xưa", "Chỉ đường", "Đã đi", "Đã đến", "Xem khoảnh khắc ›". The story keeps its “ ” quotes. Feedback per action:

| Action | Feedback |
|---|---|
| Tap a moment box | box presses (`.98`) within one frame, then the detail sheet opens (existing view transition) |
| Tap "Thử lại" on a failed photo | existing retry: photo area returns to the `--c-sunken` loading state |
| Save a moment | sheet closes, heart burst from the new box, `memory-highlight` pulse, toast "Đã lưu khoảnh khắc" (unchanged) |
| Place actions | unchanged |

---

## 8. Accessibility

- **Contrast** (text on `--c-surface`, both themes): title `--c-text` 14.9:1 light / 14.2:1 dark; meta `--c-muted` 5.9:1 / 7.7:1; story `--c-text` 14.9:1 / 14.2:1. All text now sits on solid white or plum surface, so contrast no longer depends on the photo (it relied on the scrim before).
- **Not by colour alone:** the box edge is decorative; "Chưa đồng bộ" keeps its icon + words; visited places keep the check icon + "Đã đến".
- **Names:** `memory__open` keeps `aria-label` = title. Because the story is now visible inside the button, keep the `aria-label` as the title only (do not append the story), so VoiceOver reads a short name; the story is read in the detail sheet. The photo `alt` stays the title. Failed-art heart stays decorative.
- **Keyboard / focus:** one tab stop per moment box (the open button) plus the retry button when present; tab order follows the feed. Focus ring as §4.1. Places unchanged.
- **Hit targets:** whole box is the target (≥ 300 × 400 px); retry ≥ 44 px tall; place buttons unchanged (40 px + 44 px hit area).
- **Reduced motion** (`prefers-reduced-motion: reduce`): no press scale (border colour change instead), skeleton pulse already handled globally in `src/styles/base.css:122`, image fade can stay (opacity only).
- **Dynamic type / zoom:** at 200 % text zoom the text block grows; title still clamps at 2 lines and meta at 1, story at 2; the box grows with its content, never clips the last line.

---

## 9. Assumptions

- Bé cards, settings groups, sheets, toast and offline banner keep their current edges (`--card-border`). They were not part of Thư's request; if she wants the same edge there later, it is a one-token follow-up (`--c-card-edge` + `--e-card` on `.be-status`, `.be-history`, `.settings__group`).
- The moment detail sheet is unchanged (photo, title, meta, place link, story in full).
- Feed photos stay cropped to 4:5; natural aspect ratio is only shown in the detail sheet, as today.
- Boxes have natural height (no equal-height rows); the feed is a single column, so uneven heights do not create gaps.
- `--c-photo-scrim` stays defined even if the feed no longer uses it; removing it is the planner's call.
