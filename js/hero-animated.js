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
   * Sahne görünür alana girdiğinde çözülen bekleme. Masaüstündeki mevcut erken
   * hazırlık davranışı korunur. Telefonda ise sahne ilk ekranın altında olsa
   * bile animasyon harcanmaz; R8'in üst kısmı ekranın yaklaşık %65 seviyesine
   * ulaştığında giriş başlar. Böylece sahne kullanıcının görüş alanına doğru
   * gelirken katmanlar tek tek kurulmaya başlar.
   */
  function whenInView(element) {
    return new Promise(function (resolve) {
      if (typeof IntersectionObserver !== 'function') {
        resolve();
        return;
      }

      var settled = false;
      var observer = null;
      var safety = null;

      function settle() {
        if (settled) return;
        settled = true;
        if (observer) observer.disconnect();
        if (safety) clearTimeout(safety);
        resolve();
      }

      var isMobile = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
      var options = isMobile
        ? { threshold: 0.04, rootMargin: '0px 0px -35% 0px' }
        : { threshold: 0, rootMargin: '0px 0px 100% 0px' };

      observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) {
            settle();
            return;
          }
        }
      }, options);

      /* Masaüstündeki güvenlik davranışı korunur. Mobilde zaman aşımı yoktur;
         kullanıcı sahneye ulaşmadan R8 animasyonu kesinlikle başlamaz. */
      if (!isMobile) safety = setTimeout(settle, 3000);
      observer.observe(element);
    });
  }

  /*
   * Masaüstünde imleci takip eden paralaks. Katmanların kayma miktarı CSS'teki
   * --depth ile, sahnenin eğimi ise doğrudan --mx/--my ile belirlenir; burada
   * yalnız imlecin merkeze göre konumu -1..1 aralığına indirilip yazılır.
   * Dokunmatik cihazlarda ve hareket azaltma açıkken hiç kurulmaz.
   */
  function enableParallax(stage) {
    if (!window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var hero = stage.closest('.hero') || stage;
    var frame = 0;
    var x = 0;
    var y = 0;

    function apply() {
      frame = 0;
      stage.style.setProperty('--mx', x.toFixed(3));
      stage.style.setProperty('--my', y.toFixed(3));
    }

    function queue() {
      if (!frame) frame = requestAnimationFrame(apply);
    }

    hero.addEventListener('mousemove', function (event) {
      var box = hero.getBoundingClientRect();
      if (!box.width || !box.height) return;
      x = ((event.clientX - box.left) / box.width - 0.5) * 2;
      y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      queue();
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      x = 0;
      y = 0;
      queue();
    }, { passive: true });

    stage.classList.add('is-parallax');
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

    /*
     * Tek bir görünürlük sözü iki akış tarafından da paylaşılır. is-loading
     * sınıfı sahne ekrana girmeden kaldırılırsa katmanlar sahne görünmezken
     * açılmaya başlar; bu yüzden yükleme sonucu da aynı söze bağlanır.
     */
    var inView = whenInView(stage);

    /*
     * Tek bir zincir. Önceki sürümde kritik katmanlar ve tüm katmanlar ayrı
     * zincirlerde ilerliyordu; görseller önbellekten hızlı geldiğinde
     * is-loading, is-ready eklenmeden kaldırılabiliyordu. Başlangıç durumu
     * hiç boyanmadığı için geçiş başlamıyor ve 14 katman gecikmesiz, hep
     * birlikte beliriyordu. Artık is-loading yalnız is-ready ile aynı karede
     * kaldırılıyor.
     */
    Promise.all(readiness.map(function (entry) { return entry.promise; })).then(function (results) {
      return inView.then(function () { return results; });
    }).then(function (results) {
      if (!results.every(Boolean)) {
        stage.classList.remove('is-loading');
        stage.classList.add('has-error');
        return;
      }

      stage.classList.remove('has-error');
      // İki kare bekleyerek başlangıç durumunun boyanması garantiye alınır.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stage.classList.add('is-ready');
          stage.classList.remove('is-loading');
          document.documentElement.classList.add('hero-r8-mounted');
          // En geç gelen katman 1470 ms gecikme + 560 ms sürede oturuyor;
          // paralaks ancak giriş bittikten sonra devreye giriyor.
          setTimeout(function () { enableParallax(stage); }, 2150);
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
