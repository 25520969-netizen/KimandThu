/**
 * Pure helpers that keep third-party geo APIs within their usage policies (BUG-08).
 */
(function (root) {
  "use strict";

  const GEOCODE_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
  const ROUTE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const ROUTE_CACHE_DECIMALS = 3;
  const MAX_ROUTED_PLACES = 5;

  function hasCoordinates(place) {
    return place.lat != null && place.lng != null && !isNaN(place.lat) && !isNaN(place.lng);
  }

  /** A failed geocode is not retried for 24 h. */
  function canGeocode(place, now) {
    if (hasCoordinates(place)) return false;
    if (!place.name && !place.mapUrl) return false;
    return !place.geocodeFailedAt || (now - place.geocodeFailedAt) >= GEOCODE_RETRY_AFTER_MS;
  }

  function routeCacheKey(userLat, userLng, destLat, destLng) {
    const r = (v) => Number(v).toFixed(ROUTE_CACHE_DECIMALS);
    return `${r(userLat)},${r(userLng)}_${r(destLat)},${r(destLng)}`;
  }

  function isRouteFresh(cached, now) {
    return !!cached && typeof cached.savedAt === "number" && (now - cached.savedAt) < ROUTE_CACHE_TTL_MS;
  }

  /** Ids of the nearest places (by straight-line distance) that deserve a real route request. */
  function nearestPlaceIds(places, distances, limit) {
    const max = limit === undefined ? MAX_ROUTED_PLACES : limit;
    return places
      .filter((p) => hasCoordinates(p) && distances.has(p.id))
      .sort((a, b) => distances.get(a.id) - distances.get(b.id))
      .slice(0, max)
      .map((p) => p.id);
  }

  root.hasCoordinates = hasCoordinates;
  root.canGeocode = canGeocode;
  root.routeCacheKey = routeCacheKey;
  root.isRouteFresh = isRouteFresh;
  root.nearestPlaceIds = nearestPlaceIds;
})(typeof window !== "undefined" ? window : this);
