// Methods of JourneyApp that do not need a DOM: loads the real app.js with stubs.

const journeyAppSource = readText("app.js");
const noop = () => {};
const JourneyAppClass = new Function(
  "document", "window", "localStorage", "safeUrl", "computeCycle", "formatLocalDate", "resizeDriveThumbnail", "normalizeHistory",
  `${journeyAppSource}\n;return JourneyApp;`
)({ addEventListener: noop }, { addEventListener: noop }, {}, safeUrl, computeCycle, formatLocalDate, resizeDriveThumbnail, normalizeHistory);
const app = Object.create(JourneyAppClass.prototype);

test("extractCoordinates: lat/lon query (BUG-05)", () => {
  assertEqual(app.extractCoordinates("https://maps.apple.com/?lat=10.773347&lon=106.706346"), { lat: 10.773347, lng: 106.706346 });
  assertEqual(app.extractCoordinates("https://example.com/?lat=10.5&lng=106"), { lat: 10.5, lng: 106 });
});

test("extractCoordinates: other formats and empty input still work", () => {
  assertEqual(app.extractCoordinates("https://www.google.com/maps?q=10.773347,106.706346"), { lat: 10.773347, lng: 106.706346 });
  assertEqual(app.extractCoordinates("10.776889, 106.695444"), { lat: 10.776889, lng: 106.695444 });
  assertEqual(app.extractCoordinates(""), null);
  assertEqual(app.extractCoordinates(null), null);
  assertEqual(app.extractCoordinates("Hồ Con Rùa"), null);
});

test("formatLocationBadge: attribute-breaking URL becomes inert text (SEC-03)", () => {
  const html = app.formatLocationBadge('x (https://a.b/"onmouseover="alert(1))');
  assertTrue(html.indexOf("<a ") === -1, "no anchor is produced");
  assertTrue(html.indexOf('"onmouseover') === -1, "quote is escaped");
});

test("formatLocationBadge: valid https link keeps the anchor", () => {
  const html = app.formatLocationBadge("Quán (https://maps.google.com/?q=1,2)");
  assertTrue(html.indexOf('href="https://maps.google.com/?q=1,2"') !== -1);
  assertTrue(html.indexOf("Mở bản đồ") !== -1, "link text");
  assertEqual(html.indexOf("locket-"), -1);
});

test("formatLocationBadge: plain text and empty input", () => {
  assertEqual(app.formatLocationBadge(""), "");
  assertTrue(app.formatLocationBadge("<b>x</b>").indexOf("<b>") === -1, "html escaped");
});

test("escapeHTML: escapes all five characters and coerces non-strings", () => {
  assertEqual(app.escapeHTML(`<a href="x" onclick='y'>&`), "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;");
  assertEqual(app.escapeHTML(12), "12");
  assertEqual(app.escapeHTML(null), "");
});

test("applyApiUrlParam: rejects non Apps Script URLs without asking (SEC-04)", () => {
  const ctx = Object.create(JourneyAppClass.prototype);
  ctx.config = { apiUrl: "https://script.google.com/macros/s/ORIGINAL/exec" };
  ctx.saveData = () => { throw new Error("must not save"); };
  globalThis.confirm = () => { throw new Error("must not prompt"); };
  ["https://evil.example", "http://script.google.com/macros/s/X/exec", "javascript:alert(1)",
   "https://script.google.com.evil.example/macros/s/X/exec"].forEach((bad) => {
    ctx.applyApiUrlParam(encodeURIComponent(bad));
  });
  assertEqual(ctx.config.apiUrl, "https://script.google.com/macros/s/ORIGINAL/exec");
});

test("applyApiUrlParam: valid URL needs confirmation", () => {
  const ctx = Object.create(JourneyAppClass.prototype);
  ctx.config = { apiUrl: "https://script.google.com/macros/s/ORIGINAL/exec" };
  let saved = 0;
  ctx.saveData = () => { saved += 1; };
  const fresh = "https://script.google.com/macros/s/NEW_ID-1/exec";

  globalThis.confirm = () => false;
  ctx.applyApiUrlParam(encodeURIComponent(fresh));
  assertEqual(ctx.config.apiUrl, "https://script.google.com/macros/s/ORIGINAL/exec");

  globalThis.confirm = () => true;
  ctx.applyApiUrlParam(encodeURIComponent(fresh));
  assertEqual(ctx.config.apiUrl, fresh);
  assertEqual(saved, 1);
});

test("applyApiUrlParam: malformed percent-encoding does not throw", () => {
  const ctx = Object.create(JourneyAppClass.prototype);
  ctx.config = { apiUrl: "u" };
  ctx.applyApiUrlParam("%E0%A4%A");
  assertEqual(ctx.config.apiUrl, "u");
});

test("formatMemoryDateShort: compact date and time for the meta row (UI-02)", () => {
  const year = new Date().getFullYear();
  assertEqual(app.formatMemoryDateShort(`${year}-10-25T17:09`), "25/10 · 17:09");
  assertEqual(app.formatMemoryDateShort("2020-01-05"), "5/1/2020");
  assertEqual(app.formatMemoryDateShort(""), "");
});

test("updateCounter uses calendar days", () => {
  // Started 19:00, now 08:00 the next calendar day: 1 calendar day, 13 h on the clock.
  const parts = app.counterParts("2025-04-02T19:00:00", new Date(2025, 3, 3, 8, 30, 15));
  assertEqual(parts, { days: 1, hours: 13, minutes: 30, seconds: 15 });
  assertEqual(app.counterParts("2030-01-01T00:00:00", new Date(2025, 0, 1)).days, 0);
});

test("locationLabel: the place name moves out of the badge into the meta row", () => {
  assertEqual(locationLabel("Quán (https://maps.google.com/?q=1,2)"), "Quán");
});

test("commitPeriodChange bumps updatedAt, sets startDate to the latest start, saves and queues", () => {
  [["edit", replacePeriodStart(["2026-08-01", "2026-09-01", "2026-10-01"], "2026-09-01", "2026-09-05")],
    ["delete", removePeriodStart(["2026-08-01", "2026-09-01", "2026-10-01"], "2026-10-01")]].forEach(([label, history]) => {
    const calls = { saved: [], queued: 0 };
    const inst = Object.create(JourneyAppClass.prototype);
    inst.period = { history: ["2026-08-01", "2026-09-01", "2026-10-01"], startDate: "2026-10-01", updatedAt: 1000 };
    inst.saveData = (key) => { calls.saved.push(key); return true; };
    inst.queuePeriod = () => { calls.queued += 1; };
    inst.commitPeriodChange(history);
    assertTrue(inst.period.updatedAt > 1000, label + ": updatedAt bumped");
    assertEqual(inst.period.startDate, history[history.length - 1], label + ": latest start");
    assertEqual(calls.saved, ["journey_period_v1"], label + ": saved");
    assertEqual(calls.queued, 1, label + ": queued once");
  });
});
