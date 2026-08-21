(function () {
  'use strict';

  var root = document.getElementById('applications');
  if (!root) return;

  // Mount the complete V23 application deck after the inherited V22 story.
  // `#WhatWeDo` lives inside `.topChapters`, whose own pinned WebGL timeline
  // clips descendants to a single viewport. Placing this 500svh deck there
  // leaves chapter 01 visible but prevents chapters 02–05 from receiving real
  // document scroll space. Keep V23 outside that legacy scroll owner.
  var pollutantsSection = document.getElementById('WhatWeDo');
  var legacyStoryMain = pollutantsSection && pollutantsSection.closest('main');
  if (legacyStoryMain && legacyStoryMain.nextElementSibling !== root) {
    legacyStoryMain.insertAdjacentElement('afterend', root);
  }

  var stage = root.querySelector('.v23-app-stage');
  var chapters = Array.prototype.slice.call(root.querySelectorAll('.v23-chapter'));
  var media = [
    { poster: './assets/applications/air-v23.png', film: './assets/applications/air-v23.mp4' },
    { poster: './assets/applications/water-v23.jpg', film: './assets/applications/water-v23.mp4' },
    { poster: './assets/applications/food-v23.jpeg', film: './assets/applications/food-v23.mp4' },
    { poster: './assets/applications/textiles-v23.jpg', film: './assets/applications/textiles-v23.mp4' },
    { poster: './assets/applications/medical-v23.png', film: './assets/applications/medical-v23.mp4' }
  ];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact = window.matchMedia('(max-width: 899px), (max-height: 599px), (pointer: coarse)');
  var desktopTimeline = null;
  var entryTween = null;

  chapters.forEach(function (chapter, index) {
    var asset = media[index];
    if (!asset) return;
    var poster = chapter.querySelector('.v23-chapter__poster');
    var film = chapter.querySelector('.v23-chapter__film');
    var source = film && film.querySelector('source');
    if (poster) poster.src = asset.poster;
    if (film) film.poster = asset.poster;
    if (source) {
      source.removeAttribute('src');
      source.dataset.src = asset.film;
    }
  });

  function loadFilm(index) {
    [index, index + 1].forEach(function (i) {
      var chapter = chapters[i];
      if (!chapter) return;
      var film = chapter.querySelector('.v23-chapter__film');
      if (!film || film.dataset.loaded === 'true') return;
      var source = film.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
      }
      film.dataset.loaded = 'true';
      film.load();
      film.addEventListener('canplay', function () { film.classList.add('is-ready'); }, { once: true });
    });
  }

  function activate(index) {
    chapters.forEach(function (chapter, i) {
      var film = chapter.querySelector('.v23-chapter__film');
      chapter.classList.toggle('is-active', i === index);
      if (!film) return;
      if (i === index && !reduced.matches) {
        loadFilm(i);
        var play = film.play();
        if (play && play.catch) play.catch(function () {});
      } else {
        film.pause();
      }
    });
  }

  function scrollToChapter(index) {
    var maxIndex = chapters.length - 1;
    var bounded = Math.max(0, Math.min(maxIndex, index));
    if (compact.matches || reduced.matches) {
      chapters[bounded].scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    var span = Math.max(1, root.offsetHeight - window.innerHeight);
    var y = root.getBoundingClientRect().top + window.scrollY + (span * bounded / maxIndex);
    window.scrollTo({ top: y, behavior: reduced.matches ? 'auto' : 'smooth' });
  }

  function setupDesktop() {
    if (!window.gsap || !window.ScrollTrigger || compact.matches || reduced.matches) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    root.classList.add('is-enhanced');
    window.gsap.set(chapters, {
      autoAlpha: 0,
      yPercent: 0,
      scale: 1.035,
      transformOrigin: '50% 50%'
    });
    window.gsap.set(chapters[0], { autoAlpha: 1, scale: 1 });

    /* Keep chapter 01 fully opaque while it enters. The previous alpha fade
       exposed the flat stage background beneath the poster and, together
       with the old section gradient, produced three horizontal layers. A
       restrained optical scale preserves the hand-off without compositing
       competing surfaces. */
    entryTween = window.gsap.fromTo(chapters[0],
      { autoAlpha: 1, scale: 1.018 },
      {
        autoAlpha: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top 88%',
          end: 'top top',
          scrub: 1.15,
          invalidateOnRefresh: true
        }
      }
    );

    desktopTimeline = window.gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.15,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var index = Math.min(chapters.length - 1, Math.round(self.progress * (chapters.length - 1)));
          activate(index);
        }
      }
    });

    chapters.forEach(function (chapter, i) {
      if (i === 0) return;
      /* Each hand-off has three beats: hold, gentle optical push, dissolve.
         Both chapters occupy the same frame throughout, eliminating the old
         top/bottom seam caused by +/-100% page slides. */
      var at = (i - 1) * 1.6 + 0.42;
      desktopTimeline
        .to(chapters[i - 1], {
          autoAlpha: 0.12,
          scale: 0.985,
          duration: 0.82
        }, at)
        .fromTo(chapter,
          { autoAlpha: 0, scale: 1.035 },
          { autoAlpha: 1, scale: 1, duration: 0.94 },
          at + 0.14
        )
        .set(chapters[i - 1], { autoAlpha: 0 }, at + 0.96);
    });

    /* Preserve a calm final hold instead of ending on the last dissolve. */
    desktopTimeline.to({}, { duration: 0.5 });
    loadFilm(0);
    activate(0);
    window.requestAnimationFrame(function () { window.ScrollTrigger.refresh(true); });
  }

  function setupCompactObserver() {
    if (!('IntersectionObserver' in window)) {
      chapters.forEach(function (_, i) { loadFilm(i); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var index = chapters.indexOf(entry.target);
        loadFilm(index);
        activate(index);
      });
    }, { threshold: .55 });
    chapters.forEach(function (chapter) { observer.observe(chapter); });
  }

  function setupStatic() {
    root.classList.add('is-static');
    setupCompactObserver();
    loadFilm(0);
    activate(0);
  }

  root.addEventListener('click', function (event) {
    var control = event.target.closest('[data-v23-next]');
    if (!control) return;
    var target = control.getAttribute('data-v23-next');
    if (target === 'footer') return;
    var index = chapters.findIndex(function (chapter) { return chapter.id === target; });
    if (index < 0) return;
    event.preventDefault();
    scrollToChapter(index);
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    var index = chapters.findIndex(function (chapter) { return chapter.id === id; });
    if (index < 0) return;
    event.preventDefault();
    scrollToChapter(index);
    history.replaceState(null, '', '#' + id);
  });

  function boot(attempt) {
    if (compact.matches || reduced.matches) {
      setupStatic();
      return;
    }
    if (window.gsap && window.ScrollTrigger) {
      setupDesktop();
      return;
    }
    if (attempt < 40) {
      window.setTimeout(function () { boot(attempt + 1); }, 50);
      return;
    }
    setupStatic();
  }

  boot(0);

  window.addEventListener('load', function () {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh(true);
    var id = location.hash.slice(1);
    var index = chapters.findIndex(function (chapter) { return chapter.id === id; });
    if (index >= 0) setTimeout(function () { scrollToChapter(index); }, 80);
  });
})();
