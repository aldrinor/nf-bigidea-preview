(function () {
  "use strict";

  var bridge = document.getElementById("cp-air-entry-bridge");
  var film = document.getElementById("cp-air-entry-film");
  var handoff = document.getElementById("cp-air-entry-handoff");
  if (!bridge || !film || !handoff) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 699px)");
  var duration = 6.834;
  /* V5 contains the complete room → residential grille → polluted duct move.
     Stop while the white filter still fills the lens, then hand off to the
     pixel-exact first frame of the production Air film. */
  var filterOcclusionTime = 5.58;
  var targetScroll = window.scrollY || 0;
  var visualScroll = targetScroll;
  var lastTime = performance.now();
  var lastSeek = -1;
  var raf = 0;
  var bridgeDocumentTop = 0;
  var sourceRequested = false;
  var active = false;

  function clamp(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  function smoothstep(value) {
    value = clamp(value);
    return value * value * (3 - 2 * value);
  }

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  /*
   * The source film is authored as five consecutive beats. Mapping the whole
   * movie with one smoothstep made a normal trackpad gesture skip the short
   * residential-grille beat. Give every story beat its own reversible scroll
   * interval instead:
   *
   * 00–25%  polluted condo interior
   * 25–46%  camera approaches the real residential return grille
   * 46–70%  camera crosses into the contaminated duct
   * 70–88%  slow filter approach / full-frame fibre occlusion
   * 88–100% exact Air first-frame hand-off
   */
  function authoredTime(progress) {
    if (progress <= 0.25) {
      return mix(0, 1.55, smoothstep(progress / 0.25));
    }
    if (progress <= 0.46) {
      return mix(1.55, 2.73, smoothstep((progress - 0.25) / 0.21));
    }
    if (progress <= 0.70) {
      return mix(2.73, 4.31, smoothstep((progress - 0.46) / 0.24));
    }
    if (progress <= 0.88) {
      return mix(4.31, filterOcclusionTime, smoothstep((progress - 0.70) / 0.18));
    }
    return filterOcclusionTime;
  }

  function rangeProgress(value, start, end) {
    return clamp((value - start) / Math.max(0.0001, end - start));
  }

  function selectSource() {
    if (!sourceRequested) return;
    var next = mobile.matches ? film.dataset.mobileSrc : film.dataset.desktopSrc;
    if (!next || film.getAttribute("src") === next) return;
    film.src = next;
    film.load();
  }

  function measureLayout() {
    bridgeDocumentTop = bridge.getBoundingClientRect().top + (window.scrollY || 0);
  }

  function measureProgress(scrollY) {
    var travel = Math.max(1, bridge.offsetHeight - window.innerHeight);
    return clamp((scrollY - bridgeDocumentTop) / travel);
  }

  function render(time) {
    if (!active || document.hidden) {
      raf = 0;
      return;
    }
    var delta = Math.min(0.05, Math.max(0.001, (time - lastTime) / 1000));
    lastTime = time;
    visualScroll = reduced.matches
      ? targetScroll
      : visualScroll + (targetScroll - visualScroll) * (1 - Math.exp(-delta * 12));
    if (Math.abs(targetScroll - visualScroll) < 0.04) visualScroll = targetScroll;

    var progress = measureProgress(visualScroll);
    var availableDuration = Number.isFinite(film.duration) && film.duration > 0 ? film.duration : duration;
    var safeEnd = Math.min(Math.max(0, availableDuration - 1 / 24), filterOcclusionTime);
    var desired = reduced.matches
      ? (progress < 0.5 ? 0 : safeEnd)
      : Math.min(safeEnd, authoredTime(progress));
    var handoffOpacity = reduced.matches
      ? (progress < 0.5 ? 0 : 1)
      : smoothstep(rangeProgress(progress, 0.86, 0.985));

    if (film.readyState >= HTMLMediaElement.HAVE_METADATA && Math.abs(desired - lastSeek) >= 1 / 30 && !film.seeking) {
      film.currentTime = desired;
      lastSeek = desired;
    }
    document.documentElement.style.setProperty("--air-entry-progress", progress.toFixed(4));
    document.documentElement.style.setProperty("--air-entry-handoff-opacity", handoffOpacity.toFixed(4));
    raf = requestAnimationFrame(render);
  }

  function activate() {
    active = true;
    if (!sourceRequested) {
      sourceRequested = true;
      selectSource();
    }
    measureLayout();
    targetScroll = window.scrollY || 0;
    visualScroll = targetScroll;
    lastTime = performance.now();
    if (!raf) raf = requestAnimationFrame(render);
  }

  function deactivate() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  film.addEventListener("loadedmetadata", function () {
    if (Number.isFinite(film.duration)) duration = film.duration;
    lastSeek = -1;
  });
  film.addEventListener("error", function () {
    bridge.classList.add("is-film-unavailable");
  });
  window.addEventListener("scroll", function () {
    targetScroll = window.scrollY || 0;
  }, { passive: true });
  window.addEventListener("resize", function () {
    if (sourceRequested) selectSource();
    measureLayout();
    targetScroll = window.scrollY || 0;
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (active) {
      lastTime = performance.now();
      raf = requestAnimationFrame(render);
    }
  });

  measureLayout();
  if ("IntersectionObserver" in window) {
    var bridgeObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) activate();
      else deactivate();
    }, { rootMargin: "220% 0px" });
    bridgeObserver.observe(bridge);
  } else {
    window.addEventListener("load", activate, { once: true });
  }
})();
