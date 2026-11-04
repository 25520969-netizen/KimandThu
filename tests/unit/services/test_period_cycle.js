// BUG-01 / BUG-02 / CODE-01: period cycle math (start 2026-10-01, cycle 28, duration 5).

const PERIOD_START = "2026-10-01";
const at = (month, day, hour) => new Date(2026, month - 1, day, hour === undefined ? 12 : hour);

test("computeCycle: days 1-5 are 'during' with the right day number", () => {
  for (let day = 1; day <= 5; day += 1) {
    const c = computeCycle(PERIOD_START, 28, 5, at(10, day));
    assertTrue(c.isDuring, `day ${day} isDuring`);
    assertEqual(c.periodDay, day, `day ${day} periodDay`);
  }
});

test("computeCycle: day 6 is after the period with 23 days to go", () => {
  const c = computeCycle(PERIOD_START, 28, 5, at(10, 6));
  assertEqual(c.isDuring, false);
  assertEqual(c.daysUntilNext, 23);
  assertEqual([c.nextStart.getFullYear(), c.nextStart.getMonth() + 1, c.nextStart.getDate()], [2026, 10, 29]);
});

test("computeCycle: alert window is the 3 days before the next start", () => {
  const states = [26, 27, 28].map((d) => computeCycle(PERIOD_START, 28, 5, at(10, d)).daysUntilNext);
  assertEqual(states, [3, 2, 1]);
  const next = computeCycle(PERIOD_START, 28, 5, at(10, 29));
  assertTrue(next.isDuring, "second period starts on day 29");
  assertEqual(next.periodDay, 1);
});

test("computeCycle: every day of the first 56 matches the cycle", () => {
  for (let offset = 0; offset < 56; offset += 1) {
    const c = computeCycle(PERIOD_START, 28, 5, new Date(2026, 9, 1 + offset, 9));
    assertEqual(c.isDuring, offset % 28 < 5, `offset ${offset}`);
    assertEqual(c.daysUntilNext, 28 - (offset % 28), `offset ${offset} daysUntilNext`);
  }
});

test("computeCycle: time of day does not change the result", () => {
  const early = computeCycle(PERIOD_START, 28, 5, at(10, 3, 0));
  const late = computeCycle(PERIOD_START, 28, 5, at(10, 3, 23));
  assertEqual(early.periodDay, late.periodDay);
  assertEqual(early.daysUntilNext, late.daysUntilNext);
});

test("computeCycle: start date in the future points at that start", () => {
  const c = computeCycle("2026-11-10", 28, 5, at(11, 4));
  assertEqual(c.isDuring, false);
  assertEqual(c.daysUntilNext, 6);
  assertEqual(c.nextStart.getDate(), 10);
});

test("computeCycle: invalid cycle and duration fall back to defaults", () => {
  const c = computeCycle(PERIOD_START, 0, "abc", at(10, 2));
  assertTrue(c.isDuring);
  assertEqual(c.daysUntilNext, 27);
});

test("computeCycle: invalid start date returns null", () => {
  assertEqual(computeCycle("", 28, 5, at(10, 1)), null);
  assertEqual(computeCycle(null, 28, 5, at(10, 1)), null);
  assertEqual(computeCycle("not-a-date", 28, 5, at(10, 1)), null);
});
