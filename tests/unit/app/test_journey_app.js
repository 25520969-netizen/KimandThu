// Methods of JourneyApp that do not need a DOM: loads the real app.js with stubs.

const journeyAppSource = readText("app.js");
const noop = () => {};
const JourneyAppClass = new Function(
  "document", "window", "localStorage", "safeUrl", "computeCycle", "formatLocalDate", "resizeDriveThumbnail",
  `${journeyAppSource}\n;return JourneyApp;`
)({ addEventListener: noop }, { addEventListener: noop }, {}, safeUrl, computeCycle, formatLocalDate, resizeDriveThumbnail);
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
  assertTrue(html.indexOf("Quán") !== -1);
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
