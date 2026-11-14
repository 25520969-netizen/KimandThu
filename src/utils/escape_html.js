/** escapeHtml(value): HTML-escapes the five special characters; null/undefined become "". */
(function (root) {
  "use strict";

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };

  /** @param {*} value @returns {string} */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>'"]/g, (ch) => ESCAPES[ch]);
  }

  root.escapeHtml = escapeHtml;
})(typeof window !== "undefined" ? window : this);
