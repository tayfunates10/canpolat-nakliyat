(function () {
  'use strict';

  var HEADER_LOGO_SRC = '/assets/images/canpolat-logo.svg?v=20260811-header-approved';

  document.querySelectorAll('.site-header img.brand__logo').forEach(function (logo) {
    logo.src = HEADER_LOGO_SRC;
    logo.width = 597;
    logo.height = 151;
    logo.alt = 'Canpolat Evden Eve Nakliyat';
    logo.decoding = 'async';
  });
})();
