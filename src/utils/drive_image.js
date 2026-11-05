/**
 * UI-13: pick a smaller Google Drive thumbnail size for the view that shows it.
 * Only touches https://drive.google.com/thumbnail?...&sz=wNNNN URLs; anything else is returned as is.
 */
(function (root) {
  "use strict";

  const DRIVE_THUMBNAIL_PATTERN = /^https:\/\/drive\.google\.com\/thumbnail\?/i;

  /**
   * @param {string} url Already validated image URL.
   * @param {number} width Wanted width in CSS-independent pixels (e.g. 400 or 800).
   * @returns {string}
   */
  function resizeDriveThumbnail(url, width) {
    if (typeof url !== "string" || !DRIVE_THUMBNAIL_PATTERN.test(url)) return url;
    const size = Math.max(100, Math.min(1600, Math.round(Number(width)) || 800));
    return /([?&])sz=w\d+/i.test(url)
      ? url.replace(/([?&])sz=w\d+/i, `$1sz=w${size}`)
      : `${url}&sz=w${size}`;
  }

  root.resizeDriveThumbnail = resizeDriveThumbnail;
})(typeof window !== "undefined" ? window : this);
