# 边缘平台文档结构设计

> **更新日期**: 2025-10-16
> **版本**: v1.0

## 📚 文档结构概述

边缘平台文档分为**三大核心部分**，面向不同用户群体：

### 1. 🛠️ 开发文档（Developer Guide）
**目标用户**: 框架开发者、扩展开发者

**核心内容**:
- 统一权限管理框架的架构设计
- Scope 感知权限体系详解
- CRD、Controller、APIService 开发指南
- 前端 Console 架构和 API 集成
- 最佳实践和安全规范

**参考来源**:
- `docs/design/` 下的设计文档
- `docs/prd.md` - 项目需求文档
- `docs/architecture/` - 架构设计文档

### 2. 📖 使用文档（User Guide）
**目标用户**: 最终用户、平台管理员、团队负责人

**核心内容**:
- Console 功能使用指南
- 平台管理（用户、角色、设置）
- 集群管理（节点、边缘节点）
- 工作空间和应用管理
- 监控日志和应用商店

**参考来源**:
- `edge-console/src/app/` 下的页面功能
- Console UI 的实际操作流程

### 3. 🚀 部署文档（Deployment Guide）
**目标用户**: 运维人员、系统管理员

**核心内容**:
- 资源要求和环境准备
- Kubernetes 集群安装
- 边缘平台部署和配置
- 升级和故障排查

**参考来源**:
- `edge-installer/` 下的部署脚本
- `docs/deployment.md` - 部署文档

---

## 📂 详细目录结构

```
docs/
├── intro.md                          # 首页介绍
│
├── introduction/                     # 产品介绍
│   ├── overview.md                   # 产品概述
│   ├── architecture.md               # 架构设计
│   ├── features.md                   # 核心特性
│   └── use-cases.md                  # 应用场景
│
├── quick-start/                      # 快速入门
│   ├── prerequisites.md              # 前置要求
│   ├── installation.md               # 快速安装
│   ├── first-login.md                # 首次登录
│   └── first-cluster.md              # 创建第一个集群
│
├── deployment/                       # 部署指南
│   ├── requirements.md               # 资源要求
│   ├── preparation.md                # 环境准备
│   ├── install-kubernetes.md         # Kubernetes 集群安装
│   ├── install-platform.md           # 边缘平台安装
│   ├── verification.md               # 安装验证
│   ├── upgrade.md                    # 升级指南
│   └── troubleshooting.md            # 故障排查
│
├── user-guide/                       # 用户指南
│   ├── platform/                     # 平台管理
│   │   ├── users.md                  # 用户管理
│   │   ├── roles.md                  # 角色管理
│   │   └── settings.md               # 平台设置
│   │
│   ├── clusters/                     # 集群管理
│   │   ├── overview.md               # 集群概览
│   │   ├── create.md                 # 创建集群
│   │   ├── nodes.md                  # 节点管理
│   │   ├── edge-nodes.md             # 边缘节点
│   │   └── settings.md               # 集群配置
│   │
│   ├── workspaces/                   # 工作空间管理
│   │   ├── overview.md               # 工作空间概览
│   │   ├── create.md                 # 创建工作空间
│   │   ├── members.md                # 成员管理
│   │   └── projects.md               # 项目管理
│   │
│   ├── applications/                 # 应用管理
│   │   ├── deployments.md            # 部署管理
│   │   ├── services.md               # 服务管理
│   │   ├── configmaps.md             # 配置管理
│   │   └── secrets.md                # 密钥管理
│   │
│   ├── observability/                # 监控和日志
│   │   ├── metrics.md                # 指标监控
│   │   ├── logs.md                   # 日志查看
│   │   └── alerts.md                 # 告警配置
│   │
│   └── marketplace/                  # 应用商店
│       ├── browse.md                 # 浏览应用
│       ├── install.md                # 安装应用
│       └── manage.md                 # 管理应用
│
├── developer-guide/                  # 开发指南
│   ├── overview.md                   # 开发概述
│   │
│   ├── concepts/                     # 核心概念
│   │   ├── architecture.md           # 架构设计
│   │   ├── permission-model.md       # 权限模型
│   │   ├── scope-system.md           # Scope 体系
│   │   ├── role-template.md          # RoleTemplate 机制
│   │   └── oauth.md                  # OAuth 认证
│   │
│   ├── permissions/                  # 权限体系
│   │   ├── overview.md               # 权限概述
│   │   ├── rbac.md                   # RBAC 设计
│   │   ├── scope-aware.md            # Scope 感知授权
│   │   ├── role-binding.md           # 角色绑定
│   │   ├── cascading.md              # 级联权限
│   │   └── api-extension.md          # API 扩展
│   │
│   ├── api/                          # API 开发
│   │   ├── getting-started.md        # 开始使用
│   │   ├── crd-development.md        # CRD 开发
│   │   ├── controller.md             # Controller 开发
│   │   ├── api-service.md            # APIService 扩展
│   │   ├── reverse-proxy.md          # ReverseProxy 配置
│   │   └── metrics.md                # 监控指标集成
│   │
│   ├── frontend/                     # 前端开发
│   │   ├── overview.md               # 前端概述
│   │   ├── console-arch.md           # Console 架构
│   │   ├── api-client.md             # API 客户端
│   │   ├── permissions.md            # 权限集成
│   │   └── components.md             # 组件开发
│   │
│   └── best-practices/               # 最佳实践
│       ├── security.md               # 安全实践
│       ├── performance.md            # 性能优化
│       ├── testing.md                # 测试策略
│       └── deployment.md             # 部署策略
│
├── api-reference/                    # API 参考
│   ├── overview.md                   # API 概述
│   ├── authentication.md             # 认证机制
│   ├── authorization.md              # 授权机制
│   ├── openapi.md                    # OpenAPI 文档
│   │
│   ├── rest/                         # REST API
│   │   ├── users.md                  # 用户 API
│   │   ├── roles.md                  # 角色 API
│   │   ├── clusters.md               # 集群 API
│   │   ├── workspaces.md             # 工作空间 API
│   │   └── applications.md           # 应用 API
│   │
│   └── crd/                          # CRD API
│       ├── role.md                   # Role CRD
│       ├── role-template.md          # RoleTemplate CRD
│       ├── role-binding.md           # RoleBinding CRD
│       ├── workspace.md              # Workspace CRD
│       └── nodegroup.md              # NodeGroup CRD
│
└── reference/                        # 参考资料
    ├── glossary.md                   # 术语表
    ├── faq.md                        # 常见问题
    ├── release-notes.md              # 版本说明
    └── roadmap.md                    # 产品路线图
```

---

## 🎯 用户路径设计

### 路径 1: 新用户快速上手
```
intro.md → quick-start/ → user-guide/
```

### 路径 2: 运维人员部署
```
intro.md → deployment/ → troubleshooting.md
```

### 路径 3: 开发者深入理解
```
introduction/architecture.md → developer-guide/concepts/ → developer-guide/permissions/
```

### 路径 4: API 集成开发
```
api-reference/overview.md → api-reference/rest/ → developer-guide/api/
```

---

## 📝 文档编写优先级

### P0 - 核心必备（第一阶段）
- [ ] `intro.md` - 首页介绍
- [ ] `introduction/overview.md` - 产品概述
- [ ] `quick-start/installation.md` - 快速安装
- [ ] `deployment/install-platform.md` - 平台安装
- [ ] `user-guide/platform/users.md` - 用户管理

### P1 - 重要内容（第二阶段）
- [ ] `introduction/architecture.md` - 架构设计
- [ ] `developer-guide/concepts/permission-model.md` - 权限模型
- [ ] `developer-guide/permissions/scope-aware.md` - Scope 感知授权
- [ ] `api-reference/openapi.md` - OpenAPI 文档

### P2 - 完善内容（第三阶段）
- [ ] 用户指南的详细页面
- [ ] 开发指南的详细章节
- [ ] API 参考的完整文档

---

## 🔗 内容来源映射

### 开发文档内容来源
| 文档 | 来源 |
|------|------|
| `developer-guide/concepts/permission-model.md` | `docs/prd.md` + `docs/design/` |
| `developer-guide/permissions/scope-aware.md` | `docs/design/5-scope-implementation.md` |
| `developer-guide/permissions/cascading.md` | `docs/design/5-scope-cascading-permission-design.md` |
| `developer-guide/api/reverse-proxy.md` | `docs/design/reverseproxy-usage.md` |
| `developer-guide/concepts/oauth.md` | `docs/design/oauth-architecture.md` |

### 使用文档内容来源
| 文档 | 来源 |
|------|------|
| `user-guide/platform/*` | `edge-console/src/app/(boss)/boss/` |
| `user-guide/clusters/*` | `edge-console/src/app/(tenant)/tenant/` |
| `user-guide/marketplace/*` | `edge-console/src/app/marketplace/` |

### 部署文档内容来源
| 文档 | 来源 |
|------|------|
| `deployment/install-kubernetes.md` | `edge-installer/openyurt-1.6/` |
| `deployment/install-platform.md` | `edge-installer/deploy.sh` |

---

## ✅ Story 2 完成标准

- [x] ✅ 侧边栏结构设计完成（`sidebars.ts`）
- [x] ✅ 文档目录结构创建完成
- [x] ✅ 文档结构说明文档完成（`STRUCTURE.md`）
- [ ] ⏳ 关键占位文件创建（下一步）

---

## 📌 下一步行动

1. **创建关键占位文件** - 为 P0 优先级文档创建带 frontmatter 的占位文件
2. **开始内容编写** - 从 `intro.md` 和 `introduction/overview.md` 开始
3. **迁移现有文档** - 从 `docs/` 目录迁移相关内容到新结构

---

**文档负责人**: [你的名字]
**审核人**: [审核人名字]
**最后更新**: 2025-10-16
