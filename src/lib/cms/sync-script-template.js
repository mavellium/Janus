(function () {
  if (window.parent === window) return;

  var style = document.createElement("style");
  style.textContent =
    '[data-cms-selected="true"]{outline:2px solid #6366f1 !important;outline-offset:-2px !important;box-shadow:inset 0 0 0 2px #6366f1 !important;position:relative !important;}' +
    '#janus-cms-badge{position:fixed;z-index:2147483647;background:#6366f1;color:#fff;font:600 11px/1 system-ui,sans-serif;padding:4px 8px;border-radius:4px;pointer-events:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:opacity .15s;}';
  document.head.appendChild(style);

  var _selected = null;
  var _badge = null;

  function getBadge() {
    if (!_badge) {
      _badge = document.createElement("div");
      _badge.id = "janus-cms-badge";
      document.body.appendChild(_badge);
    }
    return _badge;
  }

  function positionBadge(el, label) {
    var badge = getBadge();
    badge.textContent = label;
    var rect = el.getBoundingClientRect();
    var top = rect.top + window.scrollY - 26;
    if (top < window.scrollY + 4) top = rect.top + window.scrollY + 4;
    badge.style.left = rect.left + "px";
    badge.style.top = top + "px";
    badge.style.opacity = "1";
  }

  function hideBadge() {
    if (_badge) _badge.style.opacity = "0";
  }

  function clearSelected() {
    if (_selected) {
      _selected.removeAttribute("data-cms-selected");
      _selected = null;
    }
    hideBadge();
  }

  function getLabel(el) {
    var section = el.closest("[data-cms-section]");
    var field = el.closest("[data-cms-field]");
    var sectionKey = section ? section.getAttribute("data-cms-section") : null;
    var fieldKey = field ? field.getAttribute("data-cms-field") : null;
    if (fieldKey) return (sectionKey ? sectionKey + " › " : "") + fieldKey.split(".").pop();
    return sectionKey || "Elemento";
  }

  function selectElement(el) {
    clearSelected();
    el.setAttribute("data-cms-selected", "true");
    _selected = el;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    positionBadge(el, getLabel(el));
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

  function applyLiveUpdate(contentData) {
    if (!contentData || typeof contentData !== "object") return;
    var fields = document.querySelectorAll("[data-cms-field]");
    fields.forEach(function (el) {
      var fieldPath = el.getAttribute("data-cms-field");
      if (!fieldPath) return;
      var parts = fieldPath.split(".");
      var val = contentData;
      for (var i = 0; i < parts.length; i++) {
        if (val === null || val === undefined || typeof val !== "object") { val = undefined; break; }
        val = val[parts[i]];
      }
      if (val === undefined || val === null) return;
      var str = String(val);
      if (el.tagName === "IMG" || el.tagName === "VIDEO") {
        if (el.src !== str) el.src = str;
      } else if (el.tagName === "A") {
        if (el.href !== str) el.href = str;
      } else if (el.textContent !== str) {
        el.textContent = str;
      }
    });
  }

  window.addEventListener("message", function (e) {
    if (!e.data) return;

    if (e.data.type === "CMS_SELECT_SECTION") {
      var key = e.data.section;
      if (!key) return;
      var el =
        document.querySelector('[data-cms-section="' + key + '"]') ||
        document.querySelector('[data-cms-field="' + key + '"]');
      if (el) selectElement(el);
      return;
    }

    if (e.data.type === "CMS_SELECT_FIELD") {
      var fieldKey = e.data.field;
      if (!fieldKey) return;
      var fieldEl = document.querySelector('[data-cms-field="' + fieldKey + '"]');
      if (fieldEl) selectElement(fieldEl);
      return;
    }

    if (e.data.type === "janus:content-update") {
      applyLiveUpdate(e.data.contentData);
    }
  });
})();
