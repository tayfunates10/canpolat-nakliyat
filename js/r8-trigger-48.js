(function () {
  'use strict';

  if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

  var r8 = document.getElementById('heroAnimated');
  if (!r8) return;

  var facts = document.querySelector('.hero__facts');
  var anchor = facts ? facts.querySelector('li:nth-child(3)') : null;
  var TARGET_RATIO = 0.525;
  var initialScroll = window.scrollY || window.pageYOffset || 0;
  var userMoved = initialScroll > 8;
  var frame = 0;

  /* Keep the approved R8 hidden even if older percentage/bar-based gates fire.
     The legacy class name remains for compatibility with the final CSS lock.
     The visible timing is calibrated from the user's two mobile screenshots. */
  r8.classList.add('is-r8-trigger-48-lock');

  function contactBarTop() {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var bar = document.querySelector('.mobile-contact-bar');
    if (!bar || window.getComputedStyle(bar).display === 'none') return viewportHeight;

    var rect = bar.getBoundingClientRect();
    if (!rect.height || rect.top <= 0) return viewportHeight;
    return Math.min(viewportHeight, rect.top);
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

  function reveal() {
    r8.classList.add('is-r8-viewport-ready');
    r8.classList.add('is-r8-trigger-48-ready');
    cleanup();
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

    var barTop = contactBarTop();

    if (anchor) {
      var anchorRect = anchor.getBoundingClientRect();
      /* Screenshot calibration (691x1536 captures): desired frame has the
         "Kurulum desteği" card bottom at ~703px while the fixed contact bar
         begins at ~1342px => 703 / 1342 ~= 0.524. Triggering at 0.525 matches
         that visual state and advances the old reveal by roughly 330px. */
      if (anchorRect.bottom <= barTop * TARGET_RATIO) {
        reveal();
        return;
      }
    }

    /* Fallback only if the fact-card anchor is missing: start while the R8
       stage is comfortably above the fixed bar, never later than the old gate. */
    var r8Rect = r8.getBoundingClientRect();
    if (!anchor && r8Rect.bottom > 0 && r8Rect.top <= barTop - 260) reveal();
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
