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
     intentionally excluded: its original inline SVG is required for the
     existing piece-by-piece brand animation. */
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

  /* The footer contact column stays intact; only the duplicate bottom address
     is removed, leaving the copyright line as the single centered item. */
  document.querySelectorAll('.footer-bottom').forEach(function (footerBottom) {
    var children = footerBottom.children;
    if (children.length > 1) children[children.length - 1].remove();
  });

  /*
   * Mobile entrance gates. The generic section observer intentionally remains
   * untouched for the rest of the site, but R8 and the final CTA are held in
   * their true starting states until their own visual area crosses a fixed
   * lower-middle viewport line. This prevents an animation from being spent
   * before the user is actually looking at the content.
   */
  (function armMobileEntranceGates() {
    if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

    var r8 = document.getElementById('heroAnimated');
    var cta = document.querySelector('.final-cta');
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
             (!cta || cta.classList.contains('is-cta-viewport-ready'));
    }

    function check() {
      frame = 0;
      var currentScroll = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(currentScroll - initialScroll) > 4) userMoved = true;
      if (!userMoved) return;

      var viewport = usableViewportHeight();

      if (r8 && !r8.classList.contains('is-r8-viewport-ready')) {
        var r8Rect = r8.getBoundingClientRect();
        /* R8 starts only when its TOP reaches 62% of the usable viewport.
           At that point the scene is visibly entering the lower-middle area. */
        if (r8Rect.bottom > 0 && r8Rect.top <= viewport * 0.62) {
          r8.classList.add('is-r8-viewport-ready');
        }
      }

      if (cta && !cta.classList.contains('is-cta-viewport-ready')) {
        var ctaRect = cta.getBoundingClientRect();
        /* CTA gets a little more room: its top must reach 68% of the usable
           viewport before any of its staged entrance is allowed to play. */
        if (ctaRect.bottom > 0 && ctaRect.top <= viewport * 0.68) {
          cta.classList.add('is-cta-viewport-ready');
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
