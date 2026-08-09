(() => {
  const section = document.querySelector('#tasima-sureci.process-v2');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    section.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    }
  }, {
    root: null,
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.18,
  });

  observer.observe(section);
})();
