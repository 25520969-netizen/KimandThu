/**
 * Durable storage for the outbox (BUG-11). Uses IndexedDB, which has a much
 * larger quota than localStorage, so queued photos survive reloads. Falls back
 * to memory when IndexedDB is unavailable (e.g. some private windows).
 */
(function (root) {
  "use strict";

  const DB_NAME = "kimthu-outbox";
  const DB_VERSION = 1;
  const STORE_NAME = "outbox";

  function createMemoryOutboxStore() {
    const map = new Map();
    return {
      kind: "memory",
      getAll: async () => Array.from(map.values()),
      put: async (entry) => { map.set(entry.key, entry); },
      remove: async (key) => { map.delete(key); }
    };
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function openDatabase(idb) {
    return new Promise((resolve, reject) => {
      const request = idb.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** @returns {Promise<{kind: string, getAll: function, put: function, remove: function}>} */
  async function createOutboxStore(idb) {
    if (!idb) return createMemoryOutboxStore();
    let db = null;
    try {
      db = await openDatabase(idb);
    } catch (err) {
      console.warn("Không mở được IndexedDB, dùng bộ nhớ tạm:", err);
      return createMemoryOutboxStore();
    }
    const tx = (mode) => db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    return {
      kind: "indexeddb",
      getAll: () => requestToPromise(tx("readonly").getAll()),
      put: (entry) => requestToPromise(tx("readwrite").put(entry)),
      remove: (key) => requestToPromise(tx("readwrite").delete(key))
    };
  }

  root.createOutboxStore = createOutboxStore;
  root.createMemoryOutboxStore = createMemoryOutboxStore;
})(typeof window !== "undefined" ? window : this);
