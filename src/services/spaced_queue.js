/**
 * Serialises async tasks with a minimum gap between starts, used to respect the
 * Nominatim / OSRM public-server limit of 1 request per second (BUG-08).
 */
(function (root) {
  "use strict";

  const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * @param {number} minGapMs Minimum time between the start of two tasks.
   * @param {{now?: function(): number, sleep?: function(number): Promise<void>}} [clock]
   * @returns {function(function(): Promise<*>): Promise<*>} schedule(task)
   */
  function createSpacedQueue(minGapMs, clock) {
    const now = (clock && clock.now) || Date.now;
    const sleep = (clock && clock.sleep) || defaultSleep;
    let chain = Promise.resolve();
    let lastStart = -Infinity;

    return function schedule(task) {
      const run = chain.then(async () => {
        const wait = lastStart + minGapMs - now();
        if (wait > 0) await sleep(wait);
        lastStart = now();
        return task();
      });
      chain = run.catch(() => {});
      return run;
    };
  }

  root.createSpacedQueue = createSpacedQueue;
})(typeof window !== "undefined" ? window : this);
