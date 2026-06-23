const search = document.querySelector('#search');
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('.doc-card');

function applyFilter() {
  const term = search.value.trim().toLowerCase();
  const active = document.querySelector('.chip.active')?.dataset.filter ?? 'all';

  cards.forEach((card) => {
    const text = card.textContent.toLowerCase();
    const tags = card.dataset.tags?.toLowerCase() ?? '';
    const matchesTerm = !term || text.includes(term) || tags.includes(term);
    const matchesFilter = active === 'all' || tags.includes(active);
    card.style.display = matchesTerm && matchesFilter ? '' : 'none';
  });
}

search.addEventListener('input', applyFilter);
chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    applyFilter();
  });
});

applyFilter();
