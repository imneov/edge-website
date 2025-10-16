---
sidebar_position: 4
---

# 内容编写

学习如何在文档网站中创建和组织内容。

## 文档页面

### 创建新页面

1. 在 `docs/` 目录下创建新的 `.md` 或 `.mdx` 文件
2. 在文件顶部添加 frontmatter：

```markdown
---
sidebar_position: 5
title: 自定义页面标题
description: 用于SEO的页面描述
---

# 页面内容

您的内容在这里...
```

### Frontmatter 选项

常用的 frontmatter 字段：

- `sidebar_position`: 侧边栏中的顺序（数字）
- `title`: 自定义页面标题（覆盖H1）
- `description`: 用于SEO的页面描述
- `keywords`: SEO关键词数组
- `hide_title`: 隐藏页面标题（布尔值）
- `hide_table_of_contents`: 隐藏目录（布尔值）

### Markdown 功能

#### 代码块

````markdown
```javascript title="example.js"
function hello(name) {
  console.log(`Hello, ${name}!`);
}
```
````

#### 提示框

```markdown
:::note
这是一个提示框。
:::

:::tip
这是一个技巧提示框。
:::

:::warning
这是一个警告提示框。
:::

:::danger
这是一个危险提示框。
:::
```

#### 标签页

````markdown
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="js" label="JavaScript">
    ```js
    console.log('来自 JavaScript 的问候！');
    ```
  </TabItem>
  <TabItem value="py" label="Python">
    ```python
    print('来自 Python 的问候!')
    ```
  </TabItem>
</Tabs>
````

## 博客文章

### 创建博客文章

1. 在 `blog/` 目录下创建新文件，使用以下命名模式：
   - `YYYY-MM-DD-post-title.md`
   - `YYYY-MM-DD-post-title.mdx`

2. 添加 frontmatter：

```markdown
---
slug: custom-blog-post-slug
title: 博客文章标题
authors:
  - name: 作者姓名
    title: 作者职位
    url: https://github.com/author
    image_url: https://github.com/author.png
tags: [标签1, 标签2, 标签3]
---

博客文章内容在这里...

<!--truncate-->

此注释后的内容只在完整文章页面显示。
```

### 博客 Frontmatter

- `slug`: 自定义URL路径
- `title`: 文章标题
- `authors`: 作者信息（数组）
- `tags`: 文章标签（数组）
- `date`: 自定义发布日期
- `hide_reading_time`: 隐藏阅读时间估算

### 作者档案

创建 `blog/authors.yml` 来定义可重用的作者档案：

```yaml
author1:
  name: 张三
  title: 高级开发工程师
  url: https://github.com/zhangsan
  image_url: https://github.com/zhangsan.png

author2:
  name: 李四
  title: 技术作家
  url: https://twitter.com/lisi
  image_url: /img/lisi.png
```

然后在文章中引用：

```markdown
---
authors: [author1, author2]
---
```

## MDX 功能

MDX 允许您在内容中使用 React 组件：

### 导入组件

```markdown
import MyComponent from '@site/src/components/MyComponent';

# 页面标题

<MyComponent prop="value" />
```

### 创建自定义组件

1. 在 `src/components/` 中创建组件：

```jsx title="src/components/Highlight.jsx"
export default function Highlight({children, color}) {
  return (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '2px',
        color: '#fff',
        padding: '0.2rem',
      }}>
      {children}
    </span>
  );
}
```

2. 在内容中使用：

```markdown
import Highlight from '@site/src/components/Highlight';

这是<Highlight color="#25c2a0">高亮文本</Highlight>。
```

## 内容组织

### 侧边栏结构

编辑 `sidebars.ts` 来组织文档：

```typescript
const sidebars = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: '入门指南',
      items: ['basics', 'advanced'],
      collapsed: false,
    },
    {
      type: 'link',
      label: '外部链接',
      href: 'https://example.com',
    },
  ],
};
```

### 分类和子分类

```typescript
{
  type: 'category',
  label: 'API 参考',
  link: {
    type: 'generated-index',
    title: 'API 参考',
    description: '完整的 API 文档',
  },
  items: [
    'api/authentication',
    'api/users',
    {
      type: 'category',
      label: '资源',
      items: ['api/posts', 'api/comments'],
    },
  ],
}
```

## 资源和图片

### 添加图片

1. 将图片放在 `static/img/` 目录
2. 在内容中引用：

```markdown
![替代文本](/img/screenshot.png)

<!-- 或使用自定义样式 -->
<img src="/img/screenshot.png" alt="替代文本" width="500" />
```

### 相对路径图片

对于特定文档的图片：

```markdown
![本地图片](./assets/local-image.png)
```

## 搜索

Docusaurus 包含内置搜索功能。本地搜索无需额外配置。

对于生产环境，考虑：
- [Algolia DocSearch](https://docsearch.algolia.com/)（开源项目免费）
- 本地搜索插件

## 优秀内容的技巧

1. **使用描述性标题** - 它们会成为导航锚点
2. **添加代码示例** - 包含实际示例
3. **使用提示框** - 突出重要信息
4. **保持简洁** - 使用子标题分割长内容
5. **交叉引用** - 在相关页面之间建立链接
6. **定期更新** - 保持内容现时和准确