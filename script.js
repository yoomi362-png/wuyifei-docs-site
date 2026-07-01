const docCard = document.querySelector('#doc-card');
const pageTitle = document.querySelector('#page-title');
const heroKicker = document.querySelector('#hero-kicker');
const heroCopy = document.querySelector('#hero-copy');
const heroActions = document.querySelector('#hero-actions');
const heroMeta = document.querySelector('#hero-meta');
const statusKicker = document.querySelector('#status-kicker');
const statusTitle = document.querySelector('#status-title');
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
  if (item.external) return 'External';
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
  if (!docCard) return;

  if (!documentData) {
    document.body.classList.add('is-empty');
    docCard.innerHTML = `
      <div class="document-card-top">
        <span>Empty</span>
        <span>wuyifei.xyz</span>
      </div>
      <h3>暂无文档</h3>
      <p>文档已从站点移除。管理员上传新文件后，前台会重新显示文档入口。</p>
      <a class="document-link" href="./admin.html">进入后台</a>
    `;
    return;
  }

  document.body.classList.remove('is-empty');
  document.title = `wuyifei.xyz | ${documentData.title}`;
  if (pageTitle) pageTitle.textContent = documentData.title;
  if (heroKicker) heroKicker.textContent = 'PUBLIC DOCUMENT';
  if (heroCopy) heroCopy.textContent = documentData.description;
  if (heroActions) {
    heroActions.innerHTML = `
      <a class="button button-light" href="${documentData.href}" target="${documentData.external ? '_blank' : '_self'}" rel="noreferrer">
        ${documentData.fileType === 'pdf' ? '打开 PDF' : documentData.fileType === 'doc' || documentData.fileType === 'docx' ? '下载 Word' : documentData.external ? '打开链接' : '查看文档'}
      </a>
    `;
  }
  if (heroMeta) {
    heroMeta.innerHTML = `
      <span>${getFileLabel(documentData)}</span>
      <span>Updated ${formatDate(documentData.updatedAt)}</span>
      <span>wuyifei.xyz</span>
    `;
  }
  if (statusKicker) statusKicker.textContent = 'Document';
  if (statusTitle) statusTitle.textContent = '当前公开内容。';

  docCard.innerHTML = `
    <div class="document-card-top">
      <span>${getFileLabel(documentData)}</span>
      <time datetime="${documentData.updatedAt}">${formatDate(documentData.updatedAt)}</time>
    </div>
    <h3>${documentData.title}</h3>
    <p>${documentData.description}</p>
    <div class="tag-row">
      ${(documentData.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <a class="document-link" href="${documentData.href}" target="${documentData.external ? '_blank' : '_self'}" rel="noreferrer">
      ${documentData.fileType === 'pdf' ? '打开 PDF' : documentData.fileType === 'doc' || documentData.fileType === 'docx' ? '下载 Word' : documentData.external ? '打开链接' : '查看文档'}
    </a>
  `;
}

function setupScrollEffects() {
  const nav = document.querySelector('.site-nav');
  const reveals = document.querySelectorAll('.reveal');

  const updateScrollState = () => {
    const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
    nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.18 }
  );

  reveals.forEach((item) => observer.observe(item));
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
}

loadContent()
  .then(() => {
    renderDoc();
    setupScrollEffects();
  })
  .catch(() => {
    if (docCard) {
      docCard.innerHTML = '<p class="empty-state">Content is temporarily unavailable.</p>';
    }
    setupScrollEffects();
  });
