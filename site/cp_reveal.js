/* C-POLAR front page - copy reveal.
 *
 * The markup carries reveal hooks - data-animation="Hero", "Title", "TextBlock", "FadeIn" -
 * and an inline rule that parks the scroll cue and the logo strokes at opacity 0 until
 * something brings them in. On the page this was built from, a compiled script read those
 * hooks and ran the reveals. That script is gone, so the hooks sat there doing nothing:
 * the copy simply existed, and "Scroll down" never appeared at all because nothing ever
 * turned its opacity back up.
 *
 * This is that layer, written for this page. Lines come in a word at a time as their block
 * arrives, which is the rhythm the page was composed around - the eye is walked along the
 * sentence instead of being handed a finished paragraph.
 *
 * TWO RULES IT HAS TO KEEP, both learnt from the design guard:
 *
 *   The words must not move where they finally land. Splitting a sentence into spans is
 *   the easy way to change how it wraps. Spaces are preserved as their own text nodes and
 *   <br> is left alone, so the line breaks are the ones the markup asks for.
 *
 *   No wrapper with overflow:hidden. A masked wrapper is the prettier reveal, but an
 *   inline-block that clips changes the line box height, and every line below it shifts.
 *   Opacity and a half-em rise read almost the same and cost nothing.
 *
 * Needs gsap and ScrollTrigger, which the page already loads. It waits for them rather
 * than assuming, so load order cannot break it silently.
 */
(function () {
  "use strict";

  var START = "top 82%";     // titles begin as the section enters
  var TEXT_START = "top 58%"; // supporting copy waits until the reader scrolls deeper
  var STAGGER = 0.035;       // between words. Slower reads as a typewriter, faster as a fade
  var RISE = "0.45em";       // relative to the type size, so big headings travel further

  function words(el) {
    var out = [];
    (function walk(node) {
      var kids = [].slice.call(node.childNodes);
      for (var i = 0; i < kids.length; i++) {
        var n = kids[i];
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/);
          if (parts.length === 1 && !parts[0].trim()) continue;
          var frag = document.createDocumentFragment();
          for (var j = 0; j < parts.length; j++) {
            if (!parts[j]) continue;
            if (/^\s+$/.test(parts[j])) {
              // the space stays an ordinary text node, so wrapping is untouched
              frag.appendChild(document.createTextNode(parts[j]));
            } else {
              var s = document.createElement("span");
              s.className = "cp-w";
              s.textContent = parts[j];
              frag.appendChild(s);
              out.push(s);
            }
          }
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && n.tagName !== "SVG") {
          walk(n);
        }
      }
    })(el);
    return out;
  }

  function start(gsap, ScrollTrigger) {
    var css = document.createElement("style");
    css.textContent = ".cp-w{display:inline-block;will-change:transform,opacity}";
    document.head.appendChild(css);

    document.querySelectorAll('[data-animation="Title"],[data-animation="TextBlock"]')
      .forEach(function (el) {
        var w = words(el);
        if (!w.length) return;
        var revealStart = el.matches('[data-chapter="WhoWeAre"] h2')
          ? "top 98%"
          : (el.matches('[data-animation="TextBlock"]') ? TEXT_START : START);
        gsap.from(w, {
          opacity: 0, y: RISE, duration: 0.85, ease: "power3.out", stagger: STAGGER,
          scrollTrigger: {
            trigger: el,
            start: revealStart,
            once: true
          }
        });
      });

    // Blocks that arrive whole rather than word by word.
    document.querySelectorAll('[data-animation="Hero"],[data-animation="FadeIn"]')
      .forEach(function (el) {
        gsap.from(el, {
          opacity: 0, y: 18, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: START, once: true }
        });
      });

    // Parked at opacity 0 by an inline rule in the page, waiting for a script that no
    // longer exists. The cue belongs on the first screen, so it comes in on load.
    var cue = document.querySelectorAll(".scroll-to-cta, .logo-dk > path, .logo-dk > g");
    if (cue.length) gsap.to(cue, { opacity: 1, duration: 0.7, delay: 0.5, ease: "power2.out" });

    ScrollTrigger.refresh();
  }

  var tries = 0;
  (function wait() {
    var g = window.gsap, s = window.ScrollTrigger;
    if (g && s) { start(g, s); return; }
    if (++tries > 200) return;               // ~3s, then give up quietly rather than spin
    requestAnimationFrame(wait);
  })();
})();
