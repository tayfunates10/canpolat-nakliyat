(function () {
  'use strict';

  function imageReady(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    if (typeof image.decode === 'function') {
      return image.decode().catch(function () {});
    }
    return new Promise(function (resolve) {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  function startHeroAnimation() {
    var stage = document.getElementById('heroAnimated');
    if (!stage) return;

    var images = Array.prototype.slice.call(stage.querySelectorAll('img'));
    var ready = Promise.all(images.map(imageReady));
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 1300); });

    Promise.race([ready, timeout]).then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stage.classList.add('is-ready');
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHeroAnimation, { once: true });
  } else {
    startHeroAnimation();
  }
})();
