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

  /* Image-based site logos use the uploaded master artwork. The header logo is
     intentionally excluded only when it is the approved inline SVG on home. */
  document.querySelectorAll('img[src*="canpolat-logo"]').forEach(function (image) {
    image.src = LOGO_SRC;
    image.width = 1457;
    image.height = 478;
    image.alt = image.alt || LOGO_ALT;
  });

  document.querySelectorAll('svg.cta__logo').forEach(function (logo) {
    var image = makeLogo('cta__logo');
    image.loading = 'lazy';
    logo.replaceWith(image);
  });

  /* Normalize shared header/footer chrome on every inner and local SEO page.
     Local pages were generated from a compact template, so some of them lack
     the footer social row even though the rest of the site has it. */
  (function normalizeSharedChrome() {
    var regionNav = document.querySelector('.site-footer [data-footer-regions]');
    if (regionNav) {
      regionNav.classList.add('footer-regions');
      if (regionNav.previousElementSibling) {
        regionNav.previousElementSibling.classList.add('footer-regions__title');
      }
    }

    var footerBrand = document.querySelector('.site-footer .footer-brand');
    if (!footerBrand || footerBrand.querySelector('.footer-social')) return;

    function socialLink(href, label, pathData) {
      var link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', label);

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');

      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
      link.appendChild(svg);
      return link;
    }

    var social = document.createElement('nav');
    social.className = 'footer-social';
    social.setAttribute('aria-label', 'Sosyal medya');
    social.appendChild(socialLink(
      'https://wa.me/905359120691',
      'WhatsApp’tan yazın',
      'M12 2.3a9.6 9.6 0 0 0-8.2 14.6L2.3 21.7l4.9-1.4A9.6 9.6 0 1 0 12 2.3Zm4.8 13.2c-.2.6-1.2 1.1-1.7 1.2-.5 0-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.8-4.3-.2-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.1.2-.3.5-.3.7-.3h.6c.2 0 .4 0 .6.5l.8 2.1c.1.2.1.3 0 .5l-.3.4-.4.4c-.2.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.2.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2.1 1c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z'
    ));
    social.appendChild(socialLink(
      'https://www.instagram.com/canpolatevdenevenk',
      'Instagram sayfamız',
      'M7.6 2.3h8.8a5.3 5.3 0 0 1 5.3 5.3v8.8a5.3 5.3 0 0 1-5.3 5.3H7.6a5.3 5.3 0 0 1-5.3-5.3V7.6A5.3 5.3 0 0 1 7.6 2.3ZM7.6 4.6A3 3 0 0 0 4.6 7.6v8.8a3 3 0 0 0 3 3h8.8a3 3 0 0 0 3-3V7.6a3 3 0 0 0-3-3ZM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10Zm0 2.15a2.85 2.85 0 1 0 0 5.7 2.85 2.85 0 1 0 0-5.7Zm5.1-3.6a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 1 0 0-2.7Z'
    ));
    footerBrand.appendChild(social);
  })();

  /* The footer contact column stays intact; only the duplicate bottom address
     is removed, leaving the copyright line as the single centered item. */
  document.querySelectorAll('.footer-bottom').forEach(function (footerBottom) {
    var children = footerBottom.children;
    if (children.length > 1) children[children.length - 1].remove();
  });

  /*
   * Mobile entrance gates. R8 is deliberately locked to the previously
   * approved 78% lower-viewport trigger. Its staged animation then becomes
   * visible around the middle of the screen instead of starting after the
   * whole scene has already scrolled upward.
   */
  (function armMobileEntranceGates() {
    if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

    var R8_TRIGGER_LINE = 0.78;
    var CTA_TRIGGER_LINE = 0.68;
    var CTA_TRUCK_TRIGGER_LINE = 0.78;

    var r8 = document.getElementById('heroAnimated');
    var cta = document.querySelector('.final-cta');
    var ctaTruck = cta ? cta.querySelector('.final-cta__stage') : null;
    if (!r8 && !cta) return;

    var frame = 0;
    var initialScroll = window.scrollY || window.pageYOffset || 0;
    var userMoved = initialScroll > 8;

    function usableViewportHeight() {
      var height = window.innerHeight || document.documentElement.clientHeight;
      var bar = document.querySelector('.mobile-contact-bar');
      if (!bar || window.getComputedStyle(bar).display === 'none') return height;
      var rect = bar.getBoundingClientRect();
      return rect.height ? Math.min(height, Math.max(0, rect.top)) : height;
    }

    function done() {
      return (!r8 || r8.classList.contains('is-r8-viewport-ready')) &&
             (!cta || cta.classList.contains('is-cta-viewport-ready')) &&
             (!ctaTruck || cta.classList.contains('is-cta-truck-viewport-ready'));
    }

    function check() {
      frame = 0;
      var currentScroll = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(currentScroll - initialScroll) > 4) userMoved = true;
      if (!userMoved) return;

      var viewport = usableViewportHeight();

      if (r8 && !r8.classList.contains('is-r8-viewport-ready')) {
        var r8Rect = r8.getBoundingClientRect();
        if (r8Rect.bottom > 0 && r8Rect.top <= viewport * R8_TRIGGER_LINE) {
          r8.classList.add('is-r8-viewport-ready');
        }
      }

      if (cta && !cta.classList.contains('is-cta-viewport-ready')) {
        var ctaRect = cta.getBoundingClientRect();
        if (ctaRect.bottom > 0 && ctaRect.top <= viewport * CTA_TRIGGER_LINE) {
          cta.classList.add('is-cta-viewport-ready');
        }
      }

      if (ctaTruck && !cta.classList.contains('is-cta-truck-viewport-ready')) {
        var truckRect = ctaTruck.getBoundingClientRect();
        if (truckRect.bottom > 0 && truckRect.top <= viewport * CTA_TRUCK_TRIGGER_LINE) {
          cta.classList.add('is-cta-truck-viewport-ready');
        }
      }

      if (done()) cleanup();
    }

    function queue() {
      if (!frame) frame = requestAnimationFrame(check);
    }

    function cleanup() {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('orientationchange', queue);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('orientationchange', queue, { passive: true });
    queue();
  })();

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