(function () {
  if (window.parent === window) return;

  var style = document.createElement("style");
  style.textContent =
    '[data-cms-selected="true"]{outline:2px solid #6366f1 !important;outline-offset:-2px !important;box-shadow:inset 0 0 0 2px #6366f1 !important;}';
  document.head.appendChild(style);

  var _selected = null;

  function clearSelected() {
    if (_selected) {
      _selected.removeAttribute("data-cms-selected");
      _selected = null;
    }
  }

  function selectElement(el) {
    clearSelected();
    el.setAttribute("data-cms-selected", "true");
    _selected = el;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest("[data-cms-field],[data-cms-section]");
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      var section = el.closest("[data-cms-section]");
      var field = el.closest("[data-cms-field]");
      var target = field || section;
      if (target) selectElement(target);
      window.parent.postMessage(
        {
          type: "CMS_ELEMENT_CLICK",
          section: section ? section.getAttribute("data-cms-section") : null,
          field: field ? field.getAttribute("data-cms-field") : null,
        },
        "*",
      );
    },
    true,
  );

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "CMS_SELECT_SECTION") return;
    var key = e.data.section;
    if (!key) return;
    var el =
      document.querySelector('[data-cms-section="' + key + '"]') ||
      document.querySelector('[data-cms-field="' + key + '"]');
    if (el) selectElement(el);
  });
})();
