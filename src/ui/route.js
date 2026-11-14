/**
 * Hash routes (spec 3.3): parseRoute(hash) -> route, buildHash(route) -> hash. Pure functions.
 *   ""/unknown -> moments, "#places" -> places/unvisited, "#places/visited", "#be", "#chat" (overlay on moments)
 */
(function (root) {
  "use strict";

  const DEFAULT_ROUTE = { view: "moments", placesFilter: "unvisited", chat: false };

  /** @param {string} hash @returns {{view: string, placesFilter: string, chat: boolean}} */
  function parseRoute(hash) {
    const value = String(hash || "").replace(/^#/, "");
    if (value === "places") return { view: "places", placesFilter: "unvisited", chat: false };
    if (value === "places/visited") return { view: "places", placesFilter: "visited", chat: false };
    if (value === "be") return { view: "be", placesFilter: "unvisited", chat: false };
    if (value === "chat") return { view: "moments", placesFilter: "unvisited", chat: true };
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
