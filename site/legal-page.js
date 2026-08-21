(function () {
  "use strict";

  var article = document.querySelector(".cp-legal-content");
  var toc = document.querySelector(".cp-legal-toc");
  if (article && toc) {
    var used = Object.create(null);
    var headings = Array.prototype.slice.call(article.querySelectorAll("h3, h4"));
    headings = headings.filter(function (heading) {
      var text = heading.textContent.replace(/\u200d/g, "").trim();
      if (!text) {
        heading.remove();
        return false;
      }
      var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
      used[slug] = (used[slug] || 0) + 1;
      heading.id = used[slug] > 1 ? slug + "-" + used[slug] : slug;
      return true;
    });

    headings.forEach(function (heading, index) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + heading.id;
      link.dataset.index = String(index + 1).padStart(2, "0");
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      toc.appendChild(item);
    });

    if ("IntersectionObserver" in window) {
      var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
      var headingObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-18% 0px -68%", threshold: 0 });
      headings.forEach(function (heading) { headingObserver.observe(heading); });
    }
  }

  var revealItems = document.querySelectorAll(".cp-legal-content > *");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.03 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }

  document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-newsletter-status]");
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) status.textContent = "Enter a valid email address.";
        return;
      }
      if (status) status.textContent = "Thank you. Your email has been received.";
      form.reset();
    });
  });
})();
