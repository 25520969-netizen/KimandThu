// SEC-03: safeUrl allow-list.

test("safeUrl: accepts https URLs", () => {
  assertEqual(safeUrl("https://www.tiktok.com/@kim/video/1"), "https://www.tiktok.com/@kim/video/1");
  assertEqual(safeUrl("  https://maps.google.com/?q=1,2  "), "https://maps.google.com/?q=1,2");
});

test("safeUrl: rejects dangerous schemes", () => {
  assertEqual(safeUrl("javascript:alert(1)"), "");
  assertEqual(safeUrl("JaVaScRiPt:alert(1)"), "");
  assertEqual(safeUrl("http://insecure.example"), "");
  assertEqual(safeUrl("data:text/html;base64,PHNjcmlwdD4="), "");
  assertEqual(safeUrl("//evil.example/x"), "");
});

test("safeUrl: rejects attribute-breaking characters (audit payload)", () => {
  assertEqual(safeUrl('https://a.b/"onmouseover="alert(1'), "");
  assertEqual(safeUrl("https://a.b/'x"), "");
  assertEqual(safeUrl("https://a.b/<script>"), "");
  assertEqual(safeUrl("https://a.b/ x"), "");
});

test("safeUrl: empty and non-string input", () => {
  assertEqual(safeUrl(""), "");
  assertEqual(safeUrl("   "), "");
  assertEqual(safeUrl(null), "");
  assertEqual(safeUrl(undefined), "");
  assertEqual(safeUrl(42), "");
});

test("safeUrl: relative assets only when allowed", () => {
  assertEqual(safeUrl("assets/images/memory3.jpg"), "");
  assertEqual(safeUrl("assets/images/memory3.jpg", { allowRelative: true }), "assets/images/memory3.jpg");
  assertEqual(safeUrl("//evil.example/x.jpg", { allowRelative: true }), "");
  assertEqual(safeUrl("javascript:alert(1)", { allowRelative: true }), "");
  assertEqual(safeUrl('x" onerror="alert(1)', { allowRelative: true }), "");
});

test("safeUrl: data:image only when allowed and well formed", () => {
  const png = "data:image/png;base64,iVBORw0KGgo=";
  assertEqual(safeUrl(png), "");
  assertEqual(safeUrl(png, { allowDataImage: true }), png);
  assertEqual(safeUrl("data:image/svg+xml;base64,PHN2Zz4=", { allowDataImage: true }), "");
  assertEqual(safeUrl('data:image/png;base64,AAA"onerror="x', { allowDataImage: true }), "");
});
