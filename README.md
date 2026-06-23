# wuyifei.xyz 文档站

这是一个静态文档目录网站，适合长期维护。

## 网站结构

- `index.html`：首页
- `styles.css`：样式
- `script.js`：前端渲染逻辑
- `docs-data.js`：分类和文档数据
- `docs/`：站内文档页面

## 新增文档

1. 把文档页放进 `docs/`，或者准备一个外部文档链接
2. 在 `docs-data.js` 的 `window.DOC_ITEMS` 里添加一条记录
3. 如果需要新分类，在 `window.DOC_CATEGORIES` 里添加分类
4. 提交并推送到 GitHub

## 文档记录格式

```js
{
  title: '文档标题',
  category: 'guide',
  description: '一段简短摘要',
  href: './docs/example.html',
  updatedAt: '2026-06-23',
  tags: ['标签1', '标签2'],
}
```
