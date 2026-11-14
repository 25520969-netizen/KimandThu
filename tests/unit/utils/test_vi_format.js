// vi-VN formatters.

test("formatTime24: 24 h, zero padded", () => {
  assertEqual(formatTime24(new Date(2026, 9, 25, 17, 9)), "17:09");
  assertEqual(formatTime24(new Date(2026, 9, 25, 0, 5)), "00:05");
});

test("formatDateVi / formatDayMonth: dd/mm", () => {
  assertEqual(formatDateVi(new Date(2026, 9, 25)), "25/10/2026");
  assertEqual(formatDateVi("2026-10-05"), "05/10/2026");
  assertEqual(formatDayMonth("2026-10-25T17:09"), "25/10");
});

test("formatMonthLabel: Tháng m, yyyy", () => {
  assertEqual(formatMonthLabel("2026-10"), "Tháng 10, 2026");
  assertEqual(formatMonthLabel("2026-03"), "Tháng 3, 2026");
});

test("formatDistanceVi: metres below 1 km, comma decimals above", () => {
  assertEqual(formatDistanceVi(3.26), "3,3 km");
  assertEqual(formatDistanceVi(12.04), "12,0 km");
  assertEqual(formatDistanceVi(0.85), "850 m");
  assertEqual(formatDistanceVi(0.9996), "1,0 km");
  assertEqual(formatDistanceVi(3.2, { approx: true }), "≈ 3,2 km");
  assertEqual(formatDistanceVi(NaN), "");
  assertEqual(formatDistanceVi(null), "");
});

test("formatDaySeparator: Hôm nay, Hôm qua, then a date", () => {
  const now = new Date(2026, 10, 14, 12);
  assertEqual(formatDaySeparator(new Date(2026, 10, 14, 1), now), "Hôm nay");
  assertEqual(formatDaySeparator(new Date(2026, 10, 13, 23), now), "Hôm qua");
  assertEqual(formatDaySeparator(new Date(2026, 9, 25), now), "25/10/2026");
});
