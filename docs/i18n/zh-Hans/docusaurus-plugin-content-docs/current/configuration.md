---
sidebar_position: 3
---

# 配置说明

了解如何自定义项目模板以匹配您的项目需求。

## 基础配置

主要配置文件位于 `docusaurus.config.ts`。以下是您应该更新的关键设置：

### 站点元信息

```typescript
const config: Config = {
  title: '您的项目名称',
  tagline: '您的项目描述',
  favicon: 'img/favicon.ico',
  url: 'https://your-project.example.com',
  baseUrl: '/',
  organizationName: 'your-username',
  projectName: 'your-project',
  // ...
};
```

### 导航栏

在 `themeConfig.navbar` 部分更新导航栏：

```typescript
navbar: {
  title: '您的项目',
  logo: {
    alt: '您的项目Logo',
    src: 'img/logo.svg',
  },
  items: [
    // 添加或修改导航项
  ],
},
```

## 多语言设置

模板预配置了中英文支持。

### 默认语言配置

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh-Hans'],
},
```

### 添加更多语言

1. 在 `docusaurus.config.ts` 中的 `locales` 数组添加语言代码
2. 使用 Docusaurus CLI 创建翻译文件：

```bash
yarn write-translations --locale [locale]
```

3. 在生成的 `i18n/[locale]/` 目录中翻译内容

## 主题定制

### 自定义 CSS

编辑 `src/css/custom.css` 来自定义颜色、字体和布局：

```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  /* 添加您的自定义 CSS 变量 */
}
```

### Logo 和图标

替换 `static/img/` 目录中的这些文件：
- `logo.svg` - 网站Logo
- `favicon.ico` - 浏览器图标
- `docusaurus-social-card.jpg` - 社交媒体预览图片

## 插件配置

### 博客设置

在预设配置中配置博客行为：

```typescript
blog: {
  showReadingTime: true,
  postsPerPage: 10,
  blogSidebarTitle: '所有文章',
  blogSidebarCount: 'ALL',
},
```

### 文档设置

自定义文档行为：

```typescript
docs: {
  sidebarPath: './sidebars.ts',
  editUrl: 'https://github.com/your-username/your-project/tree/main/docs/',
  showLastUpdateTime: true,
  showLastUpdateAuthor: true,
},
```

## SEO 和分析

### Meta 标签

配置 SEO 设置：

```typescript
const config: Config = {
  // ...
  themeConfig: {
    metadata: [{name: 'keywords', content: '文档, 博客, react'}],
    image: 'img/docusaurus-social-card.jpg',
  },
};
```

### Google Analytics

添加 Google Analytics（可选）：

```bash
yarn add @docusaurus/plugin-google-analytics
```

然后在 `docusaurus.config.ts` 中配置：

```typescript
plugins: [
  [
    '@docusaurus/plugin-google-analytics',
    {
      trackingID: 'UA-XXXXXXXXX-X',
    },
  ],
],
```

## 侧边栏配置

编辑 `sidebars.ts` 来组织您的文档：

```typescript
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: '指南',
      items: ['guide1', 'guide2'],
    },
  ],
};
```

## 页脚配置

在 `docusaurus.config.ts` 中自定义页脚链接：

```typescript
footer: {
  style: 'dark',
  links: [
    {
      title: '文档',
      items: [
        {
          label: '快速开始',
          to: '/docs/intro',
        },
      ],
    },
    // 添加更多页脚部分
  ],
  copyright: `版权所有 © ${new Date().getFullYear()} 您的项目.`,
},
```

## 环境变量

您可以使用环境变量进行敏感配置：

```bash
# .env
ORGANIZATION_NAME=your-org
PROJECT_NAME=your-project
```

然后在配置中引用：

```typescript
organizationName: process.env.ORGANIZATION_NAME,
projectName: process.env.PROJECT_NAME,
```