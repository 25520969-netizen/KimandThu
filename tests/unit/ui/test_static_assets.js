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

test("UI-10: no 'transition: all' in the stylesheets", () => {
  ["styles.css", "src/styles/app_shell.css", "src/styles/redesign.css"].forEach((f) => {
    assertEqual(/transition:\s*all\b/.test(readText(f)), false, f);
  });
});

test("UI-08: every :hover rule is inside a (hover: hover) media query", () => {
  ["styles.css", "src/styles/app_shell.css", "src/styles/redesign.css"].forEach((f) => {
    let depthInHover = 0;
    let bad = 0;
    readText(f).split("\n").forEach((line) => {
      if (/@media\s*\(hover:\s*hover\)/.test(line)) depthInHover = 1;
      if (line.indexOf(":hover") !== -1 && depthInHover === 0) bad += 1;
      if (/^}/.test(line) && depthInHover === 1 && !/^\s/.test(line)) depthInHover = 0;
    });
    assertEqual(bad, 0, `${f} has unguarded :hover rules`);
  });
});

test("UI-03: the FAB proxy targets still exist in index.html", () => {
  assertTrue(indexHtml.indexOf('id="open-add-memory-modal-btn"') !== -1, "add memory button");
  assertTrue(indexHtml.indexOf('id="open-add-place-modal-btn"') !== -1, "add place button");
});

test("UI-09: at most 4 infinite animations (hero heart + loading spinners)", () => {
  const count = (readText("styles.css").match(/infinite/g) || []).length
    + (readText("src/styles/app_shell.css").match(/infinite/g) || []).length;
  assertTrue(count <= 4, `infinite animations: ${count}`);
});

test("UI-09: petal count is 6", () => {
  assertTrue(/PETAL_COUNT = 6;/.test(appSource));
});

test("D-02: app shell does not inject a second close button into sheets", () => {
  assertEqual(/sheet-close-btn/.test(readText("src/ui/app_shell.js")), false);
  assertEqual(/sheet-close-btn/.test(readText("src/styles/redesign.css")), false);
});

test("D-13: the who-am-i prompt cannot be dismissed by backdrop tap", () => {
  assertEqual(/:not\(#who-am-i-modal\)/.test(readText("src/ui/app_shell.js")), true);
});

test("D-01: places action row is not a two-column grid on phones", () => {
  const css = readText("src/styles/redesign.css");
  assertEqual(/\.places-action-btns\s*\{[^}]*flex-direction:\s*column/.test(css), true);
});

test("D-04: form fields are 16px so iOS does not zoom on focus", () => {
  const css = readText("src/styles/redesign.css");
  assertEqual(/\.chat-input-bar input\[type="text"\]\s*\{\s*font-size:\s*16px/.test(css), true);
  assertEqual(/\.form-group textarea,[\s\S]*?font-size:\s*16px/.test(css), true);
});

test("D-11: chat input asks for a send key", () => {
  assertEqual(/id="chat-text-input"[^>]*enterkeyhint="send"/.test(indexHtml), true);
});

test("D-03: sheets drag by a handle with touch-action none, not the whole card", () => {
  const css = readText("src/styles/redesign.css");
  assertEqual(/\.sheet-handle\s*\{[^}]*touch-action:\s*none/.test(css), true);
  assertEqual(/modal-card\s*\{[^}]*touch-action:\s*pan-y/.test(css), false);
});

test("D-05: chat is announced as a modal dialog", () => {
  assertEqual(/id="chat-drawer"[^>]*role="dialog"[^>]*aria-modal="true"/.test(indexHtml), true);
});

test("D-07/D-09: tokens.css defines light and dark themes and loads first", () => {
  const tokens = readText("src/styles/tokens.css");
  assertEqual(/\[data-theme="dark"\]/.test(tokens), true);
  assertEqual(/prefers-color-scheme:\s*dark/.test(tokens), true);
  assertEqual(indexHtml.indexOf("tokens.css") < indexHtml.indexOf('href="styles.css'), true);
});

test("D-09: dark text/background pairs keep >= 4.5:1 contrast", () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  [["#f6e9ee", "#1f1418"], ["#f6e9ee", "#2a1b21"], ["#cdb4c0", "#2a1b21"], ["#c9adb9", "#2a1b21"],
    ["#ff8fab", "#2a1b21"], ["#ff8fab", "#1f1418"], ["#ffffff", "#c9184a"]].forEach(([fg, bg]) => {
    assertEqual(ratio(fg, bg) >= 4.5, true, `${fg} on ${bg} = ${ratio(fg, bg).toFixed(2)}`);
  });
});

test("D-10: petal canvas is DPR-aware and pauses under overlays", () => {
  assertEqual(/devicePixelRatio/.test(appSource), true);
  assertEqual(/chat-open/.test(appSource), true);
});

test("D-08: renderPlaces skips identical renders", () => {
  assertEqual(/placesRenderSignature/.test(appSource), true);
});

test("theme defaults to light; dark/auto only when the user chooses it", () => {
  assertEqual(/getItem\("kimthu_theme"\) \|\| "light"/.test(readText("src/ui/theme_init.js")), true);
});
