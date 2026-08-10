(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var menuButton = document.querySelector('.menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mobileMenu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) setMenu(false);
    }, { passive: true });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  document.querySelectorAll('.accordion__item button').forEach(function (button) {
    button.addEventListener('click', function () {
      var targetId = button.getAttribute('aria-controls');
      var target = document.getElementById(targetId);
      var willOpen = button.getAttribute('aria-expanded') !== 'true';

      document.querySelectorAll('.accordion__item button').forEach(function (otherButton) {
        var otherTarget = document.getElementById(otherButton.getAttribute('aria-controls'));
        otherButton.setAttribute('aria-expanded', 'false');
        otherButton.querySelector('span').textContent = '+';
        otherButton.closest('.accordion__item').classList.remove('is-open');
        if (otherTarget) otherTarget.hidden = true;
      });

      if (willOpen && target) {
        button.setAttribute('aria-expanded', 'true');
        button.querySelector('span').textContent = '−';
        button.closest('.accordion__item').classList.add('is-open');
        target.hidden = false;
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', href);
    });
  });

  document.querySelectorAll('[data-year]').forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  /*
   * Bir bölüm görünür alana girdiğinde açılış animasyonunu tetikler. is-armed
   * yalnız JS ve gözlemci varken eklenir; aksi hâlde bölüm animasyonsuz ama
   * tam görünür kalır, yani JS'siz tarayıcıda hiçbir şey gizli kalmaz.
   */
  function revealOnView(selector, threshold) {
    var node = document.querySelector(selector);
    if (!node || typeof IntersectionObserver !== 'function') return;

    node.classList.add('is-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        node.classList.add('is-visible');
        observer.disconnect();
      });
    }, { threshold: threshold, rootMargin: '0px 0px -6% 0px' });

    observer.observe(node);
  }

  revealOnView('.regions__visual', 0.3);

  /*
   * Her bölüm görünür alana girdiğinde kendi geliş efektini oynatır. is-armed
   * yalnız gözlemci varken eklenir; JS çalışmazsa hiçbir bölüm gizlenmez.
   * Eşik 0.01: bir bölüm ekrandan uzun olduğunda yüzdelik eşik hiç dolmayabilir,
   * bu yüzden "ilk pikseli girdiğinde" tetiklenir.
   */
  (function armSections() {
    var sections = document.querySelectorAll('main > section');
    if (!sections.length || typeof IntersectionObserver !== 'function') return;

    /*
     * Gelecek ögeler. Çerçeveli olanlar (kart, kutu, figür, form) bütün olarak
     * gelsin diye listede önce yer alır; DOM sırasında da içeriklerinden önce
     * geldikleri için altlarındaki satırlar ayrıca seçilmez.
     */
    var REVEAL = [
      '.service-card', '.accordion__item', '.why-us__cards article', '.gallery__item',
      '.side-card', '.quote-form', '.process-grid li', '.about__features > div',
      '.about__media', '.regions__visual', '.region-tags', 'figure',
      'h1', 'h2', 'h3', '.section-tag', 'p', 'address', 'ul:not(.region-tags)',
      '.button', '.text-link', 'img'
    ].join(',');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });

    sections.forEach(function (section) {
      section.classList.add('is-armed');
      observer.observe(section);

      // Hero ve kapanış bandının kendi animasyon zinciri var; ikinci kez
      // sahnelenirlerse iki animasyon üst üste biner.
      if (section.classList.contains('hero') || section.classList.contains('final-cta')) return;

      var chosen = [];
      Array.prototype.forEach.call(section.querySelectorAll(REVEAL), function (node) {
        for (var i = 0; i < chosen.length; i++) {
          if (chosen[i].contains(node)) return;   // seçilmiş bir ögenin içindeyse atla
        }
        chosen.push(node);
      });
      chosen.forEach(function (node, index) {
        node.classList.add('reveal');
        node.style.setProperty('--reveal-i', String(index));
      });
    });
  })();

  /*
   * Galeri önizlemesi. Kareler <button> olduğu için tıklama adres çubuğuna
   * bir çapa yazmaz; sayfa kaydırma konumu hiç değişmez, pencere bulunulan
   * yerde açılır. Arka planın kayması gövdeye overflow: hidden ile durdurulur
   * ve kaybolan kaydırma çubuğu kadar sağdan boşluk bırakılır, aksi hâlde
   * pencere açılırken tüm sayfa yana sıçrar.
   */
  var openers = Array.prototype.slice.call(document.querySelectorAll('.gallery__open'));
  if (openers.length) {
    var slides = openers.map(function (opener) {
      var figure = opener.closest('.gallery__item');
      var image = opener.querySelector('img');
      var wide = opener.querySelector('source');
      var caption = figure ? figure.querySelector('figcaption') : null;
      return {
        src: (wide && wide.getAttribute('srcset')) || image.getAttribute('src'),
        alt: image.getAttribute('alt') || '',
        caption: caption ? caption.textContent : ''
      };
    });

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Galeri önizlemesi');
    box.innerHTML =
      '<div class="lightbox__backdrop" data-close></div>' +
      '<div class="lightbox__panel">' +
        '<button type="button" class="lightbox__close" data-close aria-label="Önizlemeyi kapat">&times;</button>' +
        '<button type="button" class="lightbox__nav lightbox__nav--prev" data-step="-1" aria-label="Önceki görsel">&#8249;</button>' +
        '<figure class="lightbox__figure">' +
          '<img class="lightbox__image" alt="">' +
          '<figcaption class="lightbox__caption"><span class="lightbox__text"></span>' +
          '<span class="lightbox__count" aria-hidden="true"></span></figcaption>' +
        '</figure>' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" data-step="1" aria-label="Sonraki görsel">&#8250;</button>' +
      '</div>';
    document.body.appendChild(box);

    var boxImage = box.querySelector('.lightbox__image');
    var boxText = box.querySelector('.lightbox__text');
    var boxCount = box.querySelector('.lightbox__count');
    var current = 0;
    var lastFocused = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      var slide = slides[current];
      boxImage.setAttribute('src', slide.src);
      boxImage.setAttribute('alt', slide.alt);
      boxText.textContent = slide.caption;
      boxCount.textContent = (current + 1) + ' / ' + slides.length;
    }

    var lockedScroll = 0;

    function openBox(index) {
      lastFocused = document.activeElement;
      lockedScroll = window.scrollY || window.pageYOffset || 0;
      // Gövde bulunduğu konumda sabitlenir: yalnız overflow: hidden vermek
      // telefonda sayfayı birkaç piksel kaydırıyordu.
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = gap > 0 ? gap + 'px' : '';
      document.body.style.top = -lockedScroll + 'px';
      document.body.classList.add('lightbox-open');
      show(index);
      box.hidden = false;
      box.querySelector('.lightbox__close').focus();
    }

    function closeBox() {
      box.hidden = true;
      document.body.classList.remove('lightbox-open');
      document.body.style.top = '';
      document.body.style.paddingRight = '';
      // html'de scroll-behavior: smooth açık; kapanışta konumu geri alırken
      // yumuşak kaydırma devreye girmesin diye geçici olarak kapatılır.
      var root = document.documentElement;
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, lockedScroll);
      root.style.scrollBehavior = previous;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    openers.forEach(function (opener, index) {
      opener.addEventListener('click', function () { openBox(index); });
    });

    box.addEventListener('click', function (event) {
      var target = event.target;
      if (target.hasAttribute('data-close')) { closeBox(); return; }
      var stepper = target.closest('[data-step]');
      if (stepper) show(current + Number(stepper.getAttribute('data-step')));
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) return;
      if (event.key === 'Escape') { closeBox(); return; }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); return; }
      if (event.key !== 'Tab') return;
      // Odak pencerenin içinde kalsın; arkadaki sayfaya sekmeyle geçilmemeli.
      var stops = box.querySelectorAll('button');
      var first = stops[0];
      var last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // Telefonda parmakla sağa/sola kaydırarak geçiş.
    var touchStart = null;
    box.addEventListener('touchstart', function (event) {
      touchStart = event.changedTouches[0].clientX;
    }, { passive: true });
    box.addEventListener('touchend', function (event) {
      if (touchStart === null) return;
      var delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
  }
})();
