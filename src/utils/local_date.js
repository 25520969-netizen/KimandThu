/**
 * Local-calendar date helpers (BUG-04).
 * `Date.prototype.toISOString()` is UTC, so between 00:00 and 06:59 in
 * Vietnam (UTC+7) it returns yesterday. These helpers use the local calendar.
 */
(function (root) {
  "use strict";

  /**
   * @param {Date} date
   * @returns {string} "YYYY-MM-DD" in the local time zone.
   */
  function formatLocalDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  root.formatLocalDate = formatLocalDate;
})(typeof window !== "undefined" ? window : this);
