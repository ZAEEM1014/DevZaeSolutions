/* ==========================================================================
   Stat counters — animate numbers up when they scroll into view
   ========================================================================== */
(function () {
  const counters = document.querySelectorAll('.stat .num');
  if (!counters.length) return;

  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffixEl = el.querySelector('.suffix');
        const suffixText = suffixEl ? suffixEl.textContent : '';

        let current = 0;
        const step = Math.max(1, Math.round(target / 50));

        el.innerHTML = '0';
        const span = document.createElement('span');
        span.className = 'suffix';
        span.textContent = suffixText;
        el.appendChild(span);

        const tick = () => {
          current = Math.min(current + step, target);
          el.firstChild.textContent = current;
          if (current < target) requestAnimationFrame(tick);
        };
        tick();

        counterIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((c) => counterIO.observe(c));
})();
