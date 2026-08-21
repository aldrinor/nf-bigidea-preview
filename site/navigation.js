(function () {
  "use strict";

  var body = document.body;
  var header = document.getElementById("cp-site-nav");
  var hero = document.getElementById("hero");
  var appsToggle = document.querySelector(".cp-nav-applications-toggle");
  var appsPanel = document.getElementById("cp-nav-applications-panel");
  var pollutantsToggle = document.querySelector(".cp-nav-pollutants-toggle");
  var pollutantsPanel = document.getElementById("cp-nav-pollutants-panel");
  var menuToggle = document.querySelector(".cp-nav-menu-toggle");
  var mobileNav = document.getElementById("cp-mobile-nav");
  var mobileClose = document.querySelector("[data-mobile-nav-close]");
  var contactDialog = document.getElementById("cp-contact-dialog");
  var contactClose = document.querySelector("[data-contact-close]");
  var contactForm = document.querySelector("[data-contact-form]");
  var contactStatus = document.querySelector("[data-contact-status]");
  var appCta = document.querySelector(".cp-app-contact-cta");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var appNames = {
    air: "Air",
    water: "Water",
    food: "Food packaging",
    textiles: "Textiles",
    medical: "Medical devices"
  };
  var ticking = false;

  if (!header || !hero) return;

  function dialogOpen(dialog) {
    return Boolean(dialog && dialog.open);
  }

  function overlayOpen() {
    return dialogOpen(mobileNav) || dialogOpen(contactDialog) ||
      (appsToggle && appsToggle.getAttribute("aria-expanded") === "true") ||
      (pollutantsToggle && pollutantsToggle.getAttribute("aria-expanded") === "true");
  }

  function lockPage() {
    body.classList.toggle("cp-nav-lock", dialogOpen(mobileNav) || dialogOpen(contactDialog));
  }

  function setHeaderVisible(visible) {
    body.classList.toggle("cp-nav-visible", visible);
  }

  function updateHeader() {
    var y = window.scrollY || 0;
    var heroEnd = hero.offsetTop + hero.offsetHeight;
    var pastHero = y >= heroEnd - 8;
    body.classList.toggle("cp-nav-compact", pastHero);

    /* Keep one stable navigation system above every section, including the
       footer. It stays compact after Hero so it remains useful without
       competing with the footer content. */
    setHeaderVisible(true);

    updateActiveApplication();
    ticking = false;
  }

  function requestHeaderUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHeader);
  }

  function closeApplicationsPanel() {
    if (!appsToggle || !appsPanel) return;
    appsToggle.setAttribute("aria-expanded", "false");
    appsPanel.hidden = true;
  }

  function openApplicationsPanel() {
    if (!appsToggle || !appsPanel) return;
    appsToggle.setAttribute("aria-expanded", "true");
    appsPanel.hidden = false;
    closePollutantsPanel();
    setHeaderVisible(true);
  }

  function closePollutantsPanel() {
    if (!pollutantsToggle || !pollutantsPanel) return;
    pollutantsToggle.setAttribute("aria-expanded", "false");
    pollutantsPanel.hidden = true;
  }

  function openPollutantsPanel() {
    if (!pollutantsToggle || !pollutantsPanel) return;
    pollutantsToggle.setAttribute("aria-expanded", "true");
    pollutantsPanel.hidden = false;
    closeApplicationsPanel();
    setHeaderVisible(true);
  }

  function togglePollutantsPanel() {
    if (!pollutantsToggle) return;
    if (pollutantsToggle.getAttribute("aria-expanded") === "true") closePollutantsPanel();
    else openPollutantsPanel();
  }

  function toggleApplicationsPanel() {
    if (!appsToggle) return;
    if (appsToggle.getAttribute("aria-expanded") === "true") closeApplicationsPanel();
    else openApplicationsPanel();
  }

  function closeDialog(dialog) {
    if (dialog && (dialog.classList.contains("cp-contact-fallback") || dialog.classList.contains("cp-dialog-fallback"))) {
      dialog.classList.remove("cp-contact-fallback", "cp-dialog-fallback");
      dialog.removeAttribute("open");
    } else if (dialogOpen(dialog)) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    lockPage();
  }

  function openMobileNavigation() {
    if (!mobileNav) return;
    closeApplicationsPanel();
    closePollutantsPanel();
    try {
      if (typeof mobileNav.showModal !== "function") throw new Error("Native dialog unavailable");
      mobileNav.showModal();
    } catch (error) {
      mobileNav.setAttribute("open", "");
      mobileNav.classList.add("cp-dialog-fallback");
    }
    lockPage();
  }

  function openContact(event) {
    if (!contactDialog) return;
    var source = event && event.currentTarget && event.currentTarget.dataset.application;
    var application = source || appNames[body.dataset.activeApplication] || "General";
    var select = contactForm && contactForm.elements.application;
    var sourceField = contactForm && contactForm.elements.source;
    var mobileWasOpen = dialogOpen(mobileNav);

    function revealContact() {
      if (dialogOpen(contactDialog) || contactDialog.classList.contains("cp-contact-fallback")) {
        var firstField = contactDialog.querySelector("input, select, textarea, button");
        if (firstField) firstField.focus({ preventScroll: true });
        return;
      }
      try {
        if (typeof contactDialog.showModal !== "function") throw new Error("Native dialog unavailable");
        contactDialog.showModal();
      } catch (error) {
        contactDialog.setAttribute("open", "");
        contactDialog.classList.add("cp-contact-fallback");
      }
      lockPage();
    }

    closeApplicationsPanel();
    closePollutantsPanel();
    closeDialog(mobileNav);
    if (select) select.value = application;
    if (sourceField) sourceField.value = source ? "Application: " + application : "Header";
    if (contactStatus) contactStatus.textContent = "";
    if (mobileWasOpen) requestAnimationFrame(revealContact);
    else revealContact();
  }

  function goToApplication(event) {
    var link = event.currentTarget;
    var key = link.dataset.navApp;
    var calibratedLink = document.querySelector('.cp-apps-row a[data-app-target="' + key + '"]');
    if (!calibratedLink) return;
    event.preventDefault();
    closeApplicationsPanel();
    closePollutantsPanel();
    closeDialog(mobileNav);
    calibratedLink.click();
  }

  function goHome(event) {
    event.preventDefault();
    closeApplicationsPanel();
    closePollutantsPanel();
    closeDialog(mobileNav);
    window.history.pushState(null, "", "#hero");
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function updateActiveApplication() {
    var key = body.dataset.activeApplication || "air";
    var name = appNames[key] || appNames.air;
    document.querySelectorAll("[data-nav-app]").forEach(function (link) {
      if (link.dataset.navApp === key) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (appCta) {
      appCta.dataset.application = name;
      var label = appCta.querySelector("span");
      if (label) label.textContent = name;
    }
  }

  if (appsToggle) {
    appsToggle.addEventListener("click", toggleApplicationsPanel);
    appsToggle.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      openApplicationsPanel();
      var firstLink = appsPanel && appsPanel.querySelector("a");
      if (firstLink) firstLink.focus();
    });
  }
  if (pollutantsToggle) {
    pollutantsToggle.addEventListener("click", togglePollutantsPanel);
    pollutantsToggle.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      openPollutantsPanel();
      var firstLink = pollutantsPanel && pollutantsPanel.querySelector("a");
      if (firstLink) firstLink.focus();
    });
  }
  if (menuToggle) menuToggle.addEventListener("click", openMobileNavigation);
  if (mobileClose) mobileClose.addEventListener("click", function () { closeDialog(mobileNav); });
  if (contactClose) contactClose.addEventListener("click", function () { closeDialog(contactDialog); });

  document.querySelectorAll(".cp-site-nav-logo").forEach(function (link) {
    link.addEventListener("click", goHome);
  });
  document.querySelectorAll("[data-nav-app]").forEach(function (link) {
    link.addEventListener("click", goToApplication);
  });
  document.querySelectorAll("[data-contact-open]").forEach(function (button) {
    button.addEventListener("click", openContact);
  });

  document.addEventListener("click", function (event) {
    if (!appsPanel || appsPanel.hidden || !event.target.closest(".cp-nav-applications")) {
      closeApplicationsPanel();
    }
    if (!pollutantsPanel || pollutantsPanel.hidden || !event.target.closest(".cp-nav-pollutants")) {
      closePollutantsPanel();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeApplicationsPanel();
      closePollutantsPanel();
    }
  });
  [mobileNav, contactDialog].forEach(function (dialog) {
    if (!dialog) return;
    dialog.addEventListener("close", lockPage);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      if (contactStatus) contactStatus.textContent = "Form delivery will be connected before launch.";
    });
  }

  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderUpdate, { passive: true });
  updateActiveApplication();
  updateHeader();

  /* Pollutant detail pages return here with ?contact=1 so Contact keeps the
     same modal behaviour as it has on the landing page. Remove the one-shot
     query flag after opening to keep refresh/back behaviour predictable. */
  if (new URLSearchParams(window.location.search).get("contact") === "1") {
    requestAnimationFrame(function () {
      openContact();
      var cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("contact");
      window.history.replaceState(null, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    });
  }
})();
