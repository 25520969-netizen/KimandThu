/**
 * confirmSheet(options) -> Promise<boolean>: promise-based replacement for window.confirm.
 * Resolves true on confirm; false on cancel, backdrop tap, Esc, Back or swipe. Without cancelLabel it is an
 * info sheet with one button. Focus returns to the element that was focused before opening.
 */
(function (root) {
  "use strict";

  const SHEET_ID = "confirm-sheet";

  /**
   * @param {{title: string, body?: string, confirmLabel: string, cancelLabel?: string, danger?: boolean}} options
   * @returns {Promise<boolean>}
   */
  function confirmSheet(options) {
    const doc = root.document;
    const dialog = doc.getElementById(SHEET_ID);
    const ok = doc.getElementById("confirm-sheet-ok");
    const cancel = doc.getElementById("cancel-confirm-btn");
    if (!dialog || !ok || !cancel) return Promise.reject(new Error("confirm sheet markup is missing"));

    doc.getElementById("confirm-sheet-title").textContent = options.title;
    const body = doc.getElementById("confirm-sheet-body");
    body.textContent = options.body || "";
    body.hidden = !options.body;
    ok.textContent = options.confirmLabel;
    ok.classList.toggle("btn--danger-text", !!options.danger);
    ok.classList.toggle("btn--primary", !options.danger);
    cancel.textContent = options.cancelLabel || "";
    cancel.hidden = !options.cancelLabel;

    const opener = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : null;
    return new Promise((resolve) => {
      let result = false;
      ok.onclick = () => { result = true; dialog.close(); };
      cancel.onclick = () => { result = false; if (dialog.open) dialog.close(); };
      dialog.addEventListener("close", () => {
        if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus({ preventScroll: true });
        resolve(result);
      }, { once: true });
      dialog.showModal();
    });
  }

  root.confirmSheet = confirmSheet;
})(typeof window !== "undefined" ? window : this);
