/* Canpolat Nakliyat — bağımlılıksız etkileşim ve katmanlı hero sahnesi */
(function () {
  'use strict';

  var FORM_ENDPOINT = '';
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };
  var prefersReducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

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
      { id: 'telefon', message: 'Geçerli bir telefon numarası girin. Örnek: 0 535 912 06 91', test: isValidPhone },
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
      if (!FORM_ENDPOINT) {
        if (successBox) {
          successBox.textContent = 'Teşekkürler! Form bilgileriniz doğrulandı. Hızlı teklif için 0 535 912 06 91 numarasından bize ulaşabilirsiniz.';
          successBox.hidden = false;
        }
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      }).then(function (response) {
        if (!response.ok) throw new Error('request-failed');
        if (successBox) { successBox.textContent = 'Talebiniz alındı. En kısa sürede sizi arayacağız.'; successBox.hidden = false; }
        form.reset();
      }).catch(function () {
        if (alertBox) { alertBox.textContent = 'Form gönderilemedi. Lütfen 0 535 912 06 91 numarasından bize ulaşın.'; alertBox.hidden = false; }
      }).then(function () { if (button) button.disabled = false; });
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

  function initNoopLinks() {
    $$('a[data-noop]').forEach(function (link) {
      link.addEventListener('click', function (event) { event.preventDefault(); });
    });
  }

  function injectHeroSceneStyles() {
    if ($('#hero-live-scene-styles')) return;
    var style = document.createElement('style');
    style.id = 'hero-live-scene-styles';
    style.textContent = [
      '.hero-live-scene{position:relative;z-index:1;display:none;width:100%;aspect-ratio:16/9;overflow:hidden;isolation:isolate;background:#06121b}',
      '.hero-live-scene.is-mounted{display:block}',
      '.hero-live-scene__canvas{position:absolute;left:-10.823%;top:-17.949%;width:110.823%;aspect-ratio:1536/1024;overflow:visible}',
      '.hero-live-scene__base{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;pointer-events:none;user-select:none;-webkit-user-drag:none}',
      '.hero-live-layer{position:absolute;z-index:var(--layer-z,3);height:auto;max-width:none;opacity:0;pointer-events:none;user-select:none;-webkit-user-drag:none;filter:none!important;backface-visibility:hidden;transform-origin:center bottom;transform:translate(-50%,-100%) translate3d(var(--enter-x,0),var(--enter-y,0),0) scale(var(--scene-scale,1));transition:opacity .72s ease var(--delay,0s),transform .95s cubic-bezier(.22,1,.36,1) var(--delay,0s)}',
      '.hero-live-scene.is-ready .hero-live-layer{opacity:1;transform:translate(-50%,-100%) translate3d(0,0,0) scale(var(--scene-scale,1))}',
      '.hero-live-route{position:absolute;inset:0;z-index:2;width:100%;height:100%;overflow:visible;pointer-events:none;opacity:0;transform:translate3d(-22px,-10px,0);transition:opacity .65s ease .08s,transform .95s cubic-bezier(.22,1,.36,1) .08s}',
      '.hero-live-scene.is-ready .hero-live-route{opacity:1;transform:none}',
      '.hero-live-route__path{fill:none;stroke:#ff6a0c;stroke-width:4;stroke-linecap:round;stroke-dasharray:15 12;stroke-dashoffset:72}',
      '.hero-live-scene.is-ready .hero-live-route__path{animation:heroRouteShift 1.05s ease-out .08s forwards}',
      '.hero-live-route__pin{fill:#ff6a0c}',
      '.hero-live-route__hole{fill:#06121b}',
      '@keyframes heroRouteShift{to{stroke-dashoffset:0}}',
      '@media(max-width:991px){.hero-live-scene{aspect-ratio:1000/745}.hero-live-scene__canvas{left:-20.988%;top:-10.497%;width:126.42%}}',
      '@media(max-width:767px){.hero-live-scene{margin-top:2px}.hero-live-layer{--enter-x:0px!important;--enter-y:16px!important;transition-duration:.72s}}',
      '@media(prefers-reduced-motion:reduce){.hero-live-layer,.hero-live-route{opacity:1!important;transform:translate(-50%,-100%) scale(var(--scene-scale,1))!important;transition:none!important}.hero-live-route{transform:none!important}.hero-live-route__path{animation:none!important;stroke-dashoffset:0!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function groundY(x) {
    var gx = [];
    var raw = [686,698,690,705,718,726,728,733,745,753,760,764,768,769,774,777,778,778,774,771,776,774,768,768,758,759,755,749,738,729,722,713,700,688,670];
    var gy = raw.map(function (value) { return value + 140; });
    for (var i = 0; i < 35; i += 1) gx.push(150 + i * 40);
    if (x <= gx[0]) return gy[0];
    if (x >= gx[gx.length - 1]) return gy[gy.length - 1];
    for (var j = 0; j < gx.length - 1; j += 1) {
      if (x >= gx[j] && x <= gx[j + 1]) {
        var t = (x - gx[j]) / (gx[j + 1] - gx[j]);
        return gy[j] + t * (gy[j + 1] - gy[j]);
      }
    }
    return gy[gy.length - 1];
  }

  function createRouteSvg() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'hero-live-route');
    svg.setAttribute('viewBox', '0 0 1536 1024');
    svg.setAttribute('aria-hidden', 'true');

    var path = document.createElementNS(ns, 'path');
    path.setAttribute('class', 'hero-live-route__path');
    path.setAttribute('d', 'M750 192 C675 174 585 188 500 218 C430 243 382 302 358 350 C342 395 355 451 418 496 C442 511 468 516 490 512');
    svg.appendChild(path);

    var pin = document.createElementNS(ns, 'g');
    pin.setAttribute('transform', 'translate(408 260)');
    var body = document.createElementNS(ns, 'path');
    body.setAttribute('class', 'hero-live-route__pin');
    body.setAttribute('d', 'M0-20c-11 0-20 9-20 20 0 15 20 35 20 35S20 15 20 0C20-11 11-20 0-20Z');
    var hole = document.createElementNS(ns, 'circle');
    hole.setAttribute('class', 'hero-live-route__hole');
    hole.setAttribute('r', '7');
    pin.appendChild(body);
    pin.appendChild(hole);
    svg.appendChild(pin);
    return svg;
  }

  function loadImage(img) {
    return new Promise(function (resolve, reject) {
      if (img.complete) {
        if (img.naturalWidth > 0) resolve(img); else reject(new Error('image-load'));
        return;
      }
      img.addEventListener('load', function () { resolve(img); }, { once: true });
      img.addEventListener('error', function () { reject(new Error('image-load')); }, { once: true });
    });
  }

  function initHeroScene() {
    var hero = $('.hero');
    var media = hero ? $('.hero__media', hero) : null;
    var fallbackPicture = media ? $('.hero__picture', media) : null;
    if (!hero || !media || !fallbackPicture) return;

    injectHeroSceneStyles();

    var scene = document.createElement('div');
    scene.className = 'hero-live-scene';
    scene.setAttribute('role', 'img');
    scene.setAttribute('aria-label', 'Canpolat Nakliyat kamyonu, paketlenmiş eşyalar, koliler, koltuk ve taşıma asansörü');

    var canvas = document.createElement('div');
    canvas.className = 'hero-live-scene__canvas';
    scene.appendChild(canvas);

    var base = new Image();
    base.className = 'hero-live-scene__base';
    base.alt = '';
    base.decoding = 'async';
    base.fetchPriority = 'high';
    base.src = 'assets/images/hero-parts/base.webp';
    canvas.appendChild(base);
    canvas.appendChild(createRouteSvg());

    var specs = [
      { name: 'plant', file: 'plant.webp', x: 1495, depth: 125, scale: 0.58, enterX: 18, enterY: 18, delay: 0.24, z: 3 },
      { name: 'lift', file: 'lift.webp', x: 1430, depth: 100, scale: 0.84, enterX: 42, enterY: -10, delay: 0.34, z: 4 },
      { name: 'stack', file: 'stack.webp', x: 510, depth: 74, scale: 0.34, enterX: -44, enterY: 18, delay: 0.44, z: 5 },
      { name: 'wrapped', file: 'wrapped.webp', x: 988, depth: 56, scale: 0.42, enterX: 0, enterY: 36, delay: 0.54, z: 6 },
      { name: 'sofa', file: 'sofa.webp', x: 1130, depth: 48, scale: 0.50, enterX: 46, enterY: 22, delay: 0.64, z: 7 },
      { name: 'boxes', file: 'boxes_sm.webp', x: 850, depth: 22, scale: 0.40, enterX: -10, enterY: 38, delay: 0.74, z: 8 }
    ];

    var layerPromises = specs.map(function (spec) {
      var img = new Image();
      img.className = 'hero-live-layer hero-live-layer--' + spec.name;
      img.alt = '';
      img.decoding = 'async';
      img.src = 'assets/images/hero-parts/' + spec.file;
      img.style.left = (spec.x / 1536 * 100) + '%';
      img.style.top = ((groundY(spec.x) - spec.depth) / 1024 * 100) + '%';
      img.style.setProperty('--scene-scale', String(spec.scale));
      img.style.setProperty('--enter-x', spec.enterX + 'px');
      img.style.setProperty('--enter-y', spec.enterY + 'px');
      img.style.setProperty('--delay', spec.delay + 's');
      img.style.setProperty('--layer-z', String(spec.z));
      canvas.appendChild(img);
      return loadImage(img).then(function () {
        img.style.width = (img.naturalWidth / 1536 * 100) + '%';
        return img;
      }).catch(function () {
        img.remove();
        return null;
      });
    });

    media.insertBefore(scene, fallbackPicture);

    loadImage(base).then(function () {
      return Promise.all(layerPromises);
    }).then(function () {
      fallbackPicture.hidden = true;
      scene.classList.add('is-mounted');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { scene.classList.add('is-ready'); });
      });
    }).catch(function () {
      scene.remove();
      fallbackPicture.hidden = false;
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
    initNoopLinks();
    initHeroScene();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
