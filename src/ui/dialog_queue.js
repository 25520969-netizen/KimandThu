/**
 * Dialog queue (spec 4.7): at most one requested dialog is open at a time, shown in priority order
 * (lower number first) with a gap after each close. Pure logic: timers are injected for tests.
 *
 * request(id, priority, show) -> queue a dialog; show() opens it and returns the dialog (or null to skip)
 * activeId                    -> id of the dialog currently open through the queue, or null
 */
(function (root) {
  "use strict";

  const DEFAULT_GAP_MS = 300;

  class DialogQueue {
    /** @param {{setTimeout: Function, gapMs?: number}} options */
    constructor(options) {
      this.setTimeout = options.setTimeout;
      this.gapMs = options.gapMs === undefined ? DEFAULT_GAP_MS : options.gapMs;
      this.pending = [];
      this.active = null;
      this.drainScheduled = false;
    }

    get activeId() {
      return this.active;
    }

    /**
     * @param {string} id
     * @param {number} priority
     * @param {() => (HTMLDialogElement|null)} show
     */
    request(id, priority, show) {
      if (this.active === id || this.pending.some((item) => item.id === id)) return;
      this.pending.push({ id: id, priority: priority, show: show, order: this.pending.length });
      this.scheduleDrain(0);
    }

    scheduleDrain(delayMs) {
      if (this.drainScheduled || this.active !== null) return;
      this.drainScheduled = true;
      this.setTimeout(() => {
        this.drainScheduled = false;
        this.showNext();
      }, delayMs);
    }

    showNext() {
      if (this.active !== null) return;
      while (this.pending.length > 0) {
        this.pending.sort((a, b) => a.priority - b.priority || a.order - b.order);
        const item = this.pending.shift();
        const dialog = item.show();
        if (!dialog) continue;
        this.active = item.id;
        dialog.addEventListener("close", () => this.onClosed(), { once: true });
        return;
      }
    }

    onClosed() {
      this.setTimeout(() => {
        this.active = null;
        this.showNext();
      }, this.gapMs);
    }
  }

  root.DialogQueue = DialogQueue;
})(typeof window !== "undefined" ? window : this);
