/**
 * vi-VN formatters (spec 6): 24 h time, dd/mm/yyyy dates, month labels, comma-decimal distances.
 * Written by hand because the jsc test shell lacks full ICU.
 */
(function (root) {
  "use strict";

  const METERS_PER_KM = 1000;
  const MS_PER_DAY = 86400000;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function toDate(value) {
    if (value instanceof Date) return value;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(value);
  }

  /** @param {Date} date @returns {string} e.g. "17:09" */
  function formatTime24(date) {
    return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  /** @param {Date|string} value @returns {string} e.g. "25/10/2026" */
  function formatDateVi(value) {
    const d = toDate(value);
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  /** @param {Date|string} value @returns {string} e.g. "25/10" */
  function formatDayMonth(value) {
    const d = toDate(value);
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1);
  }

  /** @param {string} yearMonth "YYYY-MM" @returns {string} e.g. "Tháng 10, 2026" */
  function formatMonthLabel(yearMonth) {
    const parts = String(yearMonth).split("-");
    return "Tháng " + Number(parts[1]) + ", " + parts[0];
  }

  /**
   * @param {number} km
   * @param {{approx?: boolean}} [opts]
   * @returns {string} "850 m", "3,2 km", "≈ 3,2 km"; "" for invalid input
   */
  function formatDistanceVi(km, opts) {
    if (typeof km !== "number" || !Number.isFinite(km)) return "";
    const meters = Math.round(km * METERS_PER_KM);
    const text = meters < METERS_PER_KM
      ? meters + " m"
      : (Math.round(km * 10) / 10).toFixed(1).replace(".", ",") + " km";
    return opts && opts.approx ? "≈ " + text : text;
  }

  function dayNumber(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  }

  /** @returns {string} "Hôm nay" | "Hôm qua" | "dd/mm/yyyy" */
  function formatDaySeparator(date, now) {
    const diff = dayNumber(now) - dayNumber(date);
    if (diff === 0) return "Hôm nay";
    if (diff === 1) return "Hôm qua";
    return formatDateVi(date);
  }

  root.formatTime24 = formatTime24;
  root.formatDateVi = formatDateVi;
  root.formatDayMonth = formatDayMonth;
  root.formatMonthLabel = formatMonthLabel;
  root.formatDistanceVi = formatDistanceVi;
  root.formatDaySeparator = formatDaySeparator;
})(typeof window !== "undefined" ? window : this);
