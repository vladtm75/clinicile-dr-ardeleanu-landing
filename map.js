/* Interactive Romania network map — public locations only */
(function () {
  const wrap = document.querySelector(".map-interactive");
  if (!wrap) return;
  const tooltip = wrap.querySelector(".map-tooltip");
  const markers = Array.from(wrap.querySelectorAll(".map-marker"));
  let active = null;

  function placeTooltip(marker) {
    const name = marker.getAttribute("data-name") || "";
    const detail = marker.getAttribute("data-detail") || "";
    tooltip.innerHTML = "<strong>" + name + "</strong><span>" + detail + "</span>";
    tooltip.hidden = false;

    const wrapRect = wrap.getBoundingClientRect();
    const svg = wrap.querySelector(".romania-map");
    const pt = svg.createSVGPoint();
    // marker is a <g> translated; use its CTM
    const ctm = marker.getScreenCTM();
    if (!ctm) return;
    pt.x = 0;
    pt.y = -16;
    const screen = pt.matrixTransform(ctm);
    const left = screen.x - wrapRect.left;
    const top = screen.y - wrapRect.top;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // keep inside wrap
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
  }

  function hide() {
    if (active) active.classList.remove("is-active");
    active = null;
    tooltip.hidden = true;
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

  wrap.addEventListener("click", () => hide());
  window.addEventListener("resize", () => {
    if (active) placeTooltip(active);
  });
})();
