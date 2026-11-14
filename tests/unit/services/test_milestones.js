const day = (y, m, d, h) => new Date(y, m - 1, d, h === undefined ? 12 : h);

test("daysTogether: counts whole calendar days", () => {
  assertEqual(daysTogether("2025-04-02T19:00:00", day(2025, 4, 3, 1)), 1);
  assertEqual(daysTogether("2025-04-02T19:00:00", day(2025, 4, 2, 23)), 0);
  assertEqual(daysTogether("garbage", day(2025, 4, 2)), null);
});

test("nextMilestone: next 100-day multiple with a countdown", () => {
  const start = "2025-04-02T19:00:00";
  const m = nextMilestone(start, new Date(2025, 3, 2 + 581, 12)); // 581 days later
  assertEqual(m.kind, "days");
  assertEqual(m.label, "600 ngày");
  assertEqual(m.daysLeft, 19);
  assertEqual(milestoneText(m), "Còn 19 ngày nữa là tròn 600 ngày");
});

test("nextMilestone: today counts and anniversaries win ties", () => {
  const start = "2025-04-02T19:00:00";
  const exact = nextMilestone(start, new Date(2025, 3, 2 + 500, 12));
  assertEqual([exact.label, exact.daysLeft], ["500 ngày", 0]);
  assertEqual(milestoneText(exact), "Hôm nay tròn 500 ngày 💕");
  const nearYear = nextMilestone(start, day(2026, 3, 30));
  assertEqual([nearYear.kind, nearYear.label, nearYear.daysLeft], ["year", "1 năm", 3]);
});

test("nextMilestone: invalid or future start returns null", () => {
  assertEqual(nextMilestone("nope", day(2025, 1, 1)), null);
  assertEqual(nextMilestone("2030-01-01T00:00:00", day(2025, 1, 1)), null);
  assertEqual(milestoneText(null), "");
});

test("memoriesOnThisDay: same month/day in earlier years only", () => {
  const mems = [
    { id: "a", date: "2025-11-04" }, { id: "b", date: "2024-11-04T10:00" },
    { id: "c", date: "2026-11-04" }, { id: "d", date: "2025-11-05" }, { id: "e" }
  ];
  const out = memoriesOnThisDay(mems, day(2026, 11, 4));
  assertEqual(out.map((x) => [x.memory.id, x.yearsAgo]), [["a", 1], ["b", 2]]);
  assertEqual(memoriesOnThisDay([], day(2026, 11, 4)), []);
  assertEqual(memoriesOnThisDay(null, day(2026, 11, 4)), []);
});

test("nextMilestone: fromDays and targetDays drive the progress bar", () => {
  const start = "2025-04-02T19:00:00";
  const m = nextMilestone(start, new Date(2025, 3, 2 + 591, 12)); // day 591
  assertEqual([m.fromDays, m.targetDays], [500, 600]);
  assertEqual(Math.round(milestoneProgress(m, 591) * 100) / 100, 0.91);
  const today = nextMilestone(start, new Date(2025, 3, 2 + 500, 12));
  assertEqual(milestoneProgress(today, 500), 1);
});

test("nextMilestone: anniversary milestone spans from the previous anniversary", () => {
  const near = nextMilestone("2025-04-02T19:00:00", day(2026, 3, 30));
  assertEqual(near.fromDays, 0);
  assertEqual(near.targetDays, 365);
  assertTrue(milestoneProgress(near, 362) > 0.99);
});
