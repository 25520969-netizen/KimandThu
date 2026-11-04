/**
 * Delta merge for synced collections (BUG-03, DATA-01).
 * The server is only authoritative for items that are NOT pending locally,
 * and absence from a delta never means deletion (only tombstones delete).
 */
(function (root) {
  "use strict";

  function idOf(item) {
    return String(item.id);
  }

  function isEmptyValue(value) {
    return value === null || value === undefined || value === "";
  }

  /** Server fields win, except empty server values never erase non-empty local ones listed in keepLocalWhenEmpty. */
  function mergeFields(local, server, keepLocalWhenEmpty) {
    const merged = Object.assign({}, local, server);
    keepLocalWhenEmpty.forEach((key) => {
      if (isEmptyValue(server[key]) && !isEmptyValue(local[key])) merged[key] = local[key];
    });
    delete merged.syncState;
    return merged;
  }

  /**
   * @param {Array<Object>} local Current local items (each has an `id`).
   * @param {{upserts?: Array<Object>, deletedIds?: Array<string>}} delta Changes reported by the server.
   * @param {{pendingIds?: Array<string>, tombstones?: Array<string>, keepLocalWhenEmpty?: Array<string>}} [options]
   * @returns {{items: Array<Object>, changed: boolean}}
   */
  function applyDelta(local, delta, options) {
    const opts = options || {};
    const pending = new Set((opts.pendingIds || []).map(String));
    const tombstones = new Set((opts.tombstones || []).map(String));
    const keepLocal = opts.keepLocalWhenEmpty || [];
    const order = [];
    const byId = new Map();
    local.forEach((item) => {
      byId.set(idOf(item), item);
      order.push(idOf(item));
    });

    (delta.deletedIds || []).forEach((rawId) => {
      const id = String(rawId);
      if (!pending.has(id)) byId.delete(id);
    });

    (delta.upserts || []).forEach((serverItem) => {
      const id = idOf(serverItem);
      if (pending.has(id) || tombstones.has(id)) return;
      const existing = byId.get(id);
      if (!existing) order.push(id);
      byId.set(id, existing ? mergeFields(existing, serverItem, keepLocal) : serverItem);
    });

    const seen = new Set();
    const items = [];
    order.forEach((id) => {
      if (seen.has(id) || !byId.has(id) || tombstones.has(id)) return;
      seen.add(id);
      items.push(byId.get(id));
    });
    return { items: items, changed: JSON.stringify(items) !== JSON.stringify(local) };
  }

  /**
   * Local items that the server has never seen (created by an older version
   * that dropped unsynced data). Only meaningful after a FULL sync.
   * @returns {Array<Object>} items that should be queued for upload.
   */
  function findUnsyncedLocal(local, fullServerItems, serverDeletedIds, options) {
    const opts = options || {};
    const known = new Set(fullServerItems.map(idOf));
    (serverDeletedIds || []).forEach((id) => known.add(String(id)));
    const skip = new Set((opts.defaultIds || []).concat(opts.pendingIds || [], opts.tombstones || []).map(String));
    return local.filter((item) => !known.has(idOf(item)) && !skip.has(idOf(item)));
  }

  root.applyDelta = applyDelta;
  root.findUnsyncedLocal = findUnsyncedLocal;
})(typeof window !== "undefined" ? window : this);
