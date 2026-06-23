# wuyifei.xyz 文档中心

这是一个部署在 GitHub Pages 上的静态文档中心，包含公开前台和管理员后台。

## 页面

- `index.html`：访客访问的文档中心首页
- `admin.html`：管理员后台
- `data/content.json`：分类和文档目录数据
- `uploads/`：后台上传的 PDF / Word 文件会放在这里

## 管理方式

管理员打开 `admin.html` 后，可以：

- 连接 GitHub 仓库
- 新增分类
- 上传 PDF / Word 文档
- 录入外部文档链接
- 自动更新 `data/content.json`

## Token 权限

后台上传依赖 GitHub API。建议使用只授权当前仓库的 fine-grained token，并确保至少包含：

- `Contents: Read and write`
- `Metadata: Read`

Token 只保存在浏览器当前会话中，不写入仓库文件。

## 访客体验

前台首页只负责：

- 分类浏览
- 文档搜索
- 最近更新
- 打开 PDF、Word 或站内文档
