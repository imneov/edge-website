# 镜像管理模块概述

## 概述

边缘计算平台的镜像管理模块提供了完整的容器镜像生命周期管理功能，支持企业级镜像仓库的集成、镜像同步、安全认证等核心能力。该模块专为边缘计算场景设计，解决了边缘节点镜像拉取慢、存储有限、网络不稳定等痛点问题。

## 核心功能

### 1. 镜像源管理 (Registry Management)
- **多镜像仓库支持**：支持 Harbor、Docker Hub、阿里云容器镜像服务等主流镜像仓库
- **统一认证管理**：集中管理多个镜像仓库的访问凭证
- **连接状态监控**：实时监控镜像仓库连接状态，及时发现连接问题
- **命名空间隔离**：支持按命名空间隔离镜像源配置

### 2. 镜像仓库管理 (Repository Management)
- **镜像同步**：将远程镜像仓库的镜像同步到边缘集群
- **自动化同步**：支持定时自动同步镜像标签和元数据
- **镜像搜索**：快速搜索和定位需要的镜像
- **批量操作**：支持批量添加、删除镜像仓库

### 3. 镜像安全与认证
- **凭证加密存储**：镜像仓库凭证使用 Kubernetes Secret 加密存储
- **访问控制**：基于 RBAC 的镜像资源访问控制
- **连接验证**：支持测试镜像仓库连接，确保凭证正确性
- **审计日志**：记录镜像管理操作日志，便于追溯

### 4. 镜像生命周期管理
- **镜像版本管理**：支持管理同一镜像的多个标签版本
- **镜像清理**：支持清理不需要的镜像版本，释放存储空间
- **镜像状态监控**：实时监控镜像同步状态和健康状态
- **镜像元数据管理**：支持为镜像添加别名、描述等元信息

## 架构设计

### 模块组成

```
镜像管理模块
├── 镜像源管理 (Registry Sources)
│   ├── 镜像仓库凭证配置
│   ├── 连接状态验证
│   └── 凭证生命周期管理
├── 镜像仓库管理 (Image Repositories)
│   ├── 镜像同步配置
│   ├── 镜像标签管理
│   └── 同步状态监控
└── 安全与权限
    ├── 凭证加密存储
    ├── RBAC 权限控制
    └── 操作审计日志
```

### 数据模型

#### 镜像源 (RegistrySecret)
```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: registry-harbor
  namespace: default
  annotations:
    theriseunion.io/display-name: "生产环境 Harbor"
    theriseunion.io/description: "生产环境 Harbor 镜像仓库"
    theriseunion.io/domain: "harbor.example.com"
    theriseunion.io/username: "admin"
    theriseunion.io/provider: "harbor"
    theriseunion.io/verify-status: "success"
    theriseunion.io/verify-message: "连接成功"
    theriseunion.io/verify-timestamp: "1704676800000"
spec:
  domain: "harbor.example.com"
  username: "admin"
  password: "<encrypted>"
  provider: "harbor"
```

#### 镜像仓库 (Repository)
```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: nginx-latest
  namespace: default
  annotations:
    theriseunion.io/display-name: "Nginx 最新版本"
    theriseunion.io/description: "Nginx web 服务器最新版本"
spec:
  repository: "library/nginx"
  tag: "latest"
  registryRef:
    name: registry-harbor
    namespace: "default"
  syncInterval: "1h"
status:
  domain: "harbor.example.com"
  syncStatus: "Success"
  lastSynced: "2024-01-08T10:30:00Z"
  manifest:
    architecture: "amd64"
    size: "142MB"
    created: "2024-01-08T08:00:00Z"
```

## 应用场景

### 1. 边缘应用部署
在边缘节点部署应用时，可以从预先同步的镜像仓库中拉取镜像，避免从公网拉取镜像慢的问题。

### 2. 离线环境支持
对于完全离线的边缘环境，可以通过镜像同步功能提前将需要的镜像同步到边缘集群。

### 3. 多集群镜像管理
统一管理多个边缘集群的镜像源和镜像仓库，确保镜像版本一致性。

### 4. 镜像版本控制
管理应用的不同版本镜像，支持快速回滚和版本切换。

## 快速开始

### 前置条件
- 已部署边缘计算平台
- 具有镜像管理权限的用户账号
- 可访问的镜像仓库（Harbor、Docker Hub 等）

### 基本操作流程

1. **配置镜像源**
   - 导航到：镜像管理 → 镜像源管理
   - 点击"添加镜像源"
   - 填写镜像仓库信息和凭证
   - 测试连接确保配置正确

2. **添加镜像仓库**
   - 导航到：镜像管理 → 镜像管理
   - 点击"添加镜像"
   - 选择镜像源和镜像仓库
   - 配置同步策略

3. **部署应用**
   - 在应用部署时选择已同步的镜像
   - 系统自动从最近/最优的镜像源拉取镜像

## 技术特性

### 高可用性
- 支持多个镜像源配置，避免单点故障
- 自动重试机制，确保镜像同步成功
- 镜像缓存机制，减少网络传输

### 性能优化
- 增量同步机制，只同步变化的镜像层
- 并发同步，提高同步效率
- 智能调度，优先使用本地镜像

### 安全性
- 凭证加密存储，防止敏感信息泄露
- TLS 加密传输，保护数据安全
- 细粒度权限控制，基于 RBAC

### 可扩展性
- 支持自定义镜像仓库适配器
- 插件化架构，易于扩展新功能
- RESTful API，便于集成

## 使用指南

详细的操作指南请参考：
- [镜像源管理](./registry-management.md)
- [镜像仓库管理](./repository-management.md)
- [镜像安全与认证](./security-authentication.md)
- [镜像生命周期管理](./lifecycle-management.md)

## 最佳实践

1. **镜像源配置**
   - 为不同环境配置独立的镜像源
   - 定期验证镜像源连接状态
   - 使用强密码保护镜像仓库账户

2. **镜像同步策略**
   - 根据业务需求设置合理的同步间隔
   - 优先同步核心业务镜像
   - 避免同步不需要的镜像标签

3. **存储管理**
   - 定期清理不需要的镜像版本
   - 监控镜像存储使用情况
   - 设置合理的镜像保留策略

## 故障排查

常见问题及解决方案请参考：
- [镜像源连接失败](./troubleshooting.md#registry-connection-failed)
- [镜像同步失败](./troubleshooting.md#image-sync-failed)
- [镜像拉取慢](./troubleshooting.md#image-pull-slow)

## API 参考

详细的 API 文档请参考：
- [镜像管理 API](./api-reference.md)

## 版本历史

- **v1.0.0** (2024-01-08): 初始版本，支持基本的镜像管理功能