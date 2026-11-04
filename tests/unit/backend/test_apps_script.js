// Runs the real google-apps-script.js against in-memory fakes of the Google services.

function createGasHarness(options) {
  const opts = options || {};
  const props = { APP_PASSCODE: opts.passcode === undefined ? "correct-horse-battery" : opts.passcode };
  const sheets = {};
  const files = {};
  const trashed = [];
  let fileSeq = 0;
  let lockAvailable = true;

  function makeSheet(name) {
    const rows = [];
    return {
      rows: rows,
      getName: () => name,
      getLastRow: () => rows.length,
      appendRow: (r) => { rows.push(r.slice()); },
      getRange: (row, col, nr, nc) => ({
        getValues: () => {
          const out = [];
          for (let i = 0; i < (nr || 1); i += 1) {
            const src = rows[row - 1 + i] || [];
            out.push(Array.from({ length: nc || 1 }, (_, j) => (src[col - 1 + j] === undefined ? "" : src[col - 1 + j])));
          }
          return out;
        },
        setValues: (vals) => vals.forEach((v, i) => { rows[row - 1 + i] = v.slice(); }),
        setValue: (v) => { rows[row - 1] = rows[row - 1] || []; rows[row - 1][col - 1] = v; }
      })
    };
  }
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => { sheets[n] = makeSheet(n); return sheets[n]; }
  };
  const folder = { getId: () => APP_FOLDER_ID, createFile: (blob) => {
    fileSeq += 1;
    const id = `file${fileSeq}_abcdefghijklmnopqrstuvwxyz`;
    files[id] = { id: id, parent: APP_FOLDER_ID };
    return { getId: () => id, setSharing: () => {} };
  } };
  const pad = (n) => String(n).padStart(2, "0");
  const env = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t) => ({ content: t, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock: () => {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    Logger: { log: () => {} },
    Utilities: {
      base64Decode: (s) => ({ length: s.length }), newBlob: () => ({}),
      formatDate: (d, tz, pattern) => {
        const t = new Date(d.getTime() + 7 * 3600 * 1000);
        const parts = { yyyy: t.getUTCFullYear(), MM: pad(t.getUTCMonth() + 1), dd: pad(t.getUTCDate()), HH: pad(t.getUTCHours()), mm: pad(t.getUTCMinutes()), ss: pad(t.getUTCSeconds()) };
        return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (k) => parts[k]);
      }
    },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 },
      getFolderById: () => folder, getRootFolder: () => folder,
      getFileById: (id) => {
        if (!files[id]) throw new Error("not found");
        return { getParents: () => { let done = false; return { hasNext: () => !done, next: () => { done = true; return { getId: () => files[id].parent }; } }; },
          setTrashed: () => { trashed.push(id); } };
      }
    }
  };
  const names = Object.keys(env);
  const api = new Function(...names, `${readText("google-apps-script.js")}\n;return { doPost: doPost, doGet: doGet };`)(...names.map((n) => env[n]));
  return {
    sheets: sheets, files: files, trashed: trashed,
    setLock: (v) => { lockAvailable = v; },
    post: (payload) => JSON.parse(api.doPost({ postData: { contents: JSON.stringify(Object.assign({ passcode: "correct-horse-battery" }, payload)) } }).content),
    postRaw: (payload) => JSON.parse(api.doPost({ postData: { contents: JSON.stringify(payload) } }).content),
    get: (params) => JSON.parse(api.doGet({ parameter: params || {} }).content)
  };
}

const APP_FOLDER_ID = "1dcyUgareKuDTIyj9xmhKKY6Uq0uC6Zuj"; // same as FOLDER_ID in the script
const PNG = "data:image/png;base64,iVBORw0KGgo=";

test("backend: fails closed when APP_PASSCODE is missing or too short", () => {
  const none = createGasHarness({ passcode: "" });
  assertEqual(none.postRaw({ type: "memory", id: "m1", passcode: "" }).code, "unauthorized");
  const shortSecret = createGasHarness({ passcode: "kimthu" });
  assertEqual(shortSecret.postRaw({ type: "memory", id: "m1", passcode: "kimthu" }).code, "unauthorized");
  assertEqual(shortSecret.get({ passcode: "kimthu" }).isAuth, false);
});

test("backend: wrong or missing passcode cannot write or read private data", () => {
  const g = createGasHarness();
  assertEqual(g.postRaw({ type: "chat_message", id: "c1", text: "hi", passcode: "kimthu" }).code, "unauthorized");
  assertEqual(g.postRaw({ type: "chat_message", id: "c1", text: "hi" }).code, "unauthorized");
  g.post({ type: "chat_message", id: "c1", sender: "Kim", text: "secret" });
  assertEqual(g.get({}).messages, []);
  assertEqual(g.get({ passcode: "nope" }).isAuth, false);
  assertEqual(g.get({ passcode: "Correct-Horse-Battery " }).messages.length, 1);
});

test("backend: memory upsert is idempotent and uploads the photo once", () => {
  const g = createGasHarness();
  const payload = { type: "memory", id: "m1", title: "A", date: "2026-11-04", location: "x", story: "s", imageBase64: PNG };
  const first = g.post(payload);
  const second = g.post(Object.assign({}, payload, { title: "A2" }));
  assertEqual(first.status, "success");
  assertEqual(g.sheets.Memories.rows.length, 2, "header + one row");
  assertEqual(Object.keys(g.files).length, 1, "retry must not upload again");
  assertEqual(second.imageUrl, first.imageUrl);
  assertEqual(g.get({}).memories[0].title, "A2");
});

test("backend: delete is a tombstone, blocks resurrection, trashes only app-folder files", () => {
  const g = createGasHarness();
  const created = g.post({ type: "memory", id: "m1", title: "A", date: "2026-11-04", imageBase64: PNG });
  const fileId = created.imageUrl.match(/id=([^&]+)/)[1];
  const res = g.post({ type: "delete_memory", id: "m1", fileId: "foreignfileid_abcdefghijklmnop" });
  assertEqual(res.deletedFileId, fileId);
  assertEqual(g.trashed, [fileId]);
  assertEqual(g.get({}).deleted.memories, ["m1"]);
  assertEqual(g.get({}).memories.length, 0);
  assertTrue(g.post({ type: "memory", id: "m1", title: "back" }).deleted === true, "late retry cannot resurrect");
});

test("backend: files outside the app folder are never trashed (SEC-02)", () => {
  const g = createGasHarness();
  g.files.foreign_abcdefghijklmnopqrstuv = { id: "foreign", parent: "SOMEWHERE_ELSE" };
  g.post({ type: "memory", id: "m2", title: "B", date: "2026-11-04", image: "https://drive.google.com/thumbnail?id=foreign_abcdefghijklmnopqrstuv&sz=w1200" });
  g.post({ type: "delete_memory", id: "m2" });
  assertEqual(g.trashed, []);
});

test("backend: deleting an unknown id still records a tombstone (demo items)", () => {
  const g = createGasHarness();
  g.post({ type: "delete_memory", id: "mem-1" });
  g.post({ type: "delete_place", id: "place-1" });
  const out = g.get({});
  assertEqual(out.deleted.memories, ["mem-1"]);
  assertEqual(out.deleted.places, ["place-1"]);
});

test("backend: places upsert once per id and the delta only returns changes", () => {
  const g = createGasHarness();
  g.post({ type: "place", id: "p1", name: "A", visited: false, lat: 10.5, lng: 106.5 });
  g.post({ type: "place", id: "p1", name: "A", visited: true, lat: 10.5, lng: 106.5 });
  assertEqual(g.sheets.Places.rows.length, 2, "no duplicate rows (BUG-06)");
  const full = g.get({});
  assertEqual(full.places.length, 1);
  assertEqual(full.places[0].visited, true);
  assertEqual(g.get({ since: String(full.serverTime + 1) }).places.length, 0);
  const waitMs = (ms) => { const end = Date.now() + ms; while (Date.now() < end) {} };
  waitMs(3);
  const mark = Date.now();
  waitMs(3);
  g.post({ type: "place", id: "p2", name: "B" });
  assertEqual(g.get({ since: String(mark) }).places.map((p) => p.id), ["p2"]);
});

test("backend: legacy task writes upsert instead of growing the sheet (BUG-06)", () => {
  const g = createGasHarness();
  for (let i = 0; i < 3; i += 1) g.post({ type: "task", id: "pw_p1", title: "t", category: "PLACE_WISHLIST", notes: "{}", completed: false });
  assertEqual(g.sheets.Tasks.rows.length, 2);
});

test("backend: busy lock returns a retryable error and writes nothing", () => {
  const g = createGasHarness();
  g.setLock(false);
  const res = g.post({ type: "memory", id: "m1", title: "A" });
  assertEqual(res.retryable, true);
  assertEqual(g.sheets.Memories, undefined);
});

test("backend: period syncs last-writer-wins and is private", () => {
  const g = createGasHarness();
  g.post({ type: "period", startDate: "2026-10-01", cycleLength: 30, durationDays: 5, history: ["2026-10-01"], updatedAt: 2000 });
  assertTrue(g.post({ type: "period", startDate: "2026-09-01", cycleLength: 28, updatedAt: 1000 }).ignored === true);
  assertEqual(g.get({}).period, null, "guests get no period data");
  const p = g.get({ passcode: "correct-horse-battery" }).period;
  assertEqual([p.startDate, p.cycleLength, p.history, p.updatedAt], ["2026-10-01", 30, ["2026-10-01"], 2000]);
});

test("backend: timed notes keep their text hidden until openAt", () => {
  const g = createGasHarness();
  g.post({ type: "note", id: "n1", sender: "Kim", text: "mở sau nhé", openAt: new Date(Date.now() + 86400000).toISOString() });
  g.post({ type: "note", id: "n2", sender: "Kim", text: "mở rồi", openAt: new Date(Date.now() - 86400000).toISOString() });
  const notes = g.get({ passcode: "correct-horse-battery" }).notes;
  const byId = {};
  notes.forEach((n) => { byId[n.id] = n; });
  assertEqual([byId.n1.locked, byId.n1.text], [true, ""]);
  assertEqual([byId.n2.locked, byId.n2.text], [false, "mở rồi"]);
  assertEqual(g.get({}).notes, [], "guests get no notes");
});

test("backend: rejects non-image and missing-id writes", () => {
  const g = createGasHarness();
  const bad = g.post({ type: "memory", id: "m3", title: "x", imageBase64: "data:text/html;base64,PHNjcmlwdD4=" });
  assertEqual(bad.imageUrl, "");
  assertEqual(Object.keys(g.files).length, 0);
  assertEqual(g.post({ type: "memory", title: "no id" }).status, "error");
  assertEqual(g.post({ type: "unknown_type", id: "1" }).status, "ignored");
});
