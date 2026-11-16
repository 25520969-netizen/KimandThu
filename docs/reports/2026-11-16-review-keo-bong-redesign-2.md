# Review: docs/plans/2026-11-15-keo-bong-redesign.md (Revision 2)
Verdict: APPROVED
Blockers: 0 · Major: 0 · Minor: 2

Checked against HEAD `f3759d6`. All nine findings of the first review (`2026-11-16-review-keo-bong-redesign.md`) are fixed.

| Earlier ID | Result | Evidence |
|---|---|---|
| PR-01 | Fixed | Task 10 adds `detailPhotoHtml`, `detailPhotoFailedHtml` and `renderDetailPhoto`, with template tests, static tests and a browser check. The code it names exists: `app.js:1583-1585` (inline photo), `app.js:1608-1611` (click listener), `index.html:450` (`#photo-lightbox`). `safeUrl("javascript:alert(1)", …)` returns `""` (`safe_url.js:28`), so the new template test can pass. |
| PR-02 | Fixed, see PR-10 | BC step 2 now runs before every browser check. |
| PR-03 | Fixed | Deferred items are under Out of scope; the three user decisions of 2026-11-16 are in the Decision log. |
| PR-04 | Fixed | Task 11 sets `min-height: 40px` and asserts the computed height. |
| PR-05 | Fixed | Task 11 asserts one row by vertical centres at 320, 375 and 430, and adds a `279px` container rule. My estimates agree: about 188 px needed in 258 px at 320; 266 in 307 at 375; 286 in 357 at 430. |
| PR-06 | Fixed | `await this.purgeRetiredOutbox();` before `restoreQueuedState()`, with a static assertion. |
| PR-07 | Fixed | `README.md:L37` is in Task 4. |
| PR-08 | Fixed | 92 % black on the dialog only; `::backdrop` transparent; both asserted in the BC. |
| PR-09 | Fixed | The grep hit list names `L1325` and the `note` variable lines. |

New findings (minor, for the coder):

| ID | Severity | Plan location | Evidence | Required change |
|----|----------|---------------|----------|-----------------|
| PR-10 | Minor | Conventions, BC steps 2 and 3 | Run in the preview on 2026-11-16: right after the clear and reload, `navigator.serviceWorker.controller === null` was `true`; 3 s later it was `false`, because the new worker claims the page (`sw.js:65`). After the second reload that step 3 asks for, the controller was set and `workerStart` was `0.9`. So the check depends on timing, and step 3 always puts the page back under a worker. The files are still fresh, because the cache is rebuilt after the edits. | Resize first, then clear and reload once. Use `performance.getEntriesByType("navigation")[0].workerStart === 0` as the check; it stayed `0` on the fresh load after the worker claimed the page. Repeat step 2 after any edit made during a check. |
| PR-11 | Minor | Task 11, PR-05 note ("Phones 342 px wide and up keep the label") | Content width is `0.9 × W − 30` for these widths, which reaches 280 px at W = 345, not 342. | Write 345. The checks at 320, 375 and 430 are not affected. |

Not checked: the browser checks themselves (the code does not exist yet); real pixel widths with Nunito loaded (the PR-05 numbers are estimates); real iPhone safe areas; the deployed Apps Script.
