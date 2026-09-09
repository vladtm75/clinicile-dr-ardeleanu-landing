/* Interactive Romania network map — public locations only */
(function () {
  const wrap = document.querySelector(".map-interactive");
  if (!wrap) return;
  const tooltip = wrap.querySelector(".map-tooltip");
  const markers = Array.from(wrap.querySelectorAll(".map-marker"));
  const chips = Array.from(document.querySelectorAll(".map-chip"));
  let active = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function syncChips(marker) {
    const id = marker ? marker.getAttribute("data-id") : null;
    chips.forEach((chip) => {
      const on = id && chip.getAttribute("data-target") === id;
      chip.classList.toggle("is-active", !!on);
      if (on) chip.setAttribute("aria-pressed", "true");
      else chip.removeAttribute("aria-pressed");
    });
  }

  function placeTooltip(marker) {
    const name = marker.getAttribute("data-name") || "";
    const detail = marker.getAttribute("data-detail") || "";
    const image = marker.getAttribute("data-image") || "";
    const status = marker.getAttribute("data-status") || "";
    const statusClass =
      status === "pipeline" ? "map-tooltip__status--dev" : "map-tooltip__status--open";

    let html = "";
    if (image) {
      html +=
        '<img class="map-tooltip__thumb" src="' +
        escapeHtml(image) +
        '" alt="" width="120" height="80" />';
    }
    html += '<div class="map-tooltip__body">';
    html += "<strong>" + escapeHtml(name) + "</strong>";
    html +=
      '<span class="map-tooltip__status ' +
      statusClass +
      '">' +
      escapeHtml(detail) +
      "</span>";
    html += "</div>";
    tooltip.innerHTML = html;
    tooltip.hidden = false;

    const wrapRect = wrap.getBoundingClientRect();
    const svg = wrap.querySelector(".romania-map");
    const pt = svg.createSVGPoint();
    const ctm = marker.getScreenCTM();
    if (!ctm) return;
    pt.x = 0;
    pt.y = -16;
    const screen = pt.matrixTransform(ctm);
    const left = screen.x - wrapRect.left;
    const top = screen.y - wrapRect.top;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    requestAnimationFrame(() => {
      const tr = tooltip.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (tr.left < wrapRect.left + 8) dx = wrapRect.left + 8 - tr.left;
      if (tr.right > wrapRect.right - 8) dx = wrapRect.right - 8 - tr.right;
      if (tr.top < wrapRect.top + 8) dy = wrapRect.top + 8 - tr.top;
      if (dx || dy) {
        tooltip.style.left = left + dx + "px";
        tooltip.style.top = top + dy + "px";
      }
    });
  }

  function show(marker) {
    if (active && active !== marker) active.classList.remove("is-active");
    active = marker;
    marker.classList.add("is-active");
    placeTooltip(marker);
    syncChips(marker);
  }

  function hide() {
    if (active) active.classList.remove("is-active");
    active = null;
    tooltip.hidden = true;
    syncChips(null);
  }

  function markerById(id) {
    return markers.find((m) => m.getAttribute("data-id") === id) || null;
  }

  markers.forEach((marker) => {
    marker.addEventListener("mouseenter", () => show(marker));
    marker.addEventListener("mouseleave", () => {
      if (document.activeElement !== marker) hide();
    });
    marker.addEventListener("focus", () => show(marker));
    marker.addEventListener("blur", () => hide());
    marker.addEventListener("click", (e) => {
      e.stopPropagation();
      if (active === marker && !tooltip.hidden) hide();
      else show(marker);
    });
    marker.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hide();
        marker.blur();
      }
    });
  });

  chips.forEach((chip) => {
    chip.addEventListener("mouseenter", () => {
      const m = markerById(chip.getAttribute("data-target"));
      if (m) show(m);
    });
    chip.addEventListener("mouseleave", () => {
      if (document.activeElement && document.activeElement.classList.contains("map-marker")) {
        return;
      }
      if (document.activeElement === chip) return;
      hide();
    });
    chip.addEventListener("focus", () => {
      const m = markerById(chip.getAttribute("data-target"));
      if (m) show(m);
    });
    chip.addEventListener("blur", () => hide());
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = markerById(chip.getAttribute("data-target"));
      if (!m) return;
      if (active === m && !tooltip.hidden) hide();
      else {
        show(m);
        m.focus({ preventScroll: true });
      }
    });
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hide();
        chip.blur();
      }
    });
  });

  wrap.addEventListener("click", () => hide());
  window.addEventListener("resize", () => {
    if (active) placeTooltip(active);
  });
})();
