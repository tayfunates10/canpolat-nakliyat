(() => {
  const section = document.querySelector('#neden-biz.why-us-v2');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    section.classList.add('is-visible');
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      section.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    }
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px',
  });

  observer.observe(section);
  section.classList.add('why-us-motion-ready');
})();
