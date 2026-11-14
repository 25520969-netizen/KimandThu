# Review: docs/plans/2026-11-14-album-kem-redesign.md (Revision 1)
Verdict: APPROVED
Blockers: 0 · Major: 0 · Minor: 6

All 16 findings of `2026-11-14-review-album-kem-redesign.md` were re-checked against the code at `0420acc`. The five Majors are fixed:
- **PR-01:** the static tests now count `NEW_CSS` only, `backdrop-filter` is counted unprefixed, and the `confirm` test moved to Task 20.
- **PR-02:** Task 27 lists D-02, D-04 and D-07/D-09 with their new assertions.
- **PR-03:** the `.sheet__card` contract is defined, and the lightbox is registered with the overlay stack. Every existing `custom-modal` except the lightbox has a `.modal-card` child (`index.html` L267–735), so the contract applies cleanly.
- **PR-04:** `requestClose`, re-registration after a veto, and deferred `pushState` are specified. The plan's three tests walk through the Back-veto sequence correctly.
- **PR-05:** `commitPeriodChange()` bumps `updatedAt`, which `mergePeriod` (`app.js:3454`) requires.

PR-06 to PR-16 are addressed. Baseline is still `112 passed, 0 failed`. What remains is listed for the coder.

| ID | Severity | Plan location | Evidence | Required change |
|----|----------|---------------|----------|-----------------|
| PR-17 | Minor | Task 10, BC (last check) | "Focus the Dòng/Lưới control, press ArrowRight". In Task 10 that control is still `.view-toggle` (`index.html:153-155`). The first `.segmented` arrives in Task 15, so `bindSegmented()` has nothing to bind yet. | Move this check to Task 15. Keep Task 10's unit-level check of `bindSegmented`, if any. |
| PR-18 | Minor | Task 14 (UI-09), Task 15 photo loading | The test counts textual `infinite` occurrences in `NEW_CSS`, limit 3, all used by Task 4. If Task 15's "skeleton pulse until `load`" on `.memory__photo` is written as its own `animation: … infinite` rule in `moments.css`, that makes a 4th occurrence and the test fails. | In Task 15, give `.memory__photo` the `.skeleton` class (reusing the Task 4 rule), or count distinct `@keyframes` names instead of `infinite`. |
| PR-19 | Minor | Task 4 vs Tasks 19–25 and 27 | Task 27's D-04 asserts a `.field input/textarea/select { font-size: 16px }` rule in `components.css`, and Tasks 19–25 build forms with "labels above fields". No task defines `.field`: Task 4 lists only `.field-error`, in Task 21. Field styling would land in the cleanup task, which says "the app looks the same as at the end of G6". | Add `.field` to Task 4's component list (label above, 16 px `input`/`textarea`/`select`, `--c-sunken` fill, `--c-control` outline, `--r-sm`). Use it in Tasks 19–25. |
| PR-20 | Minor | Task 10 `bindSheets` | "A sheet without `.sheet__card` … throw `Error(…)`". `bindSheets` runs inside the `AppShell` constructor before `bindChatState` and `bindThemeChoice` (`app_shell.js:22-24`). One bad sheet would abort the whole shell, and `window.appShell` would stay undefined. | Log with `console.error` and skip that dialog. Make the Task 10 BC check `0` such dialogs (it already does). |
| PR-21 | Minor | Task 24 step 5 note | "If iOS kills the app … the next pull brings it back." That is wrong under delta sync: the server skips rows with `updatedAt <= since` (`google-apps-script.js:347-348`). The memory then stays hidden on this phone but present on the server and the partner's phone until a full sync. | Persist the pending-delete ids (for example `journey_pending_deletes_v1`) when step 2 runs, and commit them at the next start-up, since the user already confirmed. Or correct the note and accept the gap. |
| PR-22 | Minor | Task 22, `formatLocationBadge` | The plan says the existing tests "assert on `<a `, `href`, and escaping". In fact `test_journey_app.js:33` also asserts `html.indexOf("Quán") !== -1`, and the new "Mở bản đồ" output will not contain that. | Name that assertion explicitly: replace it with a check for `Mở bản đồ`, and move the "Quán" check to a `locationLabel` test. |

Not checked: no browser check was run (static review only). The order of microtasks between `confirmSheet` resolving and the `open` MutationObserver was reasoned through, not executed: both orders leave history and the stack consistent by count. iOS behaviour (blur performance, keyboard, safe areas) is on the Task 28 manual checklist.
