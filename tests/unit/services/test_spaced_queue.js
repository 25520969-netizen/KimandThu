asyncTest("createSpacedQueue: tasks start at least minGap apart and in order", async () => {
  let t = 0;
  const starts = [];
  const sleeps = [];
  const schedule = createSpacedQueue(1100, { now: () => t, sleep: async (ms) => { sleeps.push(ms); t += ms; } });
  await Promise.all([1, 2, 3].map((n) => schedule(async () => { starts.push([n, t]); return n; })));
  assertEqual(starts.map((s) => s[0]), [1, 2, 3]);
  assertEqual(starts[1][1] - starts[0][1] >= 1100, true);
  assertEqual(starts[2][1] - starts[1][1] >= 1100, true);
});

asyncTest("createSpacedQueue: a failing task does not block later tasks", async () => {
  const schedule = createSpacedQueue(0, { now: () => 0, sleep: async () => {} });
  let failed = false;
  await schedule(async () => { throw new Error("boom"); }).catch(() => { failed = true; });
  const value = await schedule(async () => "ok");
  assertTrue(failed);
  assertEqual(value, "ok");
});
