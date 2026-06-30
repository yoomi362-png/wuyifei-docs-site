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
  if (item.external) return 'External link';
  const type = (item.fileType || '').toLowerCase();
  if (type === 'pdf') return 'PDF';
  if (type === 'doc' || type === 'docx') return 'Word';
  return 'Document';
}

async function loadContent() {
  const response = await fetch(`./data/content.json?ts=${Date.now()}`);
  if (!response.ok) {
    throw new Error('Failed to load content');
  }

  const data = await response.json();
  documentData = data.document || null;
}

function renderDoc() {
  if (!documentData) {
    docCard.innerHTML = '<p class="empty-state">No public document yet.</p>';
    return;
  }

  docCard.innerHTML = `
    <div class="mini-top">
      <span class="chip">${getFileLabel(documentData)}</span>
      <time datetime="${documentData.updatedAt}">${formatDate(documentData.updatedAt)}</time>
    </div>
    <h3>${documentData.title}</h3>
    <p>${documentData.description}</p>
    <a class="doc-link" href="${documentData.href}" target="${documentData.external ? '_blank' : '_self'}" rel="noreferrer">
      ${documentData.fileType === 'pdf' ? 'Open PDF' : documentData.fileType === 'doc' || documentData.fileType === 'docx' ? 'Download Word' : documentData.external ? 'Open link' : 'View document'}
    </a>
  `;
}

loadContent()
  .then(renderDoc)
  .catch(() => {
    docCard.innerHTML = '<p class="empty-state">Content is temporarily unavailable.</p>';
  });
