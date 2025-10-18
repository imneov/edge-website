---
sidebar_position: 1
title: 开发者指南
---

# 开发者指南

欢迎来到 Edge Platform 开发者指南！本指南将帮助你深入理解 Edge Platform 的核心概念、架构设计和最佳实践。

## 文档组织

### 核心概念 (Concepts)

这部分文档介绍 Edge Platform 的核心设计理念和关键概念：

#### [1. 系统架构](./concepts/architecture.md)

了解 Edge Platform 的整体架构设计：
- 双组件架构：APIServer + Controller
- 与 Kubernetes 的深度集成
- 多集群支持和扩展性设计
- 性能优化和安全保障

**适合**: 架构师、技术负责人、希望全面了解系统的开发者

#### [2. 权限模型](./concepts/permission-model.md)

深入理解统一权限管理框架：
- 从传统 RBAC 到 Scope 感知权限的演进
- IAMRole、RoleTemplate、IAMRoleBinding 三者关系
- 前后端权限一体化设计
- 权限聚合和检查流程

**适合**: 后端开发者、权限管理员、安全工程师

#### [3. Scope 系统](./concepts/scope-system.md)

掌握 Edge Platform 的 Scope 层级体系：
- 5 层 Scope 架构：global → cluster → workspace/nodegroup → namespace
- 并行维度：Workspace (应用视图) vs NodeGroup (资源视图)
- 级联权限继承机制
- Scope 边界和隔离

**适合**: 平台管理员、多租户环境架构师、开发团队负责人

#### [4. RoleTemplate 权限模板](./concepts/roletemplate.md)

学习权限复用和组合机制：
- RoleTemplate 的设计目的和使用场景
- 模板聚合机制和自动更新
- RoleTemplateController 的工作原理
- 最佳实践和常见问题

**适合**: 权限管理员、平台开发者、系统集成工程师

#### [5. OAuth 认证](./concepts/oauth.md)

了解认证流程和 Token 管理：
- OAuth2 认证服务架构
- JWT Token 结构和生命周期
- 与 Kubernetes User 的集成
- 前端认证集成最佳实践

**适合**: 前端开发者、安全工程师、应用集成开发者

## 学习路径

### 快速入门路径

如果你是第一次接触 Edge Platform，建议按以下顺序阅读：

```
1. 系统架构 → 了解整体设计
2. OAuth 认证 → 理解用户认证流程
3. 权限模型 → 掌握权限定义方式
4. Scope 系统 → 理解权限作用范围
5. RoleTemplate → 学习权限复用机制
```

### 管理员路径

如果你负责平台管理和权限配置，建议重点关注：

```
1. Scope 系统 → 理解多租户隔离
2. 权限模型 → 掌握角色定义
3. RoleTemplate → 学习模板管理
4. 系统架构 → 了解部署和维护
```

### 开发者路径

如果你需要开发基于 Edge Platform 的应用，建议重点关注：

```
1. OAuth 认证 → 实现用户登录
2. 权限模型 → 理解 API 权限
3. 系统架构 → 了解 API 集成方式
```

## 关键特性速查

### Kubernetes 原生集成

```yaml
# 使用标准 kubectl 命令管理权限
kubectl get iamroles
kubectl get roletemplates
kubectl get iamrolebindings

# 使用标准 K8s RBAC 检查权限
kubectl auth can-i create deployments --as=alice
```

### Scope 感知权限

```yaml
# Workspace 级别权限
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRole
metadata:
  labels:
    iam.theriseunion.io/scope: workspace
    iam.theriseunion.io/scope-value: ai-project
```

### 权限模板复用

```yaml
# 定义一次，多处使用
apiVersion: iam.theriseunion.io/v1alpha1
kind: RoleTemplate
metadata:
  name: workload-manager
---
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRole
spec:
  aggregationRoleTemplates:
    templateNames:
      - workload-manager
```

### 前后端权限一体

```yaml
# 同时定义 API 和 UI 权限
spec:
  rules:
    - apiGroups: ["apps"]
      resources: ["deployments"]
      verbs: ["get", "list"]
  uiPermissions:
    - "workload/deployment/view"
```

## 常见任务

### 创建自定义角色

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRole
metadata:
  name: my-custom-role
  labels:
    iam.theriseunion.io/scope: workspace
    iam.theriseunion.io/scope-value: my-workspace
spec:
  aggregationRoleTemplates:
    templateNames:
      - workload-manager
      - storage-viewer
  rules:
    - apiGroups: ["custom.io"]
      resources: ["customresources"]
      verbs: ["*"]
```

### 分配权限给用户

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRoleBinding
metadata:
  name: alice-developer
  labels:
    iam.theriseunion.io/scope: workspace
    iam.theriseunion.io/scope-value: my-workspace
spec:
  subjects:
    - kind: User
      name: alice
  roleRef:
    kind: IAMRole
    name: my-custom-role
```

### 创建可复用的权限模板

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: RoleTemplate
metadata:
  name: my-custom-template
  labels:
    iam.theriseunion.io/category: custom
spec:
  displayName:
    zh-CN: "自定义模板"
    en-US: "Custom Template"
  rules:
    - apiGroups: ["custom.io"]
      resources: ["resources"]
      verbs: ["get", "list"]
  uiPermissions:
    - "custom/resource/view"
```

## 设计原则

Edge Platform 的设计遵循以下核心原则：

### 1. Kubernetes 原生优先

- 所有 API 遵循 K8s 规范
- 完全兼容 kubectl 和标准工具
- 充分利用 K8s RBAC 生态

### 2. 统一权限模型

- 单一 CRD 通过标签区分 Scope
- 消除特殊情况和条件分支
- 30 行逻辑替代 300+ 行重复代码

### 3. 权限复用和组合

- RoleTemplate 提供可复用模板
- 支持权限规则的动态聚合
- 一次修改，全局生效

### 4. 前后端一体化

- API 权限和 UI 权限同时定义
- 单一来源，避免不一致
- 简化权限管理复杂度

### 5. 多租户隔离

- Scope 标签实现强隔离
- 支持工作空间和节点组并行维度
- 清晰的权限继承边界

## 技术支持

### 问题反馈

如果你在使用过程中遇到问题：

1. 查看 [常见问题](./faq.md)（即将添加）
2. 搜索 [Issues](https://github.com/theriseunion/apiserver/issues)
3. 提交新的 Issue

### 贡献指南

欢迎为 Edge Platform 贡献代码和文档：

1. 阅读 [贡献指南](./contributing.md)（即将添加）
2. 提交 Pull Request
3. 参与社区讨论

## 版本信息

- **当前版本**: v1alpha1
- **API 版本**: iam.theriseunion.io/v1alpha1, scope.theriseunion.io/v1alpha1
- **Kubernetes 兼容性**: 1.20+

## 下一步

根据你的角色和需求，选择合适的文档开始阅读：

- **架构师**: [系统架构](./concepts/architecture.md) → [权限模型](./concepts/permission-model.md)
- **管理员**: [Scope 系统](./concepts/scope-system.md) → [RoleTemplate](./concepts/roletemplate.md)
- **开发者**: [OAuth 认证](./concepts/oauth.md) → [权限模型](./concepts/permission-model.md)

祝学习愉快！
