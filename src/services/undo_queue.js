/**
 * Undo queue: runs a commit after a delay unless it is cancelled first (delete with "Hoàn tác").
 *   schedule(key, commit, ms)  -> commits the previous entry for `key` first, then waits ms
 *   cancel(key)                -> true when a pending commit was stopped
 *   flushAll()                 -> commits everything now (app closed or hidden)
 * Timers are injected so the logic is unit-testable.
 */
(function (root) {
  "use strict";

  const DEFAULT_UNDO_MS = 5000;

  class UndoQueue {
    /** @param {{setTimeout: Function, clearTimeout: Function}} timers */
    constructor(timers) {
      this.timers = timers;
      this.pending = new Map();
    }

    has(key) {
      return this.pending.has(key);
    }

    /** @param {string} key @param {() => void} commit @param {number} [ms] */
    schedule(key, commit, ms) {
      if (this.pending.has(key)) this.flush(key);
      const handle = this.timers.setTimeout(() => this.flush(key), ms === undefined ? DEFAULT_UNDO_MS : ms);
      this.pending.set(key, { commit: commit, handle: handle });
    }

    /** @returns {boolean} true when a pending commit was stopped */
    cancel(key) {
      const entry = this.pending.get(key);
      if (!entry) return false;
      this.timers.clearTimeout(entry.handle);
      this.pending.delete(key);
      return true;
    }

    flush(key) {
      const entry = this.pending.get(key);
      if (!entry) return;
      this.timers.clearTimeout(entry.handle);
      this.pending.delete(key);
      entry.commit();
    }

    flushAll() {
      Array.from(this.pending.keys()).forEach((key) => this.flush(key));
    }
  }

  root.UndoQueue = UndoQueue;
})(typeof window !== "undefined" ? window : this);
