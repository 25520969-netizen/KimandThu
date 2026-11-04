// BUG-03 / DATA-01: delta merge never drops data and respects tombstones.

const m = (id, extra) => Object.assign({ id: id, title: `t-${id}` }, extra || {});

test("applyDelta: absence from a delta never deletes local items", () => {
  const r = applyDelta([m("a"), m("b")], { upserts: [], deletedIds: [] });
  assertEqual(r.items.map((x) => x.id), ["a", "b"]);
  assertEqual(r.changed, false);
});

test("applyDelta: new server items are appended, existing ones updated", () => {
  const r = applyDelta([m("a")], { upserts: [m("a", { title: "new" }), m("c")], deletedIds: [] });
  assertEqual(r.items.map((x) => `${x.id}:${x.title}`), ["a:new", "c:t-c"]);
  assertTrue(r.changed);
});

test("applyDelta: pending local items are not overwritten or deleted", () => {
  const local = [m("a", { title: "mine", syncState: "pending" })];
  const r = applyDelta(local, { upserts: [m("a", { title: "server" })], deletedIds: [] }, { pendingIds: ["a"] });
  assertEqual(r.items[0].title, "mine");
  const r2 = applyDelta(local, { upserts: [], deletedIds: ["a"] }, { pendingIds: ["a"] });
  assertEqual(r2.items.length, 1);
});

test("applyDelta: server tombstones remove items", () => {
  const r = applyDelta([m("a"), m("b")], { upserts: [], deletedIds: ["a"] });
  assertEqual(r.items.map((x) => x.id), ["b"]);
});

test("applyDelta: local tombstones block resurrection from the server", () => {
  const r = applyDelta([], { upserts: [m("a")], deletedIds: [] }, { tombstones: ["a"] });
  assertEqual(r.items.length, 0);
});

test("applyDelta: empty server values do not erase listed local fields; syncState cleared", () => {
  const local = [m("a", { lat: 10.5, image: "https://x/y", syncState: "pending" })];
  const r = applyDelta(local, { upserts: [m("a", { lat: null, image: "" })], deletedIds: [] }, { keepLocalWhenEmpty: ["lat", "image"] });
  assertEqual(r.items[0].lat, 10.5);
  assertEqual(r.items[0].image, "https://x/y");
  assertEqual(r.items[0].syncState, undefined);
});

test("applyDelta: numeric and string ids are treated alike; duplicates collapse", () => {
  const r = applyDelta([m(1)], { upserts: [m("1", { title: "s" })], deletedIds: [] });
  assertEqual(r.items.length, 1);
  assertEqual(r.items[0].title, "s");
});

test("findUnsyncedLocal: returns only items the server has never seen", () => {
  const local = [m("mem-1"), m("a"), m("b"), m("c"), m("d")];
  const out = findUnsyncedLocal(local, [m("a")], ["b"], { defaultIds: ["mem-1"], pendingIds: ["c"] });
  assertEqual(out.map((x) => x.id), ["d"]);
});
