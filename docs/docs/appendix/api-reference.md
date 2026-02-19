---
sidebar_position: 2
title: API 参考
---

# API 参考

本文档提供边缘智能管理平台所有 REST API 端点的完整参考，包括请求路径、参数说明、认证方式和响应格式。

## API 基础信息

### 基础路径

所有业务 API 使用统一的路径前缀：

```
/oapis/{api-group}/{version}/{resource}
```

### 认证方式

平台使用 OAuth2 密码模式获取访问令牌：

```bash
curl 'http://<apiserver-endpoint>/oauth/token' \
  --data-raw 'grant_type=password&username=<username>&password=<password>&client_id=edge-console&client_secret=edge-secret'
```

**响应示例**：

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "..."
}
```

**在后续请求中携带令牌**：

```bash
curl -H "Authorization: Bearer <access_token>" \
  http://<apiserver-endpoint>/oapis/tenant/v1alpha1/clusters
```

### 授权模式

| 模式 | 说明 | 使用场景 |
|------|------|---------|
| `RBAC` | 基于角色的访问控制（默认） | 生产环境 |
| `AlwaysAllow` | 允许所有请求 | 开发/测试环境 |

---

## 通用查询参数

所有列表（List）接口支持以下查询参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | integer | 1 | 页码 |
| `limit` | integer | 10 | 每页数量 |
| `sortBy` | string | - | 排序字段名 |
| `ascending` | boolean | false | 是否升序排列 |
| `name` | string | - | 按名称模糊搜索 |
| `labelSelector` | string | - | Kubernetes 标签选择器 |

**分页响应结构**：

```json
{
  "apiVersion": "v1",
  "items": [ ... ],
  "metadata": {
    "totalItems": 42,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

---

## 标准响应状态码

| 状态码 | 说明 |
|--------|------|
| `200 OK` | 请求成功 |
| `201 Created` | 资源创建成功 |
| `204 No Content` | 删除成功 |
| `400 Bad Request` | 请求参数错误 |
| `401 Unauthorized` | 未提供有效的认证凭据 |
| `403 Forbidden` | 无权限执行此操作 |
| `404 Not Found` | 资源不存在 |
| `409 Conflict` | 资源版本冲突（并发修改） |
| `422 Unprocessable Entity` | 请求格式正确但语义错误 |
| `500 Internal Server Error` | 服务器内部错误 |

**错误响应格式**：

```json
{
  "apiVersion": "v1",
  "kind": "Status",
  "metadata": {},
  "status": "Failure",
  "message": "clusters \"my-cluster\" not found",
  "reason": "NotFound",
  "code": 404
}
```

---

## 租户管理 API

**API Group**: `tenant.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/tenant/v1alpha1`

### 集群操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/clusters` | 列出所有集群 |
| `GET` | `/clusters/{name}` | 获取指定集群详情 |
| `POST` | `/clusters` | 创建集群 |
| `PUT` | `/clusters/{name}` | 更新集群 |
| `DELETE` | `/clusters/{name}` | 删除集群 |

**额外查询参数**：

| 参数 | 说明 |
|------|------|
| `cluster` | 按集群名称过滤 |

### 工作空间操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/workspaces` | 列出所有工作空间 |
| `GET` | `/workspaces/{name}` | 获取工作空间详情 |
| `POST` | `/workspaces` | 创建工作空间 |
| `PUT` | `/workspaces/{name}` | 更新工作空间 |
| `DELETE` | `/workspaces/{name}` | 删除工作空间 |
| `GET` | `/workspaces/{workspace}/members` | 列出工作空间成员 |
| `GET` | `/workspaces/{workspace}/namespaces` | 列出工作空间中的命名空间 |
| `POST` | `/workspaces/{workspace}/namespaces` | 在工作空间中创建命名空间 |
| `GET` | `/workspaces/{workspace}/namespaces/{namespace}` | 获取命名空间详情 |
| `DELETE` | `/workspaces/{workspace}/namespaces/{namespace}` | 删除命名空间 |

**额外查询参数**：

| 参数 | 说明 |
|------|------|
| `cluster` | 按集群过滤 |
| `owner` | 按拥有者过滤 |
| `workspace` | 按工作空间过滤 |

### 节点组操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/nodegroups` | 列出所有节点组 |
| `GET` | `/nodegroups/{name}` | 获取节点组详情 |
| `POST` | `/nodegroups` | 创建节点组 |
| `PUT` | `/nodegroups/{name}` | 更新节点组 |
| `DELETE` | `/nodegroups/{name}` | 删除节点组 |
| `GET` | `/clusters/{cluster}/nodegroups` | 列出指定集群的节点组 |
| `GET` | `/nodegroups/{nodegroup}/nodes` | 列出节点组内的节点 |

---

## 应用管理 API

**API Group**: `app.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/app/v1alpha1`

### 应用操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/applications` | 列出所有应用 |
| `GET` | `/applications/{name}` | 获取应用详情 |
| `POST` | `/applications` | 创建应用 |
| `PUT` | `/applications/{name}` | 更新应用 |
| `DELETE` | `/applications/{name}` | 删除应用 |

**额外查询参数**：

| 参数 | 说明 |
|------|------|
| `workspace` | 按工作空间过滤 |

### 应用版本操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/applicationversions` | 列出所有应用版本 |
| `GET` | `/applicationversions/{name}` | 获取版本详情 |
| `POST` | `/applicationversions` | 创建版本 |
| `PUT` | `/applicationversions/{name}` | 更新版本 |
| `DELETE` | `/applicationversions/{name}` | 删除版本 |
| `POST` | `/applicationversions/{name}/review` | 审核版本（通过/拒绝） |

**审核请求体**：

```json
{
  "action": "approve",
  "message": "审核通过"
}
```

`action` 可选值：`approve`（通过）/ `reject`（拒绝）

### 应用部署操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/applicationdeployments` | 列出所有部署实例 |
| `GET` | `/applicationdeployments/{name}` | 获取部署实例详情 |
| `POST` | `/applicationdeployments` | 创建部署实例 |
| `PUT` | `/applicationdeployments/{name}` | 更新部署实例 |
| `DELETE` | `/applicationdeployments/{name}` | 删除部署实例 |

---

## 身份与权限 API

**API Group**: `iam.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/iam/v1alpha1`

### 用户操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/users` | 列出所有用户 |
| `GET` | `/users/{name}` | 获取用户详情 |
| `POST` | `/users` | 创建用户 |
| `PUT` | `/users/{name}` | 更新用户 |
| `DELETE` | `/users/{name}` | 删除用户 |
| `PUT` | `/users/{name}/password` | 重置用户密码 |
| `GET` | `/users/{user}/loginrecords` | 获取用户登录记录 |

### 权限操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/permissions` | 获取当前用户权限（层级树结构） |
| `GET` | `/users/{username}/permissions` | 获取指定用户的跨作用域权限 |

### 角色操作

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/roles` | 列出所有角色 |
| `GET` | `/roles/{name}` | 获取角色详情 |
| `POST` | `/roles` | 创建角色 |
| `PUT` | `/roles/{name}` | 更新角色 |
| `DELETE` | `/roles/{name}` | 删除角色 |

---

## 镜像仓库 API

**API Group**: `registry.vast.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/registry.vast.theriseunion.io/v1alpha1`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/clusterprojects` | 列出镜像项目 |
| `GET` | `/namespaces/{namespace}/projects` | 列出命名空间内的镜像项目 |
| `GET` | `/clusterrepositories` | 列出集群级镜像仓库 |

**额外查询参数**：

| 参数 | 说明 |
|------|------|
| `registryName` | 按仓库名称过滤 |

---

## 设备与算力 API

**API Group**: `device.vast.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/device.vast.theriseunion.io/v1alpha1`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/devices` | 列出所有设备 |
| `GET` | `/devices/{name}` | 获取设备详情 |
| `GET` | `/nodes/{nodes}/devices` | 按节点列出设备（多节点用逗号分隔） |
| `GET` | `/namespaces/{namespace}/resourcequotas` | 列出命名空间资源配额 |
| `GET` | `/namespaces/{namespace}/resourcequotas/{name}` | 获取资源配额详情 |

---

## 基础设施 API

**API Group**: `infra.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/infra.theriseunion.io/v1alpha1`

### 节点加入令牌

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/join-token` | 生成节点加入令牌 |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nodeName` | string | 是 | 节点名称 |
| `nodeGroup` | string | 否 | 目标节点组 |
| `version` | string | 否 | Kubernetes 版本 |
| `runtime` | string | 否 | 边缘运行时类型 |
| `imageRepository` | string | 否 | 镜像仓库地址 |
| `autoInstallRuntime` | bool | 否 | 是否自动安装运行时 |
| `containerdVersion` | string | 否 | containerd 版本 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/healthz` | 基础设施服务健康状态 |

---

## 监控指标 API

**API Group**: `metrics.theriseunion.io/v1alpha1`
**路径前缀**: `/oapis/metrics/v1alpha1`

提供 Prometheus 集成的集群监控指标查询接口，支持集群指标、容器指标、资源使用率和趋势分析。

---

## 系统管理 API

### 版本信息

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/oapis/version` | 获取平台版本信息 |

### OAuth 令牌

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/oauth/token` | 获取访问令牌 |

---

## API 使用示例

### 列出集群并分页

```bash
curl -H "Authorization: Bearer $TOKEN" \
  'http://api.edge.example.com/oapis/tenant/v1alpha1/clusters?page=1&limit=10&sortBy=name&ascending=true'
```

### 创建工作空间

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  'http://api.edge.example.com/oapis/tenant/v1alpha1/workspaces' \
  -d '{
    "apiVersion": "scope.theriseunion.io/v1alpha1",
    "kind": "Workspace",
    "metadata": {
      "name": "dev-workspace",
      "annotations": {
        "theriseunion.io/display-name": "开发工作空间",
        "theriseunion.io/description": "开发团队使用的工作空间"
      }
    },
    "spec": {
      "manager": "admin"
    }
  }'
```

### 部署应用

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  'http://api.edge.example.com/oapis/app/v1alpha1/applicationdeployments' \
  -d '{
    "apiVersion": "app.theriseunion.io/v1alpha1",
    "kind": "ApplicationDeployment",
    "metadata": {
      "name": "my-app-deploy",
      "namespace": "default"
    },
    "spec": {
      "application": "my-app",
      "version": "1.0.0",
      "topologies": [
        { "nodeGroup": "edge-group-1" }
      ]
    }
  }'
```

### 按标签筛选资源

```bash
# 筛选特定工作空间的应用
curl -H "Authorization: Bearer $TOKEN" \
  'http://api.edge.example.com/oapis/app/v1alpha1/applications?labelSelector=theriseunion.io/workspace=dev-workspace'

# 筛选特定地域的集群
curl -H "Authorization: Bearer $TOKEN" \
  'http://api.edge.example.com/oapis/tenant/v1alpha1/clusters?labelSelector=cluster.theriseunion.io/region=beijing'
```
