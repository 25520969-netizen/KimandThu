/**
 * Registers the service worker (offline viewing + installable PWA).
 * Only on https or localhost, where service workers are allowed.
 */
(function () {
  "use strict";
  const isSecureContext = location.protocol === "https:" || location.hostname === "localhost";
  if (!("serviceWorker" in navigator) || !isSecureContext) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Không đăng ký được service worker:", err);
    });
  });
})();
