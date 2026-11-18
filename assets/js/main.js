/* AI Consulting Studio — логика сайта.
   Данные (услуги, цены, контакты) берутся из assets/js/config.js */
(function () {
  "use strict";

  var C = window.SITE_CONFIG || {};
  var services = C.services || [];
  var contacts = C.contacts || {};
  var owner = C.owner || {};
  var robokassa = C.robokassa || {};

  var ICONS = {
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/><circle cx="19" cy="8" r="1.4" fill="currentColor"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".55"/></svg>',
    prompt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 10l3 2-3 2"/><path d="M12.5 15H17"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>'
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function formatPrice(n) {
    return Number(n).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽";
  }
  function findService(id) {
    for (var i = 0; i < services.length; i++) if (services[i].id === id) return services[i];
    return null;
  }
  function paymentReady(s) {
    return !!(robokassa.enabled && s && s.paymentUrl);
  }

  /* ---------- Контакты и реквизиты ---------- */
  function fillConfigFields() {
    $all('[data-cfg="phone"]').forEach(function (el) {
      el.textContent = contacts.phone;
      if (el.tagName === "A") el.href = "tel:" + contacts.phoneHref;
    });
    $all('[data-cfg="email"]').forEach(function (el) {
      el.textContent = contacts.email;
      if (el.tagName === "A") el.href = "mailto:" + contacts.email;
    });
    $all('[data-cfg="email-link"]').forEach(function (el) { el.href = "mailto:" + contacts.email; });
    $all('[data-cfg="phone-link"]').forEach(function (el) { el.href = "tel:" + contacts.phoneHref; });
    $all('[data-cfg="inn"]').forEach(function (el) { el.textContent = owner.inn; });
    $all('[data-cfg="status"]').forEach(function (el) { el.textContent = owner.status; });
    $all('[data-cfg="fullname"]').forEach(function (el) {
      if (owner.fullName) {
        el.textContent = owner.fullName;
        el.classList.remove("placeholder");
      } else {
        el.textContent = "[поле для заполнения]";
        el.classList.add("placeholder");
      }
    });
    $all('[data-cfg="year"]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // Telegram: если ссылка не указана — кнопки скрыты
    $all("[data-tg]").forEach(function (el) {
      if (contacts.telegram) {
        el.classList.remove("hidden");
        var link = el.tagName === "A" ? el : el.querySelector("[data-tg-link]");
        if (link) { link.href = contacts.telegram; link.target = "_blank"; link.rel = "noopener"; }
      } else {
        el.classList.add("hidden");
      }
    });
    $all("[data-tg-text]").forEach(function (el) {
      el.textContent = contacts.telegram ? "e-mail или Telegram" : "e-mail или по телефону";
    });
  }

  /* ---------- Карточки услуг ---------- */
  function renderServices() {
    var grid = $("#services-grid");
    if (!grid || !services.length) return;
    grid.innerHTML = services.map(function (s) {
      return (
        '<article class="service" id="service-' + esc(s.id) + '">' +
          '<div class="service__icon" aria-hidden="true">' + (ICONS[s.icon] || ICONS.spark) + "</div>" +
          "<h3>" + esc(s.title) + "</h3>" +
          '<p class="service__desc">' + esc(s.description) + "</p>" +
          '<div class="service__price"><b>' + esc(formatPrice(s.price)) + "</b>" +
            (s.unit ? "<span>" + esc(s.unit) + "</span>" : "") + "</div>" +
          '<a class="btn btn--primary btn--block" href="#order" data-order="' + esc(s.id) + '">' + esc(s.button || "Заказать") +
            ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        "</article>"
      );
    }).join("");
  }

  /* ---------- Таблица цен (оферта, условия) ---------- */
  function renderPriceTables() {
    $all("[data-price-table]").forEach(function (tbody) {
      tbody.innerHTML = services.map(function (s, i) {
        return "<tr><td>" + (i + 1) + "</td><td><b>" + esc(s.title) + "</b><br><span class=\"muted\">" + esc(s.description) +
          '</span></td><td class="num">' + esc(formatPrice(s.price)) + (s.unit ? " " + esc(s.unit) : "") + "</td></tr>";
      }).join("");
    });
  }

  /* ---------- Форма заказа ---------- */
  function initOrder() {
    var form = $("#order-form");
    if (!form) return;
    var select = $("#order-service");
    var sumName = $("#summary-service");
    var sumPrice = $("#summary-price");
    var payBtn = $("#pay-btn");
    var payLabel = $("#pay-label");
    var payNotice = $("#pay-notice");
    var sendBtn = $("#send-btn");
    var errorBox = $("#form-error");
    var doneBox = $("#form-done");

    select.innerHTML = services.map(function (s) {
      return '<option value="' + esc(s.id) + '">' + esc(s.title) + " — " + esc(formatPrice(s.price)) + "</option>";
    }).join("");

    function current() { return findService(select.value) || services[0]; }

    function update() {
      var s = current();
      if (!s) return;
      sumName.textContent = s.title;
      sumPrice.textContent = formatPrice(s.price);
      if (paymentReady(s)) {
        payBtn.classList.remove("hidden");
        payLabel.textContent = "Оплатить " + formatPrice(s.price);
        payNotice.classList.add("hidden");
        sendBtn.classList.remove("btn--primary");
        sendBtn.classList.add("btn--outline");
        $("#send-label").textContent = "Отправить задание на e-mail";
      } else {
        payBtn.classList.add("hidden");
        payNotice.classList.remove("hidden");
        sendBtn.classList.add("btn--primary");
        sendBtn.classList.remove("btn--outline");
        $("#send-label").textContent = "Отправить заявку · " + formatPrice(s.price);
      }
    }

    function selectService(id) {
      if (findService(id)) { select.value = id; update(); }
    }

    select.addEventListener("change", update);

    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("[data-order]") : null;
      if (a) selectService(a.getAttribute("data-order"));
    });

    var params = new URLSearchParams(window.location.search);
    if (params.get("service")) selectService(params.get("service"));
    update();

    function clearErrors() {
      errorBox.classList.remove("is-visible");
      $all(".is-invalid", form).forEach(function (el) { el.classList.remove("is-invalid"); });
    }

    function validate(needTask) {
      clearErrors();
      var problems = [];
      var name = $("#order-name"), contact = $("#order-contact"), task = $("#order-task");
      if (!name.value.trim()) { name.closest(".field").classList.add("is-invalid"); problems.push("укажите имя"); }
      if (!contact.value.trim()) { contact.closest(".field").classList.add("is-invalid"); problems.push("укажите e-mail, телефон или Telegram для связи"); }
      if (needTask && !task.value.trim()) { task.closest(".field").classList.add("is-invalid"); problems.push("опишите вопрос или задание"); }
      ["#agree-offer", "#agree-pd"].forEach(function (id) {
        var cb = $(id);
        if (!cb.checked) { cb.closest(".check").classList.add("is-invalid"); }
      });
      if (!$("#agree-offer").checked) problems.push("подтвердите согласие с публичной офертой");
      if (!$("#agree-pd").checked) problems.push("дайте согласие на обработку персональных данных");
      if (problems.length) {
        errorBox.textContent = "Пожалуйста, " + problems.join(", ") + ".";
        errorBox.classList.add("is-visible");
        errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      return true;
    }

    function buildMail() {
      var s = current();
      var subject = (paymentReady(s) ? "Задание по заказу: " : "Заявка на услугу: ") + s.title;
      var body = [
        "Услуга: " + s.title,
        "Стоимость: " + formatPrice(s.price) + (s.unit ? " " + s.unit : ""),
        "Имя: " + $("#order-name").value.trim(),
        "Контакт для связи: " + $("#order-contact").value.trim(),
        "",
        "Вопрос / задание:",
        $("#order-task").value.trim() || "(опишу дополнительно)",
        "",
        "С публичной офертой ознакомлен(а), согласие на обработку персональных данных даю."
      ].join("\n");
      return { subject: subject, body: body };
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(false)) return;
      var m = buildMail();
      window.location.href = "mailto:" + contacts.email +
        "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
      $("#form-done-text").value = m.body;
      doneBox.classList.remove("hidden");
    });

    payBtn.addEventListener("click", function () {
      var s = current();
      if (!paymentReady(s)) return;
      if (!validate(false)) return;
      window.open(s.paymentUrl, "_blank", "noopener");
    });

    var copyBtn = $("#copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var ta = $("#form-done-text");
        ta.select();
        var ok = false;
        try {
          if (navigator.clipboard) { navigator.clipboard.writeText(ta.value); ok = true; }
          else { ok = document.execCommand("copy"); }
        } catch (err) { ok = false; }
        copyBtn.textContent = ok ? "Скопировано" : "Выделите текст и скопируйте вручную";
      });
    }
  }

  /* ---------- Мобильное меню ---------- */
  function initNav() {
    var burger = $(".burger");
    var nav = $(".nav");
    if (!burger || !nav) return;
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $all("a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillConfigFields();
    renderServices();
    renderPriceTables();
    initOrder();
    initNav();
  });
})();
