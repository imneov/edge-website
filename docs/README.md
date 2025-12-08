## 概述

这是一个项目模板，包含完整的Docusaurus文档网站功能。新项目可以基于此模板快速创建，避免重复搭建文档网站的工作。

## 开发命令

### 文档网站开发
```bash
cd docs
yarn install          # 安装依赖
yarn start            # 启动开发服务器 (http://localhost:3000)
yarn build            # 构建生产版本
yarn serve            # 本地预览构建结果
yarn typecheck        # 类型检查
```

### 部署
```bash
GIT_USER=<GitHub用户名> yarn deploy    # 部署到GitHub Pages
```

## 架构结构

### 文档网站 (`docs/`)
- **配置文件**: `docusaurus.config.ts` - 网站配置，包括站点信息、主题、插件等
- **内容目录**: 
  - `docs/` - Markdown文档文件
  - `blog/` - 博客文章 (MDX格式)
  - `src/pages/` - React页面组件
  - `static/` - 静态资源 (图片、图标等)
- **样式**: `src/css/custom.css` - 自定义CSS样式
- **导航**: `sidebars.ts` - 侧边栏配置
- **多语言**: `i18n/` - 国际化翻译文件

### 模板定制要点
1. **站点信息**: 修改 `docusaurus.config.ts` 中的 `title`, `tagline`, `url`, `organizationName`, `projectName`
2. **语言设置**: 默认英文 (`en`)，支持中英文切换，可在配置中调整，注意需要在 `yarn server` 模式下才能测试
3. **主题色彩**: 蓝色渐变主题，可通过 `custom.css` 自定义
4. **社交卡片**: 更新 `static/img/` 中的社交分享图片
5. **首页内容**: 修改 `src/pages/index.tsx` 和 `src/components/HomepageFeatures/` 中的内容

### 内容组织
- 文档采用Markdown格式，支持MDX (React组件)
- 博客支持作者信息和标签系统
- 首页组件位于 `src/pages/index.tsx`
- 特色组件在 `src/components/HomepageFeatures/`

### 多语言支持
- 默认语言：英文 (en)
- 支持语言：英文、简体中文
- 中文翻译位于 `i18n/zh-Hans/` 目录
- 语言切换器已配置在导航栏

## 示例内容

模板包含以下示例内容：

### 文档示例
- **Getting Started** (`docs/intro.md`) - 项目介绍和快速开始
- **Installation** (`docs/installation.md`) - 安装指南
- **Configuration** (`docs/configuration.md`) - 配置说明
- **Writing Content** (`docs/writing-content.md`) - 内容编写指南

### 博客示例
- **Welcome Post** - 欢迎文章
- **Tips and Tricks** - MDX功能演示
- **Author Profiles** - 作者档案配置

## 使用此模板的步骤
1. 复制模板到新项目目录
2. 修改 `docs/docusaurus.config.ts` 中的项目信息
3. 更新 `docs/docs/intro.md` 作为项目介绍页
4. 替换 `static/img/` 中的logo和图标
5. 更新首页内容 `src/pages/index.tsx` 和特性介绍
6. 根据需要调整主题样式和布局
7. 删除或替换示例内容
8. 配置部署设置