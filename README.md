# wuyifei.xyz 文档中心

访问地址: https://wuyifei.xyz

这是一个部署在 GitHub Pages 上的单文档站点，前台只展示“网络跳跃教程”。

## 页面

- `index.html`：访客访问的首页
- `admin.html`：管理员后台
- `data/content.json`：当前公开文档的数据
- `docs/网络跳跃教程.pdf`：当前公开文档文件

## 管理方式

管理员打开 `admin.html` 后，可以：

- 连接 GitHub 仓库
- 上传 PDF / Word 文档并覆盖当前文档
- 录入外部文档链接
- 自动更新 `data/content.json`

## Token 权限

后台上传依赖 GitHub API。建议使用只授权当前仓库的 fine-grained token，并确保至少包含：

- `Contents: Read and write`
- `Metadata: Read`

Token 只保存在浏览器当前会话中，不写入仓库文件。

## 访客体验

前台首页只负责：

- 展示唯一公开文档
- 打开 PDF、Word 或站内文档
