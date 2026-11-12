/** Applies the saved Auto / Light / Dark choice before first paint (external file: the CSP forbids inline scripts). */
(function (root) {
  "use strict";

  function resolve(choice) {
    if (choice === "light" || choice === "dark") return choice;
    return root.matchMedia && root.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(choice) {
    const html = root.document.documentElement;
    if (choice === "light" || choice === "dark") html.setAttribute("data-theme", choice);
    else html.removeAttribute("data-theme");
    const meta = root.document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolve(choice) === "dark" ? "#1f1418" : "#ff758f");
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
