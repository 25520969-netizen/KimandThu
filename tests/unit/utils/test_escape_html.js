// escapeHtml: five characters, null-safe.

test("escapeHtml: escapes & < > ' \" and coerces non-strings", () => {
  assertEqual(escapeHtml(`<a href="x" onclick='y'>&`), "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;");
  assertEqual(escapeHtml(12), "12");
  assertEqual(escapeHtml(null), "");
  assertEqual(escapeHtml(undefined), "");
});
