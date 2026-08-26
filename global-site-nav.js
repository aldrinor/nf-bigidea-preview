(function () {
  "use strict";

  // The charge cursor is a site-level behavior. Load it before checking whether
  // this page already owns a navigation component, so legal and standalone
  // published pages receive the same cursor treatment as the main decks.
  var navScript = document.currentScript;
  var cursorSource = navScript && navScript.src
    ? new URL("positive-charge-cursor.js?v=20260825-hiw", navScript.src).href
    : "/positive-charge-cursor.js?v=20260825-hiw";

  if (!window.CPolarChargeCursor && !document.querySelector("script[data-cp-charge-cursor-loader]")) {
    var cursorScript = document.createElement("script");
    cursorScript.src = cursorSource;
    cursorScript.dataset.cpChargeCursorLoader = "true";
    document.head.appendChild(cursorScript);
  } else if (window.CPolarChargeCursor) {
    window.CPolarChargeCursor.mount(document);
  }

  if (document.querySelector(".cp-global-nav")) return;

  var path = window.location.pathname.toLowerCase();
  var isPollutantPage = path.indexOf("/pollutants/") !== -1;
  var currentPollutant = "";
  if (path.indexOf("/pollutants/ultrafine-particles/") !== -1 || /ultrafine\.html$/.test(path)) currentPollutant = "ultrafine";
  else if (path.indexOf("/pollutants/wildfire-smoke/") !== -1 || /wildfire\.html$/.test(path)) currentPollutant = "wildfire";
  else if (path.indexOf("/pollutants/viruses/") !== -1 || /virus\.html$/.test(path)) currentPollutant = "virus";
  else if (path.indexOf("/pollutants/bacteria/") !== -1 || /bacteria\.html$/.test(path)) currentPollutant = "bacteria";
  else if (path.indexOf("/pollutants/mold/") !== -1 || /fungi\.html$/.test(path)) currentPollutant = "fungi";

  function current(name) {
    if (name === "applications" && (path === "/air/" || path === "/development/" || path.indexOf("v23-application-deck") !== -1 || path.indexOf("v23-air-filtration-page") !== -1 || path.indexOf("v23-rd-page") !== -1)) return ' aria-current="page"';
    if (name === "science" && (path === "/how-it-works/" || path === "/science/" || path === "/publications/" || path.indexOf("v23-how-it-works-page") !== -1 || path.indexOf("v23-science-evidence-page") !== -1 || path.indexOf("v23-publications-downloads-page") !== -1 || isPollutantPage)) return ' aria-current="page"';
    if (name === "company" && (path === "/company/" || path.indexOf("v23-company-page") !== -1)) return ' aria-current="page"';
    if (name === "contact" && (path === "/contact/" || path.indexOf("nanoflashing-contact-form") !== -1)) return ' aria-current="page"';
    return "";
  }

  function pollutantCurrent(name) {
    return currentPollutant === name ? ' aria-current="page"' : "";
  }

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="cp-global-nav" role="banner">
      <a class="cp-global-nav__brand" href="/" aria-label="C-POLAR home"><img src="assets/brand/cpolar-full-color.svg" alt="C-POLAR"></a>
      <nav class="cp-global-nav__links" aria-label="Site navigation">
        <div class="cp-global-nav__item" data-cp-global-dropdown="cp-global-science-menu">
          <a class="cp-global-nav__trigger" href="/science/" aria-expanded="false" aria-controls="cp-global-science-menu"${current("science")}>Science</a>
        </div>
        <div class="cp-global-nav__item" data-cp-global-dropdown="cp-global-applications-menu">
          <a class="cp-global-nav__trigger" href="/air/" aria-expanded="false" aria-controls="cp-global-applications-menu"${current("applications")}>Applications</a>
        </div>
        <a href="/company/"${current("company")}>Company</a>
        <a class="cp-global-nav__contact" href="/contact/"${current("contact")}>Contact C-POLAR</a>
      </nav>
      <button class="cp-global-nav__menu" type="button" aria-expanded="false" aria-controls="cp-global-mobile-menu"><span></span><span></span><span class="cp-global-sr-only">Open navigation</span></button>
    </div>

    <nav id="cp-global-applications-menu" class="cp-global-dropdown cp-global-dropdown--applications" hidden aria-label="Applications menu">
      <a class="cp-global-dropdown__row" href="/air/"><span>Air Filtration</span><span class="cp-global-dropdown__arrow" aria-hidden="true">↗</span></a>
      <a class="cp-global-dropdown__row" href="/development/"><span>R&amp;D / Development</span><span class="cp-global-dropdown__arrow" aria-hidden="true">↗</span></a>
    </nav>

    <nav id="cp-global-science-menu" class="cp-global-dropdown cp-global-dropdown--science" hidden aria-label="Science menu">
      <a class="cp-global-dropdown__row" href="/how-it-works/"><span>How It Works</span><span class="cp-global-dropdown__arrow" aria-hidden="true">↗</span></a>
      <div class="cp-global-dropdown__parent"><span>Explore by Pollutant</span></div>
      <div class="cp-global-dropdown__children">
        <a class="cp-global-dropdown__child" href="/pollutants/ultrafine-particles/"${pollutantCurrent("ultrafine")}><span>Ultrafine Particles</span></a>
        <a class="cp-global-dropdown__child" href="/pollutants/wildfire-smoke/"${pollutantCurrent("wildfire")}><span>Wildfire Smoke</span></a>
        <a class="cp-global-dropdown__child" href="/pollutants/viruses/"${pollutantCurrent("virus")}><span>Viruses</span></a>
        <a class="cp-global-dropdown__child" href="/pollutants/bacteria/"${pollutantCurrent("bacteria")}><span>Bacteria</span></a>
        <a class="cp-global-dropdown__child" href="/pollutants/mold/"${pollutantCurrent("fungi")}><span>Mold &amp; Fungal Spores</span></a>
      </div>
      <a class="cp-global-dropdown__row cp-global-dropdown__row--evidence" href="/science/"><span>Evidence</span><span class="cp-global-dropdown__arrow" aria-hidden="true">↗</span></a>
    </nav>

    <nav id="cp-global-mobile-menu" class="cp-global-mobile" hidden aria-label="Mobile navigation">
      <button class="cp-global-mobile__close" type="button" aria-label="Close navigation"></button>
      <button class="cp-global-mobile__toggle" type="button" aria-expanded="false" aria-controls="cp-global-mobile-science">Science</button>
      <div id="cp-global-mobile-science" class="cp-global-mobile__submenu" hidden>
        <a href="/how-it-works/">How It Works</a>
        <p class="cp-global-mobile__label">Explore by Pollutant</p>
        <div class="cp-global-mobile__children">
          <a href="/pollutants/ultrafine-particles/">Ultrafine Particles</a>
          <a href="/pollutants/wildfire-smoke/">Wildfire Smoke</a>
          <a href="/pollutants/viruses/">Viruses</a>
          <a href="/pollutants/bacteria/">Bacteria</a>
          <a href="/pollutants/mold/">Mold &amp; Fungal Spores</a>
        </div>
        <a href="/science/">Evidence</a>
      </div>
      <button class="cp-global-mobile__toggle" type="button" aria-expanded="false" aria-controls="cp-global-mobile-applications">Applications</button>
      <div id="cp-global-mobile-applications" class="cp-global-mobile__submenu" hidden>
        <a href="/air/">Air Filtration</a>
        <a href="/development/">R&amp;D / Development</a>
      </div>
      <a href="/company/">Company</a>
      <a href="/contact/"${current("contact")}>Contact C-POLAR</a>
    </nav>
  `);

  var dropdownItems = Array.prototype.slice.call(document.querySelectorAll("[data-cp-global-dropdown]"));
  var closeTimer = 0;

  function closeDropdowns(exceptId) {
    dropdownItems.forEach(function (item) {
      var trigger = item.querySelector(".cp-global-nav__trigger");
      var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
      if (panel.id === exceptId) return;
      trigger.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    });
  }

  function positionPanel(trigger, panel) {
    var rect = trigger.getBoundingClientRect();
    var width = panel.offsetWidth || 338;
    var left = rect.left;
    panel.style.left = Math.max(20, Math.min(left, window.innerWidth - width - 20)) + "px";
    panel.style.top = Math.round(rect.bottom + 12) + "px";
  }

  function openDropdown(item) {
    clearTimeout(closeTimer);
    var trigger = item.querySelector(".cp-global-nav__trigger");
    var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
    closeDropdowns(panel.id);
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    positionPanel(trigger, panel);
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { closeDropdowns(); }, 180);
  }

  dropdownItems.forEach(function (item) {
    var trigger = item.querySelector(".cp-global-nav__trigger");
    var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
    item.addEventListener("pointerenter", function () { openDropdown(item); });
    item.addEventListener("pointerleave", scheduleClose);
    panel.addEventListener("pointerenter", function () { clearTimeout(closeTimer); });
    panel.addEventListener("pointerleave", scheduleClose);
    item.addEventListener("focusin", function () { openDropdown(item); });
    panel.addEventListener("focusin", function () { clearTimeout(closeTimer); });
  });

  window.addEventListener("resize", function () {
    dropdownItems.forEach(function (item) {
      var trigger = item.querySelector(".cp-global-nav__trigger");
      var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
      if (!panel.hidden) positionPanel(trigger, panel);
    });
  });

  document.addEventListener("focusin", function (event) {
    var inside = dropdownItems.some(function (item) {
      var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
      return item.contains(event.target) || panel.contains(event.target);
    });
    if (!inside) closeDropdowns();
  });

  document.addEventListener("click", function (event) {
    var inside = dropdownItems.some(function (item) {
      var panel = document.getElementById(item.getAttribute("data-cp-global-dropdown"));
      return item.contains(event.target) || panel.contains(event.target);
    });
    if (!inside) closeDropdowns();
  });

  var menuButton = document.querySelector(".cp-global-nav__menu");
  var mobile = document.getElementById("cp-global-mobile-menu");
  var mobileClose = document.querySelector(".cp-global-mobile__close");

  function closeMobile() {
    mobile.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cp-global-nav-lock");
  }

  menuButton.addEventListener("click", function () {
    var open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    mobile.hidden = !open;
    document.body.classList.toggle("cp-global-nav-lock", open);
  });

  mobileClose.addEventListener("click", closeMobile);
  Array.prototype.slice.call(document.querySelectorAll(".cp-global-mobile__toggle")).forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      document.getElementById(toggle.getAttribute("aria-controls")).hidden = expanded;
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeDropdowns();
    closeMobile();
  });
})();
