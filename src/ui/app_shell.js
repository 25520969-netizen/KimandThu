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
      this.overlays = new root.OverlayStack(root.history);
      this.bindProxyButtons();
      this.bindFab();
      this.bindViewState();
      this.mirrorChatDot();
      this.mirrorMusicState();
      this.bindStickyCounter();
      this.bindSheets();
      this.bindChatState();
      this.bindThemeChoice();
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

    // D-03/D-05: bottom sheets close with the header x, a backdrop tap, Esc, the phone Back gesture, or by
    // dragging the handle. Every path ends in the sheet's own cancel button (or dialog.close()), so the
    // camera still stops on the dialog's close event.
    bindSheets() {
      const reduce = () => root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.doc.querySelectorAll("dialog.custom-modal:not(.photo-lightbox-modal):not(#who-am-i-modal)").forEach((dialog) => {
        const card = dialog.querySelector(".modal-card");
        if (!card) return;
        const closeSheet = () => {
          const cancel = dialog.querySelector('[id^="cancel-"]');
          if (cancel) cancel.click();
          if (dialog.open) dialog.close();
        };

        dialog.addEventListener("click", (event) => { if (event.target === dialog) closeSheet(); });

        // Back gesture: one history entry per open sheet (see overlay_stack.js)
        new MutationObserver(() => {
          if (dialog.open) this.overlays.open(dialog.id, closeSheet);
          else this.overlays.closed(dialog.id);
        }).observe(dialog, { attributes: true, attributeFilter: ["open"] });

        // Handle-only drag: touch-action none on the handle, so the browser never claims the gesture.
        const handle = this.doc.createElement("div");
        handle.className = "sheet-handle";
        handle.setAttribute("aria-hidden", "true");
        handle.innerHTML = "<span></span>";
        card.insertBefore(handle, card.firstChild);

        let startY = null;
        let dy = 0;
        let startTime = 0;
        handle.addEventListener("pointerdown", (event) => {
          startY = event.clientY; dy = 0; startTime = Date.now();
          card.style.transition = "none";
          if (handle.setPointerCapture) handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener("pointermove", (event) => {
          if (startY === null) return;
          dy = Math.max(0, event.clientY - startY);
          card.style.transform = `translateY(${dy}px)`;
        });
        const end = () => {
          if (startY === null) return;
          const fast = dy / Math.max(1, Date.now() - startTime) > 0.6;
          const far = dy > card.offsetHeight * 0.3;
          const dismiss = dy > 6 && (far || (fast && dy > 40));
          startY = null;
          dy = 0;
          const finish = () => { card.style.transition = ""; card.style.transform = ""; };
          if (reduce()) {
            finish();
            if (dismiss) closeSheet();
            return;
          }
          card.style.transition = "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)";
          if (dismiss) {
            card.style.transform = "translateY(100%)";
            root.setTimeout(() => { finish(); closeSheet(); }, 200);
          } else {
            card.style.transform = "translateY(0)";
            root.setTimeout(finish, 240);
          }
        };
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      });
    }

    // UI-05/D-05: chat is a full-screen sheet on phones. While open the page behind it is inert, Back/Esc close it,
    // focus moves into the input and returns to the opener; the send/heart button swaps by typed text.
    bindChatState() {
      const drawer = this.byId("chat-drawer");
      const input = this.byId("chat-text-input");
      if (drawer) {
        const background = () => Array.from(this.doc.querySelectorAll("main, .nav-bar, .bottom-nav, footer"));
        let opener = null;
        const sync = () => {
          const open = drawer.classList.contains("open");
          this.doc.body.classList.toggle("chat-open", open);
          background().forEach((el) => { el.inert = open; });
          if (open) {
            opener = this.doc.activeElement && this.doc.activeElement !== this.doc.body ? this.doc.activeElement : null;
            this.overlays.open("chat", () => { const close = this.byId("close-chat-btn"); if (close) close.click(); });
            root.setTimeout(() => { if (input && drawer.classList.contains("open")) input.focus({ preventScroll: true }); }, 260);
          } else {
            this.overlays.closed("chat");
            if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus({ preventScroll: true });
            opener = null;
          }
        };
        new MutationObserver(sync).observe(drawer, { attributes: true, attributeFilter: ["class"] });
        this.doc.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && drawer.classList.contains("open")) {
            const close = this.byId("close-chat-btn");
            if (close) close.click();
          }
        });
      }
      if (input) {
        const sync = () => this.byId("chat-form").classList.toggle("has-text", input.value.trim() !== "");
        input.addEventListener("input", sync);
        input.form.addEventListener("submit", () => root.setTimeout(sync, 0));
        sync();
      }
    }

    // D-09: Auto / Light / Dark choice, stored on this device only (theme_init.js applies it before first paint)
    bindThemeChoice() {
      const buttons = Array.from(this.doc.querySelectorAll("[data-theme-choice]"));
      if (!buttons.length) return;
      const current = () => { try { return root.localStorage.getItem("kimthu_theme") || "light"; } catch (err) { return "light"; } };
      const paint = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === current())));
      buttons.forEach((button) => button.addEventListener("click", () => {
        const choice = button.dataset.themeChoice;
        try { root.localStorage.setItem("kimthu_theme", choice); } catch (err) { /* private mode: not persisted */ }
        if (root.applyTheme) root.applyTheme(choice);
        paint();
      }));
      paint();
    }

    // Called from app.js on popstate: true when the Back gesture closed an overlay and nothing else should happen
    consumeBack() {
      return this.overlays.handlePop();
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
