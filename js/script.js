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
   * Güven şeridi görünür alana girdiğinde ikonlar ve metinler sırayla yerine
   * oturur. is-armed yalnız JS ve gözlemci varken eklenir; aksi hâlde şerit
   * animasyonsuz ama tam görünür kalır.
   */
  (function animateTrustBar() {
    var bar = document.querySelector('.trust-bar');
    if (!bar || typeof IntersectionObserver !== 'function') return;

    bar.classList.add('is-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        bar.classList.add('is-visible');
        observer.disconnect();
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -6% 0px' });

    observer.observe(bar);
  })();
})();
