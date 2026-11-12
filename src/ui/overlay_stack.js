/**
 * Overlay stack (D-05): makes the phone Back gesture / Esc close the top overlay (chat, bottom sheet)
 * before anything else happens. Pure logic: the history object is injected so it can be unit tested.
 *
 * open(token, close)  -> remember the overlay and add one history entry
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
    }

    get size() {
      return this.items.length;
    }

    open(token, close) {
      if (this.items.some((item) => item.token === token)) return;
      this.items.push({ token: token, close: close });
      this.history.pushState({ overlay: true }, "");
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
