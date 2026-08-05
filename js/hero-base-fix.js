(function () {
  'use strict';

  var BASE_SOURCE = 'assets/images/hero-parts/base.webp?v=20260806-2';
  var observer;
  var stopTimer;

  function fixBaseImages(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var images = root.querySelectorAll('.hero-fixed-base, .hero-live-scene__base');

    images.forEach(function (image) {
      image.style.setProperty('display', 'block', 'important');
      image.style.setProperty('visibility', 'visible', 'important');
      image.style.setProperty('opacity', '1', 'important');
      image.style.setProperty('filter', 'brightness(1.08) contrast(1.02)', 'important');

      if (image.getAttribute('data-base-source-fixed') !== 'true') {
        image.setAttribute('data-base-source-fixed', 'true');
        image.src = BASE_SOURCE;
      }
    });
  }

  function start() {
    fixBaseImages(document);

    if (!document.body || !window.MutationObserver) return;

    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;

          if (node.matches && node.matches('.hero-fixed-base, .hero-live-scene__base')) {
            fixBaseImages(node.parentNode || document);
          } else if (node.querySelector) {
            fixBaseImages(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    stopTimer = window.setTimeout(function () {
      fixBaseImages(document);
      if (observer) observer.disconnect();
    }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('load', function () {
    fixBaseImages(document);
  }, { once: true });
})();
