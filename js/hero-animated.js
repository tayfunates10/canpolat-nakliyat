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

  /*
   * Sahne görünür alana girdiğinde çözülen bekleme. Kullanıcı sahneyi hiç
   * görmeden animasyon harcanmasın diye giriş, kesişim gözlemcisine bağlanır.
   * Gözlemci desteklenmiyorsa veya sahne zaten ekrandaysa beklemeden çözülür.
   */
  function whenInView(element) {
    return new Promise(function (resolve) {
      if (typeof IntersectionObserver !== 'function') {
        resolve();
        return;
      }

      var settled = false;
      function settle() {
        if (settled) return;
        settled = true;
        if (observer) observer.disconnect();
        clearTimeout(safety);
        resolve();
      }

      var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) {
            settle();
            return;
          }
        }
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

      /* Gözlemci hiç tetiklenmezse katmanlar görünmez kalmasın. */
      var safety = setTimeout(settle, 8000);
      observer.observe(element);
    });
  }

  function startHeroAnimation() {
    var stage = document.getElementById('heroAnimated');
    if (!stage) return;

    stage.classList.add('is-loading');
    removeLegacyHeroNodes(stage);

    var layers = Array.prototype.slice.call(stage.querySelectorAll('.hero-r8__layer'));
    if (layers.length !== 14) {
      stage.classList.remove('is-loading');
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

    /*
     * Tek bir görünürlük sözü iki akış tarafından da paylaşılır. is-loading
     * sınıfı sahne ekrana girmeden kaldırılırsa katmanlar sahne görünmezken
     * açılmaya başlar; bu yüzden yükleme sonucu da aynı söze bağlanır.
     */
    var inView = whenInView(stage);

    Promise.all(critical.map(function (entry) { return entry.promise; })).then(function (results) {
      if (!results.every(Boolean)) {
        stage.classList.remove('is-loading');
        stage.classList.add('has-error');
        return;
      }

      return inView.then(function () {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            stage.classList.add('is-ready');
            document.documentElement.classList.add('hero-r8-mounted');
          });
        });
      });
    });

    Promise.all(readiness.map(function (entry) { return entry.promise; })).then(function (results) {
      return inView.then(function () { return results; });
    }).then(function (results) {
      stage.classList.remove('is-loading');
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
