---
sidebar_position: 5
title: OAuth 认证
---

# OAuth2 认证架构

## 概述

Edge Platform 内置 OAuth2 认证服务，为平台提供统一的身份认证能力。认证系统与 Kubernetes 用户体系深度集成，实现了认证（Authentication）和授权（Authorization）的完整闭环。

### 设计理念

**认证和授权分离**:
- **认证 (Authentication)**: OAuth2 服务负责验证用户身份，颁发 JWT Token
- **授权 (Authorization)**: UniversalAuthorizer + K8s RBAC 负责权限检查

**用户体系统一**:
- OAuth2 用户 = Kubernetes User 资源
- OAuth2 用户组 = Kubernetes Group 成员关系
- Token 中的 claims 直接映射到 K8s 用户信息

## OAuth2 端点

Edge Platform 提供标准的 OAuth2 端点：

```
POST   /oauth/token                           - Token 获取端点
GET    /oauth/authorize                       - 授权端点（未来支持）
GET    /oauth/userinfo                        - 用户信息端点
GET    /.well-known/openid-configuration      - OpenID 发现端点
```

### Token 端点

**路径**: `POST /oauth/token`

**用途**: 获取访问令牌（Access Token）和刷新令牌（Refresh Token）

**请求示例**:

```bash
curl -X POST http://localhost:8080/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=P@88w0rd" \
  -d "client_id=edge-console"
```

**响应示例**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户信息端点

**路径**: `GET /oauth/userinfo`

**用途**: 获取当前用户的详细信息

**请求示例**:

```bash
curl -X GET http://localhost:8080/oauth/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

**响应示例**:

```json
{
  "sub": "admin",
  "name": "Administrator",
  "email": "admin@theriseunion.io",
  "groups": ["system:masters", "platform-admins"],
  "preferred_username": "admin"
}
```

### OpenID 发现端点

**路径**: `GET /.well-known/openid-configuration`

**用途**: 提供 OAuth2/OIDC 服务的配置信息

**响应示例**:

```json
{
  "issuer": "https://edge.theriseunion.io",
  "authorization_endpoint": "https://edge.theriseunion.io/oauth/authorize",
  "token_endpoint": "https://edge.theriseunion.io/oauth/token",
  "userinfo_endpoint": "https://edge.theriseunion.io/oauth/userinfo",
  "jwks_uri": "https://edge.theriseunion.io/.well-known/jwks.json",
  "response_types_supported": ["code", "token"],
  "grant_types_supported": ["password", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

## 当前实现：Password Grant Flow

### 授权流程

Edge Platform 目前实现了 OAuth2 的 Password Grant Flow（密码授权流程）：

```mermaid
sequenceDiagram
    participant User as 用户
    participant Client as 前端应用
    participant OAuth as OAuth2 服务
    participant K8s as Kubernetes API

    User->>Client: 输入用户名密码
    Client->>OAuth: POST /oauth/token<br/>(username, password, client_id)
    OAuth->>K8s: 验证用户凭证
    K8s-->>OAuth: 用户信息 (User, Groups)
    OAuth->>OAuth: 生成 JWT Token
    OAuth-->>Client: Access Token + Refresh Token
    Client->>Client: 存储 Token
    Client->>OAuth: API 请求 + Bearer Token
    OAuth->>OAuth: 验证 Token
    OAuth->>K8s: 提取用户信息
    K8s->>K8s: 权限检查 (RBAC)
    K8s-->>OAuth: 授权结果
    OAuth-->>Client: API 响应
```

### 详细步骤

**步骤 1: 用户登录**

```typescript
async function login(username: string, password: string) {
  const response = await fetch('/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
      client_id: 'edge-console',
    }),
  });

  const data = await response.json();
  // 存储 Token
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
}
```

**步骤 2: 使用 Token 访问 API**

```typescript
async function fetchWorkspaces() {
  const token = localStorage.getItem('access_token');

  const response = await fetch('/oapis/tenant/v1/workspaces', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
}
```

**步骤 3: Token 刷新**

```typescript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'edge-console',
    }),
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
}
```

## JWT Token 结构

### Token Claims

Edge Platform 使用 JWT (JSON Web Token) 作为访问令牌格式：

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "admin",
    "iss": "https://edge.theriseunion.io",
    "aud": ["edge-console"],
    "exp": 1734567890,
    "iat": 1734564290,
    "groups": ["system:masters", "platform-admins"],
    "email": "admin@theriseunion.io",
    "preferred_username": "admin"
  },
  "signature": "..."
}
```

### Claims 说明

| Claim | 说明 | 示例 |
|-------|------|------|
| `sub` | Subject，用户唯一标识 | "admin" |
| `iss` | Issuer，Token 颁发者 | "https://edge.theriseunion.io" |
| `aud` | Audience，Token 接收方 | ["edge-console"] |
| `exp` | Expiration Time，过期时间（Unix 时间戳） | 1734567890 |
| `iat` | Issued At，颁发时间（Unix 时间戳） | 1734564290 |
| `groups` | 用户所属的组 | ["system:masters"] |
| `email` | 用户邮箱 | "admin@theriseunion.io" |
| `preferred_username` | 首选用户名 | "admin" |

### Token 生命周期

- **Access Token**: 1 小时有效期
- **Refresh Token**: 24 小时有效期

```go
const (
    AccessTokenLifetime  = 1 * time.Hour
    RefreshTokenLifetime = 24 * time.Hour
)
```

### Token 验证流程

```mermaid
graph TD
    A[收到 API 请求] --> B{Header 包含 Bearer Token?}
    B -->|No| C[返回 401 Unauthorized]
    B -->|Yes| D[提取 Token]
    D --> E[验证 Token 签名]
    E -->|Invalid| C
    E -->|Valid| F[检查 Token 过期时间]
    F -->|Expired| G[返回 401 + Token Expired]
    F -->|Valid| H[提取 Claims]
    H --> I[构建 K8s User]
    I --> J[继续权限检查]
```

## 与 Kubernetes 的集成

### 用户映射

OAuth2 用户直接映射到 Kubernetes User 资源：

```yaml
apiVersion: iam.theriseunion.io/v1alpha1
kind: User
metadata:
  name: alice
spec:
  email: alice@theriseunion.io
  displayName: Alice Developer
  groups:
    - developers
    - workspace-ai-project
```

**映射关系**:
- OAuth2 Username → K8s User.metadata.name
- OAuth2 Groups → K8s User.spec.groups
- OAuth2 Email → K8s User.spec.email

### 权限检查流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant OAuth as OAuth2 Service
    participant APIServer as APIServer
    participant UA as UniversalAuthorizer
    participant RBAC as K8s RBAC

    Client->>OAuth: Token 请求 (username, password)
    OAuth->>OAuth: 验证凭证
    OAuth->>OAuth: 生成 JWT Token
    OAuth-->>Client: Access Token

    Client->>APIServer: API 请求 + Bearer Token
    APIServer->>APIServer: 验证 Token 签名
    APIServer->>APIServer: 提取 Token Claims
    APIServer->>UA: Authorize(user, resource, verb)

    UA->>RBAC: 查询 User 的 RoleBindings
    RBAC->>RBAC: 检查权限规则
    RBAC-->>UA: Allow/Deny
    UA-->>APIServer: Authorization Decision

    alt Allowed
        APIServer-->>Client: 200 OK + Data
    else Denied
        APIServer-->>Client: 403 Forbidden
    end
```

### 用户上下文传递

从 JWT Token 到 K8s User 的转换：

```go
func (a *Authenticator) AuthenticateToken(ctx context.Context, token string) (*user.DefaultInfo, error) {
    // 1. 验证 JWT Token
    claims, err := a.verifyJWT(token)
    if err != nil {
        return nil, err
    }

    // 2. 构建 K8s User
    userInfo := &user.DefaultInfo{
        Name:   claims.Subject,
        UID:    claims.Subject,
        Groups: claims.Groups,
        Extra: map[string][]string{
            "email": {claims.Email},
        },
    }

    return userInfo, nil
}
```

## 安全性

### Token 签名

Edge Platform 使用 RSA 2048-bit 密钥对 Token 进行签名：

```go
// 生成 RSA 密钥对
privateKey, err := rsa.GenerateKey(rand.Reader, 2048)

// 签名 Token
token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
signedToken, err := token.SignedString(privateKey)

// 验证 Token
token, err := jwt.Parse(signedToken, func(token *jwt.Token) (interface{}, error) {
    return &privateKey.PublicKey, nil
})
```

**安全特性**:
- 使用非对称加密（RS256）
- 私钥仅存储在服务端
- 公钥可以公开分发用于验证

### Token 存储

**客户端存储建议**:
- ✅ HttpOnly Cookie（推荐，防止 XSS 攻击）
- ⚠️ LocalStorage（需要注意 XSS 风险）
- ❌ SessionStorage（不推荐，刷新页面丢失）

**示例：安全存储**

```typescript
// 服务端设置 HttpOnly Cookie
response.setHeader('Set-Cookie', [
  `access_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
]);

// 客户端不需要手动管理 Token
// 浏览器会自动在请求中携带 Cookie
```

### Token 过期和刷新

```mermaid
graph TD
    A[发起 API 请求] --> B{Token 是否过期?}
    B -->|未过期| C[继续请求]
    B -->|已过期| D{有 Refresh Token?}
    D -->|Yes| E[使用 Refresh Token 获取新 Token]
    E --> F{Refresh 成功?}
    F -->|Yes| G[更新 Access Token]
    F -->|No| H[跳转到登录页]
    D -->|No| H
    G --> C
```

**刷新策略**:
- Access Token 过期前 5 分钟自动刷新
- Refresh Token 过期后需要重新登录
- 支持并发刷新去重（防止多个请求同时刷新）

### 客户端注册

当前版本使用硬编码的客户端配置：

```go
var registeredClients = map[string]Client{
    "edge-console": {
        ID:          "edge-console",
        Secret:      "console-secret",
        RedirectURIs: []string{
            "http://localhost:3000/callback",
            "https://console.theriseunion.io/callback",
        },
    },
}
```

**未来计划**: 支持动态客户端注册（Dynamic Client Registration）。

## 认证流程完整示例

### 前端登录组件

```typescript
import { useState } from 'react';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch('/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password,
          client_id: 'edge-console',
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // 存储 Token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // 跳转到首页
      window.location.href = '/';
    } catch (err) {
      setError('Invalid username or password');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### API 请求拦截器

```typescript
import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
});

// 请求拦截器：自动添加 Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 Token 过期
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Token 过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/oauth/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'edge-console',
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token 也过期，跳转到登录页
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 使用示例

```typescript
import apiClient from './api-client';

// 获取工作空间列表
async function getWorkspaces() {
  const response = await apiClient.get('/oapis/tenant/v1/workspaces');
  return response.data;
}

// 创建部署
async function createDeployment(namespace: string, deployment: any) {
  const response = await apiClient.post(
    `/api/v1/namespaces/${namespace}/deployments`,
    deployment
  );
  return response.data;
}
```

## 测试 OAuth 认证

### 使用 curl 测试

```bash
#!/bin/bash

# 1. 获取 Access Token
TOKEN=$(curl -s -X POST http://localhost:8080/oauth/token \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=P@88w0rd" \
  -d "client_id=edge-console" \
  | jq -r .access_token)

echo "Access Token: $TOKEN"

# 2. 使用 Token 访问 API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/oapis/tenant/v1/workspaces

# 3. 获取用户信息
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/oauth/userinfo
```

### 验证 JWT Token

```bash
# 安装 jwt-cli
# brew install jwt-cli (macOS)
# cargo install jwt-cli (其他平台)

# 解码 JWT Token
jwt decode $TOKEN

# 输出示例：
# Token header
# -----------
# {
#   "alg": "RS256",
#   "typ": "JWT"
# }
#
# Token claims
# ------------
# {
#   "sub": "admin",
#   "exp": 1734567890,
#   "groups": ["system:masters"]
# }
```

## 未来增强计划

### 短期计划（内部使用）

- [ ] Refresh Token 轮换机制
- [ ] Token 撤销端点 (`/oauth/revoke`)
- [ ] 会话管理功能
- [ ] Token 黑名单支持

### 长期计划（外部支持）

- [ ] 授权码流程（Authorization Code Flow）
- [ ] 外部 IdP 集成（OIDC、SAML）
- [ ] 动态客户端注册
- [ ] 多因素认证（MFA）
- [ ] 社交登录（GitHub、Google）

### 企业功能

- [ ] 单点登录（SSO）集成
- [ ] LDAP/Active Directory 集成
- [ ] 审计日志增强
- [ ] 会话管理和强制登出
- [ ] 密码策略配置

## 实现文件

OAuth2 认证服务的实现文件位于：

```
edge-apiserver/pkg/oapis/oauth/
├── handler.go          # HTTP 处理器
├── token.go           # Token 生成和验证
├── user_auth.go       # 用户认证逻辑
├── jwt.go             # JWT 工具函数
└── register.go        # 路由注册
```

## 最佳实践

### 1. Token 存储安全

```typescript
// ✅ 推荐：使用 HttpOnly Cookie
// 服务端设置
response.setHeader('Set-Cookie', [
  `access_token=${token}; HttpOnly; Secure; SameSite=Strict`,
]);

// ⚠️ 可接受：LocalStorage（需要防护 XSS）
localStorage.setItem('access_token', token);

// ❌ 不推荐：全局变量
window.accessToken = token;
```

### 2. Token 过期处理

```typescript
// 在 Token 过期前 5 分钟刷新
const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 分钟

function scheduleTokenRefresh(expiresIn: number) {
  const refreshTime = (expiresIn * 1000) - REFRESH_BEFORE_EXPIRY;
  setTimeout(() => {
    refreshToken();
  }, refreshTime);
}
```

### 3. 并发刷新去重

```typescript
let refreshPromise: Promise<any> | null = null;

async function refreshToken() {
  // 如果已经在刷新，返回同一个 Promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch('/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: localStorage.getItem('refresh_token'),
      client_id: 'edge-console',
    }),
  }).then((res) => res.json());

  try {
    const data = await refreshPromise;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  } finally {
    refreshPromise = null;
  }
}
```

### 4. 安全的登出

```typescript
async function logout() {
  // 1. 清除本地 Token
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // 2. 调用服务端撤销端点（如果支持）
  try {
    await fetch('/oauth/revoke', {
      method: 'POST',
      body: new URLSearchParams({
        token: localStorage.getItem('access_token'),
      }),
    });
  } catch (err) {
    console.error('Token revocation failed', err);
  }

  // 3. 跳转到登录页
  window.location.href = '/login';
}
```

## 下一步

了解了 OAuth 认证后，建议继续阅读：

- [权限模型](./permission-model.md) - 理解认证后的授权流程
- [Scope 系统](./scope-system.md) - 了解权限的作用范围
- [架构设计](./architecture.md) - 掌握认证授权的完整架构
