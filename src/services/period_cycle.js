/**
 * Pure period-cycle calculation (BUG-01, BUG-02, CODE-01).
 * Works on whole local calendar days so DST and time of day never matter.
 */
(function (root) {
  "use strict";

  const MS_PER_DAY = 86400000;
  const DEFAULT_CYCLE_LENGTH = 28;
  const DEFAULT_DURATION_DAYS = 5;

  function dayNumber(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  }

  function localDateFromDayNumber(n) {
    const utc = new Date(n * MS_PER_DAY);
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }

  function parseStartDate(startISO) {
    const parts = String(startISO || "").slice(0, 10).split("-").map(Number);
    if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p))) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function positiveIntOr(value, fallback) {
    const n = Math.floor(Number(value));
    return n >= 1 ? n : fallback;
  }

  /**
   * @param {string} startISO First day of a known period, "YYYY-MM-DD".
   * @param {number} cycleLength Days from one period start to the next.
   * @param {number} durationDays Length of the period in days.
   * @param {Date} today Any moment of the day to evaluate.
   * @returns {{isDuring: boolean, periodDay: number, nextStart: Date, daysUntilNext: number} | null}
   *   null when startISO is not a valid date. `periodDay` is 1-based and only
   *   meaningful when `isDuring` is true; `nextStart` is the next period start
   *   strictly after the current one (or the recorded start if it is in the future).
   */
  function computeCycle(startISO, cycleLength, durationDays, today) {
    const start = parseStartDate(startISO);
    if (!start) return null;

    const cycle = positiveIntOr(cycleLength, DEFAULT_CYCLE_LENGTH);
    const duration = positiveIntOr(durationDays, DEFAULT_DURATION_DAYS);
    const startDay = dayNumber(start);
    const todayDay = dayNumber(today);

    if (todayDay < startDay) {
      return { isDuring: false, periodDay: 1, nextStart: localDateFromDayNumber(startDay), daysUntilNext: startDay - todayDay };
    }

    const cyclesElapsed = Math.floor((todayDay - startDay) / cycle);
    const currentStartDay = startDay + cyclesElapsed * cycle;
    const dayIndex = todayDay - currentStartDay;
    const nextStartDay = currentStartDay + cycle;

    return {
      isDuring: dayIndex < duration,
      periodDay: dayIndex + 1,
      nextStart: localDateFromDayNumber(nextStartDay),
      daysUntilNext: nextStartDay - todayDay
    };
  }

  root.computeCycle = computeCycle;
})(typeof window !== "undefined" ? window : this);
