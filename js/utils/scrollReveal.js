/* ==========================================================================
   Scroll reveal — fades/slides .reveal elements in as they enter viewport
   ========================================================================== */
(function () {
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Highlight the active step in any process timeline as it scrolls by
  const steps = document.querySelectorAll('.process-item');
  if (steps.length) {
    const stepIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('active', entry.isIntersecting);
        });
      },
      { threshold: 0.5 }
    );
    steps.forEach((s) => stepIO.observe(s));
  }

  // Animate skill bars (About page) once visible
  const bars = document.querySelectorAll('.bar-fill');
  if (bars.length) {
    const barIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.style.width = el.dataset.w + '%';
            barIO.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((b) => barIO.observe(b));
  }
})();
