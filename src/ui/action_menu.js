/**
 * actionMenu: anchored popover for the ⋯ button / long press. Arrow keys move focus, Esc and an outside tap
 * close it, focus returns to the anchor, and it joins the overlay stack so Back closes it.
 *   actionMenu.open({ anchor, items: [{ label, icon?, danger?, checked?, onSelect }] })
 *   actionMenu.close()
 */
(function (root) {
  "use strict";

  const MENU_ID = "action-menu";
  const OVERLAY_TOKEN = "action-menu";
  const VIEWPORT_MARGIN_PX = 16;
  const ANCHOR_GAP_PX = 4;

  let currentAnchor = null;
  let outsideHandler = null;

  function menuElement() {
    return root.document.getElementById(MENU_ID);
  }

  function buildItem(item, close) {
    const button = root.document.createElement("button");
    button.type = "button";
    button.className = "action-menu__item" + (item.danger ? " is-danger" : "");
    button.setAttribute("role", item.checked === undefined ? "menuitem" : "menuitemcheckbox");
    if (item.checked !== undefined) button.setAttribute("aria-checked", String(item.checked));
    const iconHtml = item.icon && typeof root.icon === "function" ? root.icon(item.icon, { size: 20 }) : "";
    button.innerHTML = iconHtml + "<span></span>";
    button.lastChild.textContent = item.label;
    button.addEventListener("click", () => { close(); item.onSelect(); });
    return button;
  }

  function place(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const maxLeft = root.innerWidth - width - VIEWPORT_MARGIN_PX;
    const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(rect.right - width, maxLeft));
    const fitsBelow = rect.bottom + ANCHOR_GAP_PX + height <= root.innerHeight - VIEWPORT_MARGIN_PX;
    const top = fitsBelow ? rect.bottom + ANCHOR_GAP_PX : Math.max(VIEWPORT_MARGIN_PX, rect.top - ANCHOR_GAP_PX - height);
    menu.style.left = left + "px";
    menu.style.top = top + "px";
  }

  function close() {
    const menu = menuElement();
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    menu.textContent = "";
    if (outsideHandler) root.document.removeEventListener("pointerdown", outsideHandler, true);
    outsideHandler = null;
    if (root.appShell) root.appShell.overlays.closed(OVERLAY_TOKEN);
    if (currentAnchor && currentAnchor.isConnected) currentAnchor.focus({ preventScroll: true });
    currentAnchor = null;
  }

  function moveFocus(menu, step) {
    const items = Array.from(menu.querySelectorAll("button"));
    const index = items.indexOf(root.document.activeElement);
    items[(index + step + items.length) % items.length].focus();
  }

  /** @param {{anchor: Element, items: Array<object>}} options */
  function open(options) {
    const menu = menuElement();
    if (!menu) throw new Error("action menu markup is missing");
    close();
    currentAnchor = options.anchor;
    menu.textContent = "";
    options.items.forEach((item) => menu.appendChild(buildItem(item, close)));
    menu.hidden = false;
    place(menu, options.anchor);
    menu.onkeydown = (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); moveFocus(menu, 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); moveFocus(menu, -1); }
      else if (event.key === "Escape") { event.preventDefault(); close(); }
    };
    outsideHandler = (event) => { if (!menu.contains(event.target)) close(); };
    root.document.addEventListener("pointerdown", outsideHandler, true);
    if (root.appShell) root.appShell.overlays.open(OVERLAY_TOKEN, close);
    const first = menu.querySelector("button");
    if (first) first.focus();
  }

  root.actionMenu = { open: open, close: close };
})(typeof window !== "undefined" ? window : this);
