(() => {
  "use strict";

  const MC_ACTION = "https://vancouversummit.us16.list-manage.com/subscribe/post?u=462445c133a7f868b8bb43334&id=0681e93c12&f_id=00e1c2e1f0";
  const configured = /list-manage\.com\/subscribe\/post\?/.test(MC_ACTION);
  let callbackCount = 0;

  function plain(html) {
    const node = document.createElement("div");
    node.innerHTML = html || "";
    return (node.textContent || "").trim().replace(/^\d+\s*-\s*/, "");
  }

  function send(query) {
    return new Promise((resolve, reject) => {
      const callbackName = `cpContactCallback${++callbackCount}`;
      const script = document.createElement("script");
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("timeout"));
      }, 12000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error("network"));
      };
      script.src = `${MC_ACTION.replace("/post?", "/post-json?")}&${query}&c=${callbackName}`;
      document.body.appendChild(script);
    });
  }

  document.querySelectorAll("[data-cp-contact-form]").forEach((form) => {
    const status = form.querySelector("[data-cp-contact-status]");
    const button = form.querySelector("[data-cp-contact-submit]");
    const consent = form.querySelector('[name="CP_CONSENT"]');
    const email = form.querySelector('[name="EMAIL"]');
    const message = form.querySelector('[name="MESSAGE"]');
    const params = configured ? new URLSearchParams(MC_ACTION.split("?")[1]) : null;

    if (params && !form.querySelector(".cp-contact-bot")) {
      const trap = document.createElement("div");
      const trapInput = document.createElement("input");
      trap.className = "cp-contact-bot";
      trap.setAttribute("aria-hidden", "true");
      trapInput.type = "text";
      trapInput.tabIndex = -1;
      trapInput.name = `b_${params.get("u")}_${params.get("id")}`;
      trap.appendChild(trapInput);
      form.appendChild(trap);
    }

    function say(messageText, kind) {
      status.textContent = messageText;
      status.className = `cp-contact-status show ${kind}`;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!email.value.trim() || !email.checkValidity()) {
        say("Please enter a valid email address.", "bad");
        email.focus();
        return;
      }
      if (!message.value.trim()) {
        say("Please leave us a message.", "bad");
        message.focus();
        return;
      }
      if (!consent.checked) {
        say("Please tick the box so we can email you back.", "bad");
        consent.focus();
        return;
      }
      if (!configured) {
        say("This form is not connected yet.", "bad");
        return;
      }

      const formData = new FormData(form);
      formData.delete("CP_CONSENT");
      const query = new URLSearchParams(formData).toString();
      button.disabled = true;
      say("Sending…", "wait");

      send(query).then((data) => {
        if (data && data.result === "success") {
          form.reset();
          say("Thank you for reaching out to C-POLAR. Your message has been received, and a member of our team will be in touch with you shortly.", "ok");
          return;
        }
        say(plain(data && data.msg) || "That did not go through. Please try again.", "bad");
        button.disabled = false;
      }).catch(() => {
        say("We could not reach the server. Please try again in a moment.", "bad");
        button.disabled = false;
      });
    });
  });
})();
