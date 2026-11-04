// Static checks that keep the shell consistent: precache list, CSP-safe markup, versions, contrast.

const indexHtml = readText("index.html");
const swSource = readText("sw.js");
const appSource = readText("app.js");

function localAssets(html) {
  const found = [];
  const re = /(?:src|href)="([^"#]+?)(?:\?v=[\d.]+)?"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!/^(https?:|data:|mailto:)/.test(m[1])) found.push(m[1]);
  }
  return found;
}

function shellFiles() {
  const block = swSource.match(/SHELL_FILES = \[([\s\S]*?)\];/)[1];
  return block.split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

test("service worker precaches every local asset referenced by index.html", () => {
  const shell = shellFiles();
  const missing = localAssets(indexHtml).filter((f) => !shell.includes(f));
  assertEqual(missing, []);
});

test("every precached file exists", () => {
  shellFiles().filter((f) => f !== "./").forEach((f) => {
    try { readText(f); } catch (err) { throw new Error(`missing precache file ${f}`); }
  });
});

test("CSP forbids inline scripts and index.html has no inline handlers", () => {
  const csp = indexHtml.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src"));
  assertEqual(scriptSrc, "script-src 'self'");
  assertEqual(/\son[a-z]+\s*=\s*"/i.test(indexHtml), false, "inline handler in index.html");
  assertEqual(/<script(?![^>]*\ssrc=)[^>]*>/i.test(indexHtml), false, "inline <script> in index.html");
});

test("app.js generates no inline event-handler attributes (CSP)", () => {
  assertEqual(/\son(click|error|load|mouseover|dblclick)\s*=\s*["']/i.test(appSource), false);
});

test("pinch zoom is not disabled (UX-01)", () => {
  const viewport = indexHtml.match(/name="viewport" content="([^"]+)"/)[1];
  assertEqual(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(viewport), false);
});

test("one cache version everywhere", () => {
  const versions = Array.from(new Set((indexHtml.match(/\?v=([\d.]+)/g) || []).map((v) => v.slice(3))));
  assertEqual(versions.length, 1, `versions in index.html: ${versions}`);
  assertEqual(swSource.match(/CACHE_VERSION = "([\d.]+)"/)[1], versions[0]);
});

test("manifest is valid and its icons are precached", () => {
  const manifest = JSON.parse(readText("manifest.json"));
  const sizes = manifest.icons.map((i) => i.sizes).sort();
  assertEqual(sizes, ["192x192", "512x512"]);
  manifest.icons.forEach((i) => assertTrue(shellFiles().includes(i.src), `icon ${i.src} precached`));
});

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("text and button colours meet WCAG AA (4.5:1) — UX-03", () => {
  const shellCss = readText("src/styles/app_shell.css");
  const baseCss = readText("styles.css");
  const textSoft = shellCss.match(/--text-soft:\s*(#[0-9a-fA-F]{6})/)[1];
  const pinkDeep = baseCss.match(/--pink-deep:\s*(#[0-9a-fA-F]{6})/)[1];
  ["#ffffff", "#fff0f4", "#fffafc"].forEach((bg) => {
    assertTrue(contrast(textSoft, bg) >= 4.5, `--text-soft ${textSoft} on ${bg} = ${contrast(textSoft, bg).toFixed(2)}`);
    assertTrue(contrast(pinkDeep, bg) >= 4.5, `--pink-deep on ${bg}`);
  });
  assertTrue(contrast("#ffffff", pinkDeep) >= 4.5, "white on primary button fill");
});

test("backdrop-filter is limited to the header, tab bar and modal backdrop (UX-02)", () => {
  const css = readText("styles.css");
  assertEqual((css.match(/backdrop-filter/g) || []).length <= 2, true);
});
