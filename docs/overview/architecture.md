---
sidebar_position: 1
title: 系统架构
---

# EDGE APIServer 系统架构

EDGE APIServer 是一个通用型的 Kubernetes 权限体系框架，采用双组件架构设计，实现灵活、可扩展的权限管理。

## 🏗️ 整体架构

```mermaid
graph TB
    subgraph "EDGE Framework"
        A[APIServer<br/>HTTP 服务] --> B[权限引擎]
        A --> C[OAPI 路由]
        D[Controller<br/>CRD 管理] --> E[权限转换]
        
        C --> F[/oapis/* 自定义API]
        B --> G[权限检查]
        E --> H[K8s RBAC]
    end
    
    subgraph "开发者扩展"
        I[自定义API] --> F
        J[权限规则] --> G
    end
```

## 🔧 双组件设计

### APIServer 组件

负责 HTTP 服务和 API 处理：

```go
// APIServer 核心结构
type APIServer struct {
    Server        *http.Server           // HTTP 服务器
    container     *restful.Container     // go-restful 容器
    K8sClient     kubernetes.Interface   // K8s 客户端
    RuntimeClient client.Client          // controller-runtime 客户端
    Authorizer    *authorizer.Authorizer // 权限引擎
}
```

主要职责：
- 处理 HTTP 请求和响应
- 统一的权限验证
- API 路由和代理

### Controller 组件

负责 CRD 管理和权限转换：

```go
// 核心控制器
func setupControllers(mgr ctrl.Manager) {
    // IAMRole 控制器
    (&IAMRoleReconciler{}).SetupWithManager(mgr)
    
    // IAMRoleBinding 控制器
    (&IAMRoleBindingReconciler{}).SetupWithManager(mgr)
    
    // RoleTemplate 控制器
    (&RoleTemplateReconciler{}).SetupWithManager(mgr)
}
```

主要职责：
- IAMRole 转换为 K8s ClusterRole
- IAMRoleBinding 转换为 K8s ClusterRoleBinding
- RoleTemplate 聚合和展开

## 🔄 权限模型

EDGE 实现三层权限转换：

```
RoleTemplate → IAMRole → K8s RBAC
```

### IAMRole 示例

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRole
metadata:
  name: workspace-developer
spec:
  rules:
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "create", "update"]
  uiPermissions:
  - "workload.deployment.create"
  - "workload.service.manage"
```

### IAMRoleBinding 示例

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRoleBinding
metadata:
  name: alice-workspace-developer
  labels:
    iam.theriseunion.io/scope: "workspace"
    iam.theriseunion.io/scope-value: "team-workspace"
spec:
  subjects:
  - kind: User
    name: alice
  roleRef:
    kind: IAMRole
    name: workspace-developer
```

## 📊 Scope 权限继承

EDGE 支持多层级权限继承：

```
Platform → Cluster → Workspace → Namespace
```

### 权限查找流程

```go
func (a *Authorizer) cascadeCheck(ctx context.Context, attrs *Attributes) (*Decision, error) {
    scopeChain := a.buildScopeChain(attrs)
    
    // 按层级向上查找权限
    for _, scope := range scopeChain {
        if decision, err := a.checkAtScope(scope, attrs); err == nil && decision.Allow {
            return &Decision{Allow: true}, nil
        }
    }
    
    return &Decision{Allow: false}, nil
}
```

## 🌐 API 架构

### API 路径设计

```bash
# K8s 原生 API - 代理到 kube-apiserver
/api/v1/*
/apis/apps/v1/*

# EDGE 自定义 API - 本地处理
/oapis/iam/v1alpha1/*        # 权限管理
/oapis/tenant/v1/*          # 租户管理  
/oapis/oauth/v1/*           # 认证服务
```

### OAPI 模块结构

每个 OAPI 模块独立开发：

```go
// OAPI Handler 接口
type APIInstaller interface {
    Install(container *restful.Container) error
    GetGroupVersion() schema.GroupVersion
    GetAPIPath() string
}
```

## 🎨 前端集成

### UIPermissions 机制

前端通过 UIPermissions API 获取权限：

```bash
GET /oapis/iam/v1alpha1/uipermissions?scope=workspace&scopeValue=team-workspace
```

响应示例：

```json
{
  "uiPermissions": [
    "workload.deployment.create",
    "workload.service.manage"
  ]
}
```

前端基于权限控制 UI 显示：

```typescript
const permissions = await getUserPermissions('workspace', 'team-workspace');
const canCreateDeployment = permissions.includes('workload.deployment.create');
```

## 🔍 扩展点

EDGE 为开发者提供清晰的扩展点：

### 1. OAPI 接口扩展

```go
// 实现 APIInstaller 接口
type MyAPIHandler struct {
    client client.Client
}

func (h *MyAPIHandler) Install(container *restful.Container) error {
    // 创建 WebService 并注册路由
    ws := apiserverruntime.NewWebService(GroupVersion)
    // ...
    container.Add(ws)
    return nil
}
```

### 2. 权限规则扩展

```yaml
# 自定义 IAMRole
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRole
metadata:
  name: my-custom-role
spec:
  rules:
  - apiGroups: ["myapi"]
    resources: ["myresources"]
    verbs: ["*"]
```

### 3. 前端权限扩展

```yaml
# UIPermissions 定义
uiPermissions:
- "mymodule.myfeature.create"
- "mymodule.myfeature.edit"
```

---

这个架构设计使 EDGE APIServer 成为一个通用、灵活的权限管理框架，可以轻松适配各种业务场景。

下一步：[权限模型详解](./permission-model.md)