// BUG-04: local calendar date, independent of the process time zone.

test("formatLocalDate: early morning keeps the local day", () => {
  assertEqual(formatLocalDate(new Date(2026, 10, 4, 6, 30)), "2026-11-04");
  assertEqual(formatLocalDate(new Date(2026, 10, 4, 0, 0, 1)), "2026-11-04");
});

test("formatLocalDate: late night keeps the local day", () => {
  assertEqual(formatLocalDate(new Date(2026, 10, 4, 23, 59, 59)), "2026-11-04");
});

test("formatLocalDate: pads month and day, handles year boundary", () => {
  assertEqual(formatLocalDate(new Date(2026, 0, 5, 12)), "2026-01-05");
  assertEqual(formatLocalDate(new Date(2025, 11, 31, 23, 59)), "2025-12-31");
});
