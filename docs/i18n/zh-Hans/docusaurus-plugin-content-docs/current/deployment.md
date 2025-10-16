---
sidebar_position: 5
---

# 部署指南

了解如何将您的 Docusaurus 文档网站部署到各种托管平台。

## GitHub Pages

GitHub Pages 是部署开源项目 Docusaurus 网站最简单的方式。

### 前置要求

1. 您的项目必须托管在 GitHub 上
2. 您需要有仓库的写入权限
3. 在仓库设置中启用 GitHub Pages

### 配置

1. 使用您的仓库信息更新 `docusaurus.config.ts`：

```typescript
const config: Config = {
  url: 'https://your-username.github.io',
  baseUrl: '/your-repo-name/',
  organizationName: 'your-username',
  projectName: 'your-repo-name',
  deploymentBranch: 'gh-pages',
  // ...
};
```

### 手动部署

```bash
# 设置您的 GitHub 用户名
GIT_USER=your-username yarn deploy
```

### 使用 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: 部署到 GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn
          cache-dependency-path: docs/yarn.lock
      - name: 安装依赖
        working-directory: docs
        run: yarn install --frozen-lockfile
      - name: 构建网站
        working-directory: docs
        run: yarn build
      - name: 设置 Pages
        uses: actions/configure-pages@v4
      - name: 上传构建产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/build
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Netlify

Netlify 提供持续部署，拥有慷慨的免费套餐。

### 快速部署

1. 将您的 GitHub 仓库连接到 Netlify
2. 设置构建参数：
   - 构建命令：`cd docs && yarn build`
   - 发布目录：`docs/build`
   - Node 版本：18

### 自定义域名

1. 在 Netlify 设置中添加您的自定义域名
2. 更新 `docusaurus.config.ts`：

```typescript
const config: Config = {
  url: 'https://your-domain.com',
  baseUrl: '/',
  // ...
};
```

## Vercel

Vercel 为静态网站提供出色的性能和开发体验。

### 配置

在项目根目录创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "docs/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/docs/$1"
    }
  ]
}
```

在 `docs/package.json` 中添加构建脚本：

```json
{
  "scripts": {
    "vercel-build": "docusaurus build"
  }
}
```

## Docker 部署

对于自托管解决方案，使用 Docker：

### Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY docs/package*.json docs/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY docs/ ./
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include mime.types;
    sendfile on;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # 启用 gzip 压缩
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
    }
}
```

### 构建和运行

```bash
# 构建镜像
docker build -t my-docs .

# 运行容器
docker run -p 8080:80 my-docs
```

## 环境变量

对于不同环境，使用环境变量：

```bash
# 生产环境
DOCUSAURUS_URL=https://your-site.com yarn build

# 测试环境
DOCUSAURUS_URL=https://staging.your-site.com yarn build
```

在配置中访问：

```typescript
const config: Config = {
  url: process.env.DOCUSAURUS_URL || 'http://localhost:3000',
  // ...
};
```

## 性能优化

### 构建优化

- 启用压缩
- 优化图片
- 使用 CDN 托管静态资源
- 启用浏览器缓存

### 监控

考虑添加：
- Google Analytics
- 性能监控
- 错误跟踪
- SEO 监控

## 问题排查

### 常见问题

1. **构建失败**：检查断开的链接和缺失的文件
2. **404 错误**：验证 baseUrl 配置
3. **构建缓慢**：优化图片并减少包大小
4. **内存问题**：增加 Node.js 内存限制

### 调试命令

```bash
# 检查断开的链接
yarn build

# 分析包大小
yarn build --analyze

# 本地预览构建的网站
yarn serve
```