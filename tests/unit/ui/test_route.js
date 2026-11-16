// parseRoute / buildHash: hash <-> route.

test("parseRoute: empty and unknown hashes mean moments", () => {
  ["", "#", "#moments", "#nonsense", undefined].forEach((h) => {
    assertEqual(parseRoute(h), { view: "moments", placesFilter: "unvisited" });
  });
});

test("parseRoute: places, visited, be; chat is gone", () => {
  assertEqual(parseRoute("#places"), { view: "places", placesFilter: "unvisited" });
  assertEqual(parseRoute("#places/visited"), { view: "places", placesFilter: "visited" });
  assertEqual(parseRoute("#be").view, "be");
  assertEqual(parseRoute("#chat"), { view: "moments", placesFilter: "unvisited" });
});

test("buildHash: moments is a clean URL, others map to their hash", () => {
  assertEqual(buildHash({ view: "moments" }), "");
  assertEqual(buildHash({ view: "places", placesFilter: "unvisited" }), "#places");
  assertEqual(buildHash({ view: "places", placesFilter: "visited" }), "#places/visited");
  assertEqual(buildHash({ view: "be" }), "#be");
});

test("route: parseRoute(buildHash(r)) round-trips the four views", () => {
  [{ view: "moments", placesFilter: "unvisited" }, { view: "places", placesFilter: "unvisited" },
    { view: "places", placesFilter: "visited" }, { view: "be", placesFilter: "unvisited" }].forEach((r) => {
    const back = parseRoute(buildHash(r));
    assertEqual(back.view, r.view);
    assertEqual(back.placesFilter, r.placesFilter);
  });
});
