/* ==========================================================================
   CANPOLAT NAKLİYAT — script.js
   Vanilla JavaScript. Bağımlılık yoktur.

   İçindekiler:
     01. Yardımcılar
     02. Header scroll durumu
     03. Mobil menü (off-canvas)
     04. Sayfa içi yumuşak kaydırma
     05. SSS accordion
     06. Fiyat teklif formu
     07. Telif yılı
     08. Görsel yükleme hatası
     09. Scroll ile beliren bölümler
     10. Küçük yardımcı davranışlar
   ========================================================================== */
(function () {
  'use strict';

  /* Gerçek bir backend bağlanacaksa yalnızca bu değer doldurulur.
     Boş bırakılırsa form demo modunda çalışır. */
  var FORM_ENDPOINT = '';

  /* ==========================================================================
     01. YARDIMCILAR
     ========================================================================== */
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var prefersReducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  var headerEl = $('#site-header');

  var getHeaderHeight = function () {
    return headerEl ? headerEl.offsetHeight : 0;
  };

  /* ==========================================================================
     02. HEADER SCROLL DURUMU
     ========================================================================== */
  function initHeaderScroll() {
    if (!headerEl) return;

    var ticking = false;

    function update() {
      headerEl.classList.toggle('is-scrolled', window.pageYOffset > 8);
      ticking = false;
    }

    // Scroll olayı requestAnimationFrame ile sınırlandırılır
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* ==========================================================================
     03. MOBİL MENÜ
     ========================================================================== */
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
      // hidden kaldırıldıktan sonra geçişin çalışması için bir kare beklenir
      window.requestAnimationFrame(function () { overlay.classList.add('is-visible'); });

      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menüyü kapat');
      document.documentElement.classList.add('is-menu-open');

      // Menü görünür hale geldikten sonra ilk bağlantıya odaklanılır
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

      window.setTimeout(function () {
        if (!isOpen) overlay.hidden = true;
      }, 260);

      if (returnFocus !== false) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen) closeMenu(); else openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(); });
    overlay.addEventListener('click', function () { closeMenu(); });

    // Menü bağlantısına tıklanınca menü kapanır (odak hedef bölüme geçer)
    $$('.mobile-menu__link, .mobile-menu__foot a', menu).forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });

    // Escape ile kapatma + odak tuzağı
    document.addEventListener('keydown', function (event) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      var items = $$(focusableSelector, menu).filter(function (el) {
        return el.offsetParent !== null;
      });
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

    // Masaüstü genişliğine dönülürse menü kapatılır
    window.addEventListener('resize', function () {
      if (window.innerWidth > 991 && isOpen) closeMenu(false);
    });
  }

  /* ==========================================================================
     04. SAYFA İÇİ YUMUŞAK KAYDIRMA (sticky header yüksekliği hesaba katılır)
     ========================================================================== */
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

      window.scrollTo({
        top: top < 0 ? 0 : top,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });

      // Erişilebilirlik: odak hedef bölüme taşınır
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });

      if (history.replaceState) history.replaceState(null, '', hash);
    });
  }

  /* ==========================================================================
     05. SSS ACCORDION — aynı anda yalnızca bir soru açık
     ========================================================================== */
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
      // Başlangıçta tüm paneller kapalıdır (CSS max-height: 0)
      button.setAttribute('aria-expanded', 'false');

      button.addEventListener('click', function () {
        var willOpen = button.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(closePanel);
        if (willOpen) openPanel(button);
      });
    });

    // Pencere yeniden boyutlandığında açık panelin yüksekliği güncellenir
    window.addEventListener('resize', function () {
      buttons.forEach(function (button) {
        if (button.getAttribute('aria-expanded') === 'true') openPanel(button);
      });
    });
  }

  /* ==========================================================================
     06. FİYAT TEKLİF FORMU
     ========================================================================== */
  function initQuoteForm() {
    var form = $('#quote-form');
    if (!form) return;

    var alertBox = $('#form-alert');
    var successBox = $('#form-success');

    var rules = [
      { id: 'ad-soyad', message: 'Lütfen ad ve soyadınızı yazın.', test: function (v) { return v.length >= 3; } },
      { id: 'telefon',  message: 'Geçerli bir telefon numarası girin. Örnek: 0 535 912 06 91', test: isValidPhone },
      { id: 'eposta',   message: 'Geçerli bir e-posta adresi girin.', optional: true, test: isValidEmail },
      { id: 'nereden',  message: 'Taşınacağınız yeri (il / ilçe) yazın.', test: function (v) { return v.length >= 2; } },
      { id: 'nereye',   message: 'Varış yerini (il / ilçe) yazın.', test: function (v) { return v.length >= 2; } },
      { id: 'tarih',    message: 'Planladığınız taşınma tarihini yazın.', test: function (v) { return v.length >= 4; } }
    ];

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
    }

    // Temel Türkiye telefon formatı: 5xxxxxxxxx / 05xx... / +905xx...
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
        if (errorBox) {
          errorBox.textContent = message;
          errorBox.classList.add('is-visible');
        }
      } else {
        field.removeAttribute('aria-invalid');
        if (errorBox) {
          errorBox.textContent = '';
          errorBox.classList.remove('is-visible');
        }
      }
    }

    function validate() {
      var firstInvalid = null;

      rules.forEach(function (rule) {
        var field = document.getElementById(rule.id);
        if (!field) return;

        var value = field.value.trim();
        var invalid = false;

        if (!value) {
          invalid = !rule.optional;
        } else {
          invalid = !rule.test(value);
        }

        setError(field, invalid ? rule.message : '');
        if (invalid && !firstInvalid) firstInvalid = field;
      });

      return firstInvalid;
    }

    // Kullanıcı düzeltme yaptıkça hata mesajı temizlenir
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
        if (alertBox) {
          alertBox.textContent = 'Lütfen işaretli alanları kontrol edin.';
          alertBox.hidden = false;
        }
        firstInvalid.focus();
        return;
      }

      if (alertBox) alertBox.hidden = true;

      if (!FORM_ENDPOINT) {
        // Demo mod: veriler gönderilmez, alanlar korunur.
        if (successBox) {
          successBox.textContent = 'Teşekkürler! Form bilgileriniz başarıyla doğrulandı. ' +
            'Bu bir demo gönderimidir; hızlı teklif için 0 535 912 06 91 numarasından bize ulaşabilirsiniz.';
          successBox.hidden = false;
        }
        return;
      }

      // Gerçek gönderim
      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      }).then(function (response) {
        if (!response.ok) throw new Error('request-failed');
        if (successBox) {
          successBox.textContent = 'Talebiniz alındı. En kısa sürede sizi arayacağız.';
          successBox.hidden = false;
        }
        form.reset();
      }).catch(function () {
        if (alertBox) {
          alertBox.textContent = 'Form gönderilemedi. Lütfen 0 535 912 06 91 numarasından bize ulaşın.';
          alertBox.hidden = false;
        }
      }).then(function () {
        if (button) button.disabled = false;
      });
    });

    // Tarih alanı: boşken placeholder görünür, odaklanınca tarih seçici açılır
    $$('[data-date-field]').forEach(function (field) {
      field.addEventListener('focus', function () {
        if (field.type === 'text') field.type = 'date';
      });
      field.addEventListener('blur', function () {
        if (!field.value) field.type = 'text';
      });
    });
  }

  /* ==========================================================================
     07. TELİF YILI
     ========================================================================== */
  function initYear() {
    var yearEl = $('#current-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ==========================================================================
     08. GÖRSEL YÜKLEME HATASI
     Not: erken hata yakalama <head> içindeki küçük betikle yapılır.
     Burada, betik çalışmadan önce tamamlanmış görseller kontrol edilir.
     ========================================================================== */
  function initImageFallback() {
    $$('img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('is-missing');
      } else {
        img.addEventListener('error', function () { img.classList.add('is-missing'); });
        // Görsel sonradan yüklenirse yedek durumu kalkar
        img.addEventListener('load', function () { img.classList.remove('is-missing'); });
      }
    });
  }

  /* ==========================================================================
     09. SCROLL İLE BELİREN BÖLÜMLER (çok hafif)
     ========================================================================== */
  function initReveal() {
    var items = $$('.section, .cta');
    if (!items.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

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

  /* ==========================================================================
     10. KÜÇÜK YARDIMCI DAVRANIŞLAR
     ========================================================================== */
  function initNoopLinks() {
    // Henüz adresi belli olmayan bağlantılar sayfayı başa döndürmez
    $$('a[data-noop]').forEach(function (link) {
      link.addEventListener('click', function (event) { event.preventDefault(); });
    });
  }

  /* ==========================================================================
     BAŞLATMA
     ========================================================================== */
  function init() {
    initHeaderScroll();
    initMobileMenu();
    initSmoothScroll();
    initFaq();
    initQuoteForm();
    initYear();
    initImageFallback();
    initReveal();
    initNoopLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
