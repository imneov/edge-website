# 镜像管理模块文档

## 欢迎使用镜像管理模块

镜像管理模块是边缘计算平台的核心组件之一，提供了完整的容器镜像生命周期管理功能，支持企业级镜像仓库集成、镜像同步、安全认证等核心能力。

## 📚 文档导航

### 新手入门
- **[快速入门](./quick-start.md)** - 10 分钟快速上手镜像管理功能
- **[模块概述](./overview.md)** - 了解镜像管理的核心功能和架构

### 核心功能
- **[镜像源管理](./registry-management.md)** - 管理镜像仓库凭证和连接
- **[镜像仓库管理](./repository-management.md)** - 管理镜像同步和版本
- **[安全与认证](./security-authentication.md)** - 镜像安全管理和访问控制
- **[生命周期管理](./lifecycle-management.md)** - 镜像版本管理和清理策略

### 参考文档
- **[API 参考](./api-reference.md)** - 完整的 API 接口文档
- **[故障排查](./troubleshooting.md)** - 常见问题和解决方案
- **[最佳实践](./best-practices.md)** - 生产环境使用建议

## 🚀 快速开始

### 5 分钟快速配置

```bash
# 1. 创建镜像源
kubectl apply -f - <<EOF
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: harbor-prod
  namespace: default
spec:
  domain: "harbor.example.com"
  username: "admin"
  password: "Harbor12345"
  provider: "harbor"
EOF

# 2. 添加镜像仓库
kubectl apply -f - <<EOF
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: nginx-latest
  namespace: default
spec:
  repository: "library/nginx"
  tag: "latest"
  registryRef:
    name: harbor-prod
    namespace: "default"
  syncInterval: "1h"
EOF

# 3. 查看同步状态
kubectl get repositories -n default
```

详细步骤请参考 [快速入门指南](./quick-start.md)

## 🎯 核心功能

### 1. 镜像源管理

- **多镜像仓库支持**：Harbor、Docker Hub、阿里云等
- **统一认证管理**：集中管理访问凭证
- **连接状态监控**：实时监控连接健康状态
- **命名空间隔离**：支持多租户隔离

### 2. 镜像同步

- **自动同步**：按配置的间隔自动同步镜像
- **增量同步**：只同步变化的镜像层
- **并发同步**：支持多个镜像并发��步
- **状态监控**：实时显示同步进度和状态

### 3. 安全管理

- **凭证加密**：使用 Kubernetes Secret 加密存储
- **访问控制**：基于 RBAC 的权限管理
- **镜像验证**：支持镜像签名和漏洞扫描
- **审计日志**：记录所有管理操作

### 4. 生命周期管理

- **版本控制**：管理镜像的多个版本
- **自动清理**：配置镜像保留策略
- **健康检查**：定期检查镜像可用性
- **故障恢复**：自动重试和故障转移

## 🏗️ 架构设计

### 模块组成

```
镜像管理模块
├── 镜像源管理 (RegistrySecret)
│   ├── 镜像仓库凭证配置
│   ├── 连接状态验证
│   └── 凭证生命周期管理
├── 镜像仓库管理 (Repository)
│   ├── 镜像同步配置
│   ├── 镜像标签管理
│   └── 同步状态监控
└── 安全与权限
    ├── 凭证加密存储
    ├── RBAC 权限控制
    └── 操作审计日志
```

### 技术架构

- **API 层**：基于 Kubernetes CRD 的 API 接口
- **控制层**：镜像同步控制器和状态管理
- **数据层**：使用 etcd 存储配置和状态
- **集成层**：与容器运行时和网络策略集成

## 📖 使用场景

### 场景 1：边缘应用部署

在边缘节点部署应用时，从预先同步的镜像仓库中拉取镜像，避免从公网拉取镜像慢的问题。

**优势**：
- 缩短应用部署时间
- 降低公网带宽消耗
- 提高部署成功率

### 场景 2：离线环境支持

对于完全离线的边缘环境，通过镜像同步功能提前将需要的镜像同步到边缘集群。

**优势**：
- 支持完全离线部署
- 确保镜像版本一致性
- 减少运维复杂度

### 场景 3：多集群管理

统一管理多个边缘集群的镜像源和镜像仓库，确保镜像版本一致性。

**优势**：
- 集中管理镜像配置
- 统一镜像版本策略
- 简化运维流程

### 场景 4：版本控制与回滚

管理应用的不同版本镜像，支持快速回滚和版本切换。

**优势**：
- 快速故障恢复
- 灵活的版本管理
- 降低升级风险

## 🔧 典型配置示例

### 生产环境配置

```yaml
# 生产环境镜像源
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: harbor-prod
  namespace: production
spec:
  domain: "harbor.example.com"
  username: "prod-puller"
  password: "SecurePassword123"
  provider: "harbor"

---
# 生产应用镜像
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: myapp-v1.0.0
  namespace: production
spec:
  repository: "myapp/myapp"
  tag: "v1.0.0"
  registryRef:
    name: harbor-prod
    namespace: "production"
  syncInterval: "24h"  # 生产环境使用较长的同步间隔
```

### 开发环境配置

```yaml
# 开发环境镜像源
apiVersion: image.theriseunion.io/v1alpha1
kind: RegistrySecret
metadata:
  name: dockerhub-dev
  namespace: development
spec:
  domain: "docker.io"
  username: "dev-user"
  password: "DevPassword123"
  provider: "dockerhub"

---
# 开发应用镜像
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: myapp-dev
  namespace: development
spec:
  repository: "myapp/myapp"
  tag: "latest"
  registryRef:
    name: dockerhub-dev
    namespace: "development"
  syncInterval: "30m"  # 开发环境使用较短的同步间隔
```

## 📊 监控和告警

### 关键指标

- **镜像源连接成功率**
- **镜像同步成功率**
- **镜像拉取延迟**
- **存储空间使用率**

### 告警规则

```yaml
# 镜像同步失败告警
- alert: ImageSyncFailure
  expr: image_sync_failures > 3
  for: 15m
  annotations:
    summary: "镜像同步连续失败"

# 存储空间告警
- alert: ImageStorageHigh
  expr: image_storage_usage_percent > 80
  for: 5m
  annotations:
    summary: "镜像存储空间不足"
```

## 🔐 安全最佳实践

### 1. 凭证管理

- 使用专用账户而非管理员账户
- 定期轮换镜像仓库密码
- 为不同环境使用不同的凭证
- 启用凭证加密存储

### 2. 访问控制

- 基于 RBAC 的权限隔离
- 命名空间级别的资源隔离
- 最小权限原则
- 定期审计访问权限

### 3. 网络安全

- 使用 TLS 加密传输
- 配置网络策略限制访问
- 优先使用内网镜像源
- 启用镜像签名验证

## 🛠️ 故障排查

### 常见问题

1. **镜像源连接失败**
   - 检查网络连接和 DNS 解析
   - 验证凭证信息是否正确
   - 确认镜像仓库服务状态

2. **镜像同步失败**
   - 确认镜像路径和标签正确
   - 检查镜像源连接状态
   - 查看同步错误日志

3. **镜像拉取慢**
   - 使用本地或近端镜像源
   - 预先同步镜像到边缘节点
   - 优化镜像大小

详细的故障排查指南请参考 [故障排查文档](./troubleshooting.md)

## 📈 性能优化

### 网络优化

- 配置镜像缓存代理
- 使用 CDN 加速
- 优化 DNS 解析
- 调整并发连接数

### 存储优化

- 定期清理未使用的镜像
- 使用镜像保留策略
- 优化镜像存储驱动
- 监控存储使用情况

### 同步优化

- 调整同步间隔
- 使用增量同步
- 配置合理的重试策略
- 优化同步超时时间

## 🤝 贡献指南

我们欢迎社区贡献！

1. Fork 项目仓库
2. 创建特性分支
3. 提交变更
4. 发起 Pull Request

## 📞 获取帮助

### 技术支持

- **邮件**: support@theriseunion.io
- **文档**: https://docs.theriseunion.io
- **GitHub**: https://github.com/theriseunion/platform
- **社区论坛**: https://community.theriseunion.io

### 培训和咨询

- **在线培训**: https://training.theriseunion.io
- **认证考试**: https://cert.theriseunion.io
- **企业咨询**: consulting@theriseunion.io

## 📝 更新日志

### v1.0.0 (2024-01-08)

**新功能**:
- 镜像源管理功能
- 镜像仓库管理功能
- 镜像同步功能
- 连接验证功能

**改进**:
- 支持多种镜像仓库类型
- 增强的安全特性
- 改进的错误处理

## 🔗 相关资源

### 官方资源

- [项目主页](https://www.theriseunion.io)
- [技术博客](https://blog.theriseunion.io)
- [视频教程](https://videos.theriseunion.io)
- [API 文档](https://api.theriseunion.io)

### 社区资源

- [Stack Overflow](https://stackoverflow.com/questions/tagged/edge-platform)
- [Reddit 社区](https://reddit.com/r/edgeplatform)
- [Discord 服务器](https://discord.gg/edgeplatform)
- [中文社区](https://community.theriseunion.io/cn)

## 📄 许可证

本项目采用 Apache 2.0 许可证。详见 [LICENSE](https://github.com/theriseunion/platform/blob/main/LICENSE) 文件。

---

**最后更新**: 2024-01-08
**版本**: v1.0.0
**维护者**: Edge Platform Team