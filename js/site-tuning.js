(function () {
  'use strict';

  var LOGO_SRC = '/assets/images/canpolat-logo-20260810.svg';
  var LOGO_ALT = 'Canpolat Evden Eve Nakliyat';

  function makeLogo(className) {
    var image = document.createElement('img');
    image.className = className;
    image.src = LOGO_SRC;
    image.alt = LOGO_ALT;
    image.width = 1457;
    image.height = 478;
    image.decoding = 'async';
    return image;
  }

  /* Every visible site logo is normalized to the uploaded master artwork. */
  document.querySelectorAll('img[src*="canpolat-logo"]').forEach(function (image) {
    image.src = LOGO_SRC;
    image.width = 1457;
    image.height = 478;
    image.alt = image.alt || LOGO_ALT;
  });

  document.querySelectorAll('svg.brand__logo').forEach(function (logo) {
    logo.replaceWith(makeLogo('brand__logo'));
  });

  document.querySelectorAll('svg.cta__logo').forEach(function (logo) {
    var image = makeLogo('cta__logo');
    image.loading = 'lazy';
    logo.replaceWith(image);
  });

  /* The footer contact column stays intact; only the duplicate bottom address
     is removed, leaving the copyright line as the single centered item. */
  document.querySelectorAll('.footer-bottom').forEach(function (footerBottom) {
    var children = footerBottom.children;
    if (children.length > 1) children[children.length - 1].remove();
  });

  if (typeof IntersectionObserver !== 'function') {
    document.querySelectorAll('main > section .reveal').forEach(function (node) {
      node.classList.add('is-content-visible');
    });
    return;
  }

  var observer = null;
  var resizeTimer = null;

  function visibleBottomInset() {
    var bar = document.querySelector('.mobile-contact-bar');
    if (!bar || window.getComputedStyle(bar).display === 'none') return null;
    var rect = bar.getBoundingClientRect();
    if (!rect.height) return null;
    /* Root ends just above the fixed bar (plus a small breathing gap), so an
       item hidden behind the mobile actions cannot trigger early. */
    return Math.max(0, Math.ceil(window.innerHeight - rect.top + 8));
  }

  function observerMargin() {
    var mobileInset = visibleBottomInset();
    return mobileInset === null ? '0px 0px -8% 0px' : '0px 0px -' + mobileInset + 'px 0px';
  }

  function buildObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-content-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.01,
      rootMargin: observerMargin()
    });

    document.querySelectorAll('main > section.is-armed .reveal:not(.is-content-visible)').forEach(function (node) {
      observer.observe(node);
    });
  }

  buildObserver();

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildObserver, 120);
  }, { passive: true });

  window.addEventListener('orientationchange', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildObserver, 160);
  }, { passive: true });
})();
