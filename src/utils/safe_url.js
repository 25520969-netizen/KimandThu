/**
 * Allow-list URL validation (SEC-03).
 * Returns the URL only when it is safe to place in an href/src attribute,
 * otherwise an empty string. The caller must still HTML-escape the result.
 */
(function (root) {
  "use strict";

  // https only; no whitespace, quotes, angle brackets, backticks or backslashes.
  const HTTPS_URL_PATTERN = /^https:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?([/?#][^\s"'<>`\\]*)?$/i;
  // Bundled assets such as "assets/images/memory3.jpg" (no scheme, no "//" prefix).
  const RELATIVE_ASSET_PATTERN = /^(?!\/\/)[\w][\w\-./%]*$/;
  // Local photo previews produced by the in-app compressor.
  const DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/i;

  /**
   * @param {unknown} value Raw URL taken from user or server data.
   * @param {{allowRelative?: boolean, allowDataImage?: boolean}} [options]
   * @returns {string} The trimmed URL when allowed, otherwise "".
   */
  function safeUrl(value, options) {
    if (typeof value !== "string") return "";
    const opts = options || {};
    const candidate = value.trim();
    if (candidate === "") return "";
    if (HTTPS_URL_PATTERN.test(candidate)) return candidate;
    if (opts.allowDataImage && DATA_IMAGE_PATTERN.test(candidate)) return candidate;
    if (opts.allowRelative && !/^[a-z][a-z0-9+.-]*:/i.test(candidate) && RELATIVE_ASSET_PATTERN.test(candidate)) {
      return candidate;
    }
    return "";
  }

  root.safeUrl = safeUrl;
})(typeof window !== "undefined" ? window : this);
