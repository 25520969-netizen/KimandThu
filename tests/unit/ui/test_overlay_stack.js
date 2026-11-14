// OverlayStack: Back closes the top overlay first; closing by other means removes its history entry.

function makeHistory() {
  return {
    pushed: 0, backs: 0, urls: [],
    pushState(state, title, url) { this.pushed += 1; this.urls.push(url); },
    back() { this.backs += 1; }
  };
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

test("OverlayStack: open with a url pushes that url", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  stack.open("chat", () => {}, "#chat");
  assertEqual(h.urls[0], "#chat");
  stack.open("sheet", () => {});
  assertEqual(h.urls[1], undefined);
});

test("OverlayStack: has() reports registered tokens", () => {
  const stack = new OverlayStack(makeHistory());
  assertEqual(stack.has("sheet"), false);
  stack.open("sheet", () => {});
  assertEqual(stack.has("sheet"), true);
});

test("OverlayStack: a veto during Back re-registers the sheet", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  stack.open("sheet", () => { stack.open("sheet", () => {}); });
  assertEqual(stack.handlePop(), true);
  assertEqual(stack.size, 1);
  assertEqual(h.pushed, 2);
});

test("OverlayStack: open while a back is pending defers pushState", () => {
  const h = makeHistory();
  const stack = new OverlayStack(h);
  stack.open("confirm", () => {});
  stack.closed("confirm");
  assertEqual(stack.pendingBacks, 1);
  const before = h.pushed;
  stack.open("sheet", () => {});
  assertEqual(h.pushed, before);
  assertEqual(stack.handlePop(), true);
  assertEqual(h.pushed, before + 1);
  assertEqual(stack.handlePop(), true);
  assertEqual(stack.size, 0);
});
