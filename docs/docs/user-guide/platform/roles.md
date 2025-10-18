---
sidebar_position: 2
title: 角色管理
---

# 角色管理

角色管理是边缘平台统一权限管理框架的核心，通过角色来控制用户对资源的访问权限。

## 📋 概述

### 角色体系架构

边缘平台采用多层级的角色体系：

```
┌─────────────────────────────────────────┐
│           角色模板 (RoleTemplate)        │
│      定义可复用的权限规则模板            │
└──────────────┬──────────────────────────┘
               │ 聚合 (Aggregates)
               ↓
┌─────────────────────────────────────────┐
│             角色 (IAMRole)              │
│      实际分配给用户的权限集合            │
└──────────────┬──────────────────────────┘
               │ 绑定 (Binds)
               ↓
┌─────────────────────────────────────────┐
│        角色绑定 (IAMRoleBinding)        │
│      用户与角色的关联关系                │
└─────────────────────────────────────────┘
```

### 角色范围 (Scope)

角色可以在不同范围内生效：

| Scope 类型 | 说明 | 示例 |
|-----------|------|------|
| **platform** | 平台级别 | 平台管理员、平台观察者 |
| **cluster** | 集群级别 | 集群管理员、集群开发者 |
| **workspace** | 工作空间级别 | 工作空间管理员、成员 |
| **namespace** | 命名空间级别 | 项目管理员、项目开发者 |

## 👁️ 查看角色

### 访问角色管理页面

1. 登录边缘平台 Console
2. 点击左侧菜单"平台管理" > "访问控制" > "角色管理"

### 角色列表视图

```
┌────────────────────────────────────────────────────────────────┐
│ 角色名称           │ Scope      │ 来源    │ 用户数 │ 操作      │
├────────────────────────────────────────────────────────────────┤
│ platform-admin    │ platform   │ 系统    │ 5     │ [查看]    │
│ cluster-admin     │ cluster    │ 系统    │ 12    │ [查看]    │
│ workspace-admin   │ workspace  │ 系统    │ 28    │ [查看]    │
│ custom-developer  │ workspace  │ 自定义   │ 15    │ [编辑删除]│
└────────────────────────────────────────────────────────────────┘
```

### 筛选和搜索

**按 Scope 筛选**：

- 平台级角色
- 集群级角色
- 工作空间级角色
- 命名空间级角色

**按来源筛选**：

- 系统预定义角色
- 自定义角色

**搜索**：

- 输入角色名称进行搜索
- 支持模糊匹配

## 🔍 系统预定义角色

### 平台级角色

边缘平台提供以下预定义的平台级角色：

#### platform-admin（平台管理员）

**权限范围**: 平台所有资源的完全控制权限

**主要权限**：

```yaml
用户管理:
  - create, delete, update, get, list users

角色管理:
  - create, delete, update, get, list roles
  - create, delete, update, get, list role bindings

集群管理:
  - create, delete, update, get, list clusters
  - manage cluster settings

工作空间管理:
  - create, delete, update, get, list workspaces
  - manage workspace members

平台设置:
  - configure platform settings
  - manage system components
```

**适用场景**: 平台运维人员、系统管理员

#### platform-regular（普通用户）

**权限范围**: 基础使用权限

**主要权限**：

```yaml
个人信息:
  - get, update own profile

工作空间:
  - list workspaces (authorized)
  - access workspace resources (authorized)

集群:
  - list clusters (authorized)
  - access cluster resources (authorized)
```

**适用场景**: 大部分平台用户

#### platform-viewer（平台观察者）

**权限范围**: 平台只读权限

**主要权限**：

```yaml
查看权限:
  - get, list all resources
  - view metrics and logs

禁止权限:
  - create, update, delete any resources
```

**适用场景**: 审计人员、监控团队

### 集群级角色

#### cluster-admin（集群管理员）

**权限范围**: 指定集群的完全控制权限

**主要权限**：

```yaml
集群资源:
  - manage nodes
  - manage namespaces
  - manage storage
  - manage network policies

工作负载:
  - create, delete, update, get, list all workloads
  - manage deployments, statefulsets, daemonsets

配置:
  - manage configmaps, secrets
  - manage resource quotas
```

**适用场景**: 集群运维人员

#### cluster-viewer（集群观察者）

**权限范围**: 指定集群的只读权限

**主要权限**：

```yaml
查看权限:
  - get, list all cluster resources
  - view cluster metrics
  - view cluster events
```

**适用场景**: 开发人员查看资源状态

### 工作空间级角色

#### workspace-admin（工作空间管理员）

**权限范围**: 工作空间完全控制权限

**主要权限**：

```yaml
工作空间管理:
  - manage workspace settings
  - manage workspace members
  - manage workspace quota

项目管理:
  - create, delete, update projects
  - manage project resources

应用管理:
  - deploy applications
  - manage application lifecyle
```

**适用场景**: 团队负责人、项目经理

#### workspace-regular（工作空间成员）

**权限范围**: 工作空间基础使用权限

**主要权限**：

```yaml
项目访问:
  - access assigned projects
  - deploy applications (with approval)

资源查看:
  - view workspace resources
  - view project status
```

**适用场景**: 团队成员、开发人员

#### workspace-viewer（工作空间观察者）

**权限范围**: 工作空间只读权限

**主要权限**：

```yaml
查看权限:
  - view workspace information
  - view project information
  - view application status
```

**适用场景**: 产品经理、测试人员

## ➕ 创建自定义角色

### 步骤 1: 选择创建方式

**方式 1: 从角色模板创建**（推荐）

1. 点击"创建角色" > "从模板创建"
2. 选择一个或多个角色模板
3. 系统自动聚合权限规则

**方式 2: 手动创建**

1. 点击"创建角色" > "手动创建"
2. 逐个添加权限规则

**方式 3: 复制现有角色**

1. 找到要复制的角色
2. 点击操作菜单 > "复制"
3. 修改并保存

### 步骤 2: 配置基本信息

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| **角色名称*** | ✅ | 角色唯一标识 | `custom-developer` |
| **显示名称** | ❌ | 在 UI 显示的名称 | `自定义开发者角色` |
| **Scope*** | ✅ | 角色生效范围 | `workspace` |
| **描述** | ❌ | 角色用途说明 | `工作空间开发者，具有应用部署权限` |

### 步骤 3: 选择角色模板（如果使用模板）

在模板列表中选择要聚合的模板：

```
可用模板:
☑ workspace-view-basic       # 工作空间基础查看权限
☑ workspace-storage-manager  # 存储管理权限
☐ workspace-network-manager  # 网络管理权限
☑ workspace-app-deployer     # 应用部署权限
```

:::tip 角色模板聚合
选择多个模板后，系统会自动合并权限规则，无需手动配置。
:::

### 步骤 4: 配置权限规则（如果手动创建）

添加权限规则：

**规则示例 1: 允许查看 Pod**

```yaml
apiGroup: ""
resources:
  - pods
verbs:
  - get
  - list
  - watch
```

**规则示例 2: 允许管理 Deployments**

```yaml
apiGroup: "apps"
resources:
  - deployments
verbs:
  - create
  - update
  - delete
  - get
  - list
```

**规则示例 3: 允许访问特定 API**

```yaml
apiGroup: "iam.theriseunion.io"
resources:
  - roles
  - rolebindings
verbs:
  - get
  - list
```

### 步骤 5: 设置约束条件（可选）

添加额外的访问约束：

| 约束类型 | 说明 | 示例 |
|---------|------|------|
| **资源名称** | 限制访问特定名称的资源 | 只能访问 `app-*` 开头的 Deployment |
| **标签选择器** | 限制访问特定标签的资源 | `env=dev` |
| **命名空间** | 限制访问特定命名空间 | `dev-*` 开头的命名空间 |

### 步骤 6: 完成创建

1. 预览最终权限规则
2. 点击"创建"按钮
3. 角色创建成功

## ✏️ 编辑角色

### 修改角色信息

:::warning 系统角色不可修改
系统预定义角色不可编辑或删除，只能查看。
:::

1. 在角色列表中点击角色名称
2. 进入角色详情页
3. 点击"编辑"按钮
4. 修改以下内容：
   - 显示名称
   - 描述
   - 角色模板（添加/移除）
   - 权限规则（添加/修改/删除）

### 更新权限规则

**添加新规则**：

1. 在角色详情页点击"添加规则"
2. 配置规则参数
3. 点击"保存"

**修改现有规则**：

1. 找到要修改的规则
2. 点击"编辑"图标
3. 修改规则内容
4. 点击"保存"

**删除规则**：

1. 找到要删除的规则
2. 点击"删除"图标
3. 确认删除

### 版本管理

角色支持版本管理：

```
版本历史:
v3 (当前) - 2024-10-17 14:30 - admin - 添加应用部署权限
v2         - 2024-10-15 10:20 - admin - 修改存储权限
v1         - 2024-10-10 09:00 - admin - 创建角色
```

**回滚到历史版本**：

1. 查看版本历史
2. 选择要回滚的版本
3. 点击"回滚到此版本"
4. 确认操作

## 🔗 角色绑定

### 查看角色绑定

在角色详情页的"绑定"标签，可以看到：

```
用户绑定:
- user1 (张三) - workspace: dev-workspace
- user2 (李四) - workspace: qa-workspace
- user3 (王五) - cluster: prod-cluster

共 3 个用户使用此角色
```

### 创建角色绑定

**方式 1: 从角色页面创建**

1. 进入角色详情页
2. 点击"添加绑定"
3. 选择用户和范围：
   - 用户: `user1`
   - 绑定类型: `workspace`
   - 工作空间: `dev-workspace`
4. 点击"确定"

**方式 2: 从用户页面创建**

参见 [用户管理 - 授予权限](./users.md#授予权限)

### 解除角色绑定

1. 在角色的"绑定"标签
2. 找到要解除的绑定
3. 点击"解除绑定"
4. 确认操作

:::warning 权限立即失效
解除角色绑定后，用户的相应权限会立即失效。
:::

## 🎯 角色模板

### 什么是角色模板？

角色模板 (RoleTemplate) 是可复用的权限规则集合，用于构建角色。

**优点**：

- ✅ 提高权限配置的一致性
- ✅ 简化角色创建流程
- ✅ 便于权限策略的集中管理
- ✅ 支持权限的模块化组合

### 查看角色模板

1. 点击"角色管理" > "角色模板"标签
2. 查看可用的角色模板

### 常用角色模板

#### workspace-view-basic

**描述**: 工作空间基础查看权限

**包含权限**：

```yaml
- 查看工作空间信息
- 查看项目列表
- 查看应用状态
- 查看资源配额
```

#### workspace-app-deployer

**描述**: 应用部署权限

**包含权限**：

```yaml
- 创建/更新/删除 Deployments
- 创建/更新/删除 Services
- 创建/更新/删除 ConfigMaps (应用配置)
- 查看 Pod 状态和日志
```

#### workspace-storage-manager

**描述**: 存储管理权限

**包含权限**：

```yaml
- 创建/更新/删除 PVC
- 查看 PV 状态
- 管理存储类
```

### 创建自定义角色模板

:::info 需要平台管理员权限
创建角色模板需要 `platform-admin` 权限。
:::

**步骤**：

1. 点击"创建角色模板"
2. 填写模板信息：
   - 模板名称: `custom-app-manager`
   - 显示名称: `自定义应用管理`
   - 类别: `应用管理`
   - 描述: `应用的完整生命周期管理权限`
3. 添加权限规则
4. 点击"创建"

## 📊 权限分析

### 角色权限矩阵

查看角色的完整权限矩阵：

```
┌──────────────────────────────────────────────────────────┐
│ 资源类型        │ 查看 │ 创建 │ 更新 │ 删除 │ 其他      │
├──────────────────────────────────────────────────────────┤
│ Pods           │  ✅  │  ❌  │  ❌  │  ❌  │ logs     │
│ Deployments    │  ✅  │  ✅  │  ✅  │  ✅  │ scale    │
│ Services       │  ✅  │  ✅  │  ✅  │  ✅  │ -        │
│ ConfigMaps     │  ✅  │  ✅  │  ✅  │  ❌  │ -        │
│ Secrets        │  ❌  │  ❌  │  ❌  │  ❌  │ -        │
└──────────────────────────────────────────────────────────┘
```

### 用户权限审计

查看用户通过不同角色获得的权限：

```
用户: user1 (张三)

平台级权限:
  角色: platform-regular
  权限: 基础使用权限

集群级权限:
  prod-cluster:
    角色: cluster-viewer
    权限: 只读访问

工作空间级权限:
  dev-workspace:
    角色: workspace-admin
    权限: 完全控制

  qa-workspace:
    角色: workspace-viewer
    权限: 只读访问
```

## 🛡️ 最佳实践

### 1. 最小权限原则

只授予用户完成工作所需的最小权限。

✅ **好的做法**：

```yaml
# 为开发人员创建专门的角色，只包含必要权限
角色: developer
权限:
  - 部署应用
  - 查看日志
  - 更新配置
```

❌ **不好的做法**：

```yaml
# 为所有开发人员直接授予 admin 权限
角色: admin
权限: 所有权限
```

### 2. 使用角色模板

优先使用角色模板组合，而不是手动创建规则。

✅ **好的做法**：

```yaml
创建角色: custom-developer
使用模板:
  - workspace-view-basic
  - workspace-app-deployer
  - workspace-storage-manager
```

❌ **不好的做法**：

```yaml
手动添加 50+ 条权限规则
```

### 3. 定期审计权限

建立定期权限审计机制：

- 📅 每季度审查角色配置
- 📅 每月审查用户权限
- 📅 及时回收不再需要的权限

### 4. 角色命名规范

使用清晰的命名规范：

```yaml
格式: <scope>-<function>-<level>

示例:
  workspace-app-admin      # 工作空间应用管理员
  cluster-network-viewer   # 集群网络查看者
  platform-audit-viewer    # 平台审计查看者
```

## 🆘 常见问题

### Q: 角色和角色模板有什么区别？

**答**:

- **角色模板**: 可复用的权限规则集合，不能直接分配给用户
- **角色**: 由一个或多个角色模板聚合而成，可以分配给用户

### Q: 如何查看某个用户的所有权限？

**答**:

1. 进入"用户管理"
2. 点击用户名进入详情页
3. 查看"权限"标签，可以看到用户的所有权限来源和具体权限

### Q: 修改角色后，已绑定用户的权限何时生效？

**答**: 立即生效。修改角色后，所有绑定该角色的用户权限会立即更新。

### Q: 可以删除系统预定义角色吗？

**答**: 不可以。系统角色是只读的，不能修改或删除。

### Q: 如何实现临时授权？

**答**:

1. 创建临时角色
2. 设置角色的有效期
3. 绑定给用户
4. 有效期结束后自动解除绑定

## 📖 下一步

完成角色管理后，您可以：

- [配置用户](./users.md) - 为用户分配角色
- [平台设置](./settings.md) - 配置全局权限策略
- [理解权限模型](../../developer/concepts/permission-model.md) - 深入了解权限系统设计

---

**需要帮助？** 请查看 [权限体系详细文档](../../developer/permissions/overview.md) 或 [RBAC 设计文档](../../developer/permissions/rbac.md)。
