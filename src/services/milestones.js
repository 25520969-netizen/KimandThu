/**
 * Anniversary helpers: milestone countdown and "this day in previous years" (§4.2-D, L1).
 * All maths use whole local calendar days.
 */
(function (root) {
  "use strict";

  const MS_PER_DAY = 86400000;
  const MILESTONE_STEP_DAYS = 100;

  function dayNumber(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
  }

  function parseLocal(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Whole calendar days from `start` to `now`; null for an invalid start. */
  function daysTogether(start, now) {
    const s = parseLocal(start);
    return s ? dayNumber(now) - dayNumber(s) : null;
  }

  function nextDayMilestone(days) {
    const target = days % MILESTONE_STEP_DAYS === 0 && days > 0 ? days : (Math.floor(days / MILESTONE_STEP_DAYS) + 1) * MILESTONE_STEP_DAYS;
    return { kind: "days", label: `${target} ngày`, daysLeft: target - days };
  }

  function nextYearMilestone(startDate, now) {
    const today = dayNumber(now);
    for (let year = 1; year <= 200; year += 1) {
      const anniversary = new Date(startDate.getFullYear() + year, startDate.getMonth(), startDate.getDate());
      const left = dayNumber(anniversary) - today;
      if (left >= 0) return { kind: "year", label: `${year} năm`, daysLeft: left };
    }
    return null;
  }

  /**
   * @returns {{kind: string, label: string, daysLeft: number} | null} the nearest of the next
   *   100-day multiple and the next yearly anniversary (ties prefer the anniversary).
   */
  function nextMilestone(start, now) {
    const s = parseLocal(start);
    if (!s) return null;
    const days = daysTogether(start, now);
    if (days === null || days < 0) return null;
    const byDays = nextDayMilestone(days);
    const byYear = nextYearMilestone(s, now);
    return byYear && byYear.daysLeft <= byDays.daysLeft ? byYear : byDays;
  }

  function milestoneText(milestone) {
    if (!milestone) return "";
    if (milestone.daysLeft === 0) return `🎉 Hôm nay tròn ${milestone.label} bên nhau!`;
    return `💕 Còn ${milestone.daysLeft} ngày nữa là tròn ${milestone.label}`;
  }

  /** Memories from the same month/day in earlier years, newest year first. */
  function memoriesOnThisDay(memories, now) {
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    return (memories || [])
      .map((m) => ({ memory: m, parts: String(m.date || "").slice(0, 10).split("-").map(Number) }))
      .filter((x) => x.parts.length === 3 && x.parts[1] === month && x.parts[2] === day && x.parts[0] < year)
      .map((x) => ({ memory: x.memory, yearsAgo: year - x.parts[0] }))
      .sort((a, b) => a.yearsAgo - b.yearsAgo);
  }

  root.daysTogether = daysTogether;
  root.nextMilestone = nextMilestone;
  root.milestoneText = milestoneText;
  root.memoriesOnThisDay = memoriesOnThisDay;
})(typeof window !== "undefined" ? window : this);
