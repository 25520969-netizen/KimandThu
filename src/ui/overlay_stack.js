/**
 * Overlay stack (D-05): makes the phone Back gesture / Esc close the top overlay (chat, bottom sheet)
 * before anything else happens. Pure logic: the history object is injected so it can be unit tested.
 *
 * open(token, close, url?) -> remember the overlay and add one history entry (at url, when given)
 * closed(token)       -> the overlay was closed another way (x, swipe, button): drop its history entry
 * handlePop()         -> call from popstate; returns true when the pop was consumed here
 */
(function (root) {
  "use strict";

  class OverlayStack {
    /** @param {{pushState: Function, back: Function}} historyApi */
    constructor(historyApi) {
      this.history = historyApi;
      this.items = [];
      this.pendingBacks = 0;
      this.deferredPushes = [];
    }

    get size() {
      return this.items.length;
    }

    has(token) {
      return this.items.some((item) => item.token === token);
    }

    open(token, close, url) {
      if (this.has(token)) return;
      this.items.push({ token: token, close: close });
      // A history.back() from closed() is still in flight: pushing now would let it eat the new entry.
      if (this.pendingBacks > 0) this.deferredPushes.push(url);
      else this.pushEntry(url);
    }

    pushEntry(url) {
      if (url) this.history.pushState({ overlay: true }, "", url);
      else this.history.pushState({ overlay: true }, "");
    }

    closed(token) {
      const index = this.items.findIndex((item) => item.token === token);
      if (index === -1) return;
      this.items.splice(index, 1);
      // Our own history entry is still on top: step back over it without treating it as navigation.
      this.pendingBacks += 1;
      this.history.back();
    }

    handlePop() {
      if (this.pendingBacks > 0) {
        this.pendingBacks -= 1;
        if (this.pendingBacks === 0) this.deferredPushes.splice(0).forEach((url) => this.pushEntry(url));
        return true;
      }
      const top = this.items.pop();
      if (!top) return false;
      top.close();
      return true;
    }
  }

  root.OverlayStack = OverlayStack;
})(typeof window !== "undefined" ? window : this);
