/**
 * Hash routes (spec 3.3): parseRoute(hash) -> route, buildHash(route) -> hash. Pure functions.
 *   ""/unknown -> moments, "#places" -> places/unvisited, "#places/visited", "#be"; anything else (including "#chat") -> moments
 */
(function (root) {
  "use strict";

  const DEFAULT_ROUTE = { view: "moments", placesFilter: "unvisited" };

  /** @param {string} hash @returns {{view: string, placesFilter: string}} */
  function parseRoute(hash) {
    const value = String(hash || "").replace(/^#/, "");
    if (value === "places") return { view: "places", placesFilter: "unvisited" };
    if (value === "places/visited") return { view: "places", placesFilter: "visited" };
    if (value === "be") return { view: "be", placesFilter: "unvisited" };
    return Object.assign({}, DEFAULT_ROUTE);
  }

  /** @param {{view: string, placesFilter?: string}} route @returns {string} */
  function buildHash(route) {
    if (route.view === "places") return route.placesFilter === "visited" ? "#places/visited" : "#places";
    if (route.view === "be") return "#be";
    return "";
  }

  root.parseRoute = parseRoute;
  root.buildHash = buildHash;
})(typeof window !== "undefined" ? window : this);
