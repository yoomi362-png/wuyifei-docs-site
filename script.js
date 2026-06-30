const summary = document.querySelector('#summary');
const docCard = document.querySelector('#doc-card');

let documentData = null;

function formatDate(value) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getFileLabel(item) {
  if (!item) return '';
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
  documentData = data.document || null;
}

function renderSummary() {
  const items = [
    { label: '文档数量', value: documentData ? 1 : 0 },
    { label: '类型', value: documentData ? getFileLabel(documentData) : '暂无' },
    { label: '最近更新', value: documentData ? formatDate(documentData.updatedAt) : '暂无' },
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

function renderDoc() {
  if (!documentData) {
    docCard.innerHTML = '<p class="empty-state">当前还没有上传文档。</p>';
    return;
  }

  docCard.innerHTML = `
    <div class="doc-top">
      <span class="doc-badge">${getFileLabel(documentData)}</span>
      <time datetime="${documentData.updatedAt}">${formatDate(documentData.updatedAt)}</time>
    </div>
    <h3>${documentData.title}</h3>
    <p>${documentData.description}</p>
    <div class="tag-row">
      ${(documentData.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <a class="doc-link" href="${documentData.href}" target="${documentData.external ? '_blank' : '_self'}" rel="noreferrer">
      ${documentData.fileType === 'pdf' ? '打开 PDF' : documentData.fileType === 'doc' || documentData.fileType === 'docx' ? '下载 Word 文档' : documentData.external ? '打开链接' : '查看文档'}
    </a>
  `;
}

loadContent()
  .then(() => {
    renderSummary();
    renderDoc();
  })
  .catch(() => {
    summary.innerHTML = '';
    docCard.innerHTML = '<p class="empty-state">内容暂时无法加载，请稍后再试。</p>';
  });
