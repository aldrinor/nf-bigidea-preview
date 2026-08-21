(function (global) {
  "use strict";

  function mountChargeCursor(doc) {
    if (!doc || doc.documentElement.dataset.cpChargeCursorMounted) return;

    var view = doc.defaultView || global;
    var finePointer = view.matchMedia && view.matchMedia("(pointer: fine)");
    var reducedMotion = view.matchMedia && view.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer || !finePointer.matches || (reducedMotion && reducedMotion.matches)) return;

    doc.documentElement.dataset.cpChargeCursorMounted = "true";
    doc.documentElement.classList.add("cp-charge-cursor-active");

    var style = doc.createElement("style");
    style.textContent = [
      "html.cp-charge-cursor-active, html.cp-charge-cursor-active body, html.cp-charge-cursor-active body * { cursor: none !important; }",
      ".cp-charge-cursor { position: fixed; z-index: 2147483647; top: 0; left: 0; width: 84px; height: 84px; pointer-events: none; opacity: 0; transform: translate3d(-50%, -50%, 0) scale(.82); transition: opacity 160ms ease, transform 180ms cubic-bezier(.2,.78,.2,1); will-change: transform; }",
      ".cp-charge-cursor::before { content: ''; position: absolute; inset: 1px; border-radius: 50%; background: radial-gradient(circle, rgba(145,178,196,.22) 0%, rgba(145,178,196,.10) 31%, rgba(145,178,196,0) 71%); filter: blur(1px); }",
      ".cp-charge-cursor::after { content: '+'; position: absolute; inset: 0; display: grid; place-items: center; color: #91b2c4; font: 400 43px/.78 Arial, sans-serif; text-shadow: 0 0 16px rgba(145,178,196,.18); }",
      ".cp-charge-cursor.is-visible { opacity: 1; }",
      ".cp-charge-cursor.is-interactive { transform: translate3d(-50%, -50%, 0) scale(1.17); }",
      ".cp-charge-cursor.is-pressed { transform: translate3d(-50%, -50%, 0) scale(.72); }"
    ].join("");
    doc.head.appendChild(style);

    var cursor = doc.createElement("div");
    cursor.className = "cp-charge-cursor";
    cursor.setAttribute("aria-hidden", "true");
    doc.body.appendChild(cursor);

    var frame;
    var targetX = -100;
    var targetY = -100;
    var shown = false;

    function render() {
      frame = 0;
      cursor.style.left = targetX + "px";
      cursor.style.top = targetY + "px";
    }

    function move(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!frame) frame = view.requestAnimationFrame(render);
      if (!shown) {
        shown = true;
        cursor.classList.add("is-visible");
      }
      var element = event.target && event.target.closest && event.target.closest("a, button, input, select, textarea, summary, [role='button'], [data-cursor-interactive]");
      cursor.classList.toggle("is-interactive", Boolean(element));
    }

    doc.addEventListener("pointermove", move, { passive: true });
    doc.addEventListener("pointerdown", function () { cursor.classList.add("is-pressed"); }, { passive: true });
    doc.addEventListener("pointerup", function () { cursor.classList.remove("is-pressed"); }, { passive: true });
    doc.addEventListener("pointerleave", function () { cursor.classList.remove("is-visible"); shown = false; }, { passive: true });
  }

  global.CPolarChargeCursor = { mount: mountChargeCursor };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mountChargeCursor(document); }, { once: true });
  else mountChargeCursor(document);
})(window);
