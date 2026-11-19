# Review: docs/plans/2026-11-19-card-boxes.md (Revision 2)
Verdict: NEEDS REVISION
Blockers: 0 · Major: 1 · Minor: 0

| ID | Severity | Plan location | Evidence | Required change |
|----|----------|---------------|----------|-----------------|
| PR-06 | Major | Task 3, first BC at 375 × 812, "gap between consecutive `.memory` boxes is 20 px" (plan L190) | The BC uses the three sample memories (Conventions, L43). They fall in three different months: `mem-3` 2025-11-20, `mem-2` 2025-07-15, `mem-1` 2025-04-02 (`app.js:72-90`). `renderTimeline` puts a `monthLabelHtml` before each box whenever the month changes (`app.js:1467-1474`). So every `.memory` comes right after a `.month-label`, and no two boxes are ever next to each other. The space between two boxes is the box's 20 px `margin-bottom`, which collapses with the label's 24 px `margin-top` (`moments.css:194`), plus the label's height, plus 12 px. It is never 20 px. This check fails on a correct build, so Task 3's "Done when" can't hold. It's the same kind of problem as PR-01, and I missed it in the first review. | Either (a) assert `getComputedStyle(a).marginBottom === "20px"`, or (b) inject a second box right after the first, e.g. `a.insertAdjacentHTML("afterend", memoryTextCardHtml(journeyApp.memories[1]))`, re-query, and expect `next.top − a.bottom` = 20 (±0.5). Do (b) before the inject-states check, which reloads afterwards anyway. (a) is simpler and is enough. |

**Revision 2 fixes verified:**
- **PR-01:** the 320 px check now reads `b.left + paddingLeft − a.left` ≈ 17.5 ± 0.5. That is 1.5 px border + 8 px + 8 px, which is correct. The convention for spec §2 is recorded in the Assumptions (L244).
- **PR-02:** the check re-queries after every `outerHTML` swap, sets injected images to eager loading, and compares against `photoH`, which is recorded before the swaps (L192-L194).
- **PR-03:** `inner = sk.clientWidth − 16` is the right basis. `clientWidth` excludes the border, so subtracting 2 × 8 px of padding leaves the content box that the 60 % / 40 % widths resolve against (L195).
- **PR-04:** `.places .skeleton--row { margin-bottom: 0 }` at specificity (0,2,0) beats `.skeleton--row` (0,1,0) at `components.css:120`. Rows are flex children of `.places` (`index.html:119`), so they are 16 px apart. The test and BC assert this (L212, L215, L217).
- **PR-05:** the `tokens.css` ranges L3-L57, L61-L91 and L93-L125 match the file.

Nothing else changed: the test totals are still 207 → 211 → 212 → 212 → 212, and the baseline (`206 passed, 0 failed`) and every other reference I verified in review 1 still hold on HEAD `88b301b`. The only other gap check, between consecutive `.place` rows (Task 4), is valid because place rows are adjacent flex children.

Not checked: none of the browser checks were run (this review is static only). The new tests and code were not run because they don't exist yet. `:active` on iOS and `prefers-reduced-motion` can't be tested in the preview (the plan's own Assumptions say so). The claim that place actions "stay on one row at 320 px" was not measured. Whether `shouldShowTimelineSkeleton()` shows skeletons instead of the sample boxes in client-only mode (BC step 4) was not run.
