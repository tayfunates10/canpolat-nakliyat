(function () {
  'use strict';

  function normalizeFooterRegionsColumn() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;

    var grid = footer.querySelector('.footer-grid');
    var regions = footer.querySelector('[data-footer-regions]');
    if (!grid || !regions) return;

    regions.classList.add('footer-regions');

    var title = null;
    var previous = regions.previousElementSibling;
    if (previous && previous.tagName === 'H2' && (previous.textContent || '').trim() === 'Hizmet Bölgeleri') {
      title = previous;
    } else {
      title = footer.querySelector('.footer-regions__title');
    }

    if (!title) {
      title = document.createElement('h2');
      title.textContent = 'Hizmet Bölgeleri';
    }
    title.classList.add('footer-regions__title');

    var column = regions.closest('.footer-regions-column');
    if (!column) {
      column = document.createElement('div');
      column.className = 'footer-regions-column';
      column.appendChild(title);
      column.appendChild(regions);
    } else if (title.parentNode !== column) {
      column.insertBefore(title, regions);
    }

    var contactColumn = null;
    Array.prototype.some.call(grid.children, function (child) {
      var heading = child.querySelector('h2');
      if (heading && (heading.textContent || '').trim() === 'İletişim') {
        contactColumn = child;
        return true;
      }
      return false;
    });

    if (contactColumn && contactColumn !== column) {
      grid.insertBefore(column, contactColumn);
    } else if (column.parentNode !== grid) {
      grid.appendChild(column);
    }
  }

  normalizeFooterRegionsColumn();
})();
