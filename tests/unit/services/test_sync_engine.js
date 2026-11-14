// BUG-03: nothing is lost offline; writes retry and are removed only after confirmation.

function makeEngine(sendImpl, clock) {
  const store = createMemoryOutboxStore();
  const confirmed = [];
  const engine = new SyncEngine({
    store: store, send: sendImpl, now: () => clock.t,
    onConfirmed: (entry) => confirmed.push(entry.key)
  });
  return { engine: engine, store: store, confirmed: confirmed };
}

asyncTest("SyncEngine: offline write survives 10 minutes and is sent when online", async () => {
  const clock = { t: 0 };
  let online = false;
  const sent = [];
  const h = makeEngine(async (payload) => {
    if (!online) throw new TypeError("network down");
    sent.push(payload.id);
    return { status: "success" };
  }, clock);
  await h.engine.enqueue("memory:m1", { type: "memory", id: "m1" });
  await h.engine.flush();
  assertEqual(h.engine.keys(), ["memory:m1"], "kept after failure");
  clock.t = 10 * 60 * 1000;
  await h.engine.flush();
  assertEqual(h.engine.keys(), ["memory:m1"], "still kept while offline");
  online = true;
  clock.t += 10 * 60 * 1000;
  await h.engine.flush();
  assertEqual(h.engine.keys(), []);
  assertEqual(sent, ["m1"]);
  assertEqual(h.confirmed, ["memory:m1"]);
});

asyncTest("SyncEngine: respects backoff between attempts", async () => {
  const clock = { t: 1000 };
  let calls = 0;
  const h = makeEngine(async () => { calls += 1; return { status: "error", retryable: true }; }, clock);
  await h.engine.enqueue("place:p1", { type: "place", id: "p1" });
  await h.engine.flush();
  await h.engine.flush();
  assertEqual(calls, 1, "second flush is before nextAttemptAt");
  clock.t += 2500;
  await h.engine.flush();
  assertEqual(calls, 2);
});

asyncTest("SyncEngine: newer write to the same record replaces the queued one", async () => {
  const clock = { t: 0 };
  const sent = [];
  const h = makeEngine(async (p) => { sent.push(p.visited); return { status: "success" }; }, clock);
  await h.engine.enqueue("place:p1", { type: "place", id: "p1", visited: false });
  await h.engine.enqueue("place:p1", { type: "place", id: "p1", visited: true });
  await h.engine.flush();
  assertEqual(sent, [true], "one POST for two edits (BUG-06)");
});

asyncTest("SyncEngine: unauthorized keeps the entry and notifies", async () => {
  const clock = { t: 0 };
  let notified = 0;
  const store = createMemoryOutboxStore();
  const engine = new SyncEngine({
    store: store, now: () => clock.t, onUnauthorized: () => { notified += 1; },
    send: async () => ({ status: "error", code: "unauthorized" })
  });
  await engine.enqueue("chat:c1", { type: "chat_message", id: "c1" });
  await engine.flush();
  assertEqual(notified, 1);
  assertEqual(engine.keys(), ["chat:c1"]);
});

asyncTest("SyncEngine: reconcile removes entries proven by a pull; load restores from store", async () => {
  const clock = { t: 0 };
  const h = makeEngine(async () => { throw new Error("blocked"); }, clock);
  await h.engine.enqueue("memory:m1", { type: "memory", id: "m1" });
  await h.engine.enqueue("memory:m2", { type: "memory", id: "m2" });
  const removed = await h.engine.reconcile({ memories: [{ id: "m1" }] });
  assertEqual(removed, ["memory:m1"]);
  const reborn = new SyncEngine({ store: h.store, send: async () => ({}) });
  await reborn.load();
  assertEqual(reborn.keys(), ["memory:m2"]);
});

asyncTest("SyncEngine: unsupported 'ignored' responses are dropped, not retried forever", async () => {
  const h = makeEngine(async () => ({ status: "ignored" }), { t: 0 });
  await h.engine.enqueue("note:n1", { type: "note", id: "n1" });
  await h.engine.flush();
  assertEqual(h.engine.keys(), []);
});

asyncTest("SyncEngine: retryNow sends a backed-off entry immediately", async () => {
  const clock = { t: 0 };
  let online = false;
  const sent = [];
  const h = makeEngine(async (payload) => {
    if (!online) throw new TypeError("network down");
    sent.push(payload.id);
    return { status: "success" };
  }, clock);
  await h.engine.enqueue("chat:c1", { type: "chat_message", id: "c1" });
  await h.engine.flush();
  assertTrue(h.engine.getEntry("chat:c1").nextAttemptAt > clock.t, "backed off");
  online = true;
  await h.engine.flush();
  assertEqual(sent, [], "not due yet");
  await h.engine.retryNow("chat:c1");
  assertEqual(sent, ["c1"]);
  assertEqual(h.engine.keys(), []);
});

asyncTest("SyncEngine: a failed attempt calls onRetry once with attempts === 1", async () => {
  const clock = { t: 0 };
  const retries = [];
  const store = createMemoryOutboxStore();
  const engine = new SyncEngine({
    store: store, send: async () => { throw new TypeError("offline"); }, now: () => clock.t,
    onRetry: (entry) => retries.push([entry.key, entry.attempts])
  });
  await engine.enqueue("chat:c1", { type: "chat_message", id: "c1" });
  await engine.flush();
  assertEqual(retries, [["chat:c1", 1]]);
});
