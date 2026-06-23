const search = document.querySelector('#search');
const docsList = document.querySelector('#docs-list');
const summary = document.querySelector('#summary');
const recentList = document.querySelector('#recent-list');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');

let docs = [];

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
  docs = data.docs || [];
}

function buildSummary() {
  const latestDate = docs.map((item) => item.updatedAt).sort().at(-1);
  const items = [
    { label: '文档数量', value: docs.length },
    { label: '文件类型', value: [...new Set(docs.map((item) => getFileLabel(item)))].length },
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

function buildRecentList() {
  const recent = [...docs]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  recentList.innerHTML = recent
    .map(
      (item) => `
        <a class="recent-card" href="${item.href}" target="${item.external ? '_blank' : '_self'}" rel="noreferrer">
          <span>${getFileLabel(item)}</span>
          <strong>${item.title}</strong>
          <small>${formatDate(item.updatedAt)}</small>
        </a>
      `
    )
    .join('');
}

function getFilteredDocs() {
  const term = search.value.trim().toLowerCase();
  return docs.filter((item) => {
    const haystack = [item.title, item.description, ...(item.tags || [])].join(' ').toLowerCase();
    return !term || haystack.includes(term);
  });
}

function render() {
  const filtered = getFilteredDocs().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  resultCount.textContent = `共 ${filtered.length} 篇`;
  emptyState.hidden = filtered.length > 0;

  docsList.innerHTML = filtered
    .map(
      (item) => `
        <article class="doc-card">
          <div class="doc-top">
            <span class="doc-badge">${getFileLabel(item)}</span>
            <time datetime="${item.updatedAt}">${formatDate(item.updatedAt)}</time>
          </div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="tag-row">
            ${(item.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <a class="doc-link" href="${item.href}" target="${item.external ? '_blank' : '_self'}" rel="noreferrer">
            ${item.fileType === 'pdf' ? '打开 PDF' : item.fileType === 'doc' || item.fileType === 'docx' ? '下载 Word 文档' : item.external ? '打开链接' : '查看文档'}
          </a>
        </article>
      `
    )
    .join('');
}

loadContent()
  .then(() => {
    buildSummary();
    buildRecentList();
    render();
  })
  .catch(() => {
    docsList.innerHTML = '<p class="empty-state">内容暂时无法加载，请稍后再试。</p>';
  });

search.addEventListener('input', render);
