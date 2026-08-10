(function () {
  'use strict';

  var LOGO_SRC = '/assets/images/canpolat-logo-20260810.svg';
  var LOGO_ALT = 'Canpolat Evden Eve Nakliyat';
  var ICON_PHONE = 'M7.6 2.4a2 2 0 0 1 1.9 1.3l1.3 3.4a2 2 0 0 1-.6 2.3L8.9 10.5a11.4 11.4 0 0 0 4.6 4.6l1.1-1.3a2 2 0 0 1 2.3-.6l3.4 1.3a2 2 0 0 1 1.3 1.9v2.2a2.4 2.4 0 0 1-2.6 2.4C9.9 20.2 3.8 14.1 2 4.9A2.4 2.4 0 0 1 4.4 2.4h3.2Z';
  var ICON_WA = 'M12 2.3a9.6 9.6 0 0 0-8.2 14.6L2.3 21.7l4.9-1.4A9.6 9.6 0 1 0 12 2.3Zm4.8 13.2c-.2.6-1.2 1.1-1.7 1.2-.5 0-1 .2-3.4-.7-2.9-1.2-4.7-4.1-4.8-4.3-.2-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.1.2-.3.5-.3.7-.3h.6c.2 0 .4 0 .6.5l.8 2.1c.1.2.1.3 0 .5l-.3.4-.4.4c-.2.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.2.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2.1 1c.2.1.4.2.4.3.1.2.1.7-.1 1.2Z';
  var ICON_DIR = 'M12 2.2 21.8 21.3a.85.85 0 0 1-1.18 1.1L12 17.9l-8.62 4.5A.85.85 0 0 1 2.2 21.3L12 2.2Z';
  var ICON_IG = 'M7.6 2.3h8.8a5.3 5.3 0 0 1 5.3 5.3v8.8a5.3 5.3 0 0 1-5.3 5.3H7.6a5.3 5.3 0 0 1-5.3-5.3V7.6A5.3 5.3 0 0 1 7.6 2.3ZM7.6 4.6A3 3 0 0 0 4.6 7.6v8.8a3 3 0 0 0 3 3h8.8a3 3 0 0 0 3-3V7.6a3 3 0 0 0-3-3ZM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10Zm0 2.15a2.85 2.85 0 1 0 0 5.7 2.85 2.85 0 1 0 0-5.7Zm5.1-3.6a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 1 0 0-2.7Z';

  function iconMarkup(pathData) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="' + pathData + '"></path></svg>';
  }

  function makeLogo(className) {
    var image = document.createElement('img');
    image.className = className;
    image.src = LOGO_SRC;
    image.alt = LOGO_ALT;
    image.width = 1457;
    image.height = 478;
    image.decoding = 'async';
    return image;
  }

  document.querySelectorAll('img[src*="canpolat-logo"]').forEach(function (image) {
    image.src = LOGO_SRC;
    image.width = 1457;
    image.height = 478;
    image.alt = image.alt || LOGO_ALT;
  });

  document.querySelectorAll('svg.cta__logo').forEach(function (logo) {
    var image = makeLogo('cta__logo');
    image.loading = 'lazy';
    logo.replaceWith(image);
  });

  /* Upgrade only compact local-SEO templates to the full shared site chrome. */
  (function normalizeSharedChrome() {
    var header = document.querySelector('.site-header');
    if (header) {
      var compactHeader = !header.id || !header.querySelector('.menu-toggle') || !header.querySelector('#mobile-menu') || !document.querySelector('.utility-bar');
      header.id = 'site-header';

      if (compactHeader && !document.querySelector('.utility-bar')) {
        var utility = document.createElement('div');
        utility.className = 'utility-bar';
        utility.innerHTML = '<div class="marquee" role="group" aria-label="Hizmetlerimiz">' +
          '<ul class="marquee__track">' +
            '<li><a href="/hizmetler/evden-eve-nakliyat.html">Evden Eve Nakliyat</a></li>' +
            '<li><a href="/hizmetler/sehirler-arasi-nakliyat.html">Şehirler Arası Nakliyat</a></li>' +
            '<li><a href="/hizmetler/ofis-isyeri-tasima.html">Ofis ve İş Yeri Taşıma</a></li>' +
            '<li><a href="/hizmetler/asansorlu-tasima.html">Asansörlü Taşıma</a></li>' +
            '<li><a href="/hizmetler/parca-esya-tasimaciligi.html">Parça Eşya Taşımacılığı</a></li>' +
          '</ul>' +
          '<ul class="marquee__track" aria-hidden="true">' +
            '<li><a href="/hizmetler/evden-eve-nakliyat.html" tabindex="-1">Evden Eve Nakliyat</a></li>' +
            '<li><a href="/hizmetler/sehirler-arasi-nakliyat.html" tabindex="-1">Şehirler Arası Nakliyat</a></li>' +
            '<li><a href="/hizmetler/ofis-isyeri-tasima.html" tabindex="-1">Ofis ve İş Yeri Taşıma</a></li>' +
            '<li><a href="/hizmetler/asansorlu-tasima.html" tabindex="-1">Asansörlü Taşıma</a></li>' +
            '<li><a href="/hizmetler/parca-esya-tasimaciligi.html" tabindex="-1">Parça Eşya Taşımacılığı</a></li>' +
          '</ul></div>';
        header.parentNode.insertBefore(utility, header);
      }

      var brand = header.querySelector('.brand');
      if (brand) brand.setAttribute('aria-label', 'Canpolat Nakliyat ana sayfa');

      var desktopNav = header.querySelector('.desktop-nav');
      if (compactHeader && desktopNav) {
        desktopNav.setAttribute('aria-label', 'Ana menü');
        desktopNav.innerHTML = '<a href="/">Ana Sayfa</a>' +
          '<a href="/#hizmetler">Hizmetler</a>' +
          '<a href="/hakkimizda.html">Hakkımızda</a>' +
          '<a href="/#surec">Taşıma Süreci</a>' +
          '<a href="/bolgeler/edremit-nakliyat.html" aria-current="page">Hizmet Bölgeleri</a>' +
          '<a href="/galeri.html">Galeri</a>' +
          '<a href="/sss.html">SSS</a>';
      }

      var headerPhone = header.querySelector('.header-phone');
      if (compactHeader && headerPhone) {
        headerPhone.innerHTML = iconMarkup(ICON_PHONE) + '<span><small>Hemen arayın</small><strong>0535 912 06 91</strong></span>';
      }

      var inner = header.querySelector('.site-header__inner');
      var menuButton = header.querySelector('.menu-toggle');
      var mobileMenu = header.querySelector('#mobile-menu');
      var createdMenu = false;

      if (compactHeader && inner && !menuButton) {
        menuButton = document.createElement('button');
        menuButton.className = 'menu-toggle';
        menuButton.type = 'button';
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-controls', 'mobile-menu');
        menuButton.setAttribute('aria-label', 'Menüyü aç');
        menuButton.innerHTML = '<span></span><span></span><span></span>';
        inner.appendChild(menuButton);
        createdMenu = true;
      }

      if (compactHeader && !mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.id = 'mobile-menu';
        mobileMenu.hidden = true;
        mobileMenu.innerHTML = '<nav class="container" aria-label="Mobil menü">' +
          '<a href="/">Ana Sayfa</a>' +
          '<a href="/#hizmetler">Hizmetler</a>' +
          '<a href="/hakkimizda.html">Hakkımızda</a>' +
          '<a href="/#surec">Taşıma Süreci</a>' +
          '<a href="/bolgeler/edremit-nakliyat.html" aria-current="page">Hizmet Bölgeleri</a>' +
          '<a href="/galeri.html">Galeri</a>' +
          '<a href="/sss.html">SSS</a>' +
          '<a class="button button--primary" href="/#teklif">Teklif Al</a>' +
          '</nav>';
        header.appendChild(mobileMenu);
        createdMenu = true;
      }

      if (createdMenu && menuButton && mobileMenu) {
        function setLocalMenu(open) {
          menuButton.classList.toggle('is-open', open);
          menuButton.setAttribute('aria-expanded', String(open));
          menuButton.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
          mobileMenu.hidden = !open;
          document.body.classList.toggle('menu-open', open);
        }
        menuButton.addEventListener('click', function () {
          setLocalMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });
        mobileMenu.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', function () { setLocalMenu(false); });
        });
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') setLocalMenu(false);
        });
      }
    }

    var footer = document.querySelector('.site-footer');
    if (footer) {
      footer.id = 'iletisim';
      var grid = footer.querySelector('.footer-grid');
      if (grid && grid.children.length >= 4) {
        var footerBrand = grid.children[0];
        var brandText = footerBrand.querySelector('p');
        if (brandText) brandText.textContent = 'Edremit merkezli evden eve, şehirler arası, ofis, asansörlü taşıma ve paketleme/montaj hizmetleri.';

        var corporate = grid.children[1];
        var corporateTitle = corporate.querySelector('h2');
        if (corporateTitle) corporateTitle.textContent = 'Kurumsal';
        var corporateNavs = corporate.querySelectorAll('nav');
        var corporateNav = null;
        Array.prototype.forEach.call(corporateNavs, function (nav) {
          if (!corporateNav && !nav.hasAttribute('data-footer-regions')) corporateNav = nav;
        });
        if (corporateNav) {
          corporateNav.setAttribute('aria-label', 'Footer kurumsal menüsü');
          corporateNav.innerHTML = '<a href="/hakkimizda.html">Hakkımızda</a>' +
            '<a href="/#surec">Taşıma Süreci</a>' +
            '<a href="/bolgeler/edremit-nakliyat.html">Hizmet Bölgeleri</a>' +
            '<a href="/galeri.html">Galeri</a>' +
            '<a href="/sss.html">Sık Sorulan Sorular</a>' +
            '<a href="/gizlilik.html">Gizlilik ve Kişisel Veriler</a>';
        }

        var services = grid.children[2];
        var servicesTitle = services.querySelector('h2');
        if (servicesTitle) servicesTitle.textContent = 'Hizmetlerimiz';
        var servicesNav = services.querySelector('nav');
        if (servicesNav) {
          servicesNav.setAttribute('aria-label', 'Footer hizmetler menüsü');
          servicesNav.innerHTML = '<a href="/hizmetler/evden-eve-nakliyat.html">Evden Eve Nakliyat</a>' +
            '<a href="/hizmetler/sehirler-arasi-nakliyat.html">Şehirler Arası Nakliyat</a>' +
            '<a href="/hizmetler/ofis-isyeri-tasima.html">Ofis ve İş Yeri Taşıma</a>' +
            '<a href="/hizmetler/asansorlu-tasima.html">Asansörlü Taşıma</a>' +
            '<a href="/hizmetler/paketleme-montaj.html">Paketleme ve Montaj</a>';
        }

        var contact = grid.children[3];
        var contactTitle = contact.querySelector('h2');
        if (contactTitle) contactTitle.textContent = 'İletişim';
        var address = contact.querySelector('address');
        if (address) address.innerHTML = '<span>Edremit / Balıkesir</span><a href="tel:+905359120691">0535&nbsp;912&nbsp;06&nbsp;91</a>';
      }

      var regionNav = footer.querySelector('[data-footer-regions]');
      if (regionNav) {
        regionNav.classList.add('footer-regions');
        if (regionNav.previousElementSibling) regionNav.previousElementSibling.classList.add('footer-regions__title');
      }

      var footerBrandBlock = footer.querySelector('.footer-brand');
      if (footerBrandBlock && !footerBrandBlock.querySelector('.footer-social')) {
        var social = document.createElement('nav');
        social.className = 'footer-social';
        social.setAttribute('aria-label', 'Sosyal medya');
        social.innerHTML = '<a href="https://wa.me/905359120691" target="_blank" rel="noopener" aria-label="WhatsApp’tan yazın">' + iconMarkup(ICON_WA) + '</a>' +
          '<a href="https://www.instagram.com/canpolatevdenevenk" target="_blank" rel="noopener" aria-label="Instagram sayfamız">' + iconMarkup(ICON_IG) + '</a>';
        footerBrandBlock.appendChild(social);
      }
    }

    var floating = document.querySelector('.floating-actions');
    if (!floating) {
      floating = document.createElement('div');
      floating.className = 'floating-actions';
      document.body.appendChild(floating);
    }
    floating.setAttribute('role', 'group');
    floating.setAttribute('aria-label', 'Hızlı iletişim');
    floating.innerHTML = '<a class="floating-actions__dir" href="https://maps.app.goo.gl/soogyt8uA8WxuFEM8" target="_blank" rel="noopener" aria-label="Ofisimize yol tarifi alın">' + iconMarkup(ICON_DIR) + '<span class="floating-actions__tip">Yol Tarifi</span></a>' +
      '<a class="floating-actions__phone" href="tel:+905359120691" aria-label="Canpolat Nakliyat\'ı arayın">' + iconMarkup(ICON_PHONE) + '<span class="floating-actions__tip">Hemen Ara</span></a>' +
      '<a class="floating-actions__wa" href="https://wa.me/905359120691" target="_blank" rel="noopener" aria-label="WhatsApp\'tan yazın">' + iconMarkup(ICON_WA) + '<span class="floating-actions__tip">WhatsApp</span></a>';

    var mobileBar = document.querySelector('.mobile-contact-bar');
    if (!mobileBar) {
      mobileBar = document.createElement('div');
      mobileBar.className = 'mobile-contact-bar';
      document.body.appendChild(mobileBar);
    }
    mobileBar.setAttribute('role', 'group');
    mobileBar.setAttribute('aria-label', 'Mobil hızlı iletişim');
    mobileBar.innerHTML = '<a class="mobile-contact-bar__dir" href="https://maps.app.goo.gl/soogyt8uA8WxuFEM8" target="_blank" rel="noopener">' + iconMarkup(ICON_DIR) + 'Yol Tarifi</a>' +
      '<a class="mobile-contact-bar__phone" href="tel:+905359120691">' + iconMarkup(ICON_PHONE) + 'Ara</a>' +
      '<a class="mobile-contact-bar__wa" href="https://wa.me/905359120691" target="_blank" rel="noopener">' + iconMarkup(ICON_WA) + 'WhatsApp</a>';
  })();

  document.querySelectorAll('.footer-bottom').forEach(function (footerBottom) {
    var children = footerBottom.children;
    if (children.length > 1) children[children.length - 1].remove();
  });

  /* Mobile entrance gates. R8 stays locked to the user-approved 78% line. */
  (function armMobileEntranceGates() {
    if (!window.matchMedia || !window.matchMedia('(max-width: 720px)').matches) return;

    var R8_TRIGGER_LINE = 0.78;
    var CTA_TRIGGER_LINE = 0.68;
    var CTA_TRUCK_TRIGGER_LINE = 0.78;

    var r8 = document.getElementById('heroAnimated');
    var cta = document.querySelector('.final-cta');
    var ctaTruck = cta ? cta.querySelector('.final-cta__stage') : null;
    if (!r8 && !cta) return;

    var frame = 0;
    var initialScroll = window.scrollY || window.pageYOffset || 0;
    var userMoved = initialScroll > 8;

    function usableViewportHeight() {
      var height = window.innerHeight || document.documentElement.clientHeight;
      var bar = document.querySelector('.mobile-contact-bar');
      if (!bar || window.getComputedStyle(bar).display === 'none') return height;
      var rect = bar.getBoundingClientRect();
      return rect.height ? Math.min(height, Math.max(0, rect.top)) : height;
    }

    function done() {
      return (!r8 || r8.classList.contains('is-r8-viewport-ready')) &&
             (!cta || cta.classList.contains('is-cta-viewport-ready')) &&
             (!ctaTruck || cta.classList.contains('is-cta-truck-viewport-ready'));
    }

    function check() {
      frame = 0;
      var currentScroll = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(currentScroll - initialScroll) > 4) userMoved = true;
      if (!userMoved) return;

      var viewport = usableViewportHeight();

      if (r8 && !r8.classList.contains('is-r8-viewport-ready')) {
        var r8Rect = r8.getBoundingClientRect();
        if (r8Rect.bottom > 0 && r8Rect.top <= viewport * R8_TRIGGER_LINE) {
          r8.classList.add('is-r8-viewport-ready');
        }
      }

      if (cta && !cta.classList.contains('is-cta-viewport-ready')) {
        var ctaRect = cta.getBoundingClientRect();
        if (ctaRect.bottom > 0 && ctaRect.top <= viewport * CTA_TRIGGER_LINE) {
          cta.classList.add('is-cta-viewport-ready');
        }
      }

      if (ctaTruck && !cta.classList.contains('is-cta-truck-viewport-ready')) {
        var truckRect = ctaTruck.getBoundingClientRect();
        if (truckRect.bottom > 0 && truckRect.top <= viewport * CTA_TRUCK_TRIGGER_LINE) {
          cta.classList.add('is-cta-truck-viewport-ready');
        }
      }

      if (done()) cleanup();
    }

    function queue() {
      if (!frame) frame = requestAnimationFrame(check);
    }

    function cleanup() {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('orientationchange', queue);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('orientationchange', queue, { passive: true });
    queue();
  })();

  if (typeof IntersectionObserver !== 'function') {
    document.querySelectorAll('main > section .reveal').forEach(function (node) {
      node.classList.add('is-content-visible');
    });
    return;
  }

  var observer = null;
  var resizeTimer = null;

  function visibleBottomInset() {
    var bar = document.querySelector('.mobile-contact-bar');
    if (!bar || window.getComputedStyle(bar).display === 'none') return null;
    var rect = bar.getBoundingClientRect();
    if (!rect.height) return null;
    return Math.max(0, Math.ceil(window.innerHeight - rect.top + 8));
  }

  function observerMargin() {
    var mobileInset = visibleBottomInset();
    return mobileInset === null ? '0px 0px -8% 0px' : '0px 0px -' + mobileInset + 'px 0px';
  }

  function buildObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-content-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.01,
      rootMargin: observerMargin()
    });

    document.querySelectorAll('main > section.is-armed .reveal:not(.is-content-visible)').forEach(function (node) {
      observer.observe(node);
    });
  }

  buildObserver();

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildObserver, 120);
  }, { passive: true });

  window.addEventListener('orientationchange', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildObserver, 160);
  }, { passive: true });
})();