/**
 * Mobile app shell: bottom tab bar, header shortcuts and the sticky counter pill (§4.3).
 * It only forwards clicks to the existing controls (which keep their auth checks and
 * handlers) and mirrors a few states, so no feature logic is duplicated here.
 */
(function (root) {
  "use strict";

  const STICKY_PILL_ID = "sticky-counter-pill";

  class AppShell {
    /** @param {Document} doc */
    constructor(doc) {
      this.doc = doc;
      this.bindProxyButtons();
      this.bindFab();
      this.bindViewState();
      this.mirrorChatDot();
      this.mirrorMusicState();
      this.bindStickyCounter();
    }

    byId(id) {
      return this.doc.getElementById(id);
    }

    bindProxyButtons() {
      this.doc.querySelectorAll("[data-proxy]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = this.byId(button.dataset.proxy);
          if (target) target.click();
        });
      });
    }

    // The centre heart adds whatever belongs to the current page
    bindFab() {
      const fab = this.byId("bottom-fab-btn");
      if (!fab) return;
      fab.addEventListener("click", () => {
        const placesActive = this.doc.body.classList.contains("view-places");
        const target = this.byId(placesActive ? "open-add-place-modal-btn" : "open-add-memory-modal-btn");
        if (target) target.click();
      });
    }

    bindViewState() {
      this.doc.addEventListener("journey:viewchange", (event) => {
        const view = event.detail && event.detail.view;
        this.doc.body.classList.toggle("view-places", view === "places");
        this.doc.querySelectorAll(".bottom-tab[data-view]").forEach((tab) => {
          const isActive = tab.dataset.view === view;
          tab.classList.toggle("active", isActive);
          tab.setAttribute("aria-current", isActive ? "page" : "false");
        });
      });
    }

    mirrorChatDot() {
      const source = this.byId("chat-unread-dot");
      const mirror = this.byId("tab-chat-dot");
      if (!source || !mirror) return;
      const sync = () => { mirror.style.display = source.style.display === "block" ? "block" : "none"; };
      new MutationObserver(sync).observe(source, { attributes: true, attributeFilter: ["style"] });
      sync();
    }

    mirrorMusicState() {
      const source = this.byId("music-toggle-btn");
      const mirror = this.byId("header-music-btn");
      if (!source || !mirror) return;
      const sync = () => mirror.classList.toggle("active", source.classList.contains("active"));
      new MutationObserver(sync).observe(source, { attributes: true, attributeFilter: ["class"] });
    }

    // Once the big counter scrolls away, a compact pill keeps the day count visible
    bindStickyCounter() {
      const pill = this.byId(STICKY_PILL_ID);
      const card = this.doc.querySelector(".love-counter-card");
      if (!pill || !card || typeof IntersectionObserver === "undefined") return;
      const refresh = () => {
        const text = (id) => (this.byId(id) ? this.byId(id).textContent : "");
        pill.textContent = `💕 ${text("count-days")} ngày · ${text("count-hours")}:${text("count-minutes")}:${text("count-seconds")}`;
      };
      new MutationObserver(refresh).observe(this.byId("count-seconds"), { childList: true, characterData: true, subtree: true });
      new IntersectionObserver((entries) => {
        const away = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        pill.hidden = !away;
        this.doc.body.classList.toggle("counter-stuck", away);
        if (away) refresh();
      }, { threshold: 0 }).observe(card);
    }
  }

  root.AppShell = AppShell;
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => { root.appShell = new AppShell(document); });
  }
})(typeof window !== "undefined" ? window : this);
