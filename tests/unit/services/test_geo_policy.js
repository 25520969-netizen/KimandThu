const HOUR = 3600 * 1000;

test("canGeocode: skips places with coordinates or nothing to search", () => {
  assertEqual(canGeocode({ lat: 1, lng: 2, name: "x" }, 0), false);
  assertEqual(canGeocode({ name: "", mapUrl: "" }, 0), false);
  assertTrue(canGeocode({ name: "Hồ Con Rùa" }, 0));
});

test("canGeocode: a failed lookup is not retried for 24 hours", () => {
  const p = { name: "x", geocodeFailedAt: 1000 };
  assertEqual(canGeocode(p, 1000 + 23 * HOUR), false);
  assertTrue(canGeocode(p, 1000 + 24 * HOUR));
});

test("routeCacheKey: rounds nearby positions to the same key", () => {
  assertEqual(routeCacheKey(10.77701, 106.70011, 10.7821, 106.6959), routeCacheKey(10.77704, 106.70014, 10.7821, 106.6959));
  assertEqual(routeCacheKey(10.7, 106.7, 10.8, 106.6), "10.700,106.700_10.800,106.600");
});

test("isRouteFresh: 7 day TTL, rejects junk", () => {
  assertTrue(isRouteFresh({ savedAt: 0 }, 6 * 24 * HOUR));
  assertEqual(isRouteFresh({ savedAt: 0 }, 8 * 24 * HOUR), false);
  assertEqual(isRouteFresh(undefined, 0), false);
  assertEqual(isRouteFresh({}, 0), false);
});

test("nearestPlaceIds: only the nearest N places with coordinates", () => {
  const places = [1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: `p${i}`, lat: 1, lng: 1 }));
  places.push({ id: "nocoord" });
  const d = new Map(places.filter((p) => p.lat).map((p, i) => [p.id, 10 - i]));
  assertEqual(nearestPlaceIds(places, d), ["p7", "p6", "p5", "p4", "p3"]);
  assertEqual(nearestPlaceIds(places, d, 2), ["p7", "p6"]);
  assertEqual(nearestPlaceIds([], new Map()), []);
});
