/**
 * Pure sync policy: outbox keys, retry backoff, polling cadence, and when the
 * server's response proves a queued write has landed (BUG-03, BUG-06).
 */
(function (root) {
  "use strict";

  const BACKOFF_BASE_MS = 2000;
  const BACKOFF_MAX_MS = 5 * 60 * 1000;
  const POLL_ACTIVE_MS = 8000;
  const POLL_IDLE_MS = 30000;
  const POLL_GUEST_MS = 60000;
  const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

  const KEY_PREFIX_BY_TYPE = {
    memory: "memory", delete_memory: "memory",
    place: "place", delete_place: "place", toggle_place: "place",
    chat_message: "chat", note: "note", period: "period"
  };

  /** Writes to the same record share one key, so a newer write replaces an older queued one. */
  function outboxKey(payload) {
    const prefix = KEY_PREFIX_BY_TYPE[payload && payload.type];
    if (!prefix) throw new Error(`Unsupported outbox payload type: ${payload && payload.type}`);
    return prefix === "period" ? "period" : `${prefix}:${payload.id}`;
  }

  function backoffMs(attempts) {
    const n = Math.max(0, Math.floor(Number(attempts) || 0));
    return Math.min(BACKOFF_BASE_MS * Math.pow(2, n), BACKOFF_MAX_MS);
  }

  function isDue(entry, now) {
    return !entry.nextAttemptAt || entry.nextAttemptAt <= now;
  }

  /** @returns {number|null} ms until the next poll, or null when polling should pause (hidden tab). */
  function pollIntervalMs(ctx) {
    if (!ctx.visible) return null;
    if (!ctx.isAuth) return POLL_GUEST_MS;
    const recentlyActive = ctx.chatOpen || (ctx.now - ctx.lastActivityAt) < ACTIVE_WINDOW_MS;
    return recentlyActive ? POLL_ACTIVE_MS : POLL_IDLE_MS;
  }

  function idList(list) {
    return (list || []).map((x) => String(x.id !== undefined ? x.id : x));
  }

  /** True when the pulled data shows the queued write is already stored on the server. */
  function isConfirmedByServer(entry, pulled) {
    const p = entry.payload;
    if (p.type === "period") {
      return !!pulled.period && Number(pulled.period.updatedAt) >= Number(p.updatedAt || 0);
    }
    const id = String(p.id);
    const deleted = pulled.deleted || {};
    if (p.type === "delete_memory") return (deleted.memories || []).map(String).includes(id);
    if (p.type === "delete_place") return (deleted.places || []).map(String).includes(id);
    if (p.type === "memory") return idList(pulled.memories).includes(id);
    if (p.type === "place" || p.type === "toggle_place") return idList(pulled.places).includes(id);
    if (p.type === "chat_message") return idList(pulled.messages).includes(id);
    if (p.type === "note") return idList(pulled.notes).includes(id);
    return false;
  }

  root.outboxKey = outboxKey;
  root.backoffMs = backoffMs;
  root.isDue = isDue;
  root.pollIntervalMs = pollIntervalMs;
  root.isConfirmedByServer = isConfirmedByServer;
})(typeof window !== "undefined" ? window : this);
