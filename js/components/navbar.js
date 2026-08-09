/* ==========================================================================
   Navbar — scroll state + mobile drawer
   ========================================================================== */
(function () {
  const navbar = document.getElementById('navbar');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');

  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  if (toggleBtn && mobileMenu && mobileOverlay) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });
    mobileOverlay.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', closeMenu)
    );
  }

  // Scroll-to-top button
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener(
      'scroll',
      () => scrollTopBtn.classList.toggle('visible', window.scrollY > 500),
      { passive: true }
    );
    scrollTopBtn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }
})();
