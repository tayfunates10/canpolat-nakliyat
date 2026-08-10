(function () {
  'use strict';

  if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

  var r8 = document.getElementById('heroAnimated');
  if (!r8) return;

  var CONTACT_BAR_GAP = 12;
  var PRE_ROLL_RATIO = 0.35;
  var PRE_ROLL_MAX = 150;
  var initialScroll = window.scrollY || window.pageYOffset || 0;
  var userMoved = initialScroll > 8;
  var frame = 0;

  /* Keep the approved R8 hidden even if older percentage-based gates fire.
     The legacy class name is retained only for compatibility with the final
     CSS lock. The visible timing is derived from the fixed mobile contact bar. */
  r8.classList.add('is-r8-trigger-48-lock');

  function contactBarTop() {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var bar = document.querySelector('.mobile-contact-bar');
    if (!bar || window.getComputedStyle(bar).display === 'none') {
      return viewportHeight - 24;
    }

    var barRect = bar.getBoundingClientRect();
    if (!barRect.height || barRect.top <= 0) return viewportHeight - 24;
    return Math.min(viewportHeight, barRect.top) - CONTACT_BAR_GAP;
  }

  function cleanup() {
    window.removeEventListener('scroll', queue);
    window.removeEventListener('resize', queue);
    window.removeEventListener('orientationchange', queue);
    window.removeEventListener('touchmove', markMoved);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function markMoved() {
    userMoved = true;
    queue();
  }

  function check() {
    frame = 0;
    if (r8.classList.contains('is-r8-trigger-48-ready')) {
      cleanup();
      return;
    }

    var currentScroll = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(currentScroll - initialScroll) > 4) userMoved = true;
    if (!userMoved) return;

    var rect = r8.getBoundingClientRect();
    var barTop = contactBarTop();
    var preRoll = Math.min(PRE_ROLL_MAX, Math.max(72, rect.height * PRE_ROLL_RATIO));
    var trigger = barTop + preRoll;

    /* Start slightly before the R8 box itself reaches the fixed contact bar.
       This compensates for the staged entrance delay: by the time the first
       visible R8 layers arrive, the scene is visually sitting just above the
       fixed mobile buttons. Geometry, layer positions and animation timings are
       untouched; only the moment the existing animation begins is advanced. */
    if (rect.bottom > 0 && rect.top <= trigger) {
      r8.classList.add('is-r8-viewport-ready');
      r8.classList.add('is-r8-trigger-48-ready');
      cleanup();
    }
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(check);
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', queue, { passive: true });
  window.addEventListener('touchmove', markMoved, { passive: true });
  queue();
})();
