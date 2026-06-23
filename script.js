const search = document.querySelector('#search');
const docsList = document.querySelector('#docs-list');
const categoryChips = document.querySelector('#category-chips');
const categoryOverview = document.querySelector('#category-overview');
const summary = document.querySelector('#summary');
const recentList = document.querySelector('#recent-list');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');

const categories = window.DOC_CATEGORIES || [];
const docs = window.DOC_ITEMS || [];

let activeCategory = 'all';

function formatDate(value) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function buildSummary() {
  const totalCategories = categories.length;
  const totalDocs = docs.length;
  const latestDate = docs
    .map((item) => item.updatedAt)
    .sort()
    .at(-1);

  const items = [
    { label: '分类', value: totalCategories },
    { label: '文档', value: totalDocs },
    { label: '最近更新', value: latestDate ? formatDate(latestDate) : '暂无' },
  ];

  summary.innerHTML = items
    .map(
      (item) => `
        <article class="summary-card">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </article>
      `
    )
    .join('');
}

function buildCategoryControls() {
  const all = [{ id: 'all', name: '全部', description: '显示全部文档' }, ...categories];

  categoryChips.innerHTML = all
    .map(
      (category) => `
        <button class="chip${category.id === activeCategory ? ' active' : ''}" data-filter="${category.id}">
          ${category.name}
        </button>
      `
    )
    .join('');

  categoryOverview.innerHTML = categories
    .map((category) => {
      const count = docs.filter((item) => item.category === category.id).length;
      return `
        <article class="overview-card" data-category="${category.id}">
          <p class="overview-name">${category.name}</p>
          <p class="overview-desc">${category.description}</p>
          <strong>${count} 篇</strong>
        </article>
      `;
    })
    .join('');

  categoryChips.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.filter;
      buildCategoryControls();
      render();
    });
  });

  categoryOverview.querySelectorAll('.overview-card').forEach((card) => {
    card.addEventListener('click', () => {
      activeCategory = card.dataset.category;
      buildCategoryControls();
      render();
      document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function buildRecentList() {
  const recent = [...docs]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  recentList.innerHTML = recent
    .map((item) => {
      const category = categories.find((entry) => entry.id === item.category);
      return `
        <a class="recent-card" href="${item.href}">
          <span>${category?.name || '未分类'}</span>
          <strong>${item.title}</strong>
          <small>${formatDate(item.updatedAt)}</small>
        </a>
      `;
    })
    .join('');
}

function getFilteredDocs() {
  const term = search.value.trim().toLowerCase();

  return docs.filter((item) => {
    const haystack = [item.title, item.description, ...(item.tags || [])].join(' ').toLowerCase();
    const matchesTerm = !term || haystack.includes(term);
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesTerm && matchesCategory;
  });
}

function render() {
  const filtered = getFilteredDocs();

  resultCount.textContent = `共 ${filtered.length} 篇`;
  emptyState.hidden = filtered.length > 0;

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const order = activeCategory === 'all' ? categories.map((item) => item.id) : [activeCategory];

  docsList.innerHTML = order
    .filter((categoryId) => grouped[categoryId]?.length)
    .map((categoryId) => {
      const category = categories.find((item) => item.id === categoryId);
      const entries = grouped[categoryId]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(
          (item) => `
            <article class="doc-card">
              <div class="doc-top">
                <span class="doc-badge">${category?.name || '未分类'}</span>
                <time datetime="${item.updatedAt}">${formatDate(item.updatedAt)}</time>
              </div>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="tag-row">
                ${(item.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
              </div>
              <a class="doc-link" href="${item.href}" target="${item.external ? '_blank' : '_self'}" rel="noreferrer">
                ${item.external ? '打开外部文档' : '查看文档'}
              </a>
            </article>
          `
        )
        .join('');

      return `
        <section class="category-block">
          <div class="section-head compact">
            <p class="section-kicker">${category?.name || '未分类'}</p>
            <h2>${category?.description || ''}</h2>
          </div>
          <div class="card-grid">${entries}</div>
        </section>
      `;
    })
    .join('');
}

buildSummary();
buildCategoryControls();
buildRecentList();
render();

search.addEventListener('input', render);
