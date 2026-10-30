// Keep normal HTML visible even when animation APIs or JavaScript are unavailable.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.querySelector('main');
if (root && 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const targets = '.hero-copy, .service-strip>div, .section-title, .projects-heading, .project-card, .catalog-card, .editorial-copy, .editorial-image, .small-steps>article, .showroom-copy, .page-heading, .catalog-filters, .project-index-card, .product-heading, .product-overview, .photo-gallery, .case-block, .next-project>div';
  const seen = new WeakSet();
  const running = new Set();
  const observer = new IntersectionObserver(entries => {
    let stagger = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches) continue;
      const animation = entry.target.animate(
        [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 560, delay: Math.min(stagger++ * 45, 135), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
      );
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
    }
  }, { rootMargin: '0px 0px 48px 0px', threshold: 0.01 });
  const register = node => {
    if (!(node instanceof Element) || preference.matches) return;
    const elements = [...(node.matches(targets) ? [node] : []), ...node.querySelectorAll(targets)];
    for (const element of elements) {
      if (seen.has(element)) continue;
      seen.add(element);
      observer.observe(element);
    }
  };
  register(root);
  const updates = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) register(node);
  });
  updates.observe(root, { childList: true, subtree: true });
  preference.addEventListener('change', () => {
    if (preference.matches) {
      observer.disconnect();
      for (const animation of running) animation.cancel();
    } else register(root);
  });
}
