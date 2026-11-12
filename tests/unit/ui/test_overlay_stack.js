// OverlayStack: Back closes the top overlay first; closing by other means removes its history entry.

function makeHistory() {
  return { pushed: 0, backs: 0, pushState() { this.pushed += 1; }, back() { this.backs += 1; } };
}

test("OverlayStack: Back closes the top overlay and is consumed", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  const closed = [];
  stack.open("chat", () => closed.push("chat"));
  stack.open("sheet", () => closed.push("sheet"));
  assertEqual(h.pushed, 2);
  assertEqual(stack.handlePop(), true);
  assertEqual(closed, ["sheet"]);
  assertEqual(stack.handlePop(), true);
  assertEqual(closed, ["sheet", "chat"]);
  assertEqual(stack.handlePop(), false);
});

test("OverlayStack: closing another way steps history back once and swallows that pop", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  stack.open("sheet", () => {});
  stack.closed("sheet");
  assertEqual(h.backs, 1);
  assertEqual(stack.size, 0);
  assertEqual(stack.handlePop(), true);
  assertEqual(stack.handlePop(), false);
});

test("OverlayStack: the same overlay is never pushed twice", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  stack.open("chat", () => {});
  stack.open("chat", () => {});
  assertEqual(h.pushed, 1);
  stack.closed("nothing");
  assertEqual(h.backs, 0);
});
