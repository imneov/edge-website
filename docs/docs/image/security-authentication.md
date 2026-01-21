# 镜像安全与认证

## 概述

镜像安全与认证模块提供了容器镜像的安全管理功能，包括镜像仓库凭证管理、访问控制、镜像验证等。通过多层安全机制，确保镜像在传输、存储和使用过程中的安全性。

## 安全架构

### 多层安全防护

```
┌─────────────────────────────────────┐
│      应用层安全                      │
│  - 镜像签名验证                       │
│  - 镜像漏洞扫描                       │
│  - 运行时安全监控                     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│      平台层安全                      │
│  - RBAC 权限控制                     │
│  - 审计日志                          │
│  - 网络策略                          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│      基础设施层安全                  │
│  - 凭证加密存储                      │
│  - TLS 加密传输                      │
│  - Secret 管理                       │
└─────────────────────────────────────┘
```

## 凭证管理

### 凭证存储

#### 加密存储机制

镜像仓库凭证使用 Kubernetes Secret 资源存储，具备以下安全特性：

1. **Base64 编码**：凭证数据使用 Base64 编码存储
2. **Etcd 加密**：启用 etcd at-rest encryption
3. **命名空间隔离**：不同命名空间的凭证相互隔离
4. **访问控制**：基于 RBAC 的 Secret 访问控制

#### 凭证结构

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-harbor
  namespace: default
type: Opaque
data:
  # Base64 编码的凭证信息
  domain: aGFyYm9yLmV4YW1wbGUuY29t
  username: YWRtaW4=
  password: cGFzc3dvcmQxMjM=
```

### 凭证生命周期

#### 创建凭证

1. **用户输入**：在界面上输入镜像仓库信息
2. **传输加密**：使用 HTTPS 加密传输
3. **编码存储**：Base64 编码后存储到 Secret
4. **关联资源**：创建 RegistrySecret CRD 关联凭证

#### 更新凭证

**注意**：由于安全考虑，不支持直接更新凭证。如需更新：

1. 删除现有的镜像源配置
2. 重新创建新的镜像源配置
3. 验证新凭证的正确性

#### 删除凭证

1. **删除确认**：输入镜像源名称确认删除
2. **级联删除**：同时删除关联的 Secret 资源
3. **审计记录**：记录删除操作到审计日志

## 访问控制

### RBAC 权限模型

#### 角色定义

##### 镜像管理员 (image-admin)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: image-admin
rules:
- apiGroups: ["image.theriseunion.io"]
  resources: ["registrysecrets", "repositories"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

**权限范围**：
- 创建、编辑、删除镜像源
- 创建、编辑、删除镜像仓库
- 查看所有镜像信息
- 执行镜像同步操作

##### 镜像操作员 (image-operator)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: image-operator
rules:
- apiGroups: ["image.theriseunion.io"]
  resources: ["registrysecrets", "repositories"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["image.theriseunion.io"]
  resources: ["repositories"]
  verbs: ["create", "update", "patch"]
```

**权限范围**：
- 查看镜像源信息
- 创建、编辑镜像仓库
- 触发镜像同步
- 不能删除镜像源

##### 镜像查看者 (image-viewer)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: image-viewer
rules:
- apiGroups: ["image.theriseunion.io"]
  resources: ["registrysecrets", "repositories"]
  verbs: ["get", "list", "watch"]
```

**权限范围**：
- 查看镜像源信息
- 查看镜像仓库信息
- 查看同步状态
- 不能执行任何修改操作

#### 权限分配

##### 为用户分配角色

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: image-admin-binding
subjects:
- kind: User
  name: "admin@example.com"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: image-admin
  apiGroup: rbac.authorization.k8s.io
```

##### 为用户组分配角色

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: image-operator-binding
subjects:
- kind: Group
  name: "devops-team"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: image-operator
  apiGroup: rbac.authorization.k8s.io
```

### 命名空间级别权限

#### 在特定命名空间中的权限

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: image-admin
  namespace: production
rules:
- apiGroups: ["image.theriseunion.io"]
  resources: ["registrysecrets", "repositories"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

这样可以为不同环境的镜像管理分配不同的权限。

## 传输安全

### TLS 加密

#### HTTPS 传输

所有镜像管理相关的 API 调用都使用 HTTPS 加密传输：

- **API 请求**：API Server 使用 TLS 证书
- **镜像拉取**：使用 HTTPS 连接镜像仓库
- **凭证传输**：凭证在传输过程中加密保护

#### 证书验证

**严格证书验证**：
```go
// 启用严格证书验证
tlsConfig := &tls.Config{
    MinVersion: tls.VersionTLS12,
    InsecureSkipVerify: false,
}
```

**自签名证书支持**（不推荐生产环境）：
```go
// 开发环境可以使用自签名证书
tlsConfig := &tls.Config{
    InsecureSkipVerify: true, // 仅用于测试
}
```

### 镜像拉取安全

#### ImagePullSecret 配置

当 Pod 需要拉取私有镜像时，会自动使用配置的 ImagePullSecret：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: harbor.example.com/myapp:v1.0.0
  imagePullSecrets:
  - name: registry-harbor
```

#### Secret 自动注入

平台会自动将镜像源凭证注入到相关 Pod 中：

1. **识别镜像仓库**：从镜像 URL 中提取仓库域名
2. **匹配凭证**：查找对应域名的镜像源凭证
3. **注入 Secret**：自动添加到 Pod 的 imagePullSecrets
4. **拉取镜像**：容器运行时使用凭证拉取镜像

## 审计与监控

### 操作审计

#### 审计日志

所有镜像管理操作都会记录到审计日志：

| 操作类型 | 记录内容 |
|---------|----------|
| 创建镜像源 | 用户、时间、镜像源信息 |
| 删除镜像源 | 用户、时间、删除的镜像源 |
| 测试连接 | 用户、时间、连接结果 |
| 创建镜像仓库 | 用户、时间、镜像信息 |
| 删除镜像仓库 | 用户、时间、删除的镜像 |
| 同步镜像 | 用户、时间、同步结果 |

#### 查看审计日志

```bash
# 查看最近的镜像管理操作
kubectl get events --field-selector reason=ImageManagement

# 查看特定用户的操作
kubectl get events --field-selector involvedObject.kind=Image,user=admin@example.com
```

### 安全监控

#### 连接状态监控

**监控指标**：
- 镜像源连接失败率
- 镜像同步失败率
- 认证失败次数
- 网络连接超时次数

**告警规则**：
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: image-security-alerts
spec:
  groups:
  - name: image.security
    rules:
    - alert: RegistryConnectionFailure
      expr: image_registry_connection_failures > 5
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "镜像源连接失败"
        description: "镜像源 {{ $labels.registry_name }} 连续失败 {{ $value }} 次"
```

#### 异常行为检测

**异常模式**：
- 短时间内大量删除镜像源
- 从异常地理位置访问镜像仓库
- 尝试使用无效凭证多次认证
- 镜像同步频率异常

## 安全最佳实践

### 1. 凭证管理

#### 使用专用账户

```yaml
# ❌ 不推荐：使用管理员账户
username: "admin"

# ✅ 推荐：使用专用的镜像管理账户
username: "image-puller"
```

#### 最小权限原则

为镜像管理账户只授予必要的权限：
- **只读权限**：对于只需要拉取镜像的场景
- **项目级权限**：限制只能访问特定项目
- **临时访问**：使用临时凭证而非永久凭证

#### 定期轮换凭证

```bash
# 定期更换镜像仓库密码（建议每 90 天）
# 1. 在镜像仓库中修改密码
# 2. 在平台中删除旧的镜像源配置
# 3. 创建新的镜像源配置
# 4. 验证新凭证的正确性
```

### 2. 访问控制

#### 基于角色的访问

```yaml
# 为不同角色分配适当的权限
开发人员 → image-viewer (只读)
运维人员 → image-operator (操作)
平台管理员 → image-admin (管理)
```

#### 命名空间隔离

```
# 为不同环境使用独立的命名空间
dev-namespace    → 开发环境镜像
test-namespace   → 测试环境镜像
prod-namespace   → 生产环境镜像
```

### 3. 网络安全

#### 使用内网地址

```yaml
# 云服务商内部使用内网地址
domain: "harbor.cn-hangzhou.internal.example.com"

# 而非公网地址
# domain: "harbor.example.com"
```

#### 网络策略限制

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: image-pull-policy
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: image-registry
    ports:
    - protocol: TCP
      port: 443
```

### 4. 镜像验证

#### 镜像签名

```bash
# 启用镜像签名验证
# 1. 配置镜像签名策略
# 2. 验证镜像签名
# 3. 拒绝未签名或签名无效的镜像
```

#### 镜像扫描

```yaml
# 定期扫描镜像安全漏洞
apiVersion: secscan.theriseunion.io/v1alpha1
kind: ImageScanPolicy
metadata:
  name: daily-scan
spec:
  schedule: "0 2 * * *"  # 每天凌晨 2 点
  namespaces:
  - "production"
  - "staging"
```

## 安全检查清单

### 日常安全检查

- [ ] 检查所有镜像源的连接状态
- [ ] 审查最近的镜像管理操作日志
- [ ] 确认所有凭证都是最新的
- [ ] 检查是否有异常的镜像同步行为
- [ ] 验证网络策略配置正确

### 定期安全审查

- [ ] 审查用户权限分配
- [ ] 检查命名空间隔离配置
- [ ] 更新安全策略和配置
- [ ] 进行安全漏洞扫描
- [ ] 评估和优化安全配置

### 事件响应

- [ ] 制定安全事件响应流程
- [ ] 建立安全告警机制
- [ ] 准备应急响应预案
- [ ] 定期进行安全演练

## 常见安全问题

### Q1: 如何处理凭证泄露？

**响应步骤**：
1. 立即在镜像仓库中更换密码
2. 更新平台中的镜像源配置
3. 审查访问日志，确定泄露范围
4. 通知相关人员加强安全意识

### Q2: 如何限制镜像源的访问？

**方法**：
1. 使用 RBAC 限制谁能查看/编辑镜像源
2. 使用命名空间隔离不同环境的镜像源
3. 设置网络策略限制访问范围
4. 启用审计日志监控访问行为

### Q3: 如何确保镜像的完整性？

**方法**：
1. 使用镜像签名验证
2. 定期扫描镜像安全漏洞
3. 只从可信的镜像源拉取镜像
4. 使用固定的镜像标签而非 latest

### Q4: 如何防止未经授权的镜像拉取？

**方法**：
1. 启用镜像仓库的认证机制
2. 使用 ImagePullSecret 控制访问
3. 设置网络策略限制出站流量
4. 监控异常的镜像拉取行为

## 相关文档

- [镜像源管理](./registry-management.md)
- [镜像仓库管理](./repository-management.md)
- [故障排查指南](./troubleshooting.md)
- [安全最佳实践](./best-practices.md)