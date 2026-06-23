const elements = {
  token: document.querySelector('#token'),
  owner: document.querySelector('#owner'),
  repo: document.querySelector('#repo'),
  branch: document.querySelector('#branch'),
  connectBtn: document.querySelector('#connect-btn'),
  status: document.querySelector('#status'),
  docTitle: document.querySelector('#doc-title'),
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
  content: { docs: [] },
};

elements.token.value = state.token;

function setStatus(message, kind = 'muted') {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
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
  renderDocs();
}

function renderDocs() {
  const sorted = [...(state.content.docs || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  elements.docAdminList.innerHTML = sorted
    .map(
      (doc) => `
        <article class="admin-card">
          <strong>${doc.title}</strong>
          <p>${doc.description}</p>
          <small>${doc.updatedAt} · ${doc.fileType || 'doc'}</small>
        </article>
      `
    )
    .join('');
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
  const baseName = file.name.replace(/\.[^.]+$/, '').trim() || `document-${Date.now()}`;
  const safeName = `${baseName}.${ext}`;
  const path = `uploads/${today().slice(0, 7)}/${safeName}`;
  const content = await readFileAsBase64(file);

  await api(`/repos/${state.owner}/${state.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
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
  setStatus('已连接仓库，可以开始上传文档。', 'success');
}

async function publishDoc() {
  const title = elements.docTitle.value.trim();
  const description = elements.docDescription.value.trim();
  const tags = elements.docTags.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const file = elements.docFile.files[0];
  const url = elements.docUrl.value.trim();

  if (!title || !description) {
    setStatus('标题和摘要需要填写完整。', 'error');
    return;
  }

  if (!file && !url) {
    setStatus('请选择文件，或者填写一个外部链接。', 'error');
    return;
  }

  setStatus('正在上传文档并更新列表...');

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
    description,
    href,
    updatedAt: today(),
    tags,
    external,
    fileType,
  });

  await saveContent(`Publish document ${title}`);
  renderDocs();

  elements.docTitle.value = '';
  elements.docDescription.value = '';
  elements.docTags.value = '';
  elements.docFile.value = '';
  elements.docUrl.value = '';
  setStatus(`文档“${title}”已发布。`, 'success');
}

elements.connectBtn.addEventListener('click', () => connect().catch((error) => setStatus(`连接失败：${error.message}`, 'error')));
elements.publishBtn.addEventListener('click', () => publishDoc().catch((error) => setStatus(`发布失败：${error.message}`, 'error')));
