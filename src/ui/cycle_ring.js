/**
 * Cycle ring (spec 4.6): cycleRingModel() turns the cycle state into degrees and Vietnamese text, and
 * cycleRingSvg() draws it with theme tokens. Pure functions; no DOM access.
 */
(function (root) {
  "use strict";

  const MS_PER_DAY = 86400000;
  const FULL_TURN_DEG = 360;
  const SOON_DAYS = 3;
  const SVG_STROKE_PX = 14;

  function dayNumber(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  }

  function rangeText(from, to) {
    if (from.getMonth() === to.getMonth()) return `từ ${from.getDate()} đến ${to.getDate()} tháng ${to.getMonth() + 1}`;
    return `từ ${from.getDate()}/${from.getMonth() + 1} đến ${to.getDate()}/${to.getMonth() + 1}`;
  }

  function norm(deg) {
    return ((deg % FULL_TURN_DEG) + FULL_TURN_DEG) % FULL_TURN_DEG;
  }

  /**
   * @param {{cycle: ({isDuring: boolean, periodDay: number, daysUntilNext: number, windowStart: Date, windowEnd: Date}|null),
   *   cycleLength: number, durationDays: number, today: Date}} input
   */
  function cycleRingModel(input) {
    const cycle = input.cycle;
    if (!cycle) {
      return { phase: "none", dayInCycle: 0, arcs: { period: [0, 0], window: [0, 0] }, todayDeg: 0, title: "", subtitle: "", summary: "", phaseLine: "" };
    }
    const length = Math.max(1, input.cycleLength);
    const perDay = FULL_TURN_DEG / length;
    const todayIndex = cycle.isDuring ? cycle.periodDay - 1 : norm((length - cycle.daysUntilNext) * perDay) / perDay;
    const today = dayNumber(input.today);
    const winFrom = (todayIndex + dayNumber(cycle.windowStart) - today) * perDay;
    const winTo = (todayIndex + dayNumber(cycle.windowEnd) - today) * perDay;
    const insideWindow = today >= dayNumber(cycle.windowStart) && today <= dayNumber(cycle.windowEnd);
    const window = rangeText(cycle.windowStart, cycle.windowEnd);

    let phase = "before";
    if (cycle.isDuring) phase = "during";
    else if (cycle.daysUntilNext <= SOON_DAYS || insideWindow) phase = "soon";

    const texts = {
      during: ["Ngày " + cycle.periodDay, "của kỳ", `Hôm nay là ngày ${cycle.periodDay} của kỳ, dự kiến kỳ tới ${window}.`,
        `Đang trong kỳ · ngày ${cycle.periodDay}/${input.durationDays}`],
      soon: ["Sắp đến kỳ", "trong vài ngày tới", `Có thể đến kỳ trong vài ngày tới, dự kiến ${window}.`, "Có thể đến kỳ trong vài ngày tới"],
      before: [`Còn ${cycle.daysUntilNext} ngày`, "đến kỳ", `Còn ${cycle.daysUntilNext} ngày đến kỳ, dự kiến ${window}.`,
        `Còn ${cycle.daysUntilNext} ngày đến kỳ`]
    }[phase];
    return {
      phase: phase,
      dayInCycle: Math.floor(todayIndex) + 1,
      arcs: { period: [0, input.durationDays * perDay], window: [norm(winFrom), norm(winFrom) + (winTo - winFrom)] },
      todayDeg: norm((todayIndex + 0.5) * perDay),
      title: texts[0], subtitle: texts[1], summary: texts[2], phaseLine: texts[3]
    };
  }

  function point(center, radius, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [center + radius * Math.cos(rad), center + radius * Math.sin(rad)];
  }

  function arcPath(center, radius, fromDeg, toDeg) {
    const span = Math.min(toDeg - fromDeg, FULL_TURN_DEG - 0.01);
    if (span <= 0) return "";
    const [x1, y1] = point(center, radius, fromDeg);
    const [x2, y2] = point(center, radius, fromDeg + span);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${span > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  /** @param {object} model from cycleRingModel @param {{size?: number}} [opts] @returns {string} */
  function cycleRingSvg(model, opts) {
    const size = (opts && opts.size) || 200;
    const center = size / 2;
    const radius = center - SVG_STROKE_PX;
    const esc = root.escapeHtml;
    const dot = point(center, radius, model.todayDeg);
    const stroke = (color, extra) => `fill="none" stroke="${color}" stroke-width="${SVG_STROKE_PX}" ${extra || ""}`;
    return `<svg class="cycle-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(model.summary)}">` +
      `<circle cx="${center}" cy="${center}" r="${radius}" ${stroke("var(--c-primary-soft)")}/>` +
      `<path d="${arcPath(center, radius, model.arcs.window[0], model.arcs.window[1])}" ${stroke("var(--c-primary)", 'stroke-dasharray="4 4"')}/>` +
      `<path d="${arcPath(center, radius, model.arcs.period[0], model.arcs.period[1])}" ${stroke("var(--c-primary)", 'stroke-linecap="round"')}/>` +
      `<circle cx="${dot[0].toFixed(2)}" cy="${dot[1].toFixed(2)}" r="6" fill="var(--c-surface)" stroke="var(--c-primary)" stroke-width="3"/>` +
      `<text x="${center}" y="${center - 2}" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="26" fill="var(--c-text)">${esc(model.title)}</text>` +
      `<text x="${center}" y="${center + 20}" text-anchor="middle" font-size="13" fill="var(--c-muted)">${esc(model.subtitle)}</text></svg>`;
  }

  root.cycleRingModel = cycleRingModel;
  root.cycleRingSvg = cycleRingSvg;
})(typeof window !== "undefined" ? window : this);
