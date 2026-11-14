// PetalCanvas: pure colour helper (the drawing itself is checked in the browser).

test("PetalCanvas.hexToRgb: parses #RRGGBB and falls back to the accent", () => {
  assertEqual(PetalCanvas.hexToRgb("#E85D75"), [232, 93, 117]);
  assertEqual(PetalCanvas.hexToRgb(" #ff9db3 "), [255, 157, 179]);
  assertEqual(PetalCanvas.hexToRgb("nope"), [232, 93, 117]);
});
