// Static checks that keep the shell consistent: precache list, CSP-safe markup, versions, contrast.

const indexHtml = readText("index.html");
const swSource = readText("sw.js");
const appSource = readText("app.js");

const NEW_CSS = ["src/styles/tokens.css", "src/styles/base.css", "src/styles/components.css", "src/styles/shell.css",
  "src/styles/moments.css", "src/styles/places.css", "src/styles/be.css"];

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

test("Kẹo Bông: §2.1 text pairs meet 4.5:1 and controls 3:1 (light and dark)", () => {
  const tokens = readText("src/styles/tokens.css");
  const lightBlock = tokens.match(/:root \{([\s\S]*?)\n\}/)[1];
  const darkBlock = tokens.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)[1];
  const pick = (block, name) => block.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})"))[1];
  [["light", lightBlock], ["dark", darkBlock]].forEach(([theme, block]) => {
    const c = (name) => pick(block, name);
    const surfaceOnly = theme === "dark" ? "c-surface" : "c-bg";
    ["c-text", "c-muted", "c-primary"].forEach((n) => assertTrue(contrast(c(n), c("c-bg")) >= 4.5, theme + " " + n + " on bg"));
    ["c-danger", "c-success", "c-warn"].forEach((n) => assertTrue(contrast(c(n), c(surfaceOnly)) >= 4.5, theme + " " + n));
    assertTrue(contrast(c("c-muted"), c("c-sunken")) >= 4.5, theme + " muted on sunken");
    assertTrue(contrast(c("c-on-primary"), c("c-primary")) >= 4.5, theme + " on-primary on primary");
    assertTrue(contrast(c("c-primary-strong"), c("c-primary-soft")) >= 4.5, theme + " primary-strong on primary-soft");
    assertTrue(contrast(c("c-primary-strong"), c("c-sunken")) >= 4.5, theme + " primary-strong on sunken");
    assertTrue(contrast(c("c-on-toast"), c("c-toast")) >= 4.5, theme + " on-toast on toast");
    assertTrue(contrast(c("c-toast-action"), c("c-toast")) >= 4.5, theme + " toast-action on toast");
    assertTrue(contrast(c("c-control"), c("c-sunken")) >= 3, theme + " control on sunken");
    assertTrue(contrast(c("c-control"), c("c-bg")) >= 3, theme + " control on bg");
    assertTrue(contrast(c("c-control"), c("c-surface")) >= 3, theme + " control on surface");
    assertTrue(contrast(c("c-focus"), c("c-bg")) >= 3, theme + " focus on bg");
  });
});

test("backdrop-filter only on the header and tab bar", () => {
  let count = 0;
  NEW_CSS.forEach((f) => { count += (readText(f).match(/(^|[^-])backdrop-filter:\s*(?!none)/gm) || []).length; });
  assertTrue(count <= 2, "backdrop-filter declarations: " + count);
});

test("UI-10: no 'transition: all' in the stylesheets", () => {
  NEW_CSS.forEach((f) => {
    assertEqual(/transition:\s*all\b/.test(readText(f)), false, f);
  });
});

test("UI-08: every :hover rule is inside a (hover: hover) media query", () => {
  NEW_CSS.forEach((f) => {
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

test("UI-09: at most 3 infinite animations in the new stylesheets (skeleton, button and chip spinners)", () => {
  let count = 0;
  NEW_CSS.forEach((f) => { count += (readText(f).match(/infinite/g) || []).length; });
  assertTrue(count <= 3, `infinite animations: ${count}`);
});

test("hearts: 12 or 16, a static frame of 8, and a gated loop", () => {
  const petals = readText("src/ui/petal_canvas.js");
  [/PHONE_COUNT = 12;/, /WIDE_COUNT = 16;/, /STATIC_COUNT = 8;/].forEach((re) => assertTrue(re.test(petals), String(re)));
  ["prefers-reduced-motion", "visibilitychange", "dialog[open]"].forEach((s) => assertTrue(petals.indexOf(s) !== -1, s));
  ["PETAL_COUNT", "spawnHeartBurst", "spawnHeartConfetti"].forEach((s) => assertEqual(appSource.indexOf(s), -1, s));
  const base = readText("src/styles/base.css");
  assertEqual(/#petal-canvas\s*\{\s*display:\s*none/.test(base), false);
  assertTrue(/#burst-canvas\s*\{/.test(base), "burst canvas rule");
  assertTrue(indexHtml.includes('id="burst-canvas"'), "burst canvas element");
});

test("D-02: app shell does not inject a second close button into sheets", () => {
  assertEqual(/sheet-close-btn/.test(readText("src/ui/app_shell.js")), false);
  assertEqual(/sheet-close-btn/.test(readText("src/styles/components.css")), false);
});

test("places: chip row scrolls inside itself", () => {
  const css = readText("src/styles/places.css");
  assertTrue(/\.chips\s*\{[^}]*overflow-x:\s*auto/.test(css), ".chips scrolls horizontally");
});

test("D-04: form fields are 16px so iOS does not zoom on focus", () => {
  const css = readText("src/styles/components.css");
  assertEqual(/\.field (input|textarea|select)[^{]*\{[^}]*font-size:\s*16px/.test(css), true);
  ["input", "textarea", "select"].forEach((tag) => {
    const rule = css.match(/\.field input[^{]*\{[^}]*\}/);
    assertTrue(rule && rule[0].indexOf(".field " + tag) !== -1, ".field " + tag + " is covered");
  });
});

test("D-03: sheets drag by a grabber with touch-action none, not the whole card", () => {
  const css = readText("src/styles/components.css");
  assertEqual(/\.sheet__grabber\s*\{[^}]*touch-action:\s*none/.test(css), true);
  assertEqual(/\.sheet__card\s*\{[^}]*touch-action:\s*pan-y/.test(css), false);
});

test("D-07/D-09: tokens.css defines light and dark themes and loads first", () => {
  const tokens = readText("src/styles/tokens.css");
  assertEqual(/\[data-theme="dark"\]/.test(tokens), true);
  assertEqual(/prefers-color-scheme:\s*dark/.test(tokens), true);
  assertEqual(indexHtml.indexOf("tokens.css") < indexHtml.indexOf('href="src/styles/base.css'), true);
});

test("D-09: dark tokens are a warm plum-black, not pink-brown", () => {
  const tokens = readText("src/styles/tokens.css");
  assertTrue(/--c-bg:\s*#1C1217/.test(tokens), "dark --c-bg");
  assertEqual(tokens.toLowerCase().indexOf("#1f1418"), -1);
});

test("D-10: petal canvas is DPR-aware and pauses under overlays", () => {
  const petals = readText("src/ui/petal_canvas.js");
  assertEqual(/devicePixelRatio/.test(petals), true);
  assertEqual(/dialog\[open\]/.test(petals), true);
});

test("D-08: renderPlaces skips identical renders", () => {
  assertEqual(/placesRenderSignature/.test(appSource), true);
});

test("theme defaults to light; dark/auto only when the user chooses it", () => {
  assertEqual(/getItem\("kimthu_theme"\) \|\| "light"/.test(readText("src/ui/theme_init.js")), true);
});

test("fonts: only Nunito, Be Vietnam Pro and Caveat load", () => {
  const url = indexHtml.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/)[0];
  const families = (url.match(/family=[^:&]+/g) || []).map((f) => f.slice(7)).sort();
  assertEqual(families.join(","), "Be+Vietnam+Pro,Caveat,Nunito");
  assertEqual(/Playfair/.test(indexHtml), false);
  assertEqual(/Outfit/.test(indexHtml), false);
});

test("fonts: Caveat is used only by .hand", () => {
  NEW_CSS.forEach((f) => {
    const css = readText(f);
    const hits = css.split("\n").filter((l) => /Caveat|--font-hand/.test(l));
    hits.forEach((l) => {
      const isTokenDef = f === "src/styles/tokens.css" && /^\s*--font-hand(writing)?:/.test(l);
      const isHandRule = f === "src/styles/base.css" && /font-family:\s*var\(--font-hand\)/.test(l);
      assertTrue(isTokenDef || isHandRule, f + ": " + l.trim());
    });
  });
  assertEqual(/Caveat|--font-hand/.test(appSource), false);
});

test("theme-color: two media metas with the page colours", () => {
  assertTrue(/<meta name="theme-color" content="#FFF4F7" media="\(prefers-color-scheme: light\)">/.test(indexHtml), "light meta");
  assertTrue(/<meta name="theme-color" content="#1C1217" media="\(prefers-color-scheme: dark\)">/.test(indexHtml), "dark meta");
  const theme = readText("src/ui/theme_init.js");
  ["#ff758f", "#1f1418", "#fbf7f2", "#16110f"].forEach((hex) => {
    assertEqual(indexHtml.toLowerCase().indexOf(hex), -1, hex + " in index.html");
    assertEqual(theme.toLowerCase().indexOf(hex), -1, hex + " in theme_init.js");
  });
  const manifest = JSON.parse(readText("manifest.json"));
  assertEqual([manifest.background_color, manifest.theme_color], ["#FFF4F7", "#FFF4F7"]);
});

test("card boxes: edge and shadow tokens in all three theme blocks", () => {
  const css = readText("src/styles/tokens.css");
  const darkAt = css.indexOf(':root[data-theme="dark"]');
  const autoAt = css.indexOf("@media (prefers-color-scheme: dark)");
  const light = css.slice(0, darkAt);
  const dark = css.slice(darkAt, autoAt);
  const auto = css.slice(autoAt);
  assertTrue(light.indexOf("--c-card-edge: #EFB6C8;") !== -1, "light edge");
  assertTrue(light.indexOf("--e-card: 0 1px 2px rgba(216, 27, 96, 0.08), 0 8px 20px rgba(216, 27, 96, 0.12);") !== -1, "light shadow");
  [dark, auto].forEach((block) => {
    assertTrue(block.indexOf("--c-card-edge: #5A3D4A;") !== -1, "dark edge");
    assertTrue(block.indexOf("--e-card: none;") !== -1, "dark shadow");
  });
  assertTrue(light.indexOf("--card-border: transparent;") !== -1, "card-border unchanged");
  assertTrue(light.indexOf("--e-1: 0 1px 2px rgba(216, 27, 96, 0.06), 0 6px 16px rgba(216, 27, 96, 0.08);") !== -1, "e-1 unchanged");
  assertEqual(css.indexOf("--c-photo-scrim"), -1, "scrim token");
  assertEqual(css.indexOf("--c-on-photo"), -1, "on-photo token");
});

test("components: no gradients and no pink box-shadows", () => {
  NEW_CSS.forEach((f) => {
    const css = readText(f);
    css.split("\n").filter((line) => /gradient\(/.test(line)).forEach((line) => {
      assertTrue(false, f + " has a gradient: " + line.trim());
    });
    assertEqual(/box-shadow:[^;]*rgba\((255|201),/.test(css), false, f + " has a pink shadow");
  });
});

test("card boxes: moments use one edge, inset photo, body below and box press", () => {
  const m = readText("src/styles/moments.css");
  const rule = (sel) => {
    const hit = m.match(new RegExp(sel + "\\s*\\{[^}]*\\}"));
    assertTrue(hit !== null, sel + " rule exists");
    return hit[0];
  };
  [".memory", ".memory-skeleton", ".counter-card", ".otd-row"].forEach((sel) => {
    const r = rule("\\" + sel);
    assertTrue(r.indexOf("border: 1.5px solid var(--c-card-edge)") !== -1, sel + " edge");
    assertTrue(r.indexOf("box-shadow: var(--e-card)") !== -1, sel + " shadow");
  });
  const memory = rule("\\.memory");
  ["padding: var(--s-2)", "background: var(--c-surface)", "contain-intrinsic-size: auto 540px"].forEach((d) => assertTrue(memory.indexOf(d) !== -1, ".memory " + d));
  const sk = rule("\\.memory-skeleton");
  assertTrue(sk.indexOf("padding: var(--s-2)") !== -1 && sk.indexOf("background: var(--c-surface)") !== -1, "skeleton box");
  const photo = rule("\\.memory__photo");
  assertTrue(photo.indexOf("border-radius: calc(var(--r-lg) - var(--s-2))") !== -1 && photo.indexOf("max-height: 75svh") !== -1, "inset photo");
  assertTrue(rule("\\.memory__body").indexOf("padding: var(--s-3) var(--s-2) var(--s-2)") !== -1, "body padding");
  assertTrue(m.indexOf("memory__overlay") === -1 && m.indexOf("photo-scrim") === -1, "overlay gone");
  assertTrue(/\.memory__open:active\s*\{[^}]*transform:\s*none/.test(m), "no inner scale");
  assertTrue(/\.memory:has\(\.memory__open:active\)\s*\{[^}]*scale\(0\.98\)/.test(m), "box press");
  const reduced = m.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/);
  assertTrue(reduced !== null && /\.memory:has\(\.memory__open:active\)[^}]*border-color: var\(--c-primary\)/.test(reduced[0]), "reduced motion border");
  assertTrue(/\.memory--failed \.memory__retry\s*\{[^}]*top:\s*calc\(var\(--s-2\) \+ var\(--s-3\)\)/.test(m), "retry offset");
});

test("shell: legacy nav menu and floating chat button are gone", () => {
  ["legacy-nav-menu", "nav-dropdown", "floating-chat-btn", "bottom-fab-btn", "data-proxy"].forEach((s) => {
    assertEqual(indexHtml.indexOf(s), -1, s);
  });
});

test("shell: guest tab bar has no unlock tab", () => {
  const bar = indexHtml.match(/<nav class="tab-bar"[\s\S]*?<\/nav>/)[0];
  assertEqual(/class="tab[^"]*guest-only/.test(bar), false);
  assertEqual((bar.match(/<button/g) || []).length, 3);
});

test("shell: header has at most two icon buttons per mode", () => {
  const header = indexHtml.match(/<header class="app-header"[\s\S]*?<\/header>/)[0];
  const iconButtons = header.match(/<button[^>]*class="icon-btn[^"]*"[^>]*>/g) || [];
  assertEqual(iconButtons.length, 2);
  assertTrue(/id="music-toggle-btn"/.test(header) && /id="edit-profile-btn"/.test(header));
});

test("FAB: one page-aware add button; no inline + buttons", () => {
  assertTrue(indexHtml.indexOf('id="fab"') !== -1, "fab");
  assertEqual(indexHtml.indexOf("open-add-memory-modal-btn"), -1);
  assertEqual(indexHtml.indexOf("open-add-place-modal-btn"), -1);
  const shell = readText("src/ui/app_shell.js");
  assertTrue(shell.indexOf("openMemoryDialog") !== -1 && shell.indexOf("openPlaceDialog") !== -1);
});

test("moments: a failed photo becomes the heart card with a retry button", () => {
  assertEqual(/locket-photo-placeholder/.test(appSource), false);
  assertEqual(/locket-photo-placeholder/.test(readText("src/ui/templates.js")), false);
  const fn = appSource.slice(appSource.indexOf("showMemoryTextFallback("));
  assertTrue(fn.indexOf("memoryFailedCardHtml") !== -1, "failed photos become the heart card");
});

test("settings: no reset-to-defaults button; lock action lives in settings", () => {
  assertEqual(indexHtml.indexOf("reset-default-data-btn"), -1);
  const block = indexHtml.match(/<dialog id="settings-modal"[\s\S]*?<\/dialog>/)[0];
  assertTrue(block.indexOf('id="auth-lock-nav-btn"') !== -1, "lock button inside settings");
});

test("no window.confirm except the API-link prompt", () => {
  assertEqual((appSource.match(/\bconfirm\(/g) || []).length, 1);
  assertTrue(/applyApiUrlParam[\s\S]{0,800}confirm\(/.test(appSource), "the one confirm is in applyApiUrlParam");
});

test("auth: password field with current-password autocomplete", () => {
  assertTrue(/<input[^>]*id="auth-passcode-input"[^>]*type="password"[^>]*autocomplete="current-password"/.test(indexHtml) ||
    /<input[^>]*type="password"[^>]*id="auth-passcode-input"[^>]*autocomplete="current-password"/.test(indexHtml), "password input");
});

test("detail: memories open the detail sheet, not the lightbox", () => {
  const events = appSource.slice(appSource.indexOf("bindTimelineEvents() {"), appSource.indexOf("retryMemoryPhoto(id) {"));
  assertTrue(events.indexOf("openMemoryDetail") !== -1 && events.indexOf("openMemoryLightbox") === -1, "timeline and on-this-day clicks");
  const places = appSource.slice(appSource.indexOf("bindPlaceRowActions() {"), appSource.indexOf("openPlaceMenu(anchor"));
  assertTrue(places.indexOf("openMemoryDetail") !== -1 && places.indexOf("openMemoryLightbox") === -1, "place memory link");
  assertEqual(/locket-/.test(appSource), false);
});

test("add moment: labels above fields, no in-app camera, 10 MB guard", () => {
  const block = indexHtml.match(/<dialog id="memory-modal"[\s\S]*?<\/dialog>/)[0];
  assertTrue(block.indexOf('<label for="memory-title-input"') !== -1, "title label");
  assertEqual(/btn-camera-trigger|inapp-camera/.test(block), false);
  assertTrue(appSource.indexOf("10 * 1024 * 1024") !== -1, "10 MB guard");
  assertEqual(appSource.indexOf("startInAppCamera"), -1);
});

test("places: no visited-date field is sent to the backend", () => {
  const start = appSource.indexOf("  sendPlaceToBackend(place) {");
  const body = appSource.slice(start, appSource.indexOf("\n  }\n", start));
  assertEqual(/updatedAt|visitedAt/.test(body), false);
});

test("no legacy token names remain", () => {
  const legacy = /--pink-|--bg-|--text-main|--text-muted|--text-soft|--shadow-card|--font-handwriting/;
  NEW_CSS.concat(["index.html", "app.js"]).forEach((f) => assertEqual(legacy.test(readText(f)), false, f));
});

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

test("acceptance 6: no emoji inside any <button>", () => {
  const sources = { "index.html": indexHtml, "app.js": appSource, "src/ui/templates.js": readText("src/ui/templates.js") };
  Object.keys(sources).forEach((name) => {
    (sources[name].match(/<button[^>]*>[\s\S]*?<\/button>/g) || []).forEach((markup) => {
      const text = markup.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "");
      assertEqual(EMOJI.test(text), false, name + ": " + markup.slice(0, 80));
    });
  });
});

test("acceptance: every icon-only button has an aria-label", () => {
  (indexHtml.match(/<button[^>]*>[\s\S]*?<\/button>/g) || []).forEach((markup) => {
    const inner = markup.replace(/^<button[^>]*>/, "").replace(/<\/button>$/, "");
    const iconOnly = /^\s*<svg[\s\S]*<\/svg>\s*$/.test(inner) && (inner.match(/<svg/g) || []).length === 1;
    if (iconOnly) assertTrue(/aria-label=/.test(markup), "icon-only button without aria-label: " + markup.slice(0, 80));
  });
});

test("acceptance: sentence case, no all-caps labels", () => {
  assertEqual(indexHtml.indexOf("CHÚNG MÌNH ĐÃ Ở BÊN NHAU ĐƯỢC"), -1);
  NEW_CSS.forEach((f) => assertEqual(/text-transform:\s*uppercase/.test(readText(f)), false, f));
});

test("acceptance 9: dark tokens cover every section 2.1 role", () => {
  const tokens = readText("src/styles/tokens.css");
  const light = tokens.match(/:root \{([\s\S]*?)\n\}/)[1];
  const dark = tokens.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)[1];
  (light.match(/--c-[a-z-]+(?=:)/g) || []).forEach((name) => assertTrue(dark.indexOf(name + ":") !== -1, name + " missing in dark"));
});

test("fluid: no 100vh or 100vw in stylesheets", () => {
  NEW_CSS.forEach((f) => assertEqual(/100v[hw]\b/.test(readText(f)), false, f));
});

test("fluid: html clips horizontal overflow", () => {
  assertTrue(/html\s*\{[^}]*overflow-x:\s*clip/.test(readText("src/styles/base.css")), "html overflow-x: clip");
});

test("fluid: no width breakpoints in tokens or moments", () => {
  ["src/styles/tokens.css", "src/styles/moments.css"].forEach((f) =>
    assertEqual(/@media\s*\((max|min)-width:\s*(359|413|414)px\)/.test(readText(f)), false, f));
});

test("fluid: gutter, hero and display sizes use clamp()", () => {
  const tokens = readText("src/styles/tokens.css");
  [/--gutter:\s*clamp\(/, /--t-hero-num-size:\s*clamp\(/, /--t-display-size:\s*clamp\(/].forEach((re) => assertTrue(re.test(tokens), String(re)));
});

test("fluid: section head wraps instead of clipping the title", () => {
  const moments = readText("src/styles/moments.css");
  const head = moments.match(/\.section-head\s*\{[^}]*\}/);
  assertTrue(head && /flex-wrap:\s*wrap/.test(head[0]), "section-head flex-wrap");
  (moments.match(/\.section-head[^{]*\{[^}]*\}/g) || []).forEach((rule) => assertEqual(/text-overflow/.test(rule), false, rule));
});

test("fluid: feed photo height is capped by the viewport", () => {
  const rule = readText("src/styles/moments.css").match(/\.memory__photo\s*\{[^}]*\}/);
  assertTrue(rule && /max-height:\s*75svh/.test(rule[0]), "memory__photo max-height");
});

test("fluid: place actions use container queries, not window width", () => {
  const places = readText("src/styles/places.css");
  [/container-type:\s*inline-size/, /@container\s*\(max-width:\s*439px\)/, /@container\s*\(max-width:\s*319px\)/].forEach((re) => assertTrue(re.test(places), String(re)));
  assertEqual(appSource.indexOf("COMPACT_WIDTH_PX"), -1);
});

test("fluid: FAB and tab bar clear the notch", () => {
  const shell = readText("src/styles/shell.css");
  assertTrue(shell.includes("var(--safe-left)") && shell.includes("max(var(--gutter), var(--safe-right))"), "shell safe areas");
});

test("chat and timed notes are gone from app.js", () => {
  ["chatMessages", "toggleChatDrawer", "mergeChat", "mergeNotes", "promptSenderIfNeeded", "initChat", "initNotes", "NOTES_KEY", "chatOpen"]
    .forEach((name) => assertEqual(appSource.includes(name), false, name));
  ["journey_chat_messages_v1", "journey_notes_v1", "journey_chat_sender_v1", "journey_chat_sender_chosen_v1"]
    .forEach((key) => assertTrue(appSource.includes(key), key));
  assertTrue(appSource.includes("await this.purgeRetiredOutbox()"), "purge is awaited");
  const ctor = appSource.slice(appSource.indexOf("constructor() {"), appSource.indexOf("loadData(key, fallback) {"));
  assertTrue(ctor.includes("this.purgeRetiredLocalData()"), "constructor purges retired local data");
});

test("chat, who-am-i and timed notes are gone from the shell", () => {
  ["chat-drawer", "tab-chat", "who-am-i", "notes-modal", "chat.css", "chat_layout"].forEach((name) => {
    assertEqual(indexHtml.includes(name), false, "index.html " + name);
    assertEqual(swSource.includes(name), false, "sw.js " + name);
  });
  NEW_CSS.concat(["src/ui/app_shell.js", "src/ui/petal_canvas.js"]).forEach((file) => assertEqual(readText(file).includes("chat-open"), false, file));
});

test("tokens: both dark blocks are identical", () => {
  const tokens = readText("src/styles/tokens.css");
  const dark = tokens.match(/:root\[data-theme="dark"\] \{([\s\S]*?)\n\}/)[1];
  const auto = tokens.match(/:root:not\(\[data-theme="light"\]\):not\(\[data-theme="dark"\]\) \{([\s\S]*?)\n  \}/)[1];
  const lines = (block) => block.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  assertEqual(lines(auto), lines(dark));
});

test("components: pill buttons, a filled danger button and 48 px fields", () => {
  const css = readText("src/styles/components.css");
  assertTrue(/\.btn--danger\s*\{/.test(css), ".btn--danger exists");
  assertTrue(/\.btn\s*\{[^}]*border-radius:\s*var\(--r-pill\)/.test(css), ".btn is a pill");
  assertTrue(/\.field input[^{]*\{[^}]*min-height:\s*48px/.test(css), "field controls are 48 px tall");
  assertTrue(/\.field input[^{]*\{[^}]*font-size:\s*16px/.test(css), "field controls stay 16 px");
  const confirm = readText("src/ui/confirm_sheet.js");
  assertTrue(confirm.includes('"btn--danger"'), "confirm sheet uses btn--danger");
  assertEqual(confirm.includes("btn--danger-text"), false);
});

test("shell: floating pill tab bar with a heart tab icon", () => {
  const tokens = readText("src/styles/tokens.css");
  assertTrue(tokens.includes("--tabbar-h: 60px"), "--tabbar-h");
  const shell = readText("src/styles/shell.css");
  const rule = shell.match(/\.tab-bar\s*\{[^}]*\}/)[0];
  assertTrue(rule.includes("border-radius: var(--r-pill)") && rule.includes("var(--safe-left)"), ".tab-bar is a pill and clears the notch");
  assertTrue(shell.includes("max(var(--gutter), var(--safe-right))"), "FAB clears the right notch");
  const bar = indexHtml.match(/<nav class="tab-bar"[\s\S]*?<\/nav>/)[0];
  assertTrue(bar.includes("M12 20s-8-4.9-8-11"), "heart path");
  assertEqual(bar.includes("M3 11l9-8 9 8"), false);
});

test("hero: avatar pair, heart button, counter card and milestone heart", () => {
  assertTrue(/id="hero-heart-btn"[^>]*aria-label="Thả tim"|aria-label="Thả tim"[^>]*id="hero-heart-btn"/.test(indexHtml), "heart button label");
  ["id=\"avatar-one\"", "id=\"avatar-two\"", "class=\"counter-card\"", "milestone__heart", "id=\"hero-days\"", "id=\"count-days\"",
    "id=\"milestone-bar\"", "id=\"milestone-fill\"", "id=\"milestone-line\"", "id=\"partner-one-name\"", "id=\"partner-two-name\"",
    "id=\"hero-custom-quote\""].forEach((needle) => assertTrue(indexHtml.includes(needle), needle));
  const hero = indexHtml.match(/<section class="hero page" id="hero"[\s\S]*?<\/section>/)[0];
  assertTrue(/<h1 class="visually-hidden"/.test(hero), "hero h1 is visually hidden");
});

test("sheets: badges, large detail title, the failed detail photo and the hearts label", () => {
  assertTrue(indexHtml.includes("Trái tim bay") && !indexHtml.includes("Cánh hoa bay"), "settings label");
  ["auth-modal", "period-alert-modal"].forEach((id) => {
    const block = indexHtml.match(new RegExp('<dialog id="' + id + '"[\\s\\S]*?</dialog>'))[0];
    assertTrue(block.includes("sheet__badge"), id + " has a badge");
  });
  assertTrue(/id="memory-detail-title" class="large-title"/.test(indexHtml), "detail title is large");
  const render = appSource.slice(appSource.indexOf("renderDetailPhoto(mem) {"));
  const renderBody = render.slice(0, render.indexOf("\n  }\n"));
  ["detailPhotoHtml", "detailPhotoFailedHtml", "error"].forEach((needle) => assertTrue(renderBody.includes(needle), "renderDetailPhoto " + needle));
  const bind = appSource.slice(appSource.indexOf("bindMemoryDetail() {"), appSource.indexOf("async shareMemory("));
  assertTrue(bind.includes("detail__retry"), "retry is handled");
  const open = appSource.slice(appSource.indexOf("openMemoryDetail(mem) {"), appSource.indexOf("renderMemoryStory("));
  assertTrue(open.includes("renderDetailPhoto") && !open.includes("<img"), "openMemoryDetail delegates the photo");
  const moments = readText("src/styles/moments.css");
  assertTrue(/\.photo-lightbox-modal\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.92\)/.test(moments), "lightbox 92 % on the dialog");
  assertTrue(/\.photo-lightbox-modal::backdrop\s*\{[^}]*background:\s*transparent/.test(moments), "backdrop transparent");
});

test("places: white cards, 40 px actions and a label-free row below 280 px", () => {
  const places = readText("src/styles/places.css");
  const place = places.match(/\.place\s*\{[^}]*\}/)[0];
  assertTrue(place.includes("border-radius: var(--r-lg)") && place.includes("background: var(--c-surface)"), ".place is a card");
  [/container-type:\s*inline-size/, /@container\s*\(max-width:\s*439px\)/, /@container\s*\(max-width:\s*319px\)/, /@container\s*\(max-width:\s*279px\)/]
    .forEach((re) => assertTrue(re.test(places), String(re)));
  assertTrue(/\.place__actions \.btn\s*\{[^}]*min-height:\s*40px/.test(places), "action buttons are 40 px tall");
  assertTrue(appSource.includes("PLACES_SKELETON_ROWS = 4"), "four skeleton rows");
  assertTrue(place.includes("border: 1.5px solid var(--c-card-edge)") && place.includes("box-shadow: var(--e-card)"), ".place edge and shadow");
  assertTrue(/\.places\s*\{[^}]*gap:\s*var\(--s-4\)/.test(places), "list gap");
  const sk = places.match(/\.places \.skeleton--row\s*\{[^}]*\}/);
  assertTrue(sk !== null, "skeleton row rule");
  assertTrue(sk[0].includes("border: 1.5px solid var(--c-card-edge)") && sk[0].includes("margin-bottom: 0") && !sk[0].includes("box-shadow"), "skeleton edge, no shadow");
});

test("copy: no emoji in toasts, status text or placeholders", () => {
  appSource.split("\n").filter((line) => /showToast\(|textContent\s*=|placeholder\s*=/.test(line))
    .forEach((line) => assertEqual(EMOJI.test(line), false, line.trim()));
  assertEqual(EMOJI.test(readText("src/services/milestones.js")), false, "milestones.js");
});
