/**
 * Period history and prediction windows (§4.2-C of the plan, L2/L3).
 * Real cycles vary, so predictions come from the mean of the last recorded
 * cycles and are shown as a window, never as one exact date.
 */
(function (root) {
  "use strict";

  const MS_PER_DAY = 86400000;
  const MIN_PLAUSIBLE_CYCLE = 15;
  const MAX_PLAUSIBLE_CYCLE = 60;
  const MAX_INTERVALS_USED = 6;
  const DEFAULT_WINDOW_DAYS = 2;
  const MAX_WINDOW_DAYS = 4;
  const MAX_LOG_ENTRIES = 12;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  function toDayNumber(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
  }

  function fromDayNumber(n) {
    const t = new Date(n * MS_PER_DAY);
    const pad = (v) => String(v).padStart(2, "0");
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }

  function isValidIso(value) {
    if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
    return fromDayNumber(toDayNumber(value)) === value;
  }

  /** @returns {Array<string>} sorted, de-duplicated, valid "YYYY-MM-DD" dates. */
  function normalizeHistory(list) {
    const unique = Array.from(new Set((list || []).filter(isValidIso)));
    return unique.sort();
  }

  function addPeriodStart(history, iso) {
    return normalizeHistory((history || []).concat(isValidIso(iso) ? [iso] : []));
  }

  function addDays(iso, days) {
    return fromDayNumber(toDayNumber(iso) + days);
  }

  /** Days between consecutive recorded starts, ignoring implausible gaps (missed logs / typos). */
  function cycleIntervals(history) {
    const sorted = normalizeHistory(history);
    const out = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = toDayNumber(sorted[i]) - toDayNumber(sorted[i - 1]);
      if (gap >= MIN_PLAUSIBLE_CYCLE && gap <= MAX_PLAUSIBLE_CYCLE) out.push(gap);
    }
    return out;
  }

  /**
   * @param {Array<string>} history Recorded period start dates.
   * @param {number} fallbackLength Cycle length to use until there is data.
   * @returns {{cycleLength: number, windowDays: number, basedOn: number}}
   */
  function predictCycle(history, fallbackLength) {
    const used = cycleIntervals(history).slice(-MAX_INTERVALS_USED);
    const fallback = Math.max(1, Math.round(Number(fallbackLength) || 28));
    if (used.length === 0) return { cycleLength: fallback, windowDays: DEFAULT_WINDOW_DAYS, basedOn: 0 };
    const mean = used.reduce((a, b) => a + b, 0) / used.length;
    let windowDays = DEFAULT_WINDOW_DAYS;
    if (used.length >= 3) {
      const variance = used.reduce((a, b) => a + (b - mean) * (b - mean), 0) / used.length;
      windowDays = Math.min(MAX_WINDOW_DAYS, Math.max(1, Math.ceil(Math.sqrt(variance))));
    }
    return { cycleLength: Math.round(mean), windowDays: windowDays, basedOn: used.length };
  }

  /** Window around the next expected start after `lastStartIso`. */
  function predictionWindow(lastStartIso, cycleLength, windowDays) {
    const center = addDays(lastStartIso, cycleLength);
    return { center: center, from: addDays(center, -windowDays), to: addDays(center, windowDays) };
  }

  function inWindow(window, iso) {
    return iso >= window.from && iso <= window.to;
  }

  /**
   * Was the prediction made from `history` correct for the start that was actually logged?
   * @returns {{from: string, to: string, actual: string, hit: boolean} | null} null when there was nothing to predict from.
   */
  function evaluatePrediction(history, fallbackLength, actualIso) {
    const sorted = normalizeHistory(history).filter((d) => d < actualIso);
    if (sorted.length === 0 || !isValidIso(actualIso)) return null;
    const p = predictCycle(sorted, fallbackLength);
    const win = predictionWindow(sorted[sorted.length - 1], p.cycleLength, p.windowDays);
    return { from: win.from, to: win.to, actual: actualIso, hit: inWindow(win, actualIso) };
  }

  function appendPredictionLog(log, entry) {
    return (log || []).concat(entry ? [entry] : []).slice(-MAX_LOG_ENTRIES);
  }

  function accuracySummary(log) {
    const entries = log || [];
    return { hits: entries.filter((e) => e.hit).length, total: entries.length };
  }

  root.normalizeHistory = normalizeHistory;
  root.addPeriodStart = addPeriodStart;
  root.cycleIntervals = cycleIntervals;
  root.predictCycle = predictCycle;
  root.predictionWindow = predictionWindow;
  root.evaluatePrediction = evaluatePrediction;
  root.appendPredictionLog = appendPredictionLog;
  root.accuracySummary = accuracySummary;
})(typeof window !== "undefined" ? window : this);
