// layoutMessages: day separators, groups, states.

const CL_NOW = new Date(2026, 10, 14, 12, 0);
const clMsg = (id, sender, h, m, day) => ({ id: id, sender: sender, text: id, timestamp: new Date(2026, 10, day || 14, h, m).toISOString() });
const clCtx = (extra) => Object.assign({ me: "Kim", now: CL_NOW, pendingKeys: new Set(), failedKeys: new Set() }, extra || {});

test("layoutMessages: a day separator before each local day", () => {
  const items = layoutMessages([clMsg("a", "Kim", 9, 0, 13), clMsg("b", "Thư", 9, 1, 13), clMsg("c", "Kim", 8, 0, 14)], clCtx());
  assertEqual(items.filter((i) => i.kind === "day").map((i) => i.label), ["Hôm qua", "Hôm nay"]);
  assertEqual(items[0].kind, "day");
});

test("layoutMessages: same sender within 5 minutes groups; time only on the last", () => {
  const items = layoutMessages([clMsg("a", "Kim", 9, 0), clMsg("b", "Kim", 9, 3), clMsg("c", "Kim", 9, 10), clMsg("d", "Thư", 9, 11)], clCtx())
    .filter((i) => i.kind === "msg");
  assertEqual(items.map((i) => [i.groupStart, i.groupEnd, i.showTime]), [
    [true, false, false], [false, true, true], [true, true, true], [true, true, true]
  ]);
  assertEqual(items.map((i) => i.own), [true, true, true, false]);
});

test("layoutMessages: states come from the outbox keys", () => {
  const items = layoutMessages([clMsg("a", "Kim", 9, 0), clMsg("b", "Kim", 10, 0), clMsg("c", "Kim", 11, 0)],
    clCtx({ pendingKeys: new Set(["chat:b", "chat:c"]), failedKeys: new Set(["chat:c"]) })).filter((i) => i.kind === "msg");
  assertEqual(items.map((i) => i.state), ["sent", "sending", "failed"]);
});
