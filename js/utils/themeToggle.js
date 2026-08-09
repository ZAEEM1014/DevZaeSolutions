/* ==========================================================================
   Theme toggle — switches data-theme="light"/"dark" on <html>, persists the
   choice, and keeps every .theme-toggle button on the page (desktop navbar
   + mobile menu) in sync. The actual re-theming is just CSS variables (see
   variables.css) — this file only manages the switch + the button icon.
   ========================================================================== */
(function () {
  const STORAGE_KEY = 'dz-theme';
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      btn.classList.toggle('is-light', theme === 'light');
      const label = btn.querySelector('.theme-toggle-label');
      if (label) label.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
    });
  }

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  // The <head> inline snippet already set the correct theme before paint;
  // this just makes sure the toggle buttons reflect it once the DOM (and
  // this script) is ready.
  document.addEventListener('DOMContentLoaded', () => apply(current()));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    const next = current() === 'light' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  });
})();
