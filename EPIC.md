# Epic: Edge Platform 官方文档网站建设

> **创建日期**: 2025-10-16
> **目标**: 建立一个类似 https://docs.kubesphere.com.cn 的专业文档网站

## 📋 Epic 概述

为 Edge Platform 构建专业的技术文档网站，提供产品介绍、安装指南、用户手册、API 参考等完整文档体系，支持中英文双语。

### 核心价值
- **用户教育**: 帮助用户快速了解和上手 Edge Platform
- **技术支持**: 提供完整的技术文档和最佳实践
- **社区建设**: 通过博客和案例分享建立技术社区
- **品牌建设**: 展示专业形象，提升产品可信度

## 🎯 成功标准

### 功能标准
- [x] 默认语言为中文
- [x] 支持中英文双语切换
- [ ] 包含完整的产品文档（至少 20 篇）
- [ ] 集成 OpenAPI 文档
- [ ] 具备搜索功能
- [ ] 响应式设计，移动端友好

### 性能标准
- Lighthouse 性能评分 > 90
- 首次加载时间 < 3s
- 构建时间 < 2min

### 内容标准
- 文档覆盖率 > 90%
- 无死链
- 代码示例可运行

## 🏗️ 技术架构

### 技术栈
- **框架**: Docusaurus 3.8.1+
- **语言**: TypeScript
- **构建**: Node.js 18+, pnpm
- **部署**: Docker + Nginx
- **国际化**: Docusaurus i18n（默认 zh-Hans）

### 项目结构
```
edge-website/
├── docs/                      # Docusaurus 项目根目录
│   ├── docs/                  # Markdown 文档
│   │   ├── intro.md
│   │   ├── introduction/      # 产品介绍
│   │   ├── quick-start/       # 快速开始
│   │   ├── installation/      # 安装指南
│   │   ├── user-guide/        # 用户指南
│   │   ├── platform-management/  # 平台管理
│   │   ├── cluster-management/   # 集群管理
│   │   ├── api-reference/     # API 参考
│   │   └── best-practices/    # 最佳实践
│   ├── blog/                  # 博客文章
│   ├── i18n/                  # 国际化
│   │   ├── zh-Hans/           # 中文（默认）
│   │   └── en/                # 英文
│   ├── static/                # 静态资源
│   ├── src/                   # React 组件
│   ├── docusaurus.config.ts   # 主配置
│   ├── sidebars.ts            # 侧边栏配置
│   └── package.json
└── README.md
```

### Git Subtree 管理
- **主仓库**: edge-apiserver-meta（私有）
- **文档仓库**: https://github.com/imneov/edge-website（公开）
- **同步命令**: `make push-website`

## 📝 Story 列表

### ✅ Story 1: 基础配置和中文化（已完成）

**完成日期**: 2025-10-16

**完成内容**:
- [x] 修改 i18n 默认语言为中文（zh-Hans）
- [x] 配置 localeConfigs（中英文标签和路径）
- [x] 更新站点标题和 tagline 为中文
- [x] 中文化导航栏（文档、博客）
- [x] 中文化页脚链接
- [x] 验证热重载功能正常

**验收结果**: ✅ 通过
- 网站默认显示简体中文
- 导航栏和页脚正确显示中文
- 语言切换器显示"简体中文"
- 本地开发服务器运行在 http://localhost:3001

---

### Story 2: 文档结构设计（1 天）

**目标**: 参考 Kubernetes 文档站，设计完整的文档结构

**任务清单**:
1. [ ] 设计侧边栏结构（`sidebars.ts`）
   - 产品介绍（概述、架构、特性、场景）
   - 快速入门（前置要求、安装、第一个应用）
   - 安装指南（资源要求、K8s 准备、平台安装、验证）
   - 平台管理（用户、角色、集群）
   - 集群管理（概览、节点、边缘节点、应用）
   - API 参考（概览、认证、OpenAPI）
   - 最佳实践（安全、监控、故障排查）

2. [ ] 创建目录和占位 Markdown 文件
   - 为每个章节创建文件夹
   - 创建 `.md` 文件并添加 frontmatter
   - 添加基础内容框架

**验收标准**:
- [ ] 侧边栏结构完整清晰
- [ ] 所有目录和文件已创建
- [ ] 文档分类符合用户使用路径
- [ ] 无构建错误

---

### Story 3: 核心文档内容编写（5 天）

**目标**: 编写核心文档内容

**任务清单**:

#### 3.1 产品介绍（1 天）
- [ ] **产品概述** (`introduction/overview.md`)
  - Edge Platform 是什么
  - 解决什么问题
  - 核心价值主张

- [ ] **架构设计** (`introduction/architecture.md`)
  - 系统架构图
  - 组件说明（apiserver、controller、console）
  - 技术选型

- [ ] **核心特性** (`introduction/features.md`)
  - 多集群管理
  - 边缘节点管理
  - 权限管理
  - 可观测性

- [ ] **应用场景** (`introduction/use-cases.md`)
  - 物联网边缘计算
  - 工业互联网
  - 混合云场景

#### 3.2 快速入门（1 天）
- [ ] **前置要求** (`quick-start/prerequisites.md`)
  - Kubernetes 版本要求
  - 资源要求
  - 网络要求

- [ ] **快速安装** (`quick-start/install.md`)
  - 使用 Helm 一键安装
  - 验证安装结果

- [ ] **第一个应用** (`quick-start/first-app.md`)
  - 部署示例应用
  - 访问应用
  - 清理资源

#### 3.3 安装指南（1 天）
- [ ] **资源要求** (`installation/requirements.md`)
- [ ] **Kubernetes 集群准备** (`installation/kubernetes.md`)
- [ ] **Edge Platform 安装** (`installation/edge-platform.md`)
- [ ] **安装验证** (`installation/verification.md`)

#### 3.4 平台管理（1 天）
- [ ] **用户管理** (`platform-management/users.md`)
- [ ] **角色管理** (`platform-management/roles.md`)
- [ ] **集群管理** (`platform-management/clusters.md`)

#### 3.5 集群管理（1 天）
- [ ] **集群概览** (`cluster-management/overview.md`)
- [ ] **节点管理** (`cluster-management/nodes.md`)
- [ ] **边缘节点** (`cluster-management/edge-nodes.md`)
- [ ] **应用管理** (`cluster-management/applications.md`)

**验收标准**:
- [ ] 每个章节内容完整、准确
- [ ] 包含代码示例
- [ ] 包含截图（如需）
- [ ] 符合技术文档规范
- [ ] 中文表达流畅

---

### Story 4: API 参考文档集成（2 天）

**目标**: 集成 OpenAPI 文档，提供 API 参考

**任务清单**:

1. [ ] **OpenAPI 文档生成**
   - 确保 apiserver 的 `/openapi/v2` 端点正常
   - 生成 `openapi.json` 文件
   - 保存到 `static/api/` 目录

2. [ ] **集成 Swagger UI**
   - 安装 `docusaurus-plugin-openapi-docs`
   - 配置 OpenAPI 插件
   - 创建 API 参考页面

3. [ ] **API 文档说明**
   - 编写 API 使用指南
   - 认证授权说明（OAuth、Token）
   - 常用 API 示例

**验收标准**:
- [ ] OpenAPI 文档可以正常浏览
- [ ] API 可以在线测试（Try it out）
- [ ] 认证流程说明清晰

---

### Story 5: 多语言国际化（2 天）

**目标**: 完成中英文双语支持

**任务清单**:

1. [ ] **生成翻译文件**
   - 运行 `pnpm write-translations`
   - 检查 `i18n/zh-Hans/` 和 `i18n/en/` 结构

2. [ ] **英文文档编写**
   - 翻译核心页面（intro, installation, quick-start）
   - 翻译导航栏和页脚
   - 翻译 UI 组件字符串

3. [ ] **语言切换测试**
   - 测试语言切换功能
   - 检查路由（`/`, `/en/`）
   - 验证搜索功能双语支持

**验收标准**:
- [ ] 中英文可以无缝切换
- [ ] 核心文档有英文版本
- [ ] 搜索功能支持双语

---

### Story 6: 博客和案例（1 天）

**目标**: 添加博客功能，发布技术文章

**任务清单**:

1. [ ] **博客配置**
   - 配置博客作者信息（`authors.yml`）
   - 设置博客分类和标签

2. [ ] **初始博客文章**
   - "Edge Platform 文档网站上线"
   - "Edge Platform 架构解析"
   - "工业物联网场景实践"

**验收标准**:
- [ ] 博客页面可以访问
- [ ] 至少有 2-3 篇文章
- [ ] 支持标签和分类浏览

---

### Story 7: 搜索和 SEO 优化（1 天）

**目标**: 添加搜索功能，优化 SEO

**任务清单**:

1. [ ] **搜索功能**
   - 集成 Algolia DocSearch 或本地搜索
   - 配置搜索索引
   - 测试搜索功能

2. [ ] **SEO 优化**
   - 设置每个页面的 meta description
   - 添加关键词
   - 配置 sitemap
   - 添加 Google Analytics（可选）

3. [ ] **性能优化**
   - 图片压缩和懒加载
   - 代码分割
   - 构建产物优化

**验收标准**:
- [ ] 搜索功能正常工作
- [ ] SEO 指标良好（Lighthouse 评分 > 90）
- [ ] 页面加载速度快

---

### Story 8: 部署和 CI/CD（2 天）

**目标**: 实现自动化部署

**任务清单**:

1. [ ] **Docker 构建**
   - 编写 `Dockerfile`（多阶段构建）
   - 测试 Docker 镜像
   - 推送到镜像仓库（quanzhenglong.com）

2. [ ] **CI/CD 流程**
   - GitHub Actions 配置
   - 自动构建和测试
   - 自动部署到生产环境

3. [ ] **部署环境**
   - 开发环境：`http://localhost:3001`
   - 生产环境：`https://docs.theriseunion.io`
   - 配置 HTTPS 证书

4. [ ] **更新 Makefile**
   ```makefile
   website-dev: ## Start website development server
   	cd edge-website/docs && PORT=3001 pnpm start

   website-build: ## Build website
   	cd edge-website/docs && pnpm build

   website-serve: ## Serve built website
   	cd edge-website/docs && pnpm serve

   website-deploy: ## Deploy website
   	cd edge-website/docs && pnpm deploy

   website-docker-build: ## Build Docker image
   	docker build -t $(REGISTRY)/edge/edge-website:latest edge-website/docs

   website-docker-push: ## Push Docker image
   	docker push $(REGISTRY)/edge/edge-website:latest
   ```

**验收标准**:
- [ ] Docker 镜像构建成功
- [ ] CI/CD 流程正常工作
- [ ] 可以通过域名访问文档网站
- [ ] HTTPS 配置正确

---

## 📊 时间估算

| Story | 工作量 | 状态 | 依赖 |
|-------|--------|------|------|
| Story 1: 基础配置和中文化 | 0.5 天 | ✅ 已完成 | 无 |
| Story 2: 文档结构设计 | 1 天 | ⏳ 待开始 | Story 1 |
| Story 3: 核心文档编写 | 5 天 | ⏳ 待开始 | Story 2 |
| Story 4: API 参考文档 | 2 天 | ⏳ 待开始 | Story 2 |
| Story 5: 多语言国际化 | 2 天 | ⏳ 待开始 | Story 3 |
| Story 6: 博客和案例 | 1 天 | ⏳ 待开始 | Story 1 |
| Story 7: 搜索和 SEO | 1 天 | ⏳ 待开始 | Story 3 |
| Story 8: 部署和 CI/CD | 2 天 | ⏳ 待开始 | Story 1-7 |

**总计**: 14.5 天（约 3 周）

## 🚨 风险和缓解措施

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 文档内容不完整 | 高 | 中 | 分阶段发布，先上线核心文档 |
| 翻译质量差 | 中 | 中 | 优先中文，英文后续完善 |
| OpenAPI 集成问题 | 中 | 低 | 使用静态 JSON 文件备选 |
| 部署环境问题 | 高 | 低 | 提前测试部署流程 |
| 性能不达标 | 中 | 低 | 使用 CDN 和图片优化 |

## 📈 成功指标

### 上线指标
- [ ] 文档网站通过 `https://docs.theriseunion.io` 访问
- [ ] 包含至少 20 篇核心文档
- [ ] 支持中英文双语
- [ ] Lighthouse 评分 > 90

### 用户指标（上线后 3 个月）
- 月访问量 > 1000 PV
- 平均停留时间 > 3 分钟
- 跳出率 < 60%

### 内容指标
- 文档覆盖率 > 90%
- 文档更新频率 > 2 次/月
- 用户反馈响应时间 < 3 天

## 🔄 后续计划

### Phase 2: 进阶内容（1 个月后）
- 高级配置指南
- 插件开发文档
- 贡献者指南
- FAQ 常见问题

### Phase 3: 互动功能（3 个月后）
- 在线演示环境（Try it live）
- 用户反馈系统
- 社区论坛集成
- 视频教程集成

### Phase 4: 社区建设（6 个月后）
- 用户案例展示
- 技术博客定期发布
- 线上/线下技术沙龙
- 开发者认证计划

## 📚 参考资料

- **Kubernetes 文档**: https://docs.kubesphere.com.cn/
- **Docusaurus 官方文档**: https://docusaurus.io/
- **项目模板**: https://github.com/imneov/project-template
- **边缘平台仓库**: https://github.com/imneov/edge-apiserver

## 📞 联系方式

- **项目负责人**: [你的名字]
- **技术支持**: edge-platform@theriseunion.io
- **问题反馈**: https://github.com/imneov/edge-website/issues

---

**最后更新**: 2025-10-16
**文档版本**: v1.0
**Epic 状态**: 进行中（Story 1 已完成）
