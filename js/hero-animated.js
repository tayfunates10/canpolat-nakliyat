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
      if (!loaded) return false;

      var decoded = typeof image.decode === 'function'
        ? image.decode().catch(function () { return undefined; })
        : Promise.resolve();

      return decoded.then(function () {
        image.classList.add('is-loaded');
        return true;
      });
    });
  }

  function removeLegacyHeroNodes(stage) {
    var media = stage.closest('.hero__media');
    if (!media) return;

    Array.prototype.slice.call(media.querySelectorAll('picture, img:not(.hero-r8__layer)')).forEach(function (node) {
      node.remove();
    });
  }

  function startHeroAnimation() {
    var stage = document.getElementById('heroAnimated');
    if (!stage) return;

    removeLegacyHeroNodes(stage);

    var layers = Array.prototype.slice.call(stage.querySelectorAll('.hero-r8__layer'));
    if (layers.length !== 13) {
      stage.classList.add('has-error');
      return;
    }

    var readiness = layers.map(function (image) {
      return { image: image, promise: imageReady(image) };
    });

    var critical = readiness.filter(function (entry) {
      return entry.image.classList.contains('hero-r8__layer--p00') ||
             entry.image.classList.contains('hero-r8__layer--t00');
    });

    Promise.all(critical.map(function (entry) { return entry.promise; })).then(function (results) {
      if (!results.every(Boolean)) {
        stage.classList.add('has-error');
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stage.classList.add('is-ready');
          document.documentElement.classList.add('hero-r8-mounted');
        });
      });
    });

    Promise.all(readiness.map(function (entry) { return entry.promise; })).then(function (results) {
      if (results.every(Boolean)) {
        stage.classList.remove('has-error');
      } else {
        stage.classList.add('has-error');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHeroAnimation, { once: true });
  } else {
    startHeroAnimation();
  }
})();
