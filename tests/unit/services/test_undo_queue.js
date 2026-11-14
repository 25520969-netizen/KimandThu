// UndoQueue: delayed commit with cancel and flush.

function makeUndoTimers() {
  const t = { now: 0, tasks: [], nextId: 1 };
  t.setTimeout = (fn, ms) => { const id = t.nextId++; t.tasks.push({ id: id, at: t.now + ms, fn: fn }); return id; };
  t.clearTimeout = (id) => { t.tasks = t.tasks.filter((x) => x.id !== id); };
  t.advance = (ms) => {
    t.now += ms;
    t.tasks.filter((x) => x.at <= t.now).sort((a, b) => a.at - b.at).forEach((x) => {
      if (t.tasks.indexOf(x) !== -1) { t.tasks.splice(t.tasks.indexOf(x), 1); x.fn(); }
    });
  };
  return t;
}

test("UndoQueue: commits after 5000 ms", () => {
  const timers = makeUndoTimers();
  const q = new UndoQueue(timers);
  let n = 0;
  q.schedule("memory:1", () => { n += 1; });
  timers.advance(4999);
  assertEqual(n, 0);
  timers.advance(1);
  assertEqual(n, 1);
  assertEqual(q.has("memory:1"), false);
});

test("UndoQueue: cancel prevents the commit and reports whether it did", () => {
  const timers = makeUndoTimers();
  const q = new UndoQueue(timers);
  let n = 0;
  q.schedule("memory:1", () => { n += 1; });
  assertEqual(q.cancel("memory:1"), true);
  assertEqual(q.cancel("memory:1"), false);
  timers.advance(10000);
  assertEqual(n, 0);
});

test("UndoQueue: scheduling the same key commits the previous one first", () => {
  const timers = makeUndoTimers();
  const q = new UndoQueue(timers);
  const log = [];
  q.schedule("k", () => log.push("a"));
  q.schedule("k", () => log.push("b"));
  assertEqual(log, ["a"]);
  timers.advance(5000);
  assertEqual(log, ["a", "b"]);
});

test("UndoQueue: flushAll commits pending entries once", () => {
  const timers = makeUndoTimers();
  const q = new UndoQueue(timers);
  let n = 0;
  q.schedule("a", () => { n += 1; });
  q.schedule("b", () => { n += 1; });
  q.flushAll();
  assertEqual(n, 2);
  timers.advance(10000);
  assertEqual(n, 2);
});
