# Review: docs/plans/2026-11-19-card-boxes.md (Revision 3)
Verdict: APPROVED
Blockers: 0 · Major: 0 · Minor: 0

| ID | Severity | Plan location | Evidence | Required change |
|----|----------|---------------|----------|-----------------|
| — | — | — | No open findings. | — |

**Revision 3 changes verified:**
- **PR-06 fixed (plan L190):** the check is now `getComputedStyle(a).marginBottom === "20px"`. `.memory` keeps `margin-bottom: var(--s-5)` (`src/styles/moments.css:116`), and `--s-5` is `20px` (`src/styles/tokens.css:41`), so the computed value reads `"20px"`. The plan now explains why the distance to the next box can't be measured: a month label sits between every two boxes (`app.js:72-90`, `1467-1474`).
- **New in BC step 4 (plan L38):** calling `journeyApp.renderTimeline()` after `applyAuthMode()` is safe and the plan's reasoning holds. `shouldShowTimelineSkeleton()` returns `false` when `config.apiUrl` is empty (`app.js:1493`), so the feed shows the sample boxes. `applyAuthMode()` already re-renders once `hasInitialRender` is set (`app.js:596-599`), so the extra call only redraws the feed again and has no side effects. This also settles the item I couldn't check in review 2.
- **PR-01 … PR-05** are still fixed as verified in review 2. The test totals are unchanged (207 → 211 → 212 → 212 → 212, baseline `206 passed, 0 failed` on HEAD `88b301b`).

**For the coder:**
- Every expected browser-check value follows the plan's convention that spec §2's "16 px" and "20 px" are measured inside the 1.5 px border (Assumptions L244).
- If any browser measurement differs, log it in §Deviations. Do not change the padding.

Not checked: none of the browser checks were run (this review is static only). The new tests and code were not run because they don't exist yet. `:active` on iOS and `prefers-reduced-motion` can't be tested in the preview (the plan's own Assumptions say so). The claim that place actions "stay on one row at 320 px" was not measured.
