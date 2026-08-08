/* Canpolat Nakliyat — BÖLÜM 03 / Hakkımızda görünürlük animasyonu */
(function () {
  'use strict';

  var section = document.querySelector('.about-v2');
  if (!section) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    section.classList.add('is-inview');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      section.classList.add('is-inview');
      observer.disconnect();
    });
  }, {
    root: null,
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.16
  });

  observer.observe(section);
})();
