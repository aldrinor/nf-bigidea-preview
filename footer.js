(function () {
  "use strict";

  var footer = document.getElementById("cp-footer") || document.getElementById("footer");
  if (!footer) return;

  var form = footer.querySelector("[data-newsletter-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-newsletter-status]");
      var termsBox = footer.querySelector('[name="cp_terms_accept"]');
      if (termsBox && !termsBox.checked) {
        if (status) status.textContent = "Please agree to the Terms of Use and Privacy Policy before subscribing.";
        termsBox.focus();
        return;
      }
      if (status) status.textContent = "Newsletter signup will be connected before launch.";
    });
  }

})();
