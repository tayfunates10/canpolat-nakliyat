(function () {
  'use strict';

  var DESKTOP_CROP = { x: 50, y: 60, w: 1486, h: 900 };
  var TABLET_CROP = { x: 60, y: 70, w: 1476, h: 900 };
  var MOBILE_CROP = { x: 55, y: 80, w: 1481, h: 900 };
  var mountedMode = '';
  var resizeTimer = 0;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function mode() {
    if (window.innerWidth <= 767) return 'mobile';
    if (window.innerWidth <= 991) return 'tablet';
    return 'desktop';
  }

  function cropFor(currentMode) {
    if (currentMode === 'mobile') return MOBILE_CROP;
    if (currentMode === 'tablet') return TABLET_CROP;
    return DESKTOP_CROP;
  }

  function groundY(x) {
    var gx = [];
    var raw = [686, 698, 690, 705, 718, 726, 728, 733, 745, 753, 760, 764, 768, 769, 774, 777, 778, 778, 774, 771, 776, 774, 768, 768, 758, 759, 755, 749, 738, 729, 722, 713, 700, 688, 670];
    var gy = raw.map(function (value) { return value + 140; });
    var i;

    for (i = 0; i < 35; i += 1) gx.push(150 + i * 40);
    if (x <= gx[0]) return gy[0];
    if (x >= gx[gx.length - 1]) return gy[gy.length - 1];

    for (i = 0; i < gx.length - 1; i += 1) {
      if (x >= gx[i] && x <= gx[i + 1]) {
        var ratio = (x - gx[i]) / (gx[i + 1] - gx[i]);
        return gy[i] + ratio * (gy[i + 1] - gy[i]);
      }
    }

    return gy[gy.length - 1];
  }

  function loadImage(image) {
    return new Promise(function (resolve, reject) {
      if (image.complete) {
        if (image.naturalWidth > 0) resolve(image);
        else reject(new Error('image-load'));
        return;
      }

      image.addEventListener('load', function () { resolve(image); }, { once: true });
      image.addEventListener('error', function () { reject(new Error('image-load')); }, { once: true });
    });
  }

  function applyCrop(element, crop) {
    element.style.left = (-crop.x / crop.w * 100) + '%';
    element.style.top = (-crop.y / crop.h * 100) + '%';
    element.style.width = (1536 / crop.w * 100) + '%';
    element.style.height = (1024 / crop.h * 100) + '%';
  }

  function createRoutePng(crop) {
    var source = document.createElement('canvas');
    var context = source.getContext('2d');
    var image = new Image();
    var pinX = 305;
    var pinY = 145;

    source.width = 1536;
    source.height = 1024;

    context.save();
    context.strokeStyle = '#f7931e';
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash([12, 10]);
    context.beginPath();
    context.moveTo(642, 73);
    context.bezierCurveTo(535, 31, 395, 56, 315, 128);
    context.bezierCurveTo(253, 187, 232, 283, 268, 350);
    context.bezierCurveTo(286, 383, 318, 405, 358, 417);
    context.stroke();
    context.restore();

    context.save();
    context.fillStyle = '#f7a51a';
    context.beginPath();
    context.moveTo(pinX, pinY + 25);
    context.bezierCurveTo(pinX - 7, pinY + 14, pinX - 20, pinY + 2, pinX - 20, pinY - 10);
    context.bezierCurveTo(pinX - 20, pinY - 23, pinX - 11, pinY - 32, pinX, pinY - 32);
    context.bezierCurveTo(pinX + 11, pinY - 32, pinX + 20, pinY - 23, pinX + 20, pinY - 10);
    context.bezierCurveTo(pinX + 20, pinY + 2, pinX + 7, pinY + 14, pinX, pinY + 25);
    context.closePath();
    context.fill();

    context.fillStyle = '#06121b';
    context.beginPath();
    context.arc(pinX, pinY - 10, 7, 0, Math.PI * 2);
    context.fill();
    context.restore();

    image.className = 'hero-fixed-route hero-fixed-route--png hero-fixed-item';
    image.alt = '';
    image.decoding = 'async';
    image.src = source.toDataURL('image/png');
    applyCrop(image, crop);
    return image;
  }

  function createLayer(canvas, crop, spec) {
    var image = new Image();
    image.alt = '';
    image.decoding = 'async';
    image.className = 'hero-fixed-layer hero-fixed-layer--' + spec.name;
    image.style.setProperty('--hero-enter-x', spec.enterX + 'px');
    image.style.setProperty('--hero-enter-y', spec.enterY + 'px');
    image.style.setProperty('--hero-delay', spec.delay + 's');
    image.style.setProperty('--hero-z', String(spec.z));
    image.src = 'assets/images/hero-parts/' + spec.file;
    canvas.appendChild(image);

    return loadImage(image).then(function () {
      var width = Math.max(1, Math.round(image.naturalWidth * spec.scale));
      var height = Math.max(1, Math.round(image.naturalHeight * spec.scale));
      var left = spec.x - width / 2;
      var top = groundY(spec.x) - spec.depth - height;

      image.style.left = ((left - crop.x) / crop.w * 100) + '%';
      image.style.top = ((top - crop.y) / crop.h * 100) + '%';
      image.style.width = (width / crop.w * 100) + '%';
      image.style.height = 'auto';
      return image;
    }).catch(function () {
      image.remove();
      return null;
    });
  }

  function removeOldScenes(media) {
    var oldScenes = media.querySelectorAll('.hero-live-scene, .hero-fixed-scene');
    oldScenes.forEach(function (scene) { scene.remove(); });
  }

  function render() {
    var hero = document.querySelector('.hero');
    var media = hero ? hero.querySelector('.hero__media') : null;
    var fallback = media ? media.querySelector('.hero__picture') : null;
    var currentMode = mode();
    var crop = cropFor(currentMode);

    if (!hero || !media || !fallback) return;
    if (mountedMode === currentMode && media.querySelector('.hero-fixed-scene')) return;
    mountedMode = currentMode;

    removeOldScenes(media);
    fallback.hidden = true;
    fallback.style.display = 'none';
    fallback.setAttribute('aria-hidden', 'true');

    var scene = document.createElement('div');
    var viewport = document.createElement('div');
    var canvas = document.createElement('div');
    var base = new Image();

    scene.className = 'hero-fixed-scene';
    scene.setAttribute('role', 'img');
    scene.setAttribute('aria-label', 'Canpolat Nakliyat kamyonu, taş zemin, koli taşıyan çalışanlar, koliler, koltuk ve taşıma asansörü');
    viewport.className = 'hero-fixed-scene__viewport';
    viewport.style.setProperty('--hero-crop-w', String(crop.w));
    viewport.style.setProperty('--hero-crop-h', String(crop.h));
    canvas.className = 'hero-fixed-scene__canvas';

    base.className = 'hero-fixed-base hero-fixed-item';
    base.alt = '';
    base.decoding = 'async';
    base.fetchPriority = 'high';
    base.src = 'assets/images/hero-parts/base-clean.webp?v=20260806-4';
    applyCrop(base, crop);

    scene.appendChild(viewport);
    viewport.appendChild(canvas);
    canvas.appendChild(base);
    canvas.appendChild(createRoutePng(crop));

    var specifications = [
      { name: 'plant', file: 'plant.webp', x: 1490, depth: 126, scale: 0.55, enterX: 20, enterY: 16, delay: 0.12, z: 3 },
      { name: 'lift', file: 'lift.webp', x: 1430, depth: 101, scale: 0.80, enterX: 40, enterY: -10, delay: 0.20, z: 4 },
      { name: 'left-team', file: 'grp_left.webp', x: 322, depth: 90, scale: 0.70, enterX: -45, enterY: 18, delay: 0.28, z: 5 },
      { name: 'right-team', file: 'grp_right.webp', x: 1300, depth: 87, scale: 0.51, enterX: 38, enterY: 18, delay: 0.36, z: 6 },
      { name: 'stack', file: 'stack.webp', x: 505, depth: 72, scale: 0.33, enterX: -22, enterY: 24, delay: 0.44, z: 7 },
      { name: 'wrapped', file: 'wrapped.webp', x: 980, depth: 54, scale: 0.40, enterX: 0, enterY: 28, delay: 0.52, z: 8 },
      { name: 'sofa', file: 'sofa.webp', x: 1120, depth: 47, scale: 0.48, enterX: 42, enterY: 20, delay: 0.60, z: 9 },
      { name: 'boxes', file: 'boxes_sm.webp', x: 842, depth: 21, scale: 0.38, enterX: -8, enterY: 30, delay: 0.68, z: 10 }
    ];

    var promises = specifications.map(function (spec) {
      return createLayer(canvas, crop, spec);
    });

    media.insertBefore(scene, fallback);

    loadImage(base).then(function () {
      return Promise.all(promises);
    }).then(function () {
      scene.classList.add('is-mounted');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          scene.classList.add('is-ready');
        });
      });
    }).catch(function () {
      scene.remove();
      fallback.hidden = false;
      fallback.style.display = '';
      fallback.setAttribute('aria-hidden', 'false');
    });
  }

  ready(function () {
    window.setTimeout(render, 0);
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(render, 140);
    }, { passive: true });
  });
})();
