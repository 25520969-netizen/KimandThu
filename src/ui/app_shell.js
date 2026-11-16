/**
 * Mobile app shell: tab bar, header state, sheets and the sticky counter pill.
 * It routes clicks to journeyApp and mirrors a few states, so no feature logic is duplicated here.
 */
(function (root) {
  "use strict";

  const STICKY_PILL_ID = "sticky-counter-pill";
  const VIEW_NAMES = ["moments", "places", "be"];
  const SCROLLED_THRESHOLD_PX = 4;
  const LARGE_TEXT_ROOT_PX = 20.8;
  const FAB_SCROLL_THRESHOLD_PX = 8;
  const PILL_HEART_PX = 14;
  const LONG_PRESS_MS = 500;
  const LONG_PRESS_MOVE_PX = 10;

  class AppShell {
    /** @param {Document} doc */
    constructor(doc) {
      this.doc = doc;
      this.overlays = new root.OverlayStack(root.history);
      this.bindViewState();
      this.bindFab();
      this.bindLongPress();
      this.bindScrollState();
      this.bindLargeText();
      this.bindStickyCounter();
      this.bindSheets();
      this.bindSegmented();
      this.bindThemeChoice();
    }

    byId(id) {
      return this.doc.getElementById(id);
    }

    // The FAB adds whatever belongs to the current page; it shrinks while scrolling down.
    bindFab() {
      const fab = this.byId("fab");
      if (!fab) return;
      fab.addEventListener("click", () => {
        const app = root.journeyApp;
        if (!app) return;
        if (this.doc.body.classList.contains("view-places")) app.openPlaceDialog();
        else app.openMemoryDialog();
      });
      this.doc.addEventListener("journey:viewchange", (event) => {
        const view = event.detail && event.detail.view;
        fab.setAttribute("aria-label", view === "places" ? "Thêm địa điểm" : "Thêm khoảnh khắc");
        fab.hidden = view === "be";
      });
      let lastY = root.scrollY || 0;
      root.addEventListener("scroll", () => {
        const y = root.scrollY || 0;
        if (Math.abs(y - lastY) < FAB_SCROLL_THRESHOLD_PX) return;
        fab.classList.toggle("is-compact", y > lastY);
        lastY = y;
      }, { passive: true });
    }

    // Body gets view-<name>; tabs get aria-current; tab clicks route through journeyApp.switchView.
    bindViewState() {
      this.doc.addEventListener("journey:viewchange", (event) => {
        const view = event.detail && event.detail.view;
        VIEW_NAMES.forEach((name) => this.doc.body.classList.toggle("view-" + name, name === view));
        this.doc.querySelectorAll(".tab[data-view]").forEach((tab) => {
          const isActive = tab.dataset.view === view;
          tab.setAttribute("aria-current", isActive ? "page" : "false");
        });
      });
      this.doc.querySelectorAll(".tab[data-view]").forEach((tab) => {
        tab.addEventListener("click", () => {
          if (root.journeyApp) root.journeyApp.switchView(tab.dataset.view);
        });
      });
    }

    // Hairline under the header only once the page has scrolled.
    bindScrollState() {
      const sync = () => this.doc.body.classList.toggle("is-scrolled", (root.scrollY || 0) > SCROLLED_THRESHOLD_PX);
      root.addEventListener("scroll", sync, { passive: true });
      sync();
    }

    // Large Dynamic Type: card clamps loosen when the root font is >= 130 % of 16 px.
    bindLargeText() {
      const size = parseFloat(root.getComputedStyle(this.doc.documentElement).fontSize);
      if (size >= LARGE_TEXT_ROOT_PX) this.doc.documentElement.setAttribute("data-large-text", "");
    }

    // Every dialog joins the overlay stack (Back closes the top one). Sheets also close with a
    // backdrop tap, Esc and a grabber drag. All paths end in requestClose().
    bindSheets() {
      this.doc.querySelectorAll("dialog").forEach((dialog) => {
        new MutationObserver(() => {
          if (dialog.open) this.overlays.open(dialog.id, () => this.requestClose(dialog));
          else this.overlays.closed(dialog.id);
        }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
        dialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          this.requestClose(dialog);
        });
        if (!dialog.classList.contains("sheet")) return;
        const card = dialog.querySelector(".sheet__card");
        if (!card) {
          root.console.error("sheet without .sheet__card: #" + dialog.id);
          return;
        }
        dialog.addEventListener("click", (event) => { if (event.target === dialog) this.requestClose(dialog); });
        this.bindGrabber(dialog, card);
      });
    }

    /**
     * The single close path for every dialog. A dialog may define beforeClose(): Promise<boolean>|boolean;
     * false keeps it open (unsaved-changes veto) and re-registers it when Back already popped its entry.
     * @param {HTMLDialogElement} dialog
     * @returns {Promise<void>}
     */
    async requestClose(dialog) {
      if (typeof dialog.beforeClose === "function") {
        const ok = await dialog.beforeClose();
        if (ok === false) {
          if (dialog.open && !this.overlays.has(dialog.id)) {
            this.overlays.open(dialog.id, () => this.requestClose(dialog));
          }
          return;
        }
      }
      const cancel = dialog.querySelector('[id^="cancel-"]');
      if (cancel) cancel.click();
      if (dialog.open) dialog.close();
    }

    // Grabber-only drag: touch-action none on the grabber, so the browser never claims the gesture.
    bindGrabber(dialog, card) {
      const reduce = () => root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const grabber = this.doc.createElement("div");
      grabber.className = "sheet__grabber";
      grabber.setAttribute("aria-hidden", "true");
      grabber.innerHTML = "<span></span>";
      card.insertBefore(grabber, card.firstChild);

      let startY = null;
      let dy = 0;
      let startTime = 0;
      grabber.addEventListener("pointerdown", (event) => {
        startY = event.clientY; dy = 0; startTime = Date.now();
        card.style.transition = "none";
        if (grabber.setPointerCapture) grabber.setPointerCapture(event.pointerId);
      });
      grabber.addEventListener("pointermove", (event) => {
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
          if (dismiss) this.requestClose(dialog);
          return;
        }
        card.style.transition = "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)";
        if (dismiss) {
          card.style.transform = "translateY(100%)";
          root.setTimeout(() => { finish(); this.requestClose(dialog); }, 200);
        } else {
          card.style.transform = "translateY(0)";
          root.setTimeout(finish, 240);
        }
      };
      grabber.addEventListener("pointerup", end);
      grabber.addEventListener("pointercancel", end);
    }

    // Arrow keys / Home / End move inside a segmented control (roving tabindex), selecting as they go.
    bindSegmented() {
      this.doc.querySelectorAll(".segmented").forEach((group) => {
        const options = Array.from(group.querySelectorAll(".segmented__option"));
        if (!options.length) return;
        const isSelected = (o) => o.getAttribute("aria-selected") === "true" || o.getAttribute("aria-pressed") === "true";
        const syncTabindex = () => {
          const selected = options.find(isSelected) || options[0];
          options.forEach((o) => o.setAttribute("tabindex", o === selected ? "0" : "-1"));
        };
        syncTabindex();
        group.addEventListener("click", () => root.setTimeout(syncTabindex, 0));
        group.addEventListener("keydown", (event) => {
          const index = options.indexOf(this.doc.activeElement);
          if (index === -1) return;
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % options.length;
          else if (event.key === "ArrowLeft") next = (index - 1 + options.length) % options.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = options.length - 1;
          else return;
          event.preventDefault();
          options[next].focus();
          options[next].click();
        });
      });
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

    // Long-press on a memory or grid tile (couple only) opens the Sửa / Xóa / Chia sẻ menu.
    bindLongPress() {
      const list = this.byId("timeline-list-container");
      if (!list) return;
      let timer = 0;
      let origin = null;
      let suppressClick = false;
      const cancel = () => { root.clearTimeout(timer); timer = 0; origin = null; };
      list.addEventListener("pointerdown", (event) => {
        const block = event.target.closest ? event.target.closest(".memory__open, .tile") : null;
        if (!block || this.doc.body.classList.contains("is-guest")) return;
        origin = { x: event.clientX, y: event.clientY };
        timer = root.setTimeout(() => {
          timer = 0;
          suppressClick = true;
          this.openMemoryMenu(block);
        }, LONG_PRESS_MS);
      });
      list.addEventListener("pointermove", (event) => {
        if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > LONG_PRESS_MOVE_PX) cancel();
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach((type) => list.addEventListener(type, cancel));
      list.addEventListener("click", (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      list.addEventListener("contextmenu", (event) => {
        if (event.target.closest && event.target.closest(".memory__open, .tile")) event.preventDefault();
      });
    }

    openMemoryMenu(block) {
      const app = root.journeyApp;
      const holder = block.closest("[data-id]");
      const mem = app && holder ? app.memories.find((m) => String(m.id) === holder.dataset.id) : null;
      if (!mem) return;
      app.hapticTick();
      root.actionMenu.open({
        anchor: holder,
        items: [
          { label: "Sửa", icon: "edit", onSelect: () => app.openMemoryDialog({ edit: mem }) },
          { label: "Xóa", icon: "trash", danger: true, onSelect: () => app.deleteMemory(mem.id) },
          { label: "Chia sẻ", icon: "share", onSelect: () => app.shareMemory(mem) }
        ]
      });
    }

    // Month labels stick under the header; .is-stuck gives the stuck one its glass strip.
    observeMonthLabels(container) {
      if (typeof IntersectionObserver === "undefined") return;
      if (this.monthObserver) this.monthObserver.disconnect();
      const header = this.doc.querySelector(".app-header");
      const top = header ? Math.round(header.getBoundingClientRect().height) : 0;
      this.monthObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const stuck = entry.intersectionRatio < 1 && entry.boundingClientRect.top <= top + 1;
          entry.target.classList.toggle("is-stuck", stuck);
        });
      }, { rootMargin: `-${top + 1}px 0px 0px 0px`, threshold: [1] });
      container.querySelectorAll(".month-label").forEach((label) => this.monthObserver.observe(label));
    }

    // Once the big day number scrolls away, a compact pill keeps the day count visible
    bindStickyCounter() {
      const pill = this.byId(STICKY_PILL_ID);
      const hero = this.byId("hero-days");
      const days = this.byId("count-days");
      if (!pill || !hero || !days || typeof IntersectionObserver === "undefined") return;
      const refresh = () => {
        pill.innerHTML = `${root.icon("heart", { size: PILL_HEART_PX, filled: true })}<strong>${root.escapeHtml(days.textContent)}</strong> ngày`;
      };
      new MutationObserver(refresh).observe(days, { childList: true, characterData: true, subtree: true });
      new IntersectionObserver((entries) => {
        const away = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        pill.hidden = !away;
        this.doc.body.classList.toggle("counter-stuck", away);
        if (away) refresh();
      }, { threshold: 0 }).observe(hero);
    }
  }

  root.AppShell = AppShell;
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => { root.appShell = new AppShell(document); });
  }
})(typeof window !== "undefined" ? window : this);
