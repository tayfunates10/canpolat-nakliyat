(function () {
  'use strict';

  /* Inner pages must use the exact working header artwork/structure from the
     Edremit service-area page. This runs after all legacy logo normalizers. */
  (function syncExactHeaderLogo() {
    var targets = Array.prototype.filter.call(document.querySelectorAll('.site-header .brand'), function (brand) {
      var svg = brand.querySelector('svg.brand__logo');
      return !svg || !svg.querySelector('.brand__arc') || !svg.querySelector('.brand__word');
    });
    if (!targets.length) return;

    fetch('/bolgeler/edremit-nakliyat.html?shared-header=20260811-01', {
      cache: 'no-store',
      credentials: 'same-origin'
    }).then(function (response) {
      if (!response.ok) throw new Error('Header source could not be loaded');
      return response.text();
    }).then(function (html) {
      var parsed = new DOMParser().parseFromString(html, 'text/html');
      var source = parsed.querySelector('.site-header .brand svg.brand__logo');
      if (!source) throw new Error('Approved inline header logo missing');

      targets.forEach(function (brand) {
        var current = brand.querySelector('.brand__logo');
        var clone = document.importNode(source, true);
        clone.classList.add('brand__logo');
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('focusable', 'false');
        if (current) current.replaceWith(clone);
        else brand.insertBefore(clone, brand.firstChild);
      });
    }).catch(function () {
      /* Keep the already rendered logo if the exact shared source is unavailable. */
    });
  })();

  /* Compact SEO templates build the utility strip in JS and historically
     omitted icons. Use self-contained SVGs so these do not depend on a sprite. */
  var serviceIcons = {
    'evden-eve-nakliyat': '<path d="M3 11.2 12 3l9 8.2M5.2 9.4V21h13.6V9.4M9.2 21v-6.7h5.6V21"/>',
    'sehirler-arasi-nakliyat': '<path d="M3 7h10v9H3zM13 10h4l3 3v3h-7zM6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
    'ofis-isyeri-tasima': '<path d="M5 21V5h9v16M14 9h5v12M8 8h3M8 12h3M8 16h3M16.5 12h1M16.5 16h1M3 21h18"/>',
    'asansorlu-tasima': '<path d="M6 21V3h12v18M9 8l3-3 3 3M9 16l3 3 3-3M12 5v14"/>',
    'paketleme-montaj': '<path d="m14.5 5.5 4-2-2 4-7.2 7.2-2-2zM6.7 13.3 3 17l4 4 3.7-3.7M15 15l6 6M18 18l-2 2"/>',
    'parca-esya-tasimaciligi': '<path d="m12 3 8 4-8 4-8-4 8-4ZM4 7v10l8 4 8-4V7M12 11v10"/>'
  };

  document.querySelectorAll('.utility-bar .marquee a').forEach(function (link) {
    if (link.querySelector('svg')) return;
    var href = link.getAttribute('href') || '';
    var key = Object.keys(serviceIcons).find(function (name) { return href.indexOf(name) !== -1; });
    if (!key) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'utility-service-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = serviceIcons[key];
    link.insertBefore(svg, link.firstChild);
  });

  /* Guarantee one complete service-area group in every footer. */
  (function ensureFooterRegions() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    var existing = footer.querySelector('[data-footer-regions]');
    if (existing) {
      existing.classList.add('footer-regions');
      if (existing.previousElementSibling) existing.previousElementSibling.classList.add('footer-regions__title');
      return;
    }

    var grid = footer.querySelector('.footer-grid');
    if (!grid || grid.children.length < 2) return;
    var corporate = grid.children[1];
    var title = document.createElement('h2');
    title.className = 'footer-regions__title';
    title.textContent = 'Hizmet Bölgeleri';
    var nav = document.createElement('nav');
    nav.className = 'footer-regions';
    nav.setAttribute('data-footer-regions', '');
    nav.setAttribute('aria-label', 'Footer hizmet bölgeleri');
    nav.innerHTML = '<a href="/bolgeler/edremit-nakliyat.html">Edremit</a>' +
      '<a href="/bolgeler/akcay-nakliyat.html">Akçay</a>' +
      '<a href="/bolgeler/altinoluk-nakliyat.html">Altınoluk</a>' +
      '<a href="/bolgeler/ayvalik-nakliyat.html">Ayvalık</a>' +
      '<a href="/bolgeler/burhaniye-nakliyat.html">Burhaniye</a>' +
      '<a href="/bolgeler/gomec-nakliyat.html">Gömeç</a>' +
      '<a href="/bolgeler/gure-nakliyat.html">Güre</a>' +
      '<a href="/bolgeler/havran-nakliyat.html">Havran</a>' +
      '<a href="/bolgeler/ivrindi-nakliyat.html">İvrindi</a>' +
      '<a href="/bolgeler/kucukkuyu-nakliyat.html">Küçükkuyu</a>';
    corporate.appendChild(title);
    corporate.appendChild(nav);
  })();
})();
