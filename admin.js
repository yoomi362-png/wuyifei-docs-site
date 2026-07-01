const elements = {
  token: document.querySelector('#token'),
  owner: document.querySelector('#owner'),
  repo: document.querySelector('#repo'),
  branch: document.querySelector('#branch'),
  connectBtn: document.querySelector('#connect-btn'),
  status: document.querySelector('#status'),
  docTitle: document.querySelector('#doc-title'),
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
  content: { document: null },
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

function getFileLabel(item) {
  if (!item) return '';
  if (item.external) return '外部链接';
  const type = (item.fileType || '').toLowerCase();
  if (type === 'pdf') return 'PDF';
  if (type === 'doc' || type === 'docx') return 'Word';
  return '文档';
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
  renderDoc();
}

function renderDoc() {
  const item = state.content.document;
  if (!item) {
    elements.docAdminList.innerHTML = '<p class="empty-state">当前还没有文档。</p>';
    return;
  }

  elements.docAdminList.innerHTML = `
    <article class="admin-card">
      <strong>${item.title}</strong>
      <p>${item.description}</p>
      <small>${getFileLabel(item)} · ${item.updatedAt}</small>
    </article>
  `;
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

async function deleteExistingFile(filePath) {
  if (!filePath) return;

  const response = await fetch(
    `https://api.github.com/repos/${state.owner}/${state.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}?ref=${state.branch}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${state.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) return;

  const data = await response.json();
  await api(`/repos/${state.owner}/${state.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, '/')}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Remove old file ${filePath}`,
      sha: data.sha,
      branch: state.branch,
    }),
  });
}

async function uploadRepoFile(file, targetPath) {
  const content = await readFileAsBase64(file);

  await api(`/repos/${state.owner}/${state.repo}/contents/${encodeURIComponent(targetPath).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Upload ${file.name}`,
      content,
      branch: state.branch,
    }),
  });

  return `./${targetPath}`;
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
  setStatus('已连接仓库，可以开始替换文档。', 'success');
}

async function publishDoc() {
  const title = elements.docTitle.value.trim() || '未命名文档';
  const description = elements.docDescription.value.trim() || '当前站点唯一公开文档，访客可以直接在线查看或下载。';
  const file = elements.docFile.files[0];
  const url = elements.docUrl.value.trim();

  if (!file && !url) {
    setStatus('请选择文件，或者填写一个外部链接。', 'error');
    return;
  }

  setStatus('正在更新唯一文档...');

  const previousPath = state.content.document?.filePath;
  let href = url;
  let external = Boolean(url);
  let fileType = 'link';
  let filePath = previousPath || '';

  if (file) {
    fileType = getFileType(file.name);
    filePath = `docs/${title}.${fileType}`;
    if (previousPath && previousPath !== filePath) {
      await deleteExistingFile(previousPath).catch(() => {});
    }
    href = await uploadRepoFile(file, filePath);
    external = false;
  }

  state.content.document = {
    title,
    description,
    href,
    updatedAt: today(),
    tags: [fileType.toUpperCase()],
    external,
    fileType,
    filePath,
  };

  await saveContent(`Publish document ${title}`);
  renderDoc();

  elements.docDescription.value = '';
  elements.docFile.value = '';
  elements.docUrl.value = '';
  setStatus(`文档“${title}”已更新。`, 'success');
}

elements.connectBtn.addEventListener('click', () => connect().catch((error) => setStatus(`连接失败：${error.message}`, 'error')));
elements.publishBtn.addEventListener('click', () => publishDoc().catch((error) => setStatus(`发布失败：${error.message}`, 'error')));
