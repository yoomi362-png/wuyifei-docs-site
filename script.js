const search = document.querySelector('#search');
const docsList = document.querySelector('#docs-list');
const categoryChips = document.querySelector('#category-chips');
const categoryOverview = document.querySelector('#category-overview');
const summary = document.querySelector('#summary');
const recentList = document.querySelector('#recent-list');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');

let categories = [];
let docs = [];
let activeCategory = 'all';

function formatDate(value) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getFileLabel(item) {
  if (item.external) return '外部链接';
  const type = (item.fileType || '').toLowerCase();
  if (type === 'pdf') return 'PDF';
  if (type === 'doc' || type === 'docx') return 'Word';
  return '文档';
}

async function loadContent() {
  const response = await fetch(`./data/content.json?ts=${Date.now()}`);
  if (!response.ok) {
    throw new Error('Failed to load content');
  }

  const data = await response.json();
  categories = data.categories || [];
  docs = data.docs || [];
}

function buildSummary() {
  const latestDate = docs.map((item) => item.updatedAt).sort().at(-1);
  const items = [
    { label: '分类', value: categories.length },
    { label: '文档', value: docs.length },
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
  const all = [{ id: 'all', name: '全部' }, ...categories];

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
    .slice(0, 5);

  recentList.innerHTML = recent
    .map((item) => {
      const category = categories.find((entry) => entry.id === item.category);
      return `
        <a class="recent-card" href="${item.href}" target="${item.external ? '_blank' : '_self'}" rel="noreferrer">
          <span>${category?.name || '未分类'} · ${getFileLabel(item)}</span>
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
    if (!acc[item.category]) acc[item.category] = [];
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
                <span class="tag strong">${getFileLabel(item)}</span>
                ${(item.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
              </div>
              <a class="doc-link" href="${item.href}" target="${item.external ? '_blank' : '_self'}" rel="noreferrer">
                ${item.fileType === 'pdf' ? '打开 PDF' : item.fileType === 'doc' || item.fileType === 'docx' ? '下载 Word 文档' : item.external ? '打开链接' : '查看文档'}
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

loadContent()
  .then(() => {
    buildSummary();
    buildCategoryControls();
    buildRecentList();
    render();
  })
  .catch(() => {
    docsList.innerHTML = '<p class="empty-state">内容暂时无法加载，请稍后再试。</p>';
  });

search.addEventListener('input', render);
