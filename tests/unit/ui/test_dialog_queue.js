// DialogQueue: one dialog at a time, by priority, with a gap after each close.

function makeTimers() {
  const timers = { now: 0, tasks: [] };
  timers.setTimeout = (fn, ms) => { timers.tasks.push({ at: timers.now + ms, fn: fn }); };
  timers.advance = (ms) => {
    timers.now += ms;
    let ran = true;
    while (ran) {
      ran = false;
      timers.tasks.sort((a, b) => a.at - b.at);
      if (timers.tasks.length && timers.tasks[0].at <= timers.now) {
        timers.tasks.shift().fn();
        ran = true;
      }
    }
  };
  return timers;
}

function makeDialog() {
  const listeners = [];
  return {
    open: false,
    addEventListener(type, fn) { if (type === "close") listeners.push(fn); },
    close() { this.open = false; listeners.splice(0).forEach((fn) => fn()); }
  };
}

test("DialogQueue: two requests in one tick show priority 1 first", () => {
  const timers = makeTimers();
  const queue = new DialogQueue({ setTimeout: timers.setTimeout, gapMs: 300 });
  const shown = [];
  const first = makeDialog();
  queue.request("period", 2, () => { shown.push("period"); return makeDialog(); });
  queue.request("who", 1, () => { shown.push("who"); first.open = true; return first; });
  assertEqual(shown, []);
  timers.advance(0);
  assertEqual(shown, ["who"]);
  assertEqual(queue.activeId, "who");
});

test("DialogQueue: the next dialog waits for close and the 300 ms gap", () => {
  const timers = makeTimers();
  const queue = new DialogQueue({ setTimeout: timers.setTimeout, gapMs: 300 });
  const shown = [];
  const first = makeDialog();
  queue.request("who", 1, () => { shown.push("who"); return first; });
  queue.request("period", 2, () => { shown.push("period"); return makeDialog(); });
  timers.advance(0);
  timers.advance(1000);
  assertEqual(shown, ["who"]);
  first.close();
  timers.advance(299);
  assertEqual(shown, ["who"]);
  timers.advance(1);
  assertEqual(shown, ["who", "period"]);
  assertEqual(queue.activeId, "period");
});

test("DialogQueue: duplicate ids are ignored", () => {
  const timers = makeTimers();
  const queue = new DialogQueue({ setTimeout: timers.setTimeout });
  let calls = 0;
  const show = () => { calls += 1; return makeDialog(); };
  queue.request("a", 1, show);
  queue.request("a", 1, show);
  timers.advance(0);
  queue.request("a", 1, show);
  timers.advance(0);
  assertEqual(calls, 1);
});

test("DialogQueue: show() returning null moves on to the next request", () => {
  const timers = makeTimers();
  const queue = new DialogQueue({ setTimeout: timers.setTimeout });
  const shown = [];
  queue.request("skip", 1, () => { shown.push("skip"); return null; });
  queue.request("real", 2, () => { shown.push("real"); return makeDialog(); });
  timers.advance(0);
  assertEqual(shown, ["skip", "real"]);
  assertEqual(queue.activeId, "real");
});
