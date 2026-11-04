test("outboxKey: one key per record, writes to the same record coalesce", () => {
  assertEqual(outboxKey({ type: "place", id: "p1" }), "place:p1");
  assertEqual(outboxKey({ type: "toggle_place", id: "p1" }), "place:p1");
  assertEqual(outboxKey({ type: "delete_place", id: "p1" }), "place:p1");
  assertEqual(outboxKey({ type: "memory", id: "m1" }), "memory:m1");
  assertEqual(outboxKey({ type: "chat_message", id: "c1" }), "chat:c1");
  assertEqual(outboxKey({ type: "period" }), "period");
});

test("outboxKey: unsupported type throws", () => {
  assertThrows(() => outboxKey({ type: "nope", id: 1 }));
  assertThrows(() => outboxKey(null));
});

test("backoffMs: exponential with a 5 minute cap", () => {
  assertEqual([0, 1, 2, 3].map(backoffMs), [2000, 4000, 8000, 16000]);
  assertEqual(backoffMs(50), 300000);
  assertEqual(backoffMs(-3), 2000);
  assertEqual(backoffMs("x"), 2000);
});

test("isDue: no schedule or past schedule is due", () => {
  assertTrue(isDue({}, 100));
  assertTrue(isDue({ nextAttemptAt: 50 }, 100));
  assertEqual(isDue({ nextAttemptAt: 150 }, 100), false);
});

test("pollIntervalMs: hidden pauses, guest slow, idle >= 30 s, active faster", () => {
  const base = { visible: true, isAuth: true, chatOpen: false, lastActivityAt: 0, now: 10 * 60 * 1000 };
  assertEqual(pollIntervalMs(Object.assign({}, base, { visible: false })), null);
  assertEqual(pollIntervalMs(Object.assign({}, base, { isAuth: false })), 60000);
  assertEqual(pollIntervalMs(base), 30000);
  assertEqual(pollIntervalMs(Object.assign({}, base, { chatOpen: true })), 8000);
  assertEqual(pollIntervalMs(Object.assign({}, base, { lastActivityAt: base.now - 1000 })), 8000);
});

test("isConfirmedByServer: upserts, deletes, period", () => {
  const pulled = { memories: [{ id: "m1" }], places: [{ id: "p1" }], messages: [{ id: "c1" }],
    deleted: { memories: ["m2"], places: ["p2"] }, period: { updatedAt: 200 } };
  const e = (payload) => ({ payload: payload });
  assertTrue(isConfirmedByServer(e({ type: "memory", id: "m1" }), pulled));
  assertTrue(isConfirmedByServer(e({ type: "place", id: "p1" }), pulled));
  assertTrue(isConfirmedByServer(e({ type: "chat_message", id: "c1" }), pulled));
  assertTrue(isConfirmedByServer(e({ type: "delete_memory", id: "m2" }), pulled));
  assertTrue(isConfirmedByServer(e({ type: "delete_place", id: "p2" }), pulled));
  assertTrue(isConfirmedByServer(e({ type: "period", updatedAt: 100 }), pulled));
  assertEqual(isConfirmedByServer(e({ type: "period", updatedAt: 300 }), pulled), false);
  assertEqual(isConfirmedByServer(e({ type: "memory", id: "nope" }), pulled), false);
  assertEqual(isConfirmedByServer(e({ type: "place", id: "p1" }), {}), false);
});
