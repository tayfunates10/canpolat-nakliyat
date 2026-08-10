(function () {
  'use strict';

  if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

  var r8 = document.getElementById('heroAnimated');
  if (!r8) return;

  var TRIGGER_LINE = 0.48;
  var initialScroll = window.scrollY || window.pageYOffset || 0;
  var userMoved = initialScroll > 8;
  var frame = 0;

  /* Keep the approved R8 hidden even if the legacy 78% gate fires first. */
  r8.classList.add('is-r8-trigger-48-lock');

  function usableViewportHeight() {
    var height = window.innerHeight || document.documentElement.clientHeight;
    var bar = document.querySelector('.mobile-contact-bar');
    if (!bar || window.getComputedStyle(bar).display === 'none') return height;
    var rect = bar.getBoundingClientRect();
    return rect.height ? Math.min(height, Math.max(0, rect.top)) : height;
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
    var viewport = usableViewportHeight();
    if (rect.bottom > 0 && rect.top <= viewport * TRIGGER_LINE) {
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
