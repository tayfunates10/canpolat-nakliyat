(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, (scrollTop / scrollRange) * 100)}%`;
    header?.classList.toggle('scrolled', scrollTop > 18);
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });

  if (menuButton && mobilePanel) {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    let lastFocused = null;

    const focusableItems = () => [
      ...mobilePanel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ];

    const closeMenu = ({ restoreFocus = true } = {}) => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Menüyü aç');
      mobilePanel.classList.remove('open');
      backdrop.classList.remove('open');
      body.classList.remove('menu-open');
      if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
    };

    const openMenu = () => {
      lastFocused = document.activeElement;
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Menüyü kapat');
      mobilePanel.classList.add('open');
      backdrop.classList.add('open');
      body.classList.add('menu-open');
      window.setTimeout(() => focusableItems()[0]?.focus(), reduceMotion ? 0 : 220);
    };

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      open ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', () => closeMenu());
    mobilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu({ restoreFocus: false })));

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab' || menuButton.getAttribute('aria-expanded') !== 'true') return;
      const items = focusableItems();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020 && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: false });
      }
    });
  }

  const faqButtons = [...document.querySelectorAll('.faq-item button')];
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      faqButtons.forEach(other => other.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });

  const revealItems = [...document.querySelectorAll('.reveal')];
  revealItems.forEach((item, index) => {
    if (item.closest('.intro-grid') && index % 2 === 0) item.classList.add('reveal-left');
    if (item.closest('.area-grid') && index % 2 === 1) item.classList.add('reveal-right');
    if (item.matches('.service-card,.process-step,.promo-card,.sidebar-card')) item.classList.add('reveal-zoom');
  });

  document.querySelectorAll('.service-grid,.process-grid,.faq-list').forEach(group => {
    [...group.children].forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 75, 300)}ms`;
    });
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.service-card,.sidebar-card,.stat-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(850px) translateY(-7px) rotateX(${(-y * 3.2).toFixed(2)}deg) rotateY(${(x * 3.2).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });
})();
