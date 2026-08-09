/* ==========================================================================
   Work page — filter tabs + search over the project grid
   ========================================================================== */
(function () {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.project-card'));
  const tabs = document.querySelectorAll('.ftab');
  const searchInput = document.getElementById('workSearch');
  const noResults = document.getElementById('noResults');

  let activeCat = 'all';

  function applyFilter() {
    const q = (searchInput && searchInput.value.trim().toLowerCase()) || '';
    let visibleCount = 0;

    cards.forEach((card) => {
      const cat = card.dataset.cat;
      const text = card.textContent.toLowerCase();
      const matchesCat = activeCat === 'all' || cat === activeCat;
      const matchesSearch = !q || text.includes(q);
      const show = matchesCat && matchesSearch;
      card.classList.toggle('hidden', !show);
      if (show) visibleCount++;
    });

    if (noResults) noResults.classList.toggle('show', visibleCount === 0);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCat = tab.dataset.cat;
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }

  applyFilter();
})();
