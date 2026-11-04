# Kim & Thư 💕

A single-page PWA for a couple: love counter, Moments timeline, Places wishlist, private chat and a gentle care reminder. Static files on GitHub Pages; Google Apps Script + Google Sheets/Drive as the backend.

## Architecture

```
index.html + app.js + styles.css          UI (vanilla JS)
src/utils/       safe_url, local_date      pure helpers
src/services/    period_cycle, sync_*, geo_policy, spaced_queue   pure logic (unit tested)
src/adapters/    outbox_store              IndexedDB outbox (memory fallback)
google-apps-script.js                      backend (deployed separately, see below)
tests/           unit tests                scripts/test.sh
```

**Sync model (local-first).** Every write is saved locally, queued in a durable outbox (IndexedDB) and sent to the backend with retry/backoff. The backend upserts by `id`, so retries are safe, and deletes are tombstones, so other devices learn about them. The client pulls only changes (`?since=`) and never infers a deletion from absence. Items not yet confirmed show a "⏳ chưa đồng bộ" badge. Polling pauses in hidden tabs and slows when idle.

## Deploy the backend (Google Apps Script)

1. Create a Google Sheet, then **Extensions → Apps Script**. Paste the content of `google-apps-script.js`.
2. **Project Settings → Script properties → Add** `APP_PASSCODE` = a random secret of at least 12 characters. Without it every request is refused (fail-closed). Never commit this value.
3. Run `capQuyenTruyCapDrive` once from the editor and grant the Drive/Sheets permissions.
4. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone**. Copy the `/exec` URL.
   - After changing the script, use **Deploy → Manage deployments → Edit → New version**, or create a new deployment if the old URL must stop working.
5. In the app, **Cài đặt → Link Google Apps Script Backend**: paste the `/exec` URL. Both phones must enter the passcode once.
6. Sheets are created automatically (`Memories`, `Places`, `Messages`, `Notes`, `Period`). The old `Tasks` sheet is only kept for legacy clients.

To rotate the passcode: change `APP_PASSCODE`. Phones notice on the next sync, return to guest mode and ask for the new one.

## Develop & test

```bash
scripts/test.sh                 # Node if installed, otherwise macOS jsc
python3 -m http.server 8000     # then open http://localhost:8000
scripts/bump_version.sh 4.7     # bump the cache-busting version everywhere
```

The Apps Script is tested against in-memory fakes of Sheets/Drive/Lock (`tests/unit/backend`). Real-deployment behaviour (CORS readability of POST responses, quotas) must still be checked manually: add a memory while offline, reload, go online and watch the badge disappear.

## Security notes

- The site and repo are public. Secrets live only in Script properties and in each user's head/device.
- Guests can read the Moments timeline and Places; chat, notes and period data need the passcode.
- All URLs rendered into HTML pass an `https`-only allow-list and are escaped; a Content-Security-Policy restricts scripts to this origin.

## Known limitations

- A shared passcode is not per-user authentication. For stronger privacy use a backend with real accounts.
- Public Nominatim/OSRM servers are rate-limited by the client (≥ 1 s apart, cached) but remain best-effort.
- Period predictions are reminders, not medical advice or contraception.
