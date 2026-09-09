/* Interactive Romania network map — on-map photo badges + callout cards */
(function () {
  const wrap = document.querySelector(".map-interactive");
  if (!wrap) return;
  const tooltip = wrap.querySelector(".map-tooltip");
  const svg = wrap.querySelector(".romania-map");
  const markers = Array.from(wrap.querySelectorAll(".map-marker"));
  if (!svg || !tooltip || !markers.length) return;

  const NS = "http://www.w3.org/2000/svg";
  const XLINK = "http://www.w3.org/1999/xlink";
  const BADGE_R = 15;
  let active = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureDefs() {
    let defs = svg.querySelector("defs.map-defs");
    if (defs) return defs;
    defs = document.createElementNS(NS, "defs");
    defs.classList.add("map-defs");
    const clip = document.createElementNS(NS, "clipPath");
    clip.setAttribute("id", "map-badge-clip");
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", String(BADGE_R));
    clip.appendChild(circle);
    defs.appendChild(clip);
    svg.insertBefore(defs, svg.firstChild);
    return defs;
  }

  function attachBadge(marker) {
    const image = marker.getAttribute("data-image");
    if (!image || marker.querySelector(".map-marker__photo")) return;

    const status = marker.getAttribute("data-status") || "";
    const photo = document.createElementNS(NS, "g");
    photo.classList.add("map-marker__photo");
    if (status === "pipeline") photo.classList.add("map-marker__photo--dev");

    const ring = document.createElementNS(NS, "circle");
    ring.classList.add("map-marker__badge-ring");
    ring.setAttribute("r", String(BADGE_R + 1.5));
    ring.setAttribute("cx", "0");
    ring.setAttribute("cy", "0");

    const img = document.createElementNS(NS, "image");
    img.classList.add("map-marker__badge");
    img.setAttribute("href", image);
    img.setAttributeNS(XLINK, "href", image);
    img.setAttribute("x", String(-BADGE_R));
    img.setAttribute("y", String(-BADGE_R));
    img.setAttribute("width", String(BADGE_R * 2));
    img.setAttribute("height", String(BADGE_R * 2));
    img.setAttribute("preserveAspectRatio", "xMidYMid slice");
    img.setAttribute("clip-path", "url(#map-badge-clip)");
    img.setAttribute("pointer-events", "none");

    photo.appendChild(ring);
    photo.appendChild(img);

    const hit = marker.querySelector(".map-marker__hit");
    if (hit) {
      hit.setAttribute("r", "22");
      marker.insertBefore(photo, hit.nextSibling);
    } else {
      marker.insertBefore(photo, marker.firstChild);
    }

    const dot = marker.querySelector(".map-marker__dot");
    const diamond = marker.querySelector(".map-marker__diamond");
    if (dot) dot.setAttribute("visibility", "hidden");
    if (diamond) diamond.setAttribute("visibility", "hidden");
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
        '<img class="map-tooltip__photo" src="' +
        escapeHtml(image) +
        '" alt="" width="160" height="110" loading="lazy" />';
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
    tooltip.classList.toggle("map-tooltip--dev", status === "pipeline");

    const wrapRect = wrap.getBoundingClientRect();
    const pt = svg.createSVGPoint();
    const ctm = marker.getScreenCTM();
    if (!ctm) return;
    pt.x = 0;
    pt.y = -(BADGE_R + 4);
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
  }

  function hide() {
    if (active) active.classList.remove("is-active");
    active = null;
    tooltip.hidden = true;
    tooltip.classList.remove("map-tooltip--dev");
  }

  ensureDefs();
  markers.forEach(attachBadge);

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
