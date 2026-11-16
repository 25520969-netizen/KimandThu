// PetalCanvas: pure helpers (the drawing itself is checked in the browser).

test("PetalCanvas.hexToRgb: parses #RRGGBB and falls back to the accent", () => {
  assertEqual(PetalCanvas.hexToRgb("#FF7FA5"), [255, 127, 165]);
  assertEqual(PetalCanvas.hexToRgb(" #ff9dbb "), [255, 157, 187]);
  assertEqual(PetalCanvas.hexToRgb("nope"), [255, 127, 165]);
});

test("PetalCanvas.heartCount: 12 on phones, 16 from 768 px", () => {
  assertEqual(PetalCanvas.heartCount(375), 12);
  assertEqual(PetalCanvas.heartCount(767), 12);
  assertEqual(PetalCanvas.heartCount(768), 16);
});

test("PetalCanvas.shouldAnimate: hidden, reduced motion, burst, setting and covers", () => {
  const base = { hidden: false, reducedMotion: false, enabled: true, covered: false, bursting: false };
  const run = (extra) => PetalCanvas.shouldAnimate(Object.assign({}, base, extra));
  assertEqual(run({ hidden: true, bursting: true }), false);
  assertEqual(run({ reducedMotion: true, bursting: true }), false);
  assertEqual(run({ covered: true, bursting: true }), true);
  assertEqual(run({ enabled: false }), false);
  assertEqual(run({}), true);
  assertEqual(run({ covered: true }), false);
});

test("PetalCanvas.stepHeart: rises, advances the sway clock, reports when it left the top", () => {
  const heart = { y: 100, speed: 20, size: 10, t: 0 };
  assertEqual(PetalCanvas.stepHeart(heart, 1000, { width: 375, height: 812 }), false);
  assertEqual([heart.y, heart.t], [80, 1000]);
  assertEqual(PetalCanvas.stepHeart({ y: -9, speed: 20, size: 10, t: 0 }, 1000, { width: 375, height: 812 }), true);
});
