/* IndiSolution — shared page behaviour: menu, contact details, forms. */
(function () {
  "use strict";
  var C = window.INDI_CONFIG || {};

  // ---- Mobile menu ----
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Contact details from config.js ----
  var waLink = C.whatsapp ? "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") : "";
  var telLink = C.phone ? "tel:" + String(C.phone).replace(/[^\d+]/g, "") : "";
  var mailLink = C.email ? "mailto:" + C.email : "";

  document.querySelectorAll("[data-contact]").forEach(function (el) {
    var kind = el.getAttribute("data-contact");
    var map = {
      phone: [C.phone, telLink],
      whatsapp: [C.whatsapp ? "Chat on WhatsApp" : "", waLink],
      email: [C.email, mailLink],
      hours: [C.hours, ""],
      city: [C.city, ""]
    };
    var v = map[kind];
    if (!v || !v[0]) {
      var row = el.closest("[data-contact-row]");
      if (row) row.hidden = true; else el.hidden = true;
      return;
    }
    if (el.tagName === "A") {
      if (v[1]) el.href = v[1];
      if (kind === "whatsapp") { el.target = "_blank"; el.rel = "noopener"; }
      if (!el.hasAttribute("data-keep-text")) el.textContent = v[0];
    } else {
      el.textContent = v[0];
    }
  });

  var wa = document.querySelector(".wa-float");
  if (wa && waLink) { wa.href = waLink; wa.classList.add("show"); }

  document.querySelectorAll("[data-accounts-link]").forEach(function (a) {
    if (C.accountsUrl) a.href = C.accountsUrl;
  });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // ---- Pre-select requirement from ?topic= ----
  var params = new URLSearchParams(location.search);
  var topic = params.get("topic");
  var sel = document.getElementById("f-requirement");
  if (topic && sel) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === topic) { sel.selectedIndex = i; break; }
    }
  }

  // ---- Screenshot lightbox (links still open the image if this fails) ----
  var shotLinks = document.querySelectorAll("a[data-lightbox]");
  if (shotLinks.length && window.HTMLDialogElement) {
    var box = document.createElement("dialog");
    box.className = "lightbox";
    box.innerHTML = '<button type="button" aria-label="Close">&times;</button><img alt=""><p></p>';
    document.body.appendChild(box);
    var boxImg = box.querySelector("img"), boxCap = box.querySelector("p");
    box.querySelector("button").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box || e.target === boxImg) box.close(); });
    shotLinks.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var fig = a.closest("figure");
        boxImg.src = a.href;
        boxImg.alt = a.querySelector("img").alt;
        boxCap.textContent = fig && fig.querySelector("figcaption") ? fig.querySelector("figcaption").textContent : "";
        box.showModal();
      });
    });
  }

  // ---- Forms ----
  document.querySelectorAll("form[data-indi-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var status = form.querySelector(".form-status");
      var btn = form.querySelector("button[type=submit]");

      function show(msg, ok) {
        if (!status) return;
        status.textContent = msg;
        status.className = "form-status show " + (ok ? "ok" : "err");
        status.focus && status.focus();
      }

      if (!form.checkValidity()) { form.reportValidity(); return; }
      // spam trap: real people never fill the hidden field
      if (form.querySelector("[name=website]") && form.querySelector("[name=website]").value) return;

      var data = new URLSearchParams();
      data.append("form", form.getAttribute("data-indi-form"));
      data.append("page", location.href);
      new FormData(form).forEach(function (val, key) {
        if (key !== "website") data.append(key, String(val).trim());
      });

      if (!C.formEndpoint) {
        // No backend yet: open the visitor's email app with everything filled in.
        var subject = (form.getAttribute("data-indi-form") === "trial" ? "Unit Accounts trial request" : "Enquiry") +
          " — " + (data.get("organisation") || data.get("unit") || data.get("name") || "");
        var body = "";
        data.forEach(function (val, key) { if (key !== "form" && key !== "page" && val) body += key.charAt(0).toUpperCase() + key.slice(1) + ": " + val + "\n"; });
        if (C.email) {
          location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
          show("Your email app should open with your message ready. Please press Send there.", true);
        } else {
          show("Sorry, the form is not set up yet. Please call or WhatsApp us.", false);
        }
        return;
      }

      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
      fetch(C.formEndpoint, { method: "POST", mode: "no-cors", body: data })
        .then(function () {
          form.reset();
          show("Thank you. We have received your details and will get back to you within one working day.", true);
        })
        .catch(function () {
          show("Sorry, we could not send this. Please check your internet connection, or call / WhatsApp us.", false);
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  });
})();
