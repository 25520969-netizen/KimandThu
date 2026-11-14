/** Applies the saved Auto / Light / Dark choice before first paint (external file: the CSP forbids inline scripts). */
(function (root) {
  "use strict";

  const PAPER_LIGHT = "#FBF7F2";
  const PAPER_DARK = "#16110F";

  function applyTheme(choice) {
    const html = root.document.documentElement;
    if (choice === "light" || choice === "dark") html.setAttribute("data-theme", choice);
    else html.removeAttribute("data-theme");
    const metas = root.document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta) => {
      const media = meta.getAttribute("media") || "";
      let color = media.indexOf("dark") !== -1 ? PAPER_DARK : PAPER_LIGHT;
      if (choice === "light") color = PAPER_LIGHT;
      if (choice === "dark") color = PAPER_DARK;
      meta.setAttribute("content", color);
    });
  }

  function saved() {
    try { return root.localStorage.getItem("kimthu_theme") || "light"; } catch (err) { return "light"; }
  }

  root.applyTheme = applyTheme;
  applyTheme(saved());
  if (root.matchMedia) {
    const query = root.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (saved() === "auto") applyTheme("auto"); };
    if (query.addEventListener) query.addEventListener("change", onChange);
  }
})(window);
