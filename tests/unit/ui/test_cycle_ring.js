// cycleRingModel / cycleRingSvg.

const crDate = (m, d) => new Date(2026, m - 1, d);
const crInput = (extra) => Object.assign({
  cycle: { isDuring: false, periodDay: 1, daysUntilNext: 4, windowStart: crDate(12, 8), windowEnd: crDate(12, 11) },
  cycleLength: 28, durationDays: 5, today: crDate(12, 4)
}, extra || {});

test("cycleRingModel: before the period", () => {
  const m = cycleRingModel(crInput({ cycle: { isDuring: false, periodDay: 1, daysUntilNext: 10, windowStart: crDate(12, 12), windowEnd: crDate(12, 15) }, today: crDate(12, 4) }));
  assertEqual([m.phase, m.title, m.subtitle], ["before", "Còn 10 ngày", "đến kỳ"]);
  assertEqual(m.summary, "Còn 10 ngày đến kỳ, dự kiến từ 12 đến 15 tháng 12.");
  assertEqual(m.phaseLine, "Còn 10 ngày đến kỳ");
});

test("cycleRingModel: soon when 3 days or fewer remain", () => {
  const m = cycleRingModel(crInput({ cycle: { isDuring: false, periodDay: 1, daysUntilNext: 2, windowStart: crDate(12, 5), windowEnd: crDate(12, 8) } }));
  assertEqual([m.phase, m.title, m.subtitle], ["soon", "Sắp đến kỳ", "trong vài ngày tới"]);
  assertEqual(m.phaseLine, "Có thể đến kỳ trong vài ngày tới");
});

test("cycleRingModel: during the period", () => {
  const m = cycleRingModel(crInput({ cycle: { isDuring: true, periodDay: 5, daysUntilNext: 24, windowStart: crDate(12, 8), windowEnd: crDate(12, 11) } }));
  assertEqual([m.phase, m.title, m.subtitle, m.dayInCycle], ["during", "Ngày 5", "của kỳ", 5]);
  assertEqual(m.summary, "Hôm nay là ngày 5 của kỳ, dự kiến kỳ tới từ 8 đến 11 tháng 12.");
  assertEqual(m.phaseLine, "Đang trong kỳ · ngày 5/5");
  assertEqual(m.arcs.period, [0, 5 * (360 / 28)]);
});

test("cycleRingModel: four days out is still before", () => {
  const m = cycleRingModel(crInput());
  assertEqual([m.phase, m.title], ["before", "Còn 4 ngày"]);
  assertEqual(m.summary, "Còn 4 ngày đến kỳ, dự kiến từ 8 đến 11 tháng 12.");
});

test("cycleRingModel: no cycle means phase none", () => {
  assertEqual(cycleRingModel(crInput({ cycle: null })).phase, "none");
});

test("cycleRingSvg: accessible label equals the summary and colours use tokens", () => {
  const m = cycleRingModel(crInput());
  const svg = cycleRingSvg(m, { size: 200 });
  assertTrue(svg.indexOf('aria-label="' + m.summary + '"') !== -1);
  assertTrue(svg.indexOf("var(--c-primary)") !== -1 && svg.indexOf("var(--c-sunken)") !== -1);
  assertTrue(svg.indexOf('role="img"') !== -1);
});
