# 镜像管理 API 参考

## 概述

本文档详细介绍了镜像管理模块的 API 接口，包括镜像源管理（RegistrySecret）和镜像仓库管理（Repository）的 CRUD 操作。

## API 基础信息

### API 版本
- **Group**: `image.theriseunion.io`
- **Version**: `v1alpha1`
- **Base Path**: `/oapis/image.theriseunion.io/v1alpha1`

### 认证方式
所有 API 请求都需要在 HTTP Header 中携带认证 Token：

```http
Authorization: Bearer <your-token>
Content-Type: application/json
```

### 响应格式
所有 API 响应都使用 JSON 格式：

```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "ResourceType",
  "metadata": {
    "name": "resource-name",
    "namespace": "default"
  },
  "spec": {},
  "status": {}
}
```

## 镜像源管理 API (RegistrySecret)

### 资源定义

#### RegistrySecret 对象

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: string              # 镜像源名称（必需）
  namespace: string         # 命名空间（必需）
  annotations:
    theriseunion.io/display-name: string    # 显示名称（可选）
    theriseunion.io/description: string     # 描述信息（可选）
    theriseunion.io/domain: string          # 镜像仓库域名
    theriseunion.io/username: string        # 用户名
    theriseunion.io/provider: string        # 提供者类型
    theriseunion.io/verify-status: string   # 验证状态: success/failed/untested
    theriseunion.io/verify-message: string  # 验证消息
    theriseunion.io/verify-timestamp: string # 验证时间戳
spec:
  domain: string            # 镜像仓库域名（必需）
  username: string          # 用户名（必需）
  password: string          # 密码（必需）
  provider: string          # 提供者类型（必需）: harbor/dockerhub/aliyun/other
```

### API 端点

#### 1. 列出镜像源

**请求**
```http
GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/registry-secrets
```

**路径参数**
- `namespace`: 命名空间名称，或使用 `_all_` 获取所有命名空间的镜像源

**查询参数**
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：10）
- `search`: 搜索关键词（可选）

**请求示例**
```bash
curl -X GET "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**响应示例**
```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "RegistrySecretList",
  "items": [
    {
      "apiVersion": "image.theriseunion.io/v1alpha1",
      "kind": "RegistrySecret",
      "metadata": {
        "name": "harbor-prod",
        "namespace": "default",
        "annotations": {
          "theriseunion.io/display-name": "生产环境 Harbor",
          "theriseunion.io/domain": "harbor.example.com",
          "theriseunion.io/username": "admin",
          "theriseunion.io/provider": "harbor",
          "theriseunion.io/verify-status": "success"
        }
      },
      "spec": {
        "domain": "harbor.example.com",
        "username": "admin",
        "provider": "harbor"
      }
    }
  ],
  "totalItems": 1
}
```

#### 2. 获取单个镜像源

**请求**
```http
GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/registry-secrets/{name}
```

**路径参数**
- `namespace`: 命名空间名称
- `name`: 镜像源名称

**请求示例**
```bash
curl -X GET "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets/harbor-prod" \
  -H "Authorization: Bearer <token>"
```

#### 3. 创建镜像源

**请求**
```http
POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/registry-secrets
```

**请求体**
```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "RegistrySecret",
  "metadata": {
    "name": "harbor-prod",
    "namespace": "default",
    "annotations": {
      "theriseunion.io/display-name": "生产环境 Harbor",
      "theriseunion.io/description": "生产环境主镜像仓库"
    }
  },
  "spec": {
    "domain": "harbor.example.com",
    "username": "admin",
    "password": "Harbor12345",
    "provider": "harbor"
  }
}
```

**请求示例**
```bash
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "image.theriseunion.io/v1alpha1",
    "kind": "RegistrySecret",
    "metadata": {
      "name": "harbor-prod",
      "namespace": "default"
    },
    "spec": {
      "domain": "harbor.example.com",
      "username": "admin",
      "password": "Harbor12345",
      "provider": "harbor"
    }
  }'
```

#### 4. 删除镜像源

**请求**
```http
DELETE /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/registry-secrets/{name}
```

**请求示例**
```bash
curl -X DELETE "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets/harbor-prod" \
  -H "Authorization: Bearer <token>"
```

#### 5. 验证镜像源连接

**请求**
```http
POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/registry-secrets/{name}/verify
```

**请求体**
```json
{
  "domain": "harbor.example.com",
  "username": "admin",
  "password": "Harbor12345"
}
```

**注意**：如果传空对象，系统会自动从 Secret 中读取凭证。

**请求示例**
```bash
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets/harbor-prod/verify" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**响应示例**
```json
{
  "success": true,
  "message": "连接成功"
}
```

## 镜像仓库管理 API (Repository)

### 资源定义

#### Repository 对象

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: string              # 镜像仓库名称（必需）
  namespace: string         # 命名空间（必需）
  annotations:
    theriseunion.io/display-name: string    # 显示名称（可选）
    theriseunion.io/description: string     # 描述信息（可选）
spec:
  repository: string        # 镜像路径（必需）
  tag: string              # 镜像标签（必需）
  registryRef:
    name: string           # 引用的镜像源名称（必需）
    namespace: string      # 引用的镜像源命名空间（必需）
  syncInterval: string     # 同步间隔（可选，默认：1h）
  syncTimeout: string      # 同步超时（可选，默认：10m）
  retryCount: integer      # 重试次数（可选，默认：3）
status:
  domain: string           # 镜像仓库域名
  syncStatus: string       # 同步状态: Success/Failed/Syncing/
  lastSynced: string       # 最后同步时间（ISO 8601格式）
  manifest:
    architecture: string   # 镜像架构
    os: string            # 操作系统
    size: string          # 镜像大小
    created: string       # 创建时间
    layers: array         # 镜像层信息
```

### API 端点

#### 1. 列出镜像仓库

**请求**
```http
GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories
```

**路径参数**
- `namespace`: 命名空间名称，或使用 `_all_` 获取所有命名空间的镜像仓库

**查询参数**
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：10）
- `name`: 镜像名称过滤（可选）

**请求示例**
```bash
curl -X GET "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**响应示例**
```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "RepositoryList",
  "items": [
    {
      "apiVersion": "image.theriseunion.io/v1alpha1",
      "kind": "Repository",
      "metadata": {
        "name": "nginx-latest",
        "namespace": "default",
        "annotations": {
          "theriseunion.io/display-name": "Nginx 最新版本",
          "theriseunion.io/description": "Nginx web 服务器"
        }
      },
      "spec": {
        "repository": "library/nginx",
        "tag": "latest",
        "registryRef": {
          "name": "harbor-prod",
          "namespace": "default"
        },
        "syncInterval": "1h"
      },
      "status": {
        "domain": "harbor.example.com",
        "syncStatus": "Success",
        "lastSynced": "2024-01-08T10:30:00Z",
        "manifest": {
          "architecture": "amd64",
          "size": "142MB"
        }
      }
    }
  ],
  "totalItems": 1
}
```

#### 2. 获取单个镜像仓库

**请求**
```http
GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}
```

**路径参数**
- `namespace`: 命名空间名称
- `name`: 镜像仓库名称

**请求示例**
```bash
curl -X GET "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories/nginx-latest" \
  -H "Authorization: Bearer <token>"
```

#### 3. 创建镜像仓库

**请求**
```http
POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories
```

**请求体**
```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "Repository",
  "metadata": {
    "name": "nginx-latest",
    "namespace": "default",
    "annotations": {
      "theriseunion.io/display-name": "Nginx 最新版本",
      "theriseunion.io/description": "Nginx web 服务器"
    }
  },
  "spec": {
    "repository": "library/nginx",
    "tag": "latest",
    "registryRef": {
      "name": "harbor-prod",
      "namespace": "default"
    },
    "syncInterval": "1h"
  }
}
```

**请求示例**
```bash
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "image.theriseunion.io/v1alpha1",
    "kind": "Repository",
    "metadata": {
      "name": "nginx-latest",
      "namespace": "default"
    },
    "spec": {
      "repository": "library/nginx",
      "tag": "latest",
      "registryRef": {
        "name": "harbor-prod",
        "namespace": "default"
      }
    }
  }'
```

#### 4. 删除镜像仓库

**请求**
```http
DELETE /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}
```

**请求示例**
```bash
curl -X DELETE "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories/nginx-latest" \
  -H "Authorization: Bearer <token>"
```

#### 5. 手动触发同步

**请求**
```http
POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}/sync
```

**请求示例**
```bash
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories/nginx-latest/sync" \
  -H "Authorization: Bearer <token>"
```

**响应示例**
```json
{
  "success": true,
  "message": "同步任务已提交"
}
```

## 状态码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 204 No Content | 删除成功 |
| 400 Bad Request | 请求参数错误 |
| 401 Unauthorized | 未授权 |
| 403 Forbidden | 权限不足 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突 |
| 500 Internal Server Error | 服务器内部错误 |

### 错误响应格式

```json
{
  "apiVersion": "image.theriseunion.io/v1alpha1",
  "kind": "Status",
  "metadata": {},
  "status": "Failure",
  "message": "详细错误信息",
  "reason": "Invalid",
  "details": {
    "name": "resource-name",
    "kind": "repository"
  },
  "code": 400
}
```

## 使用示例

### 示例 1：完整的镜像管理流程

```bash
# 1. 创建镜像源
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "image.theriseunion.io/v1alpha1",
    "kind": "RegistrySecret",
    "metadata": {
      "name": "harbor-prod",
      "namespace": "default"
    },
    "spec": {
      "domain": "harbor.example.com",
      "username": "admin",
      "password": "Harbor12345",
      "provider": "harbor"
    }
  }'

# 2. 验证镜像源连接
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/registry-secrets/harbor-prod/verify" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. 创建镜像仓库
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "image.theriseunion.io/v1alpha1",
    "kind": "Repository",
    "metadata": {
      "name": "myapp-v1.0.0",
      "namespace": "default"
    },
    "spec": {
      "repository": "myapp/myapp",
      "tag": "v1.0.0",
      "registryRef": {
        "name": "harbor-prod",
        "namespace": "default"
      }
    }
  }'

# 4. 查看同步状态
curl -X GET "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories/myapp-v1.0.0" \
  -H "Authorization: Bearer <token>"

# 5. 手动触发同步
curl -X POST "http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/default/repositories/myapp-v1.0.0/sync" \
  -H "Authorization: Bearer <token>"
```

### 示例 2：使用 kubectl 管理镜像资源

```bash
# 创建镜像源
kubectl apply -f - <<EOF
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: harbor-prod
  namespace: default
spec:
  domain: harbor.example.com
  username: admin
  password: Harbor12345
  provider: harbor
EOF

# 创建镜像仓库
kubectl apply -f - <<EOF
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: myapp-v1.0.0
  namespace: default
spec:
  repository: myapp/myapp
  tag: v1.0.0
  registryRef:
    name: harbor-prod
    namespace: default
EOF

# 查看所有镜像源
kubectl get registrysecrets -A

# 查看所有镜像仓库
kubectl get repositories -A

# 查看镜像仓库详情
kubectl describe repository myapp-v1.0.0 -n default

# 删除镜像仓库
kubectl delete repository myapp-v1.0.0 -n default
```

## 最佳实践

### 1. 错误处理

```python
import requests
import time

def create_repository_with_retry(token, namespace, repo_data, max_retries=3):
    """创建镜像仓库，支持重试机制"""
    url = f"http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=repo_data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # 指数退避

    return None
```

### 2. 分页处理

```python
def list_all_repositories(token, namespace, page_size=100):
    """列出所有镜像仓库，自动处理分页"""
    all_repos = []
    page = 1

    while True:
        url = f"http://platform.example.com/oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories"
        params = {"page": page, "limit": page_size}
        headers = {"Authorization": f"Bearer {token}"}

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        all_repos.extend(data.get("items", []))

        if len(all_repos) >= data.get("totalItems", 0):
            break

        page += 1

    return all_repos
```

### 3. 并发控制

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def batch_create_repositories(token, namespace, repos_data, max_workers=5):
    """批量创建镜像仓库，控制并发数"""
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                create_repository_with_retry,
                token,
                namespace,
                repo_data
            ): repo_data["metadata"]["name"]
            for repo_data in repos_data
        }

        for future in as_completed(futures):
            repo_name = futures[future]
            try:
                result = future.result()
                results.append({"name": repo_name, "success": True, "data": result})
            except Exception as e:
                results.append({"name": repo_name, "success": False, "error": str(e)})

    return results
```

## 相关文档

- [镜像源管理](./registry-management.md)
- [镜像仓库管理](./repository-management.md)
- [故障排查指南](./troubleshooting.md)
- [API 设计规范](https://github.com/theriseunion/api-design)