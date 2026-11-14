/**
 * Outbox sync engine (BUG-03, BUG-06, BUG-11).
 * Writes are queued durably (one entry per record key), retried with backoff
 * and removed only after the server confirms. Because the backend upserts by
 * id, retrying is always safe. Nothing is ever dropped for being "too old".
 */
(function (root) {
  "use strict";

  class SyncEngine {
    /**
     * @param {{store: Object, send: function(Object): Promise<Object>, now?: function(): number,
     *   onConfirmed?: function(Object, Object): void, onUnauthorized?: function(): void,
     *   onChange?: function(): void, onRetry?: function(Object): void}} deps
     */
    constructor(deps) {
      this.store = deps.store;
      this.send = deps.send;
      this.now = deps.now || Date.now;
      this.onConfirmed = deps.onConfirmed || function () {};
      this.onUnauthorized = deps.onUnauthorized || function () {};
      this.onChange = deps.onChange || function () {};
      this.onRetry = deps.onRetry || function () {};
      this.entries = new Map();
      this.flushing = false;
    }

    async load() {
      const stored = await this.store.getAll();
      stored.forEach((entry) => this.entries.set(entry.key, entry));
      this.onChange();
    }

    keys() {
      return Array.from(this.entries.keys());
    }

    getEntry(key) {
      return this.entries.get(key) || null;
    }

    /** Adds or replaces the queued write for `key`. Throws if it cannot be persisted. */
    async enqueue(key, payload) {
      const entry = { key: key, payload: payload, attempts: 0, nextAttemptAt: 0, createdAt: this.now() };
      await this.store.put(entry);
      this.entries.set(key, entry);
      this.onChange();
    }

    async remove(key) {
      this.entries.delete(key);
      await this.store.remove(key);
      this.onChange();
    }

    /** Makes one queued write due immediately and flushes (the "Thử lại" button). */
    async retryNow(key) {
      const entry = this.entries.get(key);
      if (!entry) return;
      entry.nextAttemptAt = 0;
      await this.store.put(entry);
      await this.flush();
    }

    /** Sends every due entry once, oldest first. Safe to call repeatedly. */
    async flush() {
      if (this.flushing) return;
      this.flushing = true;
      try {
        const due = Array.from(this.entries.values())
          .filter((e) => !e.nextAttemptAt || e.nextAttemptAt <= this.now())
          .sort((a, b) => a.createdAt - b.createdAt);
        for (const entry of due) {
          await this.attempt(entry);
        }
      } finally {
        this.flushing = false;
      }
    }

    async attempt(entry) {
      let result = null;
      try {
        result = await this.send(entry.payload);
      } catch (err) {
        console.warn(`Gửi ${entry.key} thất bại, sẽ thử lại:`, err);
      }
      if (result && result.status === "success") {
        await this.remove(entry.key);
        this.onConfirmed(entry, result);
        return;
      }
      if (result && result.status === "ignored") {
        await this.remove(entry.key);
        return;
      }
      if (result && result.code === "unauthorized") this.onUnauthorized();
      await this.scheduleRetry(entry);
    }

    async scheduleRetry(entry) {
      const current = this.entries.get(entry.key);
      if (!current || current !== entry) return; // replaced while sending: the newer write has its own schedule
      entry.nextAttemptAt = this.now() + root.backoffMs(entry.attempts);
      entry.attempts += 1;
      await this.store.put(entry);
      this.onRetry(entry);
    }

    /** Removes entries the server's pull proves are stored. @returns {Array<string>} removed keys */
    async reconcile(pulled) {
      const removed = [];
      for (const entry of Array.from(this.entries.values())) {
        if (root.isConfirmedByServer(entry, pulled)) {
          await this.remove(entry.key);
          removed.push(entry.key);
        }
      }
      return removed;
    }
  }

  root.SyncEngine = SyncEngine;
})(typeof window !== "undefined" ? window : this);
