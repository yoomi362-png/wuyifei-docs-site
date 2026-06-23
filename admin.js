const elements = {
  token: document.querySelector('#token'),
  owner: document.querySelector('#owner'),
  repo: document.querySelector('#repo'),
  branch: document.querySelector('#branch'),
  connectBtn: document.querySelector('#connect-btn'),
  status: document.querySelector('#status'),
  categoryName: document.querySelector('#category-name'),
  categoryDescription: document.querySelector('#category-description'),
  addCategoryBtn: document.querySelector('#add-category-btn'),
  categoryAdminList: document.querySelector('#category-admin-list'),
  docTitle: document.querySelector('#doc-title'),
  docCategory: document.querySelector('#doc-category'),
  docTags: document.querySelector('#doc-tags'),
  docDescription: document.querySelector('#doc-description'),
  docFile: document.querySelector('#doc-file'),
  docUrl: document.querySelector('#doc-url'),
  publishBtn: document.querySelector('#publish-btn'),
  docAdminList: document.querySelector('#doc-admin-list'),
};

const state = {
  owner: 'yoomi362-png',
  repo: 'wuyifei-docs-site',
  branch: 'main',
  token: sessionStorage.getItem('github_token') || '',
  contentPath: 'data/content.json',
  contentSha: '',
  content: { categories: [], docs: [] },
};

elements.token.value = state.token;

function setStatus(message, kind = 'muted') {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getFileType(name = '') {
  return name.split('.').pop().toLowerCase();
}

async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${state.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.status === 204 ? null : response.json();
}

async function readContent() {
  const data = await api(`/repos/${state.owner}/${state.repo}/contents/${state.contentPath}?ref=${state.branch}`);
  state.contentSha = data.sha;
  const raw = atob(data.content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
  state.content = JSON.parse(new TextDecoder().decode(bytes));
  renderAdmin();
}

function renderCategories() {
  elements.docCategory.innerHTML = state.content.categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join('');

  elements.categoryAdminList.innerHTML = state.content.categories
    .map(
      (category) => `
        <article class="admin-card">
          <strong>${category.name}</strong>
          <p>${category.description}</p>
          <small>${category.id}</small>
        </article>
      `
    )
    .join('');
}

function renderDocs() {
  const sorted = [...state.content.docs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  elements.docAdminList.innerHTML = sorted
    .map((doc) => {
      const category = state.content.categories.find((item) => item.id === doc.category);
      return `
        <article class="admin-card">
          <strong>${doc.title}</strong>
          <p>${doc.description}</p>
          <small>${category?.name || '未分类'} · ${doc.updatedAt} · ${doc.fileType || 'doc'}</small>
        </article>
      `;
    })
    .join('');
}

function renderAdmin() {
  renderCategories();
  renderDocs();
}

async function saveContent(message) {
  const json = JSON.stringify(state.content, null, 2);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const encoded = btoa(binary);
  const data = await api(`/repos/${state.owner}/${state.repo}/contents/${state.contentPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encoded,
      sha: state.contentSha,
      branch: state.branch,
    }),
  });
  state.contentSha = data.content.sha;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadRepoFile(file) {
  const ext = getFileType(file.name);
  const safeName = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
  const path = `uploads/${today().slice(0, 7)}/${safeName}`;
  const content = await readFileAsBase64(file);

  await api(`/repos/${state.owner}/${state.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload ${file.name}`,
      content,
      branch: state.branch,
    }),
  });

  return `./${path}`;
}

async function connect() {
  state.token = elements.token.value.trim();
  state.owner = elements.owner.value.trim();
  state.repo = elements.repo.value.trim();
  state.branch = elements.branch.value.trim();

  if (!state.token) {
    setStatus('请输入 GitHub token。', 'error');
    return;
  }

  sessionStorage.setItem('github_token', state.token);
  setStatus('正在读取仓库数据...');
  await readContent();
  setStatus('已连接仓库，可以开始添加分类和上传文档。', 'success');
}

async function addCategory() {
  const name = elements.categoryName.value.trim();
  const description = elements.categoryDescription.value.trim();

  if (!name || !description) {
    setStatus('分类名称和说明都需要填写。', 'error');
    return;
  }

  const id = slugify(name);
  if (state.content.categories.some((item) => item.id === id)) {
    setStatus('这个分类已经存在。', 'error');
    return;
  }

  state.content.categories.push({ id, name, description });
  await saveContent(`Add category ${name}`);
  renderAdmin();
  elements.categoryName.value = '';
  elements.categoryDescription.value = '';
  setStatus(`分类“${name}”已添加。`, 'success');
}

async function publishDoc() {
  const title = elements.docTitle.value.trim();
  const category = elements.docCategory.value;
  const description = elements.docDescription.value.trim();
  const tags = elements.docTags.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const file = elements.docFile.files[0];
  const url = elements.docUrl.value.trim();

  if (!title || !category || !description) {
    setStatus('标题、分类和摘要需要填写完整。', 'error');
    return;
  }

  if (!file && !url) {
    setStatus('请选择文件，或者填写一个外部链接。', 'error');
    return;
  }

  setStatus('正在上传文档并更新目录...');

  let href = url;
  let external = Boolean(url);
  let fileType = 'link';

  if (file) {
    href = await uploadRepoFile(file);
    external = false;
    fileType = getFileType(file.name);
  }

  state.content.docs.unshift({
    title,
    category,
    description,
    href,
    updatedAt: today(),
    tags,
    external,
    fileType,
  });

  await saveContent(`Publish document ${title}`);
  renderAdmin();

  elements.docTitle.value = '';
  elements.docDescription.value = '';
  elements.docTags.value = '';
  elements.docFile.value = '';
  elements.docUrl.value = '';
  setStatus(`文档“${title}”已发布。`, 'success');
}

elements.connectBtn.addEventListener('click', () => connect().catch((error) => setStatus(`连接失败：${error.message}`, 'error')));
elements.addCategoryBtn.addEventListener('click', () => addCategory().catch((error) => setStatus(`添加失败：${error.message}`, 'error')));
elements.publishBtn.addEventListener('click', () => publishDoc().catch((error) => setStatus(`发布失败：${error.message}`, 'error')));
