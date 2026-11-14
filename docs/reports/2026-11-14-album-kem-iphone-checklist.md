# Album Kem v6: acceptance results and iPhone checklist

Built on the plan `docs/plans/2026-11-14-album-kem-redesign.md`. Unit and static tests: `scripts/test.sh` → 189 passed, 0 failed.

## Executed (Browser pane, Chromium, `http://127.0.0.1:8765`)

| Check | Result |
|---|---|
| 1. No horizontal scroll at 320 (pane reported 332), 375, 414 px; guest and couple; moments, places, places/visited, Bé, chat, and the sheets memory, detail, place, mark-visited, settings, auth, notes, period, confirm, add-current-location, check-result | Pass (no overflow recorded) |
| 2. 375 × 812: hero height 276 px (limit 300); first memory top 441 px (< 812); chat × and ⋯ buttons inside the viewport and ≥ 44 px | Pass |
| 3. Pink only in the day number, hero heart, links, active tab, FAB (Task 14 query) | Pass for the hero; the feed no longer uses pink outside links |
| 4. Failed photos become text cards with a retry button, no heart placeholder | Pass (on-screen photos; lazy photos below the fold were not forced) |
| 5. One open dialog after unlock (who-am-i, then period alert after 300 ms) | Pass |
| 6. No emoji inside any `<button>` | Static test passes |
| 7. Fonts: one Google Fonts request with Be Vietnam Pro, Caveat, Playfair Display; no Outfit | Static test passes; the request body itself was not inspected |
| 8. Reduced motion | **Static only**: the preview tools cannot emulate `prefers-reduced-motion` (petal canvas, burst, banner, FLIP and sheet animations check the media query in code) |
| 9. Dark theme: tokens cover every role; `theme-color` metas follow the theme | Pass (settings sheet screenshot in dark) |
| Back gesture: lightbox then detail; chat `#chat`; veto path "Viết tiếp" then Back again | Pass |

Not executed in the browser: long-press menu (needs a visible pane for the 500 ms timer), real `navigator.share`, `visualViewport` keyboard offset.

## Not executed: needs a real iPhone

Fill in "Result" for each line.

- Safe areas: header, tab bar, sheet action bar, lightbox × button. Result: ☐ pass ☐ fail · notes:
- Keyboard does not cover the chat input or any sheet action bar. Result: ☐ pass ☐ fail · notes:
- No focus zoom on any field (all inputs are 16 px). Result: ☐ pass ☐ fail · notes:
- Swipe down on the grabber closes sheets; a swipe on content scrolls. Result: ☐ pass ☐ fail · notes:
- Back swipe closes the top overlay first (confirm sheet, menu, lightbox, detail, chat). Result: ☐ pass ☐ fail · notes:
- Drive thumbnails load on both phones (spec §9 open item). Result: ☐ pass ☐ fail · notes:
- Be Vietnam Pro diacritics look right in titles, chat and Settings. Result: ☐ pass ☐ fail · notes:
- Dynamic Type at 130 %: card clamps loosen, nothing is cut off. Result: ☐ pass ☐ fail · notes:
- Scroll smoothness of a long Moments feed with the blurred header and tab bar. If it stutters, drop the two `backdrop-filter` declarations in `src/styles/shell.css` and raise the `--c-glass` alpha to 0.94, then note it in the plan's Deviations. Result: ☐ pass ☐ fail · notes:
- Long-press on a memory opens Sửa / Xóa / Chia sẻ with a small tick, and the tap after it does not open the detail. Result: ☐ pass ☐ fail · notes:
- Share sheet appears for "Chia sẻ". Result: ☐ pass ☐ fail · notes:

## Fluid screen fit (plan 2026-11-14-fluid-screen-fit)
- ☐ pass ☐ fail — Galaxy S24+ Chrome, portrait: Places row ⋯ visible on the same line, no sideways pan
- ☐ pass ☐ fail — iPhone 15 Plus Safari and home-screen app, portrait and landscape: Places row ⋯ visible, FAB and tabs clear of the notch
