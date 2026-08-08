/* Canpolat Nakliyat — bağımlılıksız etkileşim ve dönüşüm altyapısı */
(function () {
  'use strict';

  var WHATSAPP_QUOTE_URL = 'https://wa.me/905359120691';
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };
  var prefersReducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  function emitConversion(name, detail) {
    var payload = Object.assign({ event: name }, detail || {});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('canpolat:conversion', { detail: payload }));
  }

  var headerEl = $('#site-header');
  var getHeaderHeight = function () { return headerEl ? headerEl.offsetHeight : 0; };

  function initHeaderScroll() {
    if (!headerEl) return;
    var ticking = false;
    function update() {
      headerEl.classList.toggle('is-scrolled', window.pageYOffset > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function initMobileMenu() {
    var toggle = $('#menu-toggle');
    var menu = $('#mobile-menu');
    var overlay = $('#menu-overlay');
    var closeBtn = $('#menu-close');
    if (!toggle || !menu || !overlay) return;

    var focusableSelector = 'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])';
    var isOpen = false;

    function openMenu() {
      if (isOpen) return;
      isOpen = true;
      overlay.hidden = false;
      window.requestAnimationFrame(function () { overlay.classList.add('is-visible'); });
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menüyü kapat');
      document.documentElement.classList.add('is-menu-open');
      window.requestAnimationFrame(function () {
        var first = menu.querySelector(focusableSelector);
        if (first) first.focus();
      });
    }

    function closeMenu(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-visible');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menüyü aç');
      document.documentElement.classList.remove('is-menu-open');
      window.setTimeout(function () { if (!isOpen) overlay.hidden = true; }, 260);
      if (returnFocus !== false) toggle.focus();
    }

    toggle.addEventListener('click', function () { if (isOpen) closeMenu(); else openMenu(); });
    if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(); });
    overlay.addEventListener('click', function () { closeMenu(); });
    $$('.mobile-menu__link, .mobile-menu__foot a', menu).forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) return;
      if (event.key === 'Escape') { closeMenu(); return; }
      if (event.key !== 'Tab') return;
      var items = $$(focusableSelector, menu).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 991 && isOpen) closeMenu(false);
    });
  }

  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - getHeaderHeight() - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', hash);
    });
  }

  function initFaq() {
    var buttons = $$('.faq__question');
    if (!buttons.length) return;
    function closePanel(button) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', 'false');
      if (panel) panel.style.maxHeight = '';
      var item = button.closest('.faq__item');
      if (item) item.classList.remove('is-open');
    }
    function openPanel(button) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', 'true');
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
      var item = button.closest('.faq__item');
      if (item) item.classList.add('is-open');
    }
    buttons.forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', function () {
        var willOpen = button.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(closePanel);
        if (willOpen) openPanel(button);
      });
    });
    window.addEventListener('resize', function () {
      buttons.forEach(function (button) {
        if (button.getAttribute('aria-expanded') === 'true') openPanel(button);
      });
    });
  }

  function initQuoteForm() {
    var form = $('#quote-form');
    if (!form) return;
    var alertBox = $('#form-alert');
    var successBox = $('#form-success');
    var rules = [
      { id: 'ad-soyad', message: 'Lütfen ad ve soyadınızı yazın.', test: function (v) { return v.length >= 3; } },
      { id: 'telefon', message: 'Geçerli bir telefon numarası girin. Örnek: 0535 912 06 91', test: isValidPhone },
      { id: 'eposta', message: 'Geçerli bir e-posta adresi girin.', optional: true, test: isValidEmail },
      { id: 'nereden', message: 'Taşınacağınız yeri (il / ilçe) yazın.', test: function (v) { return v.length >= 2; } },
      { id: 'nereye', message: 'Varış yerini (il / ilçe) yazın.', test: function (v) { return v.length >= 2; } },
      { id: 'tarih', message: 'Planladığınız taşınma tarihini yazın.', test: function (v) { return v.length >= 4; } }
    ];

    function isValidEmail(value) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value); }
    function isValidPhone(value) {
      var digits = value.replace(/\D/g, '');
      if (digits.indexOf('90') === 0 && digits.length === 12) digits = digits.slice(2);
      if (digits.indexOf('0') === 0 && digits.length === 11) digits = digits.slice(1);
      return digits.length === 10 && digits.charAt(0) === '5';
    }
    function setError(field, message) {
      var errorBox = document.getElementById('err-' + field.id);
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        if (errorBox) { errorBox.textContent = message; errorBox.classList.add('is-visible'); }
      } else {
        field.removeAttribute('aria-invalid');
        if (errorBox) { errorBox.textContent = ''; errorBox.classList.remove('is-visible'); }
      }
    }
    function validate() {
      var firstInvalid = null;
      rules.forEach(function (rule) {
        var field = document.getElementById(rule.id);
        if (!field) return;
        var value = field.value.trim();
        var invalid = !value ? !rule.optional : !rule.test(value);
        setError(field, invalid ? rule.message : '');
        if (invalid && !firstInvalid) firstInvalid = field;
      });
      return firstInvalid;
    }

    rules.forEach(function (rule) {
      var field = document.getElementById(rule.id);
      if (!field) return;
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') setError(field, '');
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (successBox) successBox.hidden = true;
      var firstInvalid = validate();
      if (firstInvalid) {
        if (alertBox) { alertBox.textContent = 'Lütfen işaretli alanları kontrol edin.'; alertBox.hidden = false; }
        firstInvalid.focus();
        return;
      }
      if (alertBox) alertBox.hidden = true;
      var data = new FormData(form);
      var lines = [
        'Merhaba Canpolat Nakliyat, fiyat teklifi almak istiyorum.',
        '',
        'Ad Soyad: ' + String(data.get('adSoyad') || ''),
        'Telefon: ' + String(data.get('telefon') || ''),
        'Nereden: ' + String(data.get('nereden') || ''),
        'Nereye: ' + String(data.get('nereye') || ''),
        'Taşınma Tarihi: ' + String(data.get('tarih') || '')
      ];
      if (data.get('eposta')) lines.push('E-posta: ' + String(data.get('eposta')));
      if (data.get('notlar')) lines.push('Not: ' + String(data.get('notlar')));

      var quoteUrl = WHATSAPP_QUOTE_URL + '?text=' + encodeURIComponent(lines.join('\n'));
      var popup = window.open(quoteUrl, '_blank');
      if (popup) popup.opener = null;
      else window.location.assign(quoteUrl);

      emitConversion('quote_form_submit', { conversion_location: 'home_form' });
      if (successBox) {
        successBox.textContent = 'WhatsApp mesajınız hazırlandı. Göndermeden önce mesajı WhatsApp içinde inceleyebilirsiniz.';
        successBox.hidden = false;
      }
    });

    $$('[data-date-field]').forEach(function (field) {
      field.addEventListener('focus', function () { if (field.type === 'text') field.type = 'date'; });
      field.addEventListener('blur', function () { if (!field.value) field.type = 'text'; });
    });
  }

  function initYear() {
    var yearEl = $('#current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function initImageFallback() {
    $$('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) img.classList.add('is-missing');
      else {
        img.addEventListener('error', function () { img.classList.add('is-missing'); });
        img.addEventListener('load', function () { img.classList.remove('is-missing'); });
      }
    });
  }

  function initReveal() {
    var items = $$('.section, .cta');
    if (!items.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    items.forEach(function (item) { item.classList.add('reveal'); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function initConversionTracking() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('[data-analytics-event]') : null;
      if (!link || link.tagName === 'FORM') return;
      emitConversion(link.getAttribute('data-analytics-event'), {
        conversion_location: link.getAttribute('data-analytics-location') || 'unknown'
      });
    });
  }

  function init() {
    initHeaderScroll();
    initMobileMenu();
    initSmoothScroll();
    initFaq();
    initQuoteForm();
    initYear();
    initImageFallback();
    initReveal();
    initConversionTracking();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
