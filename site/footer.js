(function () {
  "use strict";

  var footer = document.getElementById("cp-footer") || document.getElementById("footer");
  if (!footer) return;

  var form = footer.querySelector("[data-newsletter-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-newsletter-status]");
      if (status) status.textContent = "Newsletter signup will be connected before launch.";
    });
  }

})();
