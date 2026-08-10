(function () {
  'use strict';

  var HEADER_LOGO_SRC = '/assets/images/canpolat-logo.svg?v=20260811-header-inline-v4';
  var GROUP_CLASSES = ['brand__word', 'brand__sub', 'brand__arc', 'brand__chev'];

  function upgradeBrand(brand) {
    if (!brand || brand.querySelector('svg.brand__logo')) return;

    var image = brand.querySelector('img.brand__logo');
    if (!image) return;

    fetch(HEADER_LOGO_SRC, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Header logo SVG could not be loaded');
        return response.text();
      })
      .then(function (markup) {
        var parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
        var svg = parsed.documentElement;
        if (!svg || String(svg.nodeName).toLowerCase() !== 'svg') throw new Error('Invalid header logo SVG');

        svg.classList.add('brand__logo');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        var groups = Array.prototype.filter.call(svg.children, function (node) {
          return String(node.nodeName).toLowerCase() === 'g';
        });
        GROUP_CLASSES.forEach(function (className, index) {
          if (groups[index]) groups[index].classList.add(className);
        });

        image.replaceWith(document.importNode(svg, true));
      })
      .catch(function () {
        /* Keep the approved static artwork as a safe fallback. */
        image.src = HEADER_LOGO_SRC;
        image.width = 597;
        image.height = 151;
        image.alt = 'Canpolat Evden Eve Nakliyat';
        image.decoding = 'async';
      });
  }

  document.querySelectorAll('.site-header .brand').forEach(upgradeBrand);
})();
