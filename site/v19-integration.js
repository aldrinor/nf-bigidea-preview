(function () {
  "use strict";

  var applications = document.getElementById("cp-apps");
  var sceneLayer = document.getElementById("cp-scenes");
  if (!applications || !sceneLayer) return;

  var heroLogo = document.querySelector(".cp-logo");
  if (heroLogo) heroLogo.src = "./assets/brand/cpolar-full-color.svg";
  var heroSection = document.querySelector('[data-chapter="Hero"]');
  if (heroSection) heroSection.id = "hero";

  var frame = document.createElement("iframe");
  frame.id = "cp-v19-master";
  var motionQuality = new URLSearchParams(location.search).get("motion");
  var frameSrc = "./v19/index.html?embed=1" +
    (motionQuality === "original" ? "&motion=original" : "&assetset=hd-production-20260804");
  frame.title = "C-POLAR applications: Air, Water, Food Packaging, Textiles and Medical Devices";
  frame.setAttribute("scrolling", "no");
  frame.setAttribute("loading", "lazy");
  sceneLayer.appendChild(frame);

  var ready = false;
  var frameRequested = false;
  var lastProgress = -1;
  var lastOpacity = -1;
  var firstTop = 0;
  var runHeight = 1;
  var viewportHeight = window.innerHeight;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileViewport = window.matchMedia("(max-width: 760px)");
  var smoothedScrollY = window.scrollY || 0;
  var lastFrameTime = 0;
  var entryFilmLead = 0;
  function filmToDocumentProgress(value) {
    return clamp((value - entryFilmLead) / (1 - entryFilmLead));
  }
  var chapterProgress = {
    /* On mobile, progress 0 sits exactly on the sticky-film boundary. Land
       slightly inside the Air establish shot so its copy is already fully
       resolved instead of leaving the user on the HVAC/Air hand-off frame. */
    air: filmToDocumentProgress((mobileViewport.matches ? 1.2 : 0) / 67.2),
    water: filmToDocumentProgress(0.285),
    food: filmToDocumentProgress(0.485),
    textiles: filmToDocumentProgress(0.625),
    medical: filmToDocumentProgress(0.975)
  };
  /* These cuts match the visible title changes inside the V19 master film. */
  var applicationStops = [
    { key: "air", start: 0 },
    { key: "water", start: 16.6 / 67.2 },
    { key: "food", start: 30 / 67.2 },
    { key: "textiles", start: 41.7 / 67.2 },
    { key: "medical", start: 55.25 / 67.2 }
  ];

  function clamp(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  function damp(current, target, speed, seconds) {
    return target + (current - target) * Math.exp(-speed * seconds);
  }

  function limitStep(current, next, maximum) {
    var step = next - current;
    if (step > maximum) return current + maximum;
    if (step < -maximum) return current - maximum;
    return next;
  }

  function publishApplicationState(filmProgress, appsInView) {
    var index = 0;
    for (var i = 1; i < applicationStops.length; i += 1) {
      if (filmProgress >= applicationStops[i].start) index = i;
      else break;
    }
    var current = applicationStops[index];
    var nextStart = index + 1 < applicationStops.length ? applicationStops[index + 1].start : 1;
    var localProgress = clamp((filmProgress - current.start) / Math.max(0.0001, nextStart - current.start));

    document.body.dataset.activeApplication = current.key;
    document.body.classList.toggle("cp-apps-in-view", appsInView);
    document.body.classList.toggle("cp-app-cta-visible", appsInView && localProgress >= 0.78 && localProgress <= 0.98);
    document.documentElement.style.setProperty("--cp-current-app-progress", localProgress.toFixed(4));
  }

  function measure() {
    var scrollY = window.scrollY || 0;
    firstTop = applications.getBoundingClientRect().top + scrollY;
    viewportHeight = window.innerHeight;
    runHeight = Math.max(1, applications.offsetHeight - viewportHeight);
  }

  function scrollToChapter(progress) {
    loadFrame();
    measure();
    window.scrollTo({
      top: firstTop + runHeight * progress,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }

  function returnToHero(event) {
    if (event) event.preventDefault();
    window.history.pushState(null, "", "#hero");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }

  var chapterAnchors = {
    air: "#app-air",
    water: "#app-water",
    textiles: "#app-textile",
    food: "#app-food",
    medical: "#app-medical"
  };

  function chapterKey(link) {
    return link.dataset.appTarget ||
      (link.getAttribute("href") || "").replace(/^#(?:app-)?/, "").toLowerCase();
  }

  document.querySelectorAll("[data-app-target]").forEach(function (link) {
    var key = chapterKey(link);
    if (!(key in chapterProgress)) return;
    link.dataset.appTarget = key;
    link.setAttribute("href", chapterAnchors[key]);
    link.addEventListener("click", function (event) {
      event.preventDefault();
      window.history.pushState(null, "", link.getAttribute("href"));
      scrollToChapter(chapterProgress[key]);
    });
  });

  function scrollToHashChapter() {
    var link = document.querySelector('[data-app-target][href="' + window.location.hash + '"]');
    if (!link) return false;
    var key = chapterKey(link);
    if (!(key in chapterProgress)) return false;
    scrollToChapter(chapterProgress[key]);
    return true;
  }

  function findMaster() {
    try {
      return frame.contentWindow && frame.contentWindow.__cpolarMaster;
    } catch (_) {
      return null;
    }
  }

  function loadFrame() {
    if (frameRequested) return;
    frameRequested = true;
    frame.src = frameSrc;
    confirmReady(600);
  }

  function confirmReady(tries) {
    var master = findMaster();
    if (master && typeof master.setProgress === "function") {
      ready = true;
      document.body.classList.add("cp-v19-ready");
      sceneLayer.removeAttribute("aria-hidden");
      measure();
      smoothedScrollY = window.scrollY || 0;
      lastFrameTime = performance.now();
      if (window.location.hash) setTimeout(scrollToHashChapter, 60);
      return;
    }
    if (tries > 0) setTimeout(function () { confirmReady(tries - 1); }, 100);
  }

  frame.addEventListener("load", function () {
    confirmReady(80);
  });
  /* The applications film is tens of megabytes and lives several viewports
     below the Hero. Request it only when the user approaches that section or
     explicitly selects an application. */
  if ("IntersectionObserver" in window) {
    var frameObserver = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      loadFrame();
      frameObserver.disconnect();
    }, { rootMargin: "180% 0px" });
    frameObserver.observe(applications);
  } else {
    window.addEventListener("load", loadFrame, { once: true });
  }
  if (/^#app-/.test(window.location.hash)) loadFrame();

  window.addEventListener("message", function (event) {
    if (
      event.origin !== window.location.origin ||
      event.source !== frame.contentWindow ||
      !event.data ||
      event.data.type !== "cpolar:go-hero"
    ) return;

    returnToHero();
  });

  window.addEventListener("resize", function () {
    measure();
    setTimeout(measure, 160);
  }, { passive: true });
  window.addEventListener("load", measure);
  window.addEventListener("hashchange", scrollToHashChapter);
  setTimeout(measure, 700);

  function render(now) {
    if (ready) {
      var actualScrollY = window.scrollY || 0;
      var seconds = lastFrameTime ? Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000)) : 1 / 60;
      var gap = Math.abs(actualScrollY - smoothedScrollY);
      var largeSeek = gap > viewportHeight * 1.5;
      var dampingSpeed = largeSeek ? 22 : 10;
      var dampedScrollY = damp(smoothedScrollY, actualScrollY, dampingSpeed, seconds);
      /* A time-scaled cap still produced a visible lurch whenever the browser
         missed a frame: the next 40–50 ms frame was allowed to consume a
         disproportionately large part of the bridge. Cap distance per
         rendered frame instead. Normal wheel/touch movement stays cinematic;
         deliberate chapter jumps use the faster catch-up lane. */
      var maximumStep = viewportHeight * (largeSeek ? 0.12 : 0.022);
      smoothedScrollY = reduceMotion.matches ? actualScrollY : limitStep(smoothedScrollY, dampedScrollY, maximumStep);
      if (Math.abs(actualScrollY - smoothedScrollY) < 0.04) smoothedScrollY = actualScrollY;
      lastFrameTime = now;
      var scrollY = smoothedScrollY;
      var exitStart = firstTop + runHeight;
      var filmEnd = firstTop + applications.offsetHeight;
      var withinApplicationFilm = actualScrollY >= firstTop && actualScrollY < filmEnd;
      var opacity = withinApplicationFilm ? 1 : 0;
      var progress = clamp((scrollY - firstTop) / runHeight);
      var filmProgress = entryFilmLead + progress * (1 - entryFilmLead);
      var active = withinApplicationFilm;
      var appsInView = actualScrollY >= firstTop && actualScrollY < exitStart;

      publishApplicationState(filmProgress, appsInView);

      if (Math.abs(opacity - lastOpacity) > 0.001) {
        document.documentElement.style.setProperty("--cp-v19-opacity", opacity.toFixed(4));
        lastOpacity = opacity;
      }
      document.body.classList.toggle("cp-v19-active", active);

      if (active && Math.abs(filmProgress - lastProgress) > 0.00002) {
        var master = findMaster();
        if (master) master.setProgress(filmProgress);
        lastProgress = filmProgress;
      }
    } else {
      document.body.classList.remove("cp-apps-in-view", "cp-app-cta-visible");
    }
    requestAnimationFrame(render);
  }

  measure();
  requestAnimationFrame(render);
})();
