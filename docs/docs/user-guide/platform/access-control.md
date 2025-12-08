---
sidebar_position: 5
title: 访问控制
---

# 访问控制

本文档介绍边缘平台的访问控制机制和配置方法。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 访问控制概述

边缘平台采用基于角色的访问控制（RBAC）模型，提供细粒度的权限管理。

## 🎯 RBAC 模型

### 核心概念

**角色模板（RoleTemplate）**：

- 定义可复用的权限规则
- 可以被多个角色引用
- 支持权限聚合

**角色（IAMRole）**：

- 聚合多个角色模板
- 定义完整的权限集合
- 可分配给用户

**角色绑定（IAMRoleBinding）**：

- 将角色分配给用户
- 指定权限作用范围
- 支持多个绑定

### 权限层级

```
平台级别 (Platform)
├── 集群级别 (Cluster)
│   ├── 工作空间级别 (Workspace)
│   │   └── 命名空间级别 (Namespace)
│   └── 节点池级别 (NodePool)
└── 全局资源 (Global Resources)
```

## 🔐 权限控制

### 资源权限

**Kubernetes 资源**：

| 资源类型 | 权限 | 说明 |
|----------|------|------|
| Pods | get, list, create, delete | Pod 管理权限 |
| Deployments | get, list, create, update, delete | 部署管理权限 |
| Services | get, list, create, update, delete | 服务管理权限 |
| ConfigMaps | get, list, create, update, delete | 配置管理权限 |

**平台资源**：

| 资源类型 | 权限 | 说明 |
|----------|------|------|
| Users | get, list, create, update, delete | 用户管理权限 |
| Roles | get, list, create, update, delete | 角色管理权限 |
| Clusters | get, list, create, update, delete | 集群管理权限 |
| Workspaces | get, list, create, update, delete | 工作空间管理权限 |

### API 权限

**平台 API**：

```
/oapis/iam.edge-platform.io/v1beta1/users
/oapis/iam.edge-platform.io/v1beta1/roles
/oapis/iam.edge-platform.io/v1beta1/rolebindings
/oapis/tenant.edge-platform.io/v1/clusters
/oapis/tenant.edge-platform.io/v1/workspaces
```

**Kubernetes API**：

```
/api/v1/namespaces/{namespace}/pods
/apis/apps/v1/namespaces/{namespace}/deployments
/apis/v1/namespaces/{namespace}/services
```

## 👥 用户权限配置

### 分配平台角色

**步骤**：

1. 进入"平台管理" > "用户管理"
2. 选择用户
3. 点击"分配角色"
4. 选择角色和作用范围
5. 确认并保存

**示例**：

```yaml
# 为用户分配平台管理员角色
apiVersion: iam.edge-platform.io/v1beta1
kind: IAMRoleBinding
metadata:
  name: admin-platform-admin
spec:
  roleRef:
    name: platform-admin
  subjects:
  - kind: User
    name: admin
  scope:
    kind: Platform
```

### 分配集群角色

```yaml
# 为用户分配集群管理员角色
apiVersion: iam.edge-platform.io/v1beta1
kind: IAMRoleBinding
metadata:
  name: bob-cluster-admin
spec:
  roleRef:
    name: cluster-admin
  subjects:
  - kind: User
    name: bob
  scope:
    kind: Cluster
    name: prod-cluster
```

### 分配工作空间角色

```yaml
# 为用户分配工作空间成员角色
apiVersion: iam.edge-platform.io/v1beta1
kind: IAMRoleBinding
metadata:
  name: alice-workspace-member
spec:
  roleRef:
    name: workspace-member
  subjects:
  - kind: User
    name: alice
  scope:
    kind: Workspace
    name: project-a
    cluster: prod-cluster
```

## 🔍 权限验证

### 测试用户权限

**通过 Console**：

1. 使用目标用户登录
2. 尝试访问资源
3. 验证权限是否生效

**通过 API**：

```bash
# 获取当前用户权限
curl -H "Authorization: Bearer $TOKEN" \
  https://api.edge-platform.io/oapis/iam.edge-platform.io/v1beta1/users/me/permissions

# 检查特定操作权限
curl -H "Authorization: Bearer $TOKEN" \
  -X POST \
  -d '{"verb":"create","resource":"pods","namespace":"default"}' \
  https://api.edge-platform.io/oapis/iam.edge-platform.io/v1beta1/authorization
```

### 权限调试

**查看用户角色绑定**：

```bash
kubectl get iamrolebindings -o yaml | grep -A 5 "name: alice"
```

**查看角色详情**：

```bash
kubectl get iamrole workspace-member -o yaml
```

**查看角色模板**：

```bash
kubectl get roletemplate -o yaml
```

## 🛡️ 安全最佳实践

### 最小权限原则

- 只授予完成工作所需的最小权限
- 定期审查和清理不必要的权限
- 使用角色而非直接授权

### 权限分离

- 开发和生产环境分离
- 管理权限和使用权限分离
- 敏感操作需要审批流程

### 定期审计

- 定期检查用户权限
- 审查角色绑定
- 监控权限变更
- 追踪异常访问

### 多因素认证

- 启用 MFA 增强安全
- 敏感操作二次验证
- 定期更新凭证

## 📊 权限监控

### 审计日志

查看用户操作记录：

```bash
# 查看用户操作日志
kubectl logs -n edge-system -l app=edge-apiserver | grep "user=alice"

# 查看权限变更日志
kubectl logs -n edge-system -l app=edge-controller | grep "IAMRoleBinding"
```

### 权限报告

生成权限分析报告：

- 用户权限汇总
- 角色使用统计
- 权限变更历史
- 异常访问报告

## 🆘 常见问题

### 用户无法访问资源？

**排查步骤**：

1. 检查用户角色绑定
2. 验证角色权限配置
3. 确认资源作用范围
4. 查看授权日志

### 权限配置不生效？

**可能原因**：

- 角色绑定配置错误
- 作用范围不匹配
- 缓存未更新
- 授权器配置问题

### 如何撤销用户权限？

删除对应的角色绑定：

```bash
kubectl delete iamrolebinding <binding-name>
```

## 📖 相关文档

- [用户管理](./users.md)
- [角色管理](./roles.md)
- [平台设置](./settings.md)

---

**需要帮助？** 请查看 [常见问题](../../reference/faq.md) 或 [技术支持](../../reference/support.md)。
