// icon(): every required glyph renders as a stroked currentColor SVG.

const REQUIRED_ICONS = ["home", "pin", "drop", "plus", "music", "settings", "lock", "navigation", "check",
  "cloud-pending", "more", "chevron-down", "chevron-right", "eye", "eye-off", "camera", "heart", "close",
  "clock", "alert", "share", "edit", "trash", "locate", "tiktok"];

test("icon: every required name returns a stroked currentColor svg", () => {
  REQUIRED_ICONS.forEach((name) => {
    const svg = icon(name);
    assertTrue(svg.indexOf("<svg") === 0, name + " starts with <svg");
    assertTrue(svg.indexOf('stroke-width="1.75"') !== -1, name + " stroke width");
    assertTrue(svg.indexOf("currentColor") !== -1, name + " currentColor");
    assertTrue(svg.indexOf('aria-hidden="true"') !== -1, name + " decorative by default");
  });
});

test("icon: filled adds fill currentColor", () => {
  assertTrue(icon("home", { filled: true }).indexOf('fill="currentColor"') !== -1);
  assertTrue(icon("home").indexOf('fill="none"') !== -1);
});

test("icon: label makes it an accessible image", () => {
  const svg = icon("alert", { label: "Cảnh báo" });
  assertTrue(svg.indexOf('aria-label="Cảnh báo"') !== -1);
  assertTrue(svg.indexOf('role="img"') !== -1);
  assertEqual(svg.indexOf("aria-hidden"), -1);
});

test("icon: size sets width and height; unknown name throws", () => {
  assertTrue(icon("plus", { size: 18 }).indexOf('width="18" height="18"') !== -1);
  assertThrows(() => icon("nope"));
});
