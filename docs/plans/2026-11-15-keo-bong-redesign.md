# Plan: "Kẹo Bông" redesign and removal of chat and timed notes

- **Status:** APPROVED
- **Revision:** 2 — addresses every finding of `docs/reports/2026-11-16-review-keo-bong-redesign.md` (PR-01 … PR-09; see Decision log).
- **Source:** `docs/advice/2026-11-15-design-keo-bong.md` (called "the spec" below), plus the user decisions in the Decision log.
- **Goal:** the app looks like the "Kẹo Bông" spec (blush background, white cards, rounded type, hearts floating behind every page) and no longer contains chat or timed notes anywhere, including the backend.
- **Approach:**
  - Remove chat and timed notes first (backend, sync policy, `app.js`, then markup and modules), so the visual work never has to style them.
  - Then restyle from the tokens outwards: tokens and fonts, shared components, shell, hero, feed cards, sheets, Places, Bé.
  - Last, turn the petal canvas into floating hearts with a separate top layer for the celebration burst, clean emoji out of UI strings, and bump the cache version.
- **Stack:** vanilla JS SPA (`index.html`, `app.js`, `src/ui/*.js`, `src/services/*.js`), plain CSS in `src/styles/*.css`, Google Apps Script backend (`google-apps-script.js`), dependency-free test runner (`tests/run_tests.js`).
- **Baseline:** `./scripts/test.sh` → `197 passed, 0 failed` (run 2026-11-15 on HEAD `f3759d6`, clean tree; the script used the macOS `jsc` shell because Node is not installed).
- **Global constraints:**
  - no new dependencies, no build step
  - keep CSP `script-src 'self'`; fonts only from Google Fonts (already allowed)
  - keep every existing element id that this plan does not explicitly remove (`app.js` and the tests look elements up by id)
  - keep existing Vietnamese wording; change copy only where a task says so (user decision D3)
  - do not commit, do not deploy, do not touch the user's Google account
  - never let a write reach the backend during browser checks (see BC)
- **Review focus:**
  1. After the chat removal nothing may still call a removed method or read a removed element (the constructor must finish: `typeof journeyApp === "object"` with no console error).
  2. Old queued `chat:` / `note:` outbox entries and the four retired `localStorage` keys are dropped on start, and nothing else is.
  3. White text on the photo scrim stays readable on a very bright photo; the failed-photo card keeps its retry button outside the card's open button; a photo that fails in the detail sheet shows the same heart box with a retry button and never opens the lightbox.
  4. Place action rows from 258 px to 400 px of card content width: now that the card has 16 px padding, the actions must stay on one row and inside the card (they may not wrap).
  5. The floating tab bar, FAB and toast never cover the last card or each other, with and without the iPhone home indicator.

> Coder: execute tasks in order, tick each checkbox when its Verify passes, log any deviation in §Deviations. Line numbers were checked on 2026-11-15 against HEAD `f3759d6`. They shift after edits, so always find the code by the symbol named next to the range.

## Conventions used by every task

- **TEST:** `./scripts/test.sh` → prints `<n> passed, 0 failed`.
- **Static test file:** static checks go into `tests/unit/ui/test_static_assets.js` and reuse `indexHtml`, `swSource`, `appSource`, `NEW_CSS`, `readText`, `test`, `assertEqual`, `assertTrue`.
- **Browser check (BC):**
  1. Start the preview with `preview_start {name: "kimthu-static"}`.
  2. **Clear the service worker and its cache before every browser check, then reload.** Not once per session: `sw.js:L78-L86` answers from the cache first and refreshes it in the background, and `src/ui/register_service_worker.js:L7-L10` registers the worker again on every load at `localhost`. Without this step the first reload after a task's edits serves the previous task's files, so a "no console error" check can pass against old code. (This is how the preview served a `milestones.js` without `milestoneProgress` on 2026-11-15.) Run, then reload the page:
     `(await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister()); (await caches.keys()).forEach((k) => caches.delete(k));`
     After the reload, confirm `performance.getEntriesByType("navigation")[0].workerStart === 0` before reading any result (PR-10: the new worker claims the page a few seconds later, so `controller === null` is timing dependent; `workerStart` stays `0` for that load).
  3. Set the size first with `resize_window {preset: "mobile"}` (375 × 812) unless the task names another size, then do step 2 once (clear and reload). Repeat step 2 after any edit made during a check.
  4. Simulate couple mode on the client only: `journeyApp.config.apiUrl = ""; journeyApp.isAuthenticated = true; journeyApp.applyAuthMode()`.
  5. Never type a passcode. Never click "Lưu" in Settings (it would persist the emptied link).
  6. Expect `read_console_messages {onlyErrors: true}` to show no error from this app.
  7. Reset with `resize_window {preset: "desktop"}` when done.
- **No horizontal scroll (NHS):** `window.innerWidth === document.documentElement.clientWidth && document.documentElement.scrollWidth <= document.documentElement.clientWidth` → `true`.
- **Spec values:** where a task says "values from spec §x", copy the exact values from that section of the spec; they are not repeated here.

## Requirement map

| Input | Covered by |
|---|---|
| Spec §3.1 remove chat, who-am-i, timed notes; D2 delete the data | Tasks 1, 2, 3, 4, and "User steps" |
| Spec §2.1–2.3 tokens, type, radius, shadow; F-01, F-02 | Task 5 |
| Spec §4.6, §5 shared components | Task 6 |
| Spec §3 header, tab bar, FAB, bottom padding; F-05 | Task 7 |
| Spec §4.1 hero (avatar pair, heart button, counter card, milestone) | Task 8 |
| Spec §4.1 memory card, grid, month label, on-this-day, empty state; F-03; D1 | Task 9 |
| Spec §4.2, §4.3, §4.6 sheets (detail incl. the failed-photo fallback, add moment, unlock, settings, period alert, lightbox) | Task 10 |
| Spec items deferred by the user on 2026-11-16 (load-error rows, exit icon, detail skeleton and not-synced line) | Out of scope |
| Spec §4.4 Places | Task 11 |
| Spec §4.5 Bé | Task 12 |
| Spec §2.4 floating hearts and burst; F-04 | Task 13 |
| Spec §6 "Emoji"; D3 | Task 14 |
| Cache version, README | Task 15 |
| Spec §7 accessibility | contrast test in Task 5; focus, hit areas and reduced motion inside Tasks 6–13 |

## File map

| File | Action | Responsibility |
|---|---|---|
| `google-apps-script.js` | Modify | stop accepting and serving chat messages and timed notes |
| `src/services/sync_policy.js` | Modify | no chat/note outbox types; `isRetiredOutboxKey` |
| `app.js` | Modify | remove chat/notes logic; purge retired local data; hero, burst and copy changes |
| `index.html` | Modify | remove chat/who/notes markup; fonts, theme colour, hero, tab bar, sheet badges, burst canvas |
| `src/styles/chat.css` | Delete | — |
| `src/ui/chat_layout.js` | Delete | — |
| `tests/unit/ui/test_chat_layout.js` | Delete | — |
| `src/styles/tokens.css` | Modify | "Kẹo Bông" tokens, light and dark |
| `src/styles/base.css` | Modify | type classes, canvas layers, reduced-motion rule |
| `src/styles/components.css` | Modify | buttons, chips, segmented, avatar, toast, sheets, fields, switch, settings cards |
| `src/styles/shell.css` | Modify | header, floating tab bar, FAB, page padding |
| `src/styles/moments.css` | Modify | hero, counter card, memory cards, grid, detail sheet |
| `src/styles/places.css` | Modify | place cards |
| `src/styles/be.css` | Modify | Bé cards |
| `src/ui/templates.js` | Modify | photo-overlay card, failed-photo card, text card, month label, on-this-day thumb; drop chat skeleton |
| `src/ui/petal_canvas.js` | Modify | floating hearts, static frame, burst on a top layer |
| `src/ui/cycle_ring.js` | Modify | ring colours |
| `src/ui/app_shell.js` | Modify | drop chat state; sticky pill heart |
| `src/ui/route.js` | Modify | no `chat` route |
| `src/ui/overlay_stack.js` | Modify | header comment only |
| `src/ui/icons.js` | Modify | drop `chat` and `send` glyphs |
| `src/ui/confirm_sheet.js` | Modify | filled danger button with optional icon |
| `src/ui/theme_init.js` | Modify | new theme-colour constants |
| `src/services/milestones.js` | Modify | no emoji in the milestone line |
| `manifest.json` | Modify | new background and theme colour |
| `sw.js` | Modify | precache list without chat files; version via the bump script |
| `README.md` | Modify | no chat / timed notes in the feature list |
| `tests/run_tests.js` | Modify | drop the chat layout source and test |
| `tests/unit/backend/test_apps_script.js` | Modify | backend ignores chat and notes |
| `tests/unit/services/test_sync_policy.js` | Modify | policy without chat |
| `tests/unit/services/test_milestones.js` | Modify | milestone text without emoji |
| `tests/unit/app/test_journey_app.js` | Modify | `purgeRetiredOutbox` |
| `tests/unit/ui/test_static_assets.js` | Modify | static guards for every task |
| `tests/unit/ui/test_templates.js` | Modify | new card templates |
| `tests/unit/ui/test_petal_canvas.js` | Modify | heart helpers |
| `tests/unit/ui/test_route.js` | Modify | routes without chat |
| `tests/unit/ui/test_icons.js` | Modify | required icon list |
| `tests/unit/ui/test_cycle_ring.js` | Modify | ring colours |

## Tasks

### Task 1: Backend stops accepting and serving chat and notes (spec §3.1, D2)
**Files**
- Modify: `google-apps-script.js:L25-L32` (`SHEET_DEFS`: remove the `messages` and `notes` entries)
- Modify: `google-apps-script.js:L206-L217` (`handleChat_`: delete)
- Modify: `google-apps-script.js:L257-L268` (`handleNote_`: delete)
- Modify: `google-apps-script.js:L293-L303` (`POST_HANDLERS`: remove `chat_message` and `note`)
- Modify: `google-apps-script.js:L376-L401` (`collectMessages_`, `collectNotes_` and its comment: delete)
- Modify: `google-apps-script.js:L415-L433` (`doGet`: remove `messages`, `notes`, `deleted.notes` from `out` and the two `collect…` calls)
- Test: `tests/unit/backend/test_apps_script.js:L90-L98`, `L181-L191`

**Interfaces**
- Produces: `doPost` answers `{status: "ignored", …}` for `type: "chat_message"` and `type: "note"` (the existing unknown-type branch at `doPost`). `SyncEngine.attempt` already drops an entry on `"ignored"` (`src/services/sync_engine.js:L93-L96`), so old installed clients stop retrying.
- Produces: the `doGet` response has no `messages` and no `notes` key. Old clients read both with `|| []`.

**Steps**
- [x] Rewrite the test at `L90-L98` ("wrong or missing passcode cannot write or read private data") so it uses `type: "period"` instead of `chat_message`: both unauthorised `postRaw` calls return `code === "unauthorized"`; after an authorised `g.post({type: "period", startDate: "2026-11-01", updatedAt: 1})`, `g.get({}).period === null`, `g.get({passcode: "nope"}).isAuth === false`, and `g.get({passcode: "Correct-Horse-Battery "}).period.startDate === "2026-11-01"`.
- [x] Replace the test at `L181-L191` with `"backend: chat and timed-note writes are ignored and never served"`: `g.postRaw({type: "chat_message", id: "c1", text: "hi", passcode: "correct-horse-battery"}).status === "ignored"`, the same for `type: "note"`, and the authorised `g.get(...)` result has neither a `messages` nor a `notes` property.
- [x] Run TEST → expect 1 failed (the new test).
- [x] Make the six edits listed under Files.
- [x] Run TEST → expect `197 passed, 0 failed`.

**Done when:** `grep -n "handleChat_\|handleNote_\|collectMessages_\|collectNotes_\|SHEET_DEFS.messages\|SHEET_DEFS.notes" google-apps-script.js` prints nothing and TEST passes.

### Task 2: Sync policy without chat (spec §3.1)
**Files**
- Modify: `src/services/sync_policy.js:L15-L19` (`KEY_PREFIX_BY_TYPE`), `L38-L43` (`pollIntervalMs`), `L50-L64` (`isConfirmedByServer`), `L66-L70` (exports)
- Test: `tests/unit/services/test_sync_policy.js:L6`, `L29-L33`, `L43`

**Interfaces**
- Produces: `isRetiredOutboxKey(key: string) -> boolean` — `true` when the key starts with `"chat:"` or `"note:"`. Exported on the global like the other functions.
- Changes: `pollIntervalMs({visible, isAuth, lastActivityAt, now})` no longer reads `chatOpen`. `outboxKey` throws for `chat_message` and `note`.

**Steps**
- [x] In the test file: change `L6` to `assertThrows(() => outboxKey({ type: "chat_message", id: "c1" }))` and add the same for `type: "note"`; remove `chatOpen` from the base object at `L29` and delete the assertion at `L33`; delete the `chat_message` assertion at `L43`; add `test("isRetiredOutboxKey: only chat and note keys", …)` asserting `true` for `"chat:c1"` and `"note:n1"`, `false` for `"memory:m1"`, `"place:p1"`, `"period"`.
- [x] Run TEST → expect failures in `test_sync_policy.js`.
- [x] Remove `chat_message` and `note` from `KEY_PREFIX_BY_TYPE`; remove `ctx.chatOpen ||` from `pollIntervalMs`; remove the two `chat_message` / `note` lines from `isConfirmedByServer`; add and export `isRetiredOutboxKey`.
- [x] Run TEST → expect `198 passed, 0 failed`.

**Done when:** TEST passes. `tests/unit/services/test_sync_engine.js` is not edited (its `"chat:c1"` keys are arbitrary strings for a generic queue).

### Task 3: Remove chat and notes logic from `app.js`; purge retired local data (spec §3.1, D2)
**Files**
- Modify: `app.js:L42` (`CHAT_VIBRATE_KEY` → rename to `HAPTIC_SETTING_KEY`, same value), `L50` (`DIALOG_PRIORITY`: drop `whoAmI`), `L59` (`NOTES_KEY`), `L61-L62` (`SENDER_CHOSEN_KEY`, `VIBRATE_PATTERN_MS`), `L100-L116` (`DEFAULT_CHAT_MESSAGES`): delete the chat/notes constants
- Modify: `app.js:L157-L216` (constructor): remove `this.notes`, `this.chatMessages`, `this.currentSender`, `this.chatPendingImage`, the `initChat()` and `initNotes()` calls; add the `purgeRetiredLocalData()` call
- Modify: `app.js:L245-L248` (`persistChat`: delete)
- Modify: `app.js:L592-L615` (`applyAuthMode`: remove the `promptSenderIfNeeded()` call and the `chatDrawer` block)
- Modify: `app.js:L3057-L3077` (`initSync`: add `await this.purgeRetiredOutbox();` directly after `await this.syncEngine.load();` and before `await this.restoreQueuedState();`. The `await` is required: `SyncEngine.remove` awaits the store between keys, and `syncFromBackend()` flushes the queue right after `initSync`'s `try` block, so an un-awaited purge could still send a second `chat:` entry)
- Modify: `app.js:L3079-L3094` (`restoreQueuedState`: restore images only for `payload.type === "memory"`; remove `renderChatMessages()`)
- Modify: `app.js:L3097-L3098` (`handleSyncRetry`: remove the `chat:` line)
- Modify: `app.js:L3129-L3140` (`scheduleNextPoll`: remove `chatOpen`)
- Modify: `app.js:L3203-L3225` (`handleWriteConfirmed`: remove the `chat_message` and `note` branches)
- Modify: `app.js:L3255-L3389` (comment block, `initNotes`, `toLocalInputValue`, `openNotes`, `submitNote`, `renderNotes`, `mergeNotes`, `promptSenderIfNeeded`, `updateChatPresence`: delete all)
- Modify: `app.js:L3391-L3408` (`applyPulledData`: remove the `mergeChat` and `mergeNotes` calls)
- Modify: `app.js:L3463-L3486` (`mergeChat`: delete)
- Modify: `app.js:L3515-L3634` (comment block, `initChat`, `setChatUnread`, `toggleChatDrawer`: delete)
- Modify: `app.js:L3637-L3640` (`hapticTick`: keep; read `HAPTIC_SETTING_KEY`)
- Modify: `app.js:L3642-L3789` (`vibrate`, `setChatSender`, `updateChatHeaderLabels`, `openChatMenu`, `clearChatPendingImage`, `sendChatMessage`, `chatOutboxKeys`, `renderChatMessages`, `shouldShowChatSkeleton`, `chatItemHtml`, `viewChatImage`: delete all)
- Test: `tests/unit/ui/test_static_assets.js`, `tests/unit/app/test_journey_app.js`

**Interfaces**
- Produces: `const RETIRED_STORAGE_KEYS = ["journey_chat_messages_v1", "journey_notes_v1", "journey_chat_sender_v1", "journey_chat_sender_chosen_v1"]`
- Produces: `JourneyApp.prototype.purgeRetiredLocalData() -> void` — calls `localStorage.removeItem(key)` for each retired key inside one `try/catch` (private mode must not break start-up). Called once in the constructor, directly after the config is loaded.
- Produces: `JourneyApp.prototype.purgeRetiredOutbox() -> Promise<void>` — `for (const key of this.syncEngine.keys().filter(isRetiredOutboxKey)) await this.syncEngine.remove(key);`
- Consumes: `isRetiredOutboxKey` (Task 2), `SyncEngine.keys()`, `SyncEngine.remove(key)`.

**Steps**
- [x] Add to `test_static_assets.js`: `test("chat and timed notes are gone from app.js", …)` asserting `appSource` contains none of `"chatMessages"`, `"toggleChatDrawer"`, `"mergeChat"`, `"mergeNotes"`, `"promptSenderIfNeeded"`, `"initChat"`, `"initNotes"`, `"NOTES_KEY"`, `"chatOpen"`; contains all four strings of `RETIRED_STORAGE_KEYS`; contains `"await this.purgeRetiredOutbox()"`; and the constructor text (from `"constructor() {"` to `"loadData(key, fallback) {"`) contains `"this.purgeRetiredLocalData()"`.
- [x] Add to `test_journey_app.js`: `asyncTest("purgeRetiredOutbox removes only chat and note entries", …)` — set `app.syncEngine = { keys: () => ["chat:c1", "memory:m1", "note:n1", "period"], remove: async (k) => { removed.push(k); } }`, await `app.purgeRetiredOutbox()`, assert `removed` equals `["chat:c1", "note:n1"]`.
- [x] Run TEST → expect 2 failed.
- [x] Make the edits listed under Files. After deleting, run `grep -n "chat\|Chat\|note\b\|Notes\|currentSender\|vibrate()" app.js` and confirm every remaining hit is one of: the `RETIRED_STORAGE_KEYS` strings, `purgeRetired…`, the value of `HAPTIC_SETTING_KEY`, `placeNotesInput` / `currentLocNotesInput`, the `note` variable and `memory-photo-note` in `openMemoryDialog` and `fillMemoryFormForEdit` (`L660-L687`), the comment above `renderBePage` (`L1325`, "care note and history"), or the `popstate` comment and `route.chat` lines at `L1861-L1867` and `L1876` (those go in Task 4).
- [x] Run TEST → expect `200 passed, 0 failed`.
- [x] BC: `typeof journeyApp === "object"`; the Moments, Places and Bé tabs still switch; tapping the Chat tab does nothing (its markup is removed in Task 4).

**Done when:** TEST passes and BC shows no console error.

### Task 4: Remove chat, who-am-i and notes markup, styles and modules (spec §3.1)
**Files**
- Delete: `src/styles/chat.css`, `src/ui/chat_layout.js`, `tests/unit/ui/test_chat_layout.js`
- Modify: `index.html:L33` (chat stylesheet link), `L469-L496` (`#chat-drawer`), `L498-L507` (`#who-am-i-modal`), `L509-L532` (`#notes-modal`), `L541` (`#tab-chat`), `L563` (`chat_layout.js` script): delete
- Modify: `sw.js:L17`, `L46` (`SHELL_FILES`: remove the two chat files)
- Modify: `tests/run_tests.js:L37`, `L62` (remove the chat source and test)
- Modify: `src/ui/route.js:L3`, `L8-L18` (`parseRoute`: no `chat` field, no `"chat"` branch)
- Modify: `app.js:L1860-L1867` (`popstate` handler: remove the `route.chat` block and fix the comment), `L1876` (remove the initial `route.chat` line)
- Modify: `src/ui/app_shell.js:L2` (header comment), `L13` (`CHAT_INPUT_MAX_PX`), `L30` (`bindChatState()` call), `L92-L95` (`bindSheets`: selector becomes `"dialog"`, fix the comment), `L212-L271` (`bindChatState`, `bindKeyboardOffset`: delete)
- Modify: `src/ui/petal_canvas.js:L82-L84` (`isCovered`: only `dialog[open]`)
- Modify: `src/ui/overlay_stack.js:L2` (comment: "the top overlay (a sheet)")
- Modify: `src/ui/templates.js:L171-L176` (`chatSkeletonHtml` and its export: delete)
- Modify: `src/ui/icons.js:L14`, `L30` (remove `"chat"` and `"send"`)
- Modify: `src/styles/shell.css:L96-L107` (`.tab-dot`, `body.chat-open .sticky-counter-pill`), `L131` (`body.chat-open .fab`): delete
- Modify: `src/styles/components.css:L115-L116` (`.skeleton--bubble`), `L128-L129` (`.avatar--32`, `.avatar--56`), `L305` (comment), `L308-L322` (`.who`, `.who-option`): delete; keep `.password-field` (`L306-L307`) and `.avatar--20` (still used by `templates.js` until Task 9)
- Modify: `README.md:L3`, `L9`, `L37`, `L54` (remove chat and timed notes from the description, the feature list and the guest note; at `L37` the list of automatically created sheets becomes `Memories`, `Places`, `Period`)
- Test: `tests/unit/ui/test_static_assets.js`, `test_route.js`, `test_templates.js`, `test_icons.js`

**Interfaces**
- Changes: `parseRoute(hash) -> {view: string, placesFilter: string}`. `"#chat"` now returns the default route.

**Steps**
- [x] In `test_static_assets.js`: remove `"src/styles/chat.css"` from `NEW_CSS` (`L7-L8`); delete the tests at `L139-L141` (D-13), `L158-L160` (D-11), `L168-L170` (D-05); in D-04 (`L148-L156`) delete the `#chat-text-input` line (`L150`); in D-10 (`L185-L190`) delete the `chat-open` assertion; in the guest tab bar test (`L244-L248`) expect `3` buttons; in the last test (`L383-L388`) keep only the `shell` assertion and rename it to `"fluid: FAB and tab bar clear the notch"`.
- [x] Add `test("chat, who-am-i and timed notes are gone from the shell", …)`: none of `"chat-drawer"`, `"tab-chat"`, `"who-am-i"`, `"notes-modal"`, `"chat.css"`, `"chat_layout"` in `indexHtml` or `swSource`; `"chat-open"` appears in none of `NEW_CSS`, `src/ui/app_shell.js`, `src/ui/petal_canvas.js`.
- [x] `test_route.js`: expected objects lose `chat` (`L5`, `L10-L11`); replace `L13` with `assertEqual(parseRoute("#chat"), { view: "moments", placesFilter: "unvisited" })`; delete `L29`.
- [x] `test_templates.js`: delete the `chatSkeletonHtml` test (`L92-L94`). `test_icons.js`: remove `"chat"` and `"send"` from `REQUIRED_ICONS` (`L3-L5`).
- [x] Run TEST → expect failures (the new guard, routes).
- [x] Before deleting the two glyphs, run `grep -n 'icon("chat"\|icon("send"\|icon: "chat"\|icon: "send"' app.js src/ui/*.js` → expect no output.
- [x] Make the edits and deletions listed under Files.
- [x] Run TEST → expect `194 passed, 0 failed` (200 − 3 chat-layout tests − 3 deleted static tests − 1 template test + 1 new guard).
- [x] BC (couple mode): the tab bar shows exactly three tabs; no dialog opens on its own after `applyAuthMode()` except a due period alert; `location.hash = "#chat"` leaves Moments shown.

**Done when:** TEST prints `194 passed, 0 failed`, `ls src/styles/chat.css src/ui/chat_layout.js` reports both missing, and BC shows no console error.

### Task 5: Tokens, typefaces and theme colour (spec §2.1–2.3)
**Files**
- Modify: `src/styles/tokens.css:L3-L47` (`:root`), `L52-L73` (`:root[data-theme="dark"]`), `L75-L98` (the `prefers-color-scheme: dark` block)
- Modify: `src/styles/base.css:L47-L63` (`.large-title`, `.t-title`, `.t-headline`)
- Modify: `index.html:L17-L18` (theme-color metas), `L25` (Google Fonts URL)
- Modify: `src/ui/theme_init.js:L5-L6` (`PAPER_LIGHT`, `PAPER_DARK`)
- Modify: `manifest.json:L9-L10` (`background_color`, `theme_color`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Produces (new tokens, light / dark): `--c-primary-strong` `#B0124C` / `#FFA3BE`; `--c-photo-scrim` (gradient from spec §2.1, same in dark); `--c-on-photo` `#FFFFFF` / `#FFFFFF`; `--c-toast` `#3A1F2B` / `#4A2233`; `--c-on-toast` `#FFF4F7` / `#FBEAF0`; `--c-toast-action` `#FF9DBB` / `#FF9DBB`; `--card-border` `transparent` / `var(--c-divider)`; `--heart-alpha-min` `0.14` / `0.12`; `--heart-alpha-max` `0.26` / `0.22`; `--m-beat: 600ms` (light block only, like the other motion tokens).
- Changes: every existing `--c-*`, `--e-*`, `--r-*`, `--t-display-*`, `--t-title-*` and `--font-display` value → spec §2.1–2.3. `--tabbar-h` stays `49px` here (Task 7 changes it).

**Steps**
- [x] Update the static tests first:
  - Contrast test (`L77-L94`): rename to `"Kẹo Bông: §2.1 text pairs meet 4.5:1 and controls 3:1 (light and dark)"`; replace the `c-primary on c-primary-soft` assertion (`L89`) with `c-primary-strong` on `c-primary-soft` ≥ 4.5 and `c-primary-strong` on `c-sunken` ≥ 4.5; add `c-on-toast` on `c-toast` ≥ 4.5 and `c-toast-action` on `c-toast` ≥ 4.5; add `c-control` on `c-sunken` ≥ 3.
  - D-09 (`L179-L183`): expect `--c-bg:\s*#1C1217`; keep the `#1f1418` check.
  - Fonts (`L200-L205`): rename; expect `"Be+Vietnam+Pro,Caveat,Nunito"`; add `assertEqual(/Playfair/.test(indexHtml), false)`.
  - Theme colour (`L220-L228`): expect `#FFF4F7` (light) and `#1C1217` (dark); rename to `"theme-color: two media metas with the page colours"`.
  - Gradients (`L230-L236`): rename to `"components: the photo scrim token is the only gradient"`; a line containing `gradient(` is allowed only in `src/styles/tokens.css` and only when it starts with `--c-photo-scrim:`; keep the `box-shadow` assertion.
  - Add `test("tokens: both dark blocks are identical", …)`: the body of `:root[data-theme="dark"] { … }` and the body of the `:root:not(…) { … }` rule inside the media query are equal after trimming each line.
- [x] Run TEST → expect failures in those tests.
- [x] Edit `tokens.css`: set the values, add the new tokens to all three blocks (the dark-coverage test at `L340-L345` requires every `--c-*` name in the dark block, including `--c-photo-scrim`, `--c-on-photo` and `--c-toast-action`).
- [x] `base.css`: `.large-title` and `.t-title` → `font-weight: 800`; `.t-headline` → `font-family: var(--font-display); font-weight: 700`.
- [x] `index.html:L25`: `family=Be+Vietnam+Pro:wght@400;500;600&family=Caveat:wght@500&family=Nunito:wght@700;800&display=swap&subset=vietnamese`. Metas, `theme_init.js` and `manifest.json` → `#FFF4F7` / `#1C1217` (`manifest.json`: both fields `#FFF4F7`).
- [x] Run TEST → expect `0 failed`.
- [x] BC: `getComputedStyle(document.body).backgroundColor === "rgb(255, 244, 247)"`; `getComputedStyle(document.querySelector(".large-title")).fontFamily` starts with `Nunito`; after `applyTheme("dark")` the background is `rgb(28, 18, 23)`; call `applyTheme("light")` again.

**Done when:** TEST passes and BC values match.

### Task 6: Shared components (spec §4.6, §5)
**Files**
- Modify: `src/styles/components.css` — `.btn` family (`L4-L38`), `.icon-btn` (`L40-L53`), `.chip` (`L56-L75`), `.segmented` (`L78-L102`), `.empty` (`L105-L107`), `.skeleton` (`L110-L114`), `.avatar` (`L119-L131`), `.journey-toast` (`L134-L164`), `.offline-banner` (`L167-L176`), sheets (`L186-L243`), `.settings__*` and `.switch` (`L275-L301`), `.field` and `.photo-drop` (`L325-L345`)
- Modify: `src/ui/confirm_sheet.js:L11-L30` (`confirmSheet`)
- Modify: `app.js:L1379-L1394` (`deletePeriodStart`), `L1521-L1544` (`deleteMemory`), `L2743-L2767` (`deletePlace`): add `icon: "trash"` to their `confirmSheet({… danger: true})` calls
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Changes: `confirmSheet({title, body?, confirmLabel, cancelLabel?, danger?, icon?: string})`. With `danger` the OK button gets class `btn--danger` (not `btn--danger-text`); with `icon` its content is `icon(name, {size: 18})` followed by the label as a text node (use `textContent` on a `<span>`; never interpolate the label into HTML).

**Steps**
- [x] Add static tests: `.btn--danger` exists in `components.css`; `.btn {…}` contains `border-radius: var(--r-pill)`; `.field input…{…}` still contains `font-size: 16px` (existing D-04 covers it) and `min-height: 48px`; `confirm_sheet.js` contains `"btn--danger"` and does not contain `"btn--danger-text"`.
- [x] Run TEST → expect failures.
- [x] Restyle with these values (everything else in each rule stays):
  - `.btn`: `border-radius: var(--r-pill)`; font `700 var(--t-callout-size)/var(--t-callout-lh) var(--font-display)`.
  - `.btn--primary`: add `box-shadow: var(--e-1)`. `.btn--soft`: text `var(--c-primary-strong)`. `.btn--secondary`: `border: 1.5px solid var(--c-control)`, `background: var(--c-surface)`. `.btn--text`: colour `var(--c-primary)`. New `.btn--danger`: `background: var(--c-danger); color: var(--c-on-primary)`. `.btn:disabled`: `opacity: 0.45; box-shadow: none`.
  - `.icon-btn:active`: `background: var(--c-primary-soft)`.
  - `.chip`: `min-height: 40px`, `background: var(--c-surface)`, `border: 1.5px solid var(--c-divider)`; `[aria-pressed="true"]`: `background: var(--c-primary-soft); color: var(--c-primary-strong); border-color: transparent`. Its `::after` hit area becomes `inset: -2px 0`.
  - `.segmented__option` selected: `color: var(--c-primary-strong)`.
  - `.empty`: `text-align: center`; new `.empty__art { display: block; margin: 0 auto var(--s-3); color: var(--c-accent); }`.
  - `.skeleton--row`: `height: 96px; border-radius: var(--r-lg)`.
  - `.avatar`: font `800 1em/1 var(--font-display)`; add `.avatar--64 { width: 64px; height: 64px; font-size: 26px; }`; `.avatar--k { background: var(--c-primary); color: var(--c-on-primary); }`; `.avatar--t { background: var(--c-surface); color: var(--c-primary-strong); box-shadow: inset 0 0 0 2px var(--c-primary); }`. `.avatar--20` stays until Task 9.
  - `.journey-toast`: `background: var(--c-toast); color: var(--c-on-toast); border: 1px solid var(--card-border); border-radius: var(--r-pill)`. `.toast-action`: `color: var(--c-toast-action); min-height: 44px`.
  - `.offline-banner`: `border-radius: var(--r-md)`; replace the one-sided border with `border: 1px solid var(--card-border)` and add `box-shadow: var(--e-1)`.
  - `dialog.sheet .sheet__card`: `border-top: 1px solid var(--card-border)`. `.sheet__grabber span`: `height: 4px; background: var(--c-divider); opacity: 1`.
  - `.field > label, .field__label`: font `600 var(--t-meta-size)/var(--t-meta-lh) var(--font-body)`. Field controls: `min-height: 48px; border: 1.5px solid var(--c-control); border-radius: var(--r-md); background: var(--c-surface)`; add `:focus { border-color: var(--c-primary); }`.
  - `.photo-drop`: `border: 1.5px dashed var(--c-control); background: var(--c-primary-soft)`.
  - `.switch`: `width: 52px; height: 32px`; thumb `28px`, `translate: 20px 0` when on.
  - Settings as cards: `#settings-modal .sheet__card, #settings-modal .sheet__actions { background: var(--c-bg); }`; `.settings__group { padding: var(--s-3) var(--s-4) var(--s-1); border: 1px solid var(--card-border); border-radius: var(--r-lg); background: var(--c-surface); box-shadow: var(--e-1); }` (the `.settings__head` heading stays inside the card as its first line; no markup change); `.settings__group .settings__row:last-child { border-bottom: 0; }`.
- [x] Focus on pink fills: add `.btn--primary:focus-visible, .btn--danger:focus-visible, .fab:focus-visible { box-shadow: 0 0 0 2px var(--c-surface); }` to `components.css`. The global `:focus-visible` rule in `base.css:L97-L101` is not edited.
- [x] Edit `confirmSheet` and the three delete confirmations.
- [x] Run TEST → expect `0 failed`.
- [x] BC (couple mode): open Settings → groups are white cards on the blush sheet; the switch is 52 × 32; open "Thêm khoảnh khắc" via the FAB → fields are white, 48 px tall; long-press a memory → "Xóa" → the confirm button is filled red with a trash icon; cancel it.

**Done when:** TEST passes and BC matches.

### Task 7: Shell — header, floating tab bar, FAB, page padding (spec §3)
**Files**
- Modify: `src/styles/tokens.css:L42`, `L47` (`--tabbar-h: 60px`; `--bottom-nav-height: calc(var(--tabbar-h) + 8px + var(--safe-bottom))`)
- Modify: `src/styles/shell.css:L28-L52` (`.wordmark`, `.sticky-counter-pill`), `L59-L95` (`.tab-bar`, `.tab`), `L110-L130` (`.fab`), `L139-L145` (`.main-content`)
- Modify: `src/styles/components.css` (`.journey-toast` `bottom`)
- Modify: `index.html:L539` (Moments tab icon → the `heart` glyph path from `src/ui/icons.js:L29`)
- Modify: `src/ui/app_shell.js:L358-L373` (`bindStickyCounter` → `refresh`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Changes: the sticky pill content becomes `icon("heart", {size: 14, filled: true}) + "<strong>" + escapeHtml(days) + "</strong> ngày"`.

**Steps**
- [x] Add static tests: `tokens.css` has `--tabbar-h: 60px`; the `.tab-bar {…}` rule contains `border-radius: var(--r-pill)` and `var(--safe-left)`; the `<nav class="tab-bar">` block in `index.html` contains the heart path `M12 20s-8-4.9-8-11` and not the home path `M3 11l9-8 9 8`; `shell.css` still contains `max(var(--gutter), var(--safe-right))`.
- [x] Run TEST → expect failures.
- [x] `.tab-bar`: `left: max(12px, var(--safe-left)); right: max(12px, var(--safe-right)); bottom: calc(8px + var(--safe-bottom)); height: var(--tabbar-h); max-width: 420px; margin-inline: auto; padding: 6px; gap: 4px; border: 1px solid var(--card-border); border-radius: var(--r-pill); box-shadow: var(--e-2)`. Remove `padding-bottom`, `padding-inline` and `border-top`. Keep the glass background and both `backdrop-filter` lines (the static test allows two declarations in total).
- [x] `.tab`: `max-width: none; border-radius: var(--r-pill); transition: background-color var(--m-base) var(--ease-out), transform var(--m-fast) var(--ease-out)`. `.tab__label`: `font: 600 0.75rem/1.2 var(--font-body)`. `.tab[aria-current="page"] { background: var(--c-primary-soft); color: var(--c-primary-strong); }` (keep the filled-icon rule).
- [x] `.wordmark`: `font-weight: 800`. `.sticky-counter-pill`: `display: inline-flex; align-items: center; justify-content: center; gap: var(--s-1); background: var(--c-surface); box-shadow: var(--e-1)`; `strong` → `color: var(--c-primary-strong)`; `.ui-icon` inside → `width: 14px; height: 14px; color: var(--c-primary)`.
- [x] `.fab`: `bottom: calc(var(--bottom-nav-height) + 12px)`.
- [x] `.main-content`: `padding-bottom: calc(var(--bottom-nav-height) + 16px)`; add `body:not(.is-guest):not(.view-be) .main-content { padding-bottom: calc(var(--bottom-nav-height) + 84px); }`.
- [x] `.journey-toast`: `bottom: calc(var(--bottom-nav-height) + 12px)`; add `body:not(.is-guest):not(.view-be) .journey-toast { bottom: calc(var(--bottom-nav-height) + 80px); }`.
- [x] Update `bindStickyCounter`'s `refresh` and the Moments tab SVG.
- [x] Run TEST → expect `0 failed`.
- [x] BC at 375 × 812 and 320 × 568, guest and couple mode: NHS is `true`; `document.querySelector(".tab-bar").getBoundingClientRect()` has `left ≥ 12` and `bottom ≤ innerHeight − 8`; the FAB's rect and the tab bar's rect do not intersect; scrolled to the page end, the footer's bottom edge is above the tab bar's top edge; `journeyApp.showToast("Thử")` → the toast rect intersects neither the FAB nor the tab bar.

**Done when:** TEST passes and BC matches.

### Task 8: Hero — avatar pair, heart button, counter card, milestone marker (spec §4.1)
**Files**
- Modify: `index.html:L67-L77` (`#hero` content)
- Modify: `src/styles/moments.css:L3-L40` (hero, milestone, period chip)
- Modify: `app.js:L253-L279` (`initDOM`: new refs), `L1128-L1134` (`renderProfile`), `L1048-L1126` (`initEvents`: heart button listener), `L2932-L2943` (`celebrate`)
- Test: `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Markup (ids in bold are new; all other ids keep their current element type and attributes):
  ```html
  <section class="hero page" id="hero" aria-label="Chuyện của hai đứa">
    <h1 class="visually-hidden" id="hero-title">Kim &amp; Thư</h1>
    <div class="couple">
      <div class="couple__avatars">
        <span class="avatar avatar--64 avatar--k" id="avatar-one" aria-hidden="true">K</span>
        <button type="button" class="couple__heart" id="hero-heart-btn" aria-label="Thả tim"><!-- heart svg, fill="currentColor" --></button>
        <span class="avatar avatar--64 avatar--t" id="avatar-two" aria-hidden="true">T</span>
      </div>
      <p class="couple__names"><span class="couple__name" id="partner-one-name">Kim</span><span class="couple__name" id="partner-two-name">Thư</span></p>
    </div>
    <p class="hero__quote hand muted" id="hero-custom-quote"></p>
    <div class="counter-card">
      <!-- existing #hero-days, .hero__clock and .milestone, unchanged except: -->
      <!-- inside #milestone-fill add <svg class="milestone__heart" aria-hidden="true"> with the heart path, fill="currentColor" -->
    </div>
    <!-- existing #period-chip, unchanged -->
  </section>
  ```
- Produces: `JourneyApp.prototype.beatHeart() -> void` — restarts the `is-beating` class on `#hero-heart-btn` (remove, force reflow with `void el.offsetWidth`, add), calls `this.hapticTick()` and `this.petals.burst(cx, cy, 800, 8)` with the button's centre (the 4-argument `burst` arrives in Task 13; until then the 4th argument is ignored).
- Changes: `celebrate({reason, label?, origin?: Element})` — when `origin` is given the burst starts at its centre; otherwise at `#count-days` as today. `afterMemorySaved` (`app.js:L738-L751`) passes `origin: block`.
- Changes: `renderProfile` also sets `#hero-title` to `"<one> & <two>"` and each avatar to the first character of the trimmed name in upper case (`"?"` when the name is empty).

**Steps**
- [x] Add static tests on `indexHtml`: `id="hero-heart-btn"` has `aria-label="Thả tim"`; `id="avatar-one"`, `id="avatar-two"`, `class="counter-card"` and `milestone__heart` exist; `#hero-days`, `#count-days`, `#milestone-bar`, `#milestone-fill`, `#milestone-line`, `#partner-one-name`, `#partner-two-name`, `#hero-custom-quote` still exist; the `<h1` inside `#hero` has class `visually-hidden`.
- [x] Run TEST → expect failures.
- [x] Replace the hero markup.
- [x] CSS in `moments.css`:
  - `.hero { text-align: center; padding-block: var(--s-6) var(--s-4); }`
  - `.couple__avatars { position: relative; display: inline-flex; }` (its width is exactly the two overlapping avatars, so 50 % is the centre of the overlap).
  - Avatars: `.couple { --avatar-hero: clamp(56px, 17vw, 64px); }` and `.couple .avatar { width: var(--avatar-hero); height: var(--avatar-hero); font-size: calc(var(--avatar-hero) * 0.4); outline: 3px solid var(--c-bg); }`; `#avatar-two { margin-left: -10px; }`. The size is fluid on purpose: the static test `"fluid: no width breakpoints in tokens or moments"` forbids a `359px` media query in `moments.css`.
  - `.couple__heart`: `position: absolute; left: 50%; top: 50%; translate: -50% -50%; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--c-primary); cursor: pointer`; its visible disc is a `::before` of 36 × 36 px, `border-radius: 50%; background: var(--c-surface); box-shadow: var(--e-1)`, centred behind the 28 × 28 px svg.
  - `@keyframes heart-beat { 0%, 100% { scale: 1; } 40% { scale: 1.18; } }`; `.couple__heart svg { animation: heart-beat var(--m-beat) var(--ease-spring) 2; }`; `.couple__heart.is-beating svg { animation: heart-beat var(--m-beat) var(--ease-spring) 1; }` (use a second keyframes name, e.g. `heart-beat-tap`, with the same frames so re-adding the class restarts it). No `infinite`.
  - `.couple__names { display: flex; justify-content: center; gap: var(--s-6); margin-top: var(--s-2); }`. `.couple__name`: `flex: 0 1 140px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 var(--t-headline-size)/var(--t-headline-lh) var(--font-display)`; the first is `text-align: end`, the second `text-align: start`, so the gap between the names stays under the heart whatever the name lengths.
  - `.hero__quote`: `margin-top: var(--s-3)`; clamp to 2 lines (`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden`); `:empty { display: none; }`.
  - `.counter-card`: `margin-top: var(--s-4); padding: var(--s-6); border: 1px solid var(--card-border); border-radius: var(--r-lg); background: var(--c-surface); box-shadow: var(--e-1)`.
  - `.hero__days`: `align-items: center`. `.hero__num`: `font-weight: 800; font-variant-numeric: tabular-nums`. `.hero__unit`: `font: 700 var(--t-headline-size)/var(--t-headline-lh) var(--font-display); color: var(--c-text)`.
  - `.milestone { padding-inline: 8px; }`. `.milestone__bar`: `height: 8px; overflow: visible`. Fill span: `position: relative; min-width: 8px; background: var(--c-primary)`. `.milestone__heart`: `position: absolute; right: -8px; top: 50%; translate: 0 -50%; width: 16px; height: 16px; color: var(--c-primary)`.
  - `.period-chip`: `background: var(--c-surface); border: 1.5px solid var(--c-divider)`.
- [x] `app.js`: add refs `this.heroTitle`, `this.avatarOne`, `this.avatarTwo`, `this.heroHeartBtn` in `initDOM`; update `renderProfile`; add `beatHeart` and bind it to the button's `click` in `initEvents`; update `celebrate` and `afterMemorySaved`.
- [x] Run TEST → expect `0 failed` (`"updateCounter uses calendar days"` in `test_journey_app.js` must still pass unchanged).
- [x] BC at 375 and 320 wide: the two avatars overlap by 10 px (`avatarOne.right − avatarTwo.left === 10`); the heart button's rect is ≥ 44 × 44 and centred on the overlap (± 1 px); with `journeyApp.config.partnerTwo = "Một cái tên rất là dài"; journeyApp.renderProfile()` the second name ends in an ellipsis and NHS stays `true` (reload afterwards); clicking it adds `is-beating` and raises no error; the sticky pill still appears after scrolling past the counter; NHS `true`.

**Done when:** TEST passes and BC matches.

### Task 9: Moments feed — photo-overlay card, failed-photo card, text card, grid (spec §4.1, D1)
**Files**
- Modify: `src/ui/templates.js:L32-L79` (`avatarHtml`, `metaRowHtml`, `quoteHtml`, `textBlock`, `memoryTextCardHtml`, `memoryBlockHtml`), `L90-L92` (`monthLabelHtml`), `L95-L106` (`onThisDayHtml`), `L108-L111` (`memorySkeletonHtml`), exports (`L176-L185`)
- Modify: `src/styles/components.css:L127` (`.avatar--20`: delete)
- Modify: `src/styles/moments.css:L54-L160` (feed, month label, grid, on-this-day)
- Modify: `app.js:L1441-L1481` (`renderTimeline` skeleton count, `renderTimelineEmpty`), `L3813-L3823` (`showMemoryTextFallback`)
- Test: `tests/unit/ui/test_templates.js`, `tests/unit/ui/test_static_assets.js`

**Interfaces**
- `memoryBlockHtml(mem, opts) -> string` — with a safe image:
  ```html
  <article class="memory memory--photo" data-id="…">
    <button type="button" class="memory__open" aria-label="TITLE">
      <div class="memory__photo skeleton"><img class="memory__img" … width="800" height="1000" loading="lazy" decoding="async" data-fallback-src="…"></div>
      <div class="memory__overlay">
        <h3 class="memory__title t-title clamp-2">TITLE</h3>
        <p class="memory__meta t-meta">25/10 · 17:09 · Place</p>
      </div>
      <!-- only when mem.syncState === "pending": -->
      <span class="memory__badge status status--warn">[cloud-pending icon, 14]Chưa đồng bộ</span>
    </button>
  </article>
  ```
  No story text. Without an image it returns `memoryTextCardHtml(mem)`.
- `memoryTextCardHtml(mem) -> string` — `<article class="memory memory--text" data-id>` with one `.memory__open` button holding the title, the meta row (with the inline pending status, as today) and the story (`.memory__quote hand clamp-3`). The `retry` option is removed.
- `memoryFailedCardHtml(mem) -> string` (new, exported):
  ```html
  <article class="memory memory--failed" data-id="…">
    <button type="button" class="memory__open" aria-label="TITLE">
      <div class="memory__photo memory__photo--failed">[heart icon, 48, aria-hidden]</div>
      <div class="memory__overlay memory__overlay--plain"><h3 …>TITLE</h3><p class="memory__meta t-meta muted">…</p></div>
    </button><button type="button" class="btn btn--text memory__retry" data-id="…">Ảnh chưa tải được · Thử lại</button>
  </article>
  ```
- `monthLabelHtml(ym) -> '<h2 class="month-label t-headline">Tháng 10, 2026</h2>'`.
- `onThisDayHtml`: thumb `width="48" height="48"`.
- `memorySkeletonHtml() -> '<div class="memory-skeleton skeleton skeleton--photo" aria-hidden="true"></div>'`.
- Removed: `avatarHtml`, the `senderInitial` option (never passed by `app.js`).

**Steps**
- [x] Update `test_templates.js`:
  - `L8-L13`: title escaped in `memoryBlockHtml`; the story-quote assertion moves to `memoryTextCardHtml(TPL_MEM)`; add `assertEqual(memoryBlockHtml(TPL_MEM, {couple: true}).indexOf("Nắng"), -1)`.
  - `L15-L20`: check the three templates `memoryBlockHtml`, `memoryTextCardHtml(TPL_MEM)`, `memoryFailedCardHtml(TPL_MEM)`.
  - `L22-L28`: text card for an empty image; for the failed card assert `"memory--failed"`, `"Thử lại"`, `"</button><button"`, and the heart path `M12 20s-8-4.9-8-11`.
  - `L30-L36`: add `memory__overlay` and `memory__badge` assertions.
  - `L47`: expect the `t-headline` month label. `L52-L56`: include `memoryFailedCardHtml`.
- [x] Update the static test at `L265-L270`: rename to `"moments: a failed photo becomes the heart card with a retry button"`; keep the two `locket-photo-placeholder` checks; the slice after `showMemoryTextFallback(` must contain `memoryFailedCardHtml`.
- [x] Run TEST → expect failures.
- [x] Implement the templates.
- [x] `app.js`: `showMemoryTextFallback` uses `memoryFailedCardHtml(mem)` for `.memory` holders (tiles unchanged); `renderTimeline` shows three skeletons (`memorySkeletonHtml().repeat(3)`); `renderTimelineEmpty` prepends `<span class="empty__art">${icon("heart", {size: 64})}</span>` (text unchanged).
- [x] CSS:
  - `.memory`: `position: relative; margin-bottom: var(--s-5); border: 1px solid var(--card-border); border-radius: var(--r-lg); overflow: hidden; background: var(--c-sunken); box-shadow: var(--e-1); contain-intrinsic-size: auto 440px`. Keep `content-visibility: auto`.
  - `.memory__open`: `position: relative; display: block` (drop the flex gap). `.memory__photo`: keep the whole rule (the static test needs `max-height: 75svh`) but `border-radius: 0`.
  - `.memory__overlay`: `position: absolute; inset: auto 0 0 0; padding: var(--s-8) var(--s-4) var(--s-4); background: var(--c-photo-scrim); color: var(--c-on-photo); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35)`; `.memory__title` and `.memory__meta` inside it use `color: inherit`.
  - `.memory__overlay--plain`: `background: none; text-shadow: none; color: var(--c-text)`.
  - `.memory__badge`: `position: absolute; top: var(--s-3); left: var(--s-3); padding: var(--s-1) var(--s-2); border-radius: var(--r-pill); background: var(--c-surface); font: 500 var(--t-meta-size)/var(--t-meta-lh) var(--font-body); box-shadow: var(--e-1)`.
  - `.memory__photo--failed`: `display: flex; align-items: center; justify-content: center; background: var(--c-primary-soft); color: var(--c-accent)`.
  - `.memory--failed .memory__retry`: `position: absolute; top: var(--s-3); left: var(--s-3); margin: 0; min-height: 44px; border-radius: var(--r-pill); background: var(--c-surface); box-shadow: var(--e-1)`.
  - `.memory--text`: replace the left border with `padding: var(--s-5); background: var(--c-surface)`; inside it `.memory__open { display: flex; flex-direction: column; gap: var(--s-2); }`.
  - Focus: `.memory__open:focus-visible { outline: none; box-shadow: none; }` and `.memory:has(.memory__open:focus-visible) { outline: 2px solid var(--c-focus); outline-offset: 2px; }`.
  - `.memory-skeleton`: `margin-bottom: var(--s-5)`.
  - `.month-label`: `margin: var(--s-6) 0 var(--s-3)`.
  - Grid: `.timeline.is-grid { gap: 6px; }` (delete `padding-inline: 0` and the grid month-label `padding-inline`); `.tile { border-radius: var(--r-md); }`; `.tile__text`: `color: var(--c-primary-strong); font: 700 15px/1.3 var(--font-display)`.
  - `.otd-row`: `padding: var(--s-3); border: 1px solid var(--card-border); border-radius: var(--r-lg); background: var(--c-surface); box-shadow: var(--e-1)` (drop `border-block`); thumb `48px`.
- [x] Run TEST → expect `0 failed`.
- [x] BC at 375 wide: each `.memory--photo` shows the title inside the photo's bottom area (`overlay.bottom === card.bottom ± 1`); remove one feed image's `data-fallback-src` attribute and set its `src` to `"/missing.jpg"` (a 404 on the local server) → the card becomes `.memory--failed` at the same width, and clicking "Thử lại" restores `.memory--photo`; switch to "Lưới" → tiles have 6 px gaps; NHS `true`. In dark (`applyTheme("dark")`) the card has a 1 px border and no shadow; switch back.

**Done when:** TEST passes and BC matches.

### Task 10: Sheets — detail (with the failed-photo fallback), unlock, period alert, settings label, lightbox (spec §4.2, §4.3, §4.6; PR-01)
**Files**
- Modify: `index.html:L143` (`#memory-detail-title`: class `large-title`), `L312-L316` (`#period-alert-modal` header), `L389` (`#cfg-petals-label` text → `Trái tim bay`), `L425-L429` (`#auth-modal` header), `L37` (comment → "Floating hearts background canvas")
- Modify: `src/ui/templates.js` (new `detailPhotoHtml`, `detailPhotoFailedHtml`, added to the exports at `L176-L185`)
- Modify: `app.js:L1578-L1595` (`openMemoryDetail`: the inline photo markup at `L1583-L1585` is replaced by a `renderDetailPhoto(mem)` call), `L1605-L1631` (`bindMemoryDetail`: retry click)
- Modify: `src/styles/moments.css:L163-L184` (detail and lightbox)
- Modify: `src/styles/components.css` (new `.sheet__badge`)
- Test: `tests/unit/ui/test_templates.js`, `tests/unit/ui/test_static_assets.js`

**Interfaces**
- Markup: in `#auth-modal` and `#period-alert-modal`, as the first child of `.sheet__card` (before `.sheet__header`; the grabber is inserted above it at run time), add `<span class="sheet__badge" aria-hidden="true">[svg]</span>` with the `lock` glyph (unlock) and the `drop` glyph (period alert), copied from `src/ui/icons.js:L19` and `L15`.
- Produces: `detailPhotoHtml(mem) -> string` — `""` when `safeUrl(mem.image, IMAGE_URL_OPTIONS)` is empty; otherwise exactly today's markup, with both values through `escapeHtml`: `<button type="button" class="detail__photo" aria-label="Phóng to ảnh"><img src="…" alt="TITLE"></button>`.
- Produces: `detailPhotoFailedHtml() -> string` — `<div class="detail__failed">[heart icon, 48, aria-hidden]<button type="button" class="btn btn--secondary detail__retry">Ảnh chưa tải được · Thử lại</button></div>`. It must not carry the class `detail__photo`: `bindMemoryDetail` opens the lightbox for clicks inside `.detail__photo`.
- Produces: `JourneyApp.prototype.renderDetailPhoto(mem) -> void` — sets `#memory-detail-photo`'s `innerHTML` to `detailPhotoHtml(mem)`; when that contains an `<img>`, adds an `error` listener with `{ once: true }` that replaces the content with `detailPhotoFailedHtml()`. No inline handler attributes (CSP).
- Changes: the existing click listener in `bindMemoryDetail` (`L1607-L1610`) first checks `e.target.closest(".detail__retry")`; on a hit it calls `this.renderDetailPhoto(mem)` and returns. The `.detail__photo` → lightbox branch stays as it is.

**Steps**
- [x] Add to `test_templates.js`: `detailPhotoHtml(TPL_MEM)` contains `class="detail__photo"`, `aria-label="Phóng to ảnh"` and the escaped title in `alt`, and no `<b>`; `detailPhotoHtml(Object.assign({}, TPL_MEM, { image: "" })) === ""`; `detailPhotoHtml(Object.assign({}, TPL_MEM, { image: "javascript:alert(1)" })) === ""`; `detailPhotoFailedHtml()` contains `detail__failed`, `detail__retry`, `Thử lại` and the heart path `M12 20s-8-4.9-8-11`, and does not contain `detail__photo`.
- [x] Add static tests: `indexHtml` contains `Trái tim bay` and not `Cánh hoa bay`; the `#auth-modal` and `#period-alert-modal` blocks each contain `sheet__badge`; `#memory-detail-title` has class `large-title`; the `app.js` text from `"renderDetailPhoto(mem) {"` to the next `"\n  }\n"` contains `detailPhotoHtml`, `detailPhotoFailedHtml` and `"error"`; the text from `"bindMemoryDetail() {"` to `"async shareMemory("` contains `detail__retry`; the text from `"openMemoryDetail(mem) {"` to `"renderMemoryStory("` contains `renderDetailPhoto` and no `<img`.
- [x] Run TEST → expect failures.
- [x] Implement the two templates, `renderDetailPhoto`, and the two `app.js` edits.
- [x] Markup edits.
- [x] CSS: `.sheet__badge { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin: 0 0 var(--s-3); border-radius: 50%; background: var(--c-primary-soft); color: var(--c-primary-strong); }`.
- [x] Detail: `.detail__photo`: `width: 100%; margin: 0; border-radius: var(--r-lg); overflow: hidden`; its `img`: `max-height: 70dvh`. New `.detail__failed { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--s-3); aspect-ratio: 4 / 5; max-height: 70dvh; border-radius: var(--r-lg); background: var(--c-primary-soft); color: var(--c-accent); }`.
- [x] Lightbox (PR-08): the dialog fills the viewport, so the 92 % colour goes on one layer only: `.photo-lightbox-modal { background: rgba(0, 0, 0, 0.92); }` and `.photo-lightbox-modal::backdrop { background: transparent; }`.
- [x] Run TEST → expect `0 failed`.
- [x] BC: open a memory → the photo has 24 px corners and is inset from the sheet edges; the guest "Mở khóa" sheet shows the lock badge; Settings shows "Trái tim bay".
- [x] BC, failed photo in the detail sheet: open a memory that has a photo; remember `const original = document.querySelector("#memory-detail-photo img").src`; set that image's `src` to `"/missing.jpg"` (a 404 on the local server) → within 2 s `#memory-detail-photo .detail__failed` exists and there is no `<img>` inside `#memory-detail-photo`; click the heart box outside the button → `document.getElementById("photo-lightbox").open === false`; click "Thử lại" → `.detail__failed` is gone and `#memory-detail-photo img` exists again with `src === original`.
- [x] BC, lightbox: open the lightbox → `getComputedStyle(dialog).backgroundColor === "rgba(0, 0, 0, 0.92)"` and `getComputedStyle(dialog, "::backdrop").backgroundColor` is `rgba(0, 0, 0, 0)`.

**Done when:** TEST passes and all three BC blocks hold.

### Task 11: Places — cards, distance pill, actions (spec §4.4)
**Files**
- Modify: `src/styles/places.css:L18-L59`
- Modify: `app.js:L39` (`PLACES_SKELETON_ROWS = 4`), `L2850-L2859` (`renderPlacesEmpty`: prepend `<span class="empty__art">${icon("pin", {size: 64})}</span>`; text unchanged)
- Test: `tests/unit/ui/test_static_assets.js`

**Steps**
- [x] Add a static test: the `.place {…}` rule contains `border-radius: var(--r-lg)` and `background: var(--c-surface)`; `places.css` still matches the three container-query patterns of the existing test at `L377-L381` and also matches `@container\s*\(max-width:\s*279px\)`; the `.place__actions .btn {…}` rule contains `min-height: 40px`; `appSource` contains `PLACES_SKELETON_ROWS = 4`.
- [x] Run TEST → expect failures.
- [x] CSS:
  - `.places`: `display: flex; flex-direction: column; gap: var(--s-3)`.
  - `.place`: `padding: var(--s-4); border: 1px solid var(--card-border); border-radius: var(--r-lg); background: var(--c-surface); box-shadow: var(--e-1)` (drop `padding-block` and `border-bottom`; keep `container-type: inline-size`).
  - `.place__title`: `font: 800 1.125rem/1.3 var(--font-display)`.
  - `.place__distance`: `padding: 2px var(--s-2); border-radius: var(--r-pill); background: var(--c-primary-soft); color: var(--c-primary-strong)`.
  - `.place__actions .btn`: `position: relative; height: 40px; min-height: 40px; min-width: 44px` (PR-04: `.btn` has `min-height: 44px` in `components.css:L9`, so `height` alone would still compute to 44 px); add `.place__actions .btn::after { content: ""; position: absolute; inset: -2px 0; }` for the 44 px hit height.
  - The container queries now measure the card's content box (card width − 34 px: 16 px padding and a 1 px border on each side). Keep the `439px` and `319px` rules and their numbers (the static test matches them).
  - PR-05: add `@container (max-width: 279px) { .place__actions .btn--soft .btn__label { display: none; } }` after the `319px` rule. At a 320 px viewport the content box is about 258 px, and the four actions with the "Chỉ đường" label need about 266 px, so the row would wrap. With the label hidden (the link keeps its `aria-label`) the row needs about 190 px. Phones 345 px wide and up keep the label.
- [x] `app.js` edits.
- [x] Run TEST → expect `0 failed`.
- [x] BC (couple mode, Places tab, a place that has a map link, a TikTok link and is not visited, so all four actions show) at 320, 375 and 430 wide. Record `document.documentElement.clientWidth` and the `.place` content width next to each result. For every `.place__actions` element `a`:
  - one row: `new Set([...a.children].filter((e) => e.offsetWidth).map((e) => { const b = e.getBoundingClientRect(); return Math.round(b.top + b.height / 2); })).size === 1` (vertical centres, because the buttons are 40 px and "⋯" is 44 px tall; `flex-wrap: wrap` would otherwise let a wrapped row pass a right-edge check);
  - inside the card: each child's `right` ≤ the card's content-box right edge + 1;
  - height: `getComputedStyle(a.querySelector(".btn")).height === "40px"`;
  - label: the "Chỉ đường" `.btn__label` is visible at 375 and 430 and has `display: none` at 320.
  NHS `true` at all three widths; guests see no "Đã đi" and no "⋯". If the one-row check fails at any width, stop and log the measured child widths in §Deviations; do not ship a wrapping row.

**Done when:** TEST passes and every BC line holds at all three widths.

### Task 12: Bé — cards and ring colours (spec §4.5)
**Files**
- Modify: `src/styles/be.css:L4-L19`
- Modify: `src/ui/cycle_ring.js:L84-L91` (`cycleRingSvg`)
- Test: `tests/unit/ui/test_cycle_ring.js:L44`

**Interfaces**
- `cycleRingSvg` output colours: track `var(--c-primary-soft)`; predicted-window arc `var(--c-primary)` with `stroke-dasharray="4 4"`; period arc `var(--c-primary)` (unchanged); today dot `fill="var(--c-surface)" stroke="var(--c-primary)" stroke-width="3"`; title `font-weight="800"`.

**Steps**
- [x] `test_cycle_ring.js:L44`: expect `var(--c-primary)` and `var(--c-primary-soft)` present and `var(--c-sunken)` absent; add `stroke-dasharray="4 4"` present.
- [x] Run TEST → expect 1 failed.
- [x] Edit `cycleRingSvg`.
- [x] CSS: `.be-status`, `.be-care` and `.be-history` become cards: `padding: var(--s-5) var(--s-4); border: 1px solid var(--card-border); border-radius: var(--r-lg); box-shadow: var(--e-1)`; `.be-status` and `.be-history` use `background: var(--c-surface)`, `.be-care` uses `background: var(--c-primary-soft)` with no shadow. `.be-history`: `padding-block: 0`; `li:last-child { border-bottom: 0; }`; `li { font-variant-numeric: tabular-nums; }`.
- [x] Run TEST → expect `0 failed`.
- [x] BC (couple mode, Bé tab): three cards; the history card's last row has no line under it; NHS `true`.

**Done when:** TEST passes and BC matches.

### Task 13: Floating hearts and the burst layer (spec §2.4)
**Files**
- Modify: `src/ui/petal_canvas.js` (whole file; the class name `PetalCanvas` and the file name stay)
- Modify: `index.html:L37-L38` (add `<canvas id="burst-canvas" aria-hidden="true"></canvas>` after `#petal-canvas`)
- Modify: `src/styles/base.css:L14-L22` (`#petal-canvas`), `L113-L122` (reduced-motion block)
- Modify: `app.js:L2916-L2926` (`initPetalsCanvas`), `L2932-L2943` (`celebrate`)
- Test: `tests/unit/ui/test_petal_canvas.js`, `tests/unit/ui/test_static_assets.js:L127-L132`, `L185-L190`

**Interfaces**
- `new PetalCanvas({canvas: HTMLCanvasElement, burstCanvas: HTMLCanvasElement, enabled?: () => boolean})` — the `hero` option is removed.
- Kept: `start()`, `stop()`, `update()`, `fit()`, `static hexToRgb(hex) -> number[]` (fallback now `[255, 127, 165]`).
- Changed: `burst(x: number, y: number, durationMs?: number, count?: number) -> void` — default count 24; draws on `burstCanvas`; particles travel 60–140 px from the origin and rise 40 px while fading from 0.9 to 0.
- New pure statics (unit-tested):
  - `PetalCanvas.heartCount(viewportWidth: number) -> number` — `16` when `viewportWidth >= 768`, else `12`.
  - `PetalCanvas.shouldAnimate({hidden: boolean, reducedMotion: boolean, enabled: boolean, covered: boolean, bursting: boolean}) -> boolean` — `false` when `hidden` or `reducedMotion`; otherwise `true` when `bursting`; otherwise `enabled && !covered`.
  - `PetalCanvas.stepHeart(heart, dtMs: number, bounds: {width: number, height: number}) -> boolean` — moves the heart up by `heart.speed * dtMs / 1000`, advances `heart.t` by `dtMs`, and returns `true` when the heart has fully left the top (`heart.y < -heart.size`), so the caller respawns it below the bottom edge.
- Heart fields: `{x, y, size (10–22), speed (12–28 px/s), swayAmp (10–24), swayPeriod (4000–7000 ms), t, alpha}`. Drawn x = `x + swayAmp * sin(2π t / swayPeriod)`; tilt = `15° * sin(2π t / swayPeriod)`.
- Constants: `PHONE_COUNT = 12`, `WIDE_COUNT = 16`, `WIDE_MIN_WIDTH_PX = 768`, `STATIC_COUNT = 8`, `BURST_COUNT = 24`, `DPR_CAP = 2`, `MAX_DT_MS = 50`, `THEME_CHECK_EVERY_FRAMES = 15`.

**Steps**
- [x] Rewrite `test_petal_canvas.js`: keep the `hexToRgb` test with the new fallback (`"nope"` → `[255, 127, 165]`, and `"#FF7FA5"` → `[255, 127, 165]`); add tests for `heartCount(375) === 12`, `heartCount(768) === 16`; the five `shouldAnimate` cases (hidden; reduced motion; bursting while covered → `true`; disabled → `false`; enabled and uncovered → `true`); `stepHeart` with `{y: 100, speed: 20, size: 10, t: 0}` and `dtMs: 1000` → `y === 80`, `t === 1000`, returns `false`; with `y: -9, speed: 20` → returns `true`.
- [x] Replace the static test at `L127-L132` with `"hearts: 12 or 16, a static frame of 8, and a gated loop"`: the file matches `PHONE_COUNT = 12`, `WIDE_COUNT = 16`, `STATIC_COUNT = 8`, and contains `prefers-reduced-motion`, `visibilitychange`, `dialog[open]`; `appSource` still contains none of `PETAL_COUNT`, `spawnHeartBurst`, `spawnHeartConfetti`. In D-10 (`L185-L190`) keep the `devicePixelRatio` and `dialog[open]` assertions. Add: `base.css` has no `#petal-canvas { display: none` and has a `#burst-canvas` rule; `indexHtml` contains `id="burst-canvas"`.
- [x] Run TEST → expect failures.
- [x] Implement:
  - One `requestAnimationFrame` loop, time-based (`dt = min(now − last, MAX_DT_MS)`), running only while `shouldAnimate(...)` is true; `update()` starts or cancels it, exactly as today.
  - Covered = `!!document.querySelector("dialog[open]")`. Listen to `visibilitychange`, `resize`, capture-phase `close`, and observe `open` attribute changes on dialogs with one `MutationObserver` on `document.body` (`subtree: true, attributeFilter: ["open"]`). Remove the `IntersectionObserver` and the hero clip.
  - Colour: read `--c-accent`, `--heart-alpha-min` and `--heart-alpha-max` with `getComputedStyle(document.documentElement)` when the loop starts and every `THEME_CHECK_EVERY_FRAMES` frames; when the accent changed, redraw the offscreen heart sprite (the `heart` glyph path as a `Path2D`, filled, on a 64 × 64 offscreen canvas) and reassign each heart's alpha inside the new range.
  - Hearts spawn spread over the whole viewport; `fit()` rebuilds them when `heartCount(innerWidth)` changes.
  - Reduced motion or `enabled() === false`: no loop. When enabled and reduced motion is on, draw one static frame of `STATIC_COUNT` hearts from a fixed-seed generator (so a resize does not reshuffle them); when disabled, clear the canvas.
  - `burst` is a no-op under reduced motion (unchanged behaviour).
- [x] `base.css`: `#petal-canvas { z-index: 0; }`; add `#burst-canvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 60; }`; in the reduced-motion block replace `#petal-canvas { display: none; }` with `#burst-canvas { display: none; }`.
- [x] `app.js`: `initPetalsCanvas` passes `burstCanvas: document.getElementById("burst-canvas")` and no `hero`; update the section comment. `celebrate` passes the default count; `beatHeart` (Task 8) passes `8`.
- [x] Run TEST → expect `0 failed`.
- [x] BC:
  - On Moments, Places and Bé: sample `#petal-canvas` twice, 500 ms apart, with `getImageData` over the full canvas → both samples have non-transparent pixels and differ.
  - Open any sheet → after 300 ms two samples 500 ms apart are identical (loop paused) or empty.
  - Settings → switch "Trái tim bay" off → the canvas is fully transparent; on again → hearts return.
  - `journeyApp.celebrate({reason: "save"})` → `#burst-canvas` has non-transparent pixels within 200 ms and is empty after 1500 ms.
  - Record the frame cost: with the Moments feed visible, measure 120 frames with `requestAnimationFrame` timestamps → the median interval is ≤ 20 ms on the preview machine. Log the number in §Deviations if it is higher.

**Done when:** TEST passes and all five BC checks hold.

### Task 14: No emoji in UI strings (spec §6, D3)
**Files**
- Modify: `src/services/milestones.js:L67-L71` (`milestoneText`: `"Hôm nay tròn <label>"`)
- Modify: `app.js` — every `showToast(…)`, `textContent = …` and `placeholder = …` string that contains an emoji (at HEAD: `L234`, `L475`, `L483`, `L693`, `L952`, `L990`, `L1092`, `L1205`, `L1230`, `L1523`, `L1722`, `L1810`, `L2553`, `L2563`, `L2574`, `L2589`, `L2606`, `L2626`, `L2651`, `L2694`, `L2745`, `L2950`, `L3072`, `L3173`; the chat ones are already gone)
- Test: `tests/unit/services/test_milestones.js:L22`, `tests/unit/ui/test_static_assets.js`

**Steps**
- [x] `test_milestones.js:L22`: expect `"Hôm nay tròn 500 ngày"`.
- [x] Add a static test `"copy: no emoji in toasts, status text or placeholders"`: for every line of `app.js` that matches `/showToast\(|textContent\s*=|placeholder\s*=/`, the existing `EMOJI` regex (`L315`) does not match; `src/services/milestones.js` has no `EMOJI` match.
- [x] Run TEST → expect 2 failed.
- [x] Remove only the emoji and the space next to it. Keep every word. Do not touch the sample data (`DEFAULT_PLACES` notes), the file header comment, or the page `<title>`.
- [x] Run TEST → expect `0 failed`.

**Done when:** TEST passes.

### Task 15: Cache version, precache list, README
**Files**
- Modify (script): `index.html`, `sw.js` — run `./scripts/bump_version.sh 7.0`
- Modify: `README.md` (rename "falling petals" wording to floating hearts if present; chat lines were removed in Task 4)

**Steps**
- [x] Run `./scripts/bump_version.sh 7.0` → prints `Version set to 7.0`.
- [x] Run TEST → expect `0 failed` (covers "one cache version everywhere", "service worker precaches every local asset", "every precached file exists").
- [x] `grep -n "6\.1" index.html sw.js` → no output.

**Done when:** TEST passes and the grep is empty.

## Final verification
- `./scripts/test.sh` → `0 failed`; the pass count is the baseline 197 plus the tests added, minus the chat tests removed (record the final number in §Deviations).
- `grep -rn "chat-open\|chat-drawer\|who-am-i\|notes-modal\|Playfair" index.html app.js src sw.js` → no output.
- BC walk-through at 375 × 812, light then dark (`applyTheme("dark")`), guest then couple mode: Moments, grid view, a memory's detail sheet, the add-moment sheet, Places (both filters), Bé, Settings, the unlock sheet. NHS `true` on every view; no console error; every text sits on the background the spec gives it.
- BC at 320 × 568 and 768 × 1024: NHS `true`; the tab bar is centred and at most 420 px wide at 768.
- Reduced motion: emulate `prefers-reduced-motion: reduce` if the pane allows it; otherwise state "not executed" in §Deviations. Expected: a static frame of hearts, no beat, no burst.
- Not executable here: a real iPhone (safe areas under the floating tab bar, home-screen install). State it as not verified.

## User steps after the code is deployed (not for the coder)
These need the user's Google account. Do them in this order.
1. Open the Apps Script project, replace its code with the new `google-apps-script.js`, and deploy a new version of the web app (README, "Triển khai backend"). Until this is done, deleted tabs can be recreated by an old client that sends a chat message.
2. In the Google Sheet, delete the `Messages` tab and the `Notes` tab (right-click the tab → Xoá). Sheets keeps a version history if this ever needs undoing.
3. In the app's Google Drive folder, search for files whose name starts with `chat_`, select them and move them to the trash. Drive keeps trashed files for 30 days. Photos of moments have other names and are not affected.
4. Open the app once on each phone while online so the new version installs; it clears the chat and notes data stored on that phone at start-up.

## Assumptions
- Old installed clients may still post a chat message or note before they update. The new backend answers `"ignored"` and the old client's queue drops the entry, so nothing is recreated once step 1 above is done.
- `journey_chat_vibrate_v1` (vibration on/off) stays in `localStorage`: `hapticTick` still reads it for the long-press tick. It has no UI any more and defaults to on.
- Behaviours that already exist are restyled, not rewritten: unsaved-changes confirmation, undo toast, GPS chip states, offline banner, optimistic save with "Chưa đồng bộ".
- Bé has no loading or error state because its data is local-first; the spec's rows for those states are not implemented.
- `:has()` (focus ring on the memory card) needs iOS 15.4 or later; older Safari falls back to no visible ring on the card. The audience uses current iPhones.

## Out of scope / out-of-scope observations
- A stored "like" per moment (spec §8.1) and photo avatars (spec §8.2).
- Deferred by the user on 2026-11-16 (PR-03): the load-error rows with "Thử lại" for the Moments feed and the Places list (spec §4.1, §4.4); the exit icon on "Chuyển sang chế độ khách" (spec §4.6; `index.html:L414` stays text only); the photo-loading skeleton and the not-synced line in the detail sheet (spec §4.2).
- Observation: the browser pane held a stale `kimthu-shell-6.1` cache whose `milestones.js` lacked `milestoneProgress`, which made the app's constructor throw. Files were changed during v6 development without a version bump. Task 15 bumps to 7.0; future file changes need a bump too.
- Observation: `README.md` and code comments still describe `Design/2026-11-14-design-album-kem.md` as the current design.

## Decision log
- Q: How should a moment look when its photo fails to load? → A: the pink 4:5 box with a heart, as in the spec (user, 2026-11-15). Replaces the compact text card of v6; Task 9.
- Q: What happens to chat messages and timed notes already stored? → A: delete everything, on each device and on the Google Sheet (user, 2026-11-15). This overrides spec §3.1 "Not in scope: the Apps Script backend" and spec §8.5; Tasks 1–4 and "User steps".
- Q: How are the Sheet tabs deleted? → A: the user deletes the `Messages` and `Notes` tabs by hand; no purge function is added (user, 2026-11-15).
- Q: Chat photos in Drive? → A: move the `chat_` files to the Drive trash (user, 2026-11-15). Done by hand, because no purge function is added.
- Q: Replace existing wording with the spec's wording? → A: keep the existing wording; only remove emoji and add text for new elements (user, 2026-11-15). Tasks 8 and 14.
- Q: Slide or fade for the active tab pill (spec §6 "Switch tab")? → A: fade in place (user, 2026-11-16, recorded in the review). A sliding indicator needs per-mode layout state in JS (two tabs for guests, three for the couple); the fade is CSS only. Task 7.
- Q: Detail sheet actions at the top as in the spec's wireframe, or at the bottom as today? → A: they stay at the bottom; only the look changes (user, 2026-11-16, recorded in the review). Task 10.
- Q: PR-01, the failed-photo fallback in the detail sheet (spec §4.2): now or later? → A: add it now (user, 2026-11-16). Task 10: `detailPhotoHtml`, `detailPhotoFailedHtml`, `renderDetailPhoto`, template tests, a static test and a browser check.
- Planner decision: pending `chat:` / `note:` outbox entries are dropped, not sent, because the user asked for all messages to be deleted.
- Planner decision: the celebration burst gets its own top canvas (`#burst-canvas`). On the background canvas it would be hidden behind the new white counter card.
- Revision 2, PR-02: BC step 2 (unregister the service worker and clear its caches) now runs before every browser check, with a check that no worker controls the page.
- Revision 2, PR-03: the deferred spec items are listed under Out of scope; the three user decisions of 2026-11-16 are recorded above.
- Revision 2, PR-04: `.place__actions .btn` gets `min-height: 40px`; the computed height is asserted in Task 11's BC.
- Revision 2, PR-05: Task 11's BC asserts one row (by vertical centres) at 320, 375 and 430. Planner decision: below 280 px of card content the "Chỉ đường" label is hidden by a new `@container (max-width: 279px)` rule, instead of shrinking paddings, so every action keeps a 44 px wide target. This goes beyond spec §4.4, which only names the secondary buttons as icon-only on small screens.
- Revision 2, PR-06: `initSync` awaits `purgeRetiredOutbox()` before `restoreQueuedState()`; a static assertion checks the `await`.
- Revision 2, PR-07: `README.md:L37` (list of automatically created sheets) is part of Task 4.
- Revision 2, PR-08: the lightbox's 92 % black is on the dialog only; `::backdrop` is transparent.
- Revision 2, PR-09: Task 3's grep hit list names the `L1325` comment and the `note` variable lines, and no longer lists the melody array (it never matched).

## Deviations (filled by coder)
- Review `2026-11-16-review-keo-bong-redesign-2.md`: PR-10 (BC steps 2/3 use `workerStart === 0`, resize first) and PR-11 (345 px) applied to the Conventions and Task 11 text.
- BC step 2 is not enough in the preview pane: the browser's HTTP cache also serves stale `?v=6.1` files and the new worker precaches from it. Every BC therefore also ran `fetch(url, {cache: "reload"})` for all scripts, styles and `sw.js` after clearing the worker and caches, then reloaded.
- Task 3: the static guard forbids `toggleChatDrawer`, so the two `route.chat` lines in `app.js` (`popstate` handler and initial route, listed under Task 4) were removed in Task 3. Task 4 then only had to change `route.js`.
- Task 6: the failing-test step was skipped (test and code written together); the test would have failed on HEAD. `.btn--danger-text` stays in `components.css` because `#auth-lock-nav-btn` still uses it.
- Task 13: `PetalCanvas.stepHeart(heart, dtMs)` has no third `bounds` parameter (it would be unused); the test still passes `bounds` and it is ignored.
- Task 15: the plan's `grep -n "6\.1" index.html sw.js` also matches the heart path (`c0 6.1-8 11`). `grep -n "v=6\.1\|shell-6\.1"` is empty, `CACHE_VERSION = "7.0"`.
- Final test count: `./scripts/test.sh` → `206 passed, 0 failed` (baseline 197).
- BC notes: the Browser pane is hidden unless shown, and then `requestAnimationFrame` never fires; it was shown with `show_pane` for Task 13. Even then rAF ran ~2 fps in the pane, so the 120-frame cost check was not meaningful (median interval of the frames that did fire: 16.6 ms). Tab clicks and `loading="lazy"` images lag in the pane, so BC used `journeyApp.switchView(...)` and `img.loading = "eager"`. Programmatic clicks log "Blocked call to navigator.vibrate" (no user gesture), not an app error.
- Reduced motion was checked by stubbing `matchMedia`: one static frame, no loop, no burst.
- Not verified: a real iPhone (safe areas, home-screen install), real Nunito metrics, the deployed Apps Script.
