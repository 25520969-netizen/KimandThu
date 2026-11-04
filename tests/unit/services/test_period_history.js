test("addPeriodStart: sorts, de-duplicates and ignores invalid dates", () => {
  assertEqual(addPeriodStart(["2026-09-03", "2026-08-05"], "2026-10-01"), ["2026-08-05", "2026-09-03", "2026-10-01"]);
  assertEqual(addPeriodStart(["2026-09-03"], "2026-09-03"), ["2026-09-03"]);
  assertEqual(addPeriodStart(["2026-09-03"], "2026-13-40"), ["2026-09-03"]);
  assertEqual(addPeriodStart(null, "bad"), []);
});

test("cycleIntervals: ignores implausible gaps", () => {
  assertEqual(cycleIntervals(["2026-01-01", "2026-01-30", "2026-02-05", "2026-04-20"]), [29]);
});

test("predictCycle: falls back to the setting when there is no data", () => {
  assertEqual(predictCycle([], 28), { cycleLength: 28, windowDays: 2, basedOn: 0 });
  assertEqual(predictCycle(["2026-01-01"], 30), { cycleLength: 30, windowDays: 2, basedOn: 0 });
});

test("predictCycle: uses the mean of recorded cycles (L3: real cycles are not 28)", () => {
  const p = predictCycle(["2026-01-01", "2026-01-30", "2026-02-28"], 28);
  assertEqual(p.cycleLength, 29);
  assertEqual(p.basedOn, 2);
  assertEqual(p.windowDays, 2);
});

test("predictCycle: window grows with variability and is capped", () => {
  const steady = predictCycle(["2026-01-01", "2026-01-29", "2026-02-26", "2026-03-26"], 28);
  assertEqual(steady.windowDays, 1);
  const wild = predictCycle(["2026-01-01", "2026-01-20", "2026-03-10", "2026-04-02", "2026-05-31"], 28);
  assertEqual(wild.windowDays <= 4 && wild.windowDays >= 1, true);
});

test("predictionWindow: centred on the expected date", () => {
  assertEqual(predictionWindow("2026-11-01", 28, 2), { center: "2026-11-29", from: "2026-11-27", to: "2026-12-01" });
});

test("evaluatePrediction: hit, miss and nothing-to-predict", () => {
  const history = ["2026-08-01", "2026-08-29", "2026-09-26"]; // 28-day cycles, next expected 2026-10-24
  assertEqual(evaluatePrediction(history, 28, "2026-10-25").hit, true);
  assertEqual(evaluatePrediction(history, 28, "2026-11-05").hit, false);
  assertEqual(evaluatePrediction([], 28, "2026-10-25"), null);
  assertEqual(evaluatePrediction(history, 28, "not-a-date"), null);
});

test("accuracy log keeps the last 12 entries", () => {
  let log = [];
  for (let i = 0; i < 15; i += 1) log = appendPredictionLog(log, { hit: i % 3 !== 0 });
  assertEqual(log.length, 12);
  assertEqual(accuracySummary(log).total, 12);
  assertEqual(accuracySummary([]), { hits: 0, total: 0 });
});
