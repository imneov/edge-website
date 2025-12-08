---
sidebar_position: 2
---

# 安装指南

本指南将帮助你在本地机器上设置项目模板。

## 环境要求

开始之前，请确保已安装以下软件：

- **Node.js** 18.0 或更高版本 ([下载](https://nodejs.org/))
- **Yarn** 包管理器 ([安装指南](https://yarnpkg.com/getting-started/install))
- **Git** 版本控制工具

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/project-template.git
cd project-template
```

### 2. 进入文档目录

```bash
cd docs
```

### 3. 安装依赖

```bash
yarn install
```

这将安装包括 Docusaurus 和其插件在内的所有必要依赖。

### 4. 启动开发服务器

```bash
yarn start
```

此命令启动本地开发服务器并在浏览器中打开 `http://localhost:3000`。大多数更改会实时反映，无需重启服务器。

## 验证安装

安装完成后，你应该看到：

1. 带有项目模板品牌的欢迎页面
2. 包含"文档"和"博客"部分的导航菜单
3. 右上角的语言切换器
4. 示例文档页面

## 常见问题

### Node 版本错误

如果遇到 node 版本问题：

```bash
# 检查 Node.js 版本
node --version

# 如需要，更新到 Node.js 18+
# 使用 nvm（推荐）
nvm install 18
nvm use 18
```

### 端口已被占用

如果端口 3000 已被占用：

```bash
# 使用不同端口
yarn start --port 3001
```

### 包安装失败

如果 yarn install 失败：

```bash
# 清除缓存并重试
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

## 下一步

安装完成后：

1. 查看 [配置指南](/docs/configuration) 自定义你的网站
2. 开始为你的项目 [编写内容](/docs/writing-content)
3. 了解 [部署选项](/docs/deployment)