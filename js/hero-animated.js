(function () {
  'use strict';

  function imageReady(image) {
    return new Promise(function (resolve) {
      if (image.complete) {
        resolve(image.naturalWidth > 0);
        return;
      }

      image.addEventListener('load', function () { resolve(true); }, { once: true });
      image.addEventListener('error', function () {
        image.classList.add('is-missing');
        resolve(false);
      }, { once: true });
    }).then(function (loaded) {
      if (!loaded || typeof image.decode !== 'function') return loaded;
      return image.decode().then(function () { return true; }).catch(function () { return true; });
    });
  }

  function startHeroAnimation() {
    var stage = document.getElementById('heroAnimated');
    if (!stage) return;

    var layers = Array.prototype.slice.call(stage.querySelectorAll('.hero-r8__layer'));
    if (layers.length !== 13) {
      stage.classList.add('has-error');
      return;
    }

    Promise.all(layers.map(imageReady)).then(function (results) {
      var allLoaded = results.every(Boolean);

      if (!allLoaded) {
        stage.classList.add('has-error');
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stage.classList.remove('has-error');
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
