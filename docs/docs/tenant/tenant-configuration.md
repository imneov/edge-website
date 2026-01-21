# 租户配置指南

## 概述

租户配置提供了对租户空间各种设置和参数的管理能力，包括基础配置、资源配额、网络设置、安全策略等。通过合理的配置，可以优化租户空间的性能、安全性和可用性。

## 基础配置

### 租户空间信息

#### 基本属性
- **租户空间ID**: 全局唯一的标识符
- **显示名称**: 用户友好的租户名称
- **描述信息**: 租户空间的功能和用途描述
- **创建时间**: 租户空间的创建时间

#### 元数据配置
```yaml
metadata:
  name: tenant-workspace
  annotations:
    theriseunion.io/alias-name: "生产环境租户"
    theriseunion.io/description: "用于生产环境的租户空间"
    theriseunion.io/creator: "admin"
  labels:
    workspace.theriseunion.io/type: "express"
    theriseunion.io/cluster: "host"
```

### 集群配置

#### 集群关联
- **所属集群**: 租户空间关联的集群
- **Edge Runtime**: 边缘运行时类型选择
- **节点组**: 自动创建专属节点组
- **命名空间**: 自动创建专属命名空间

#### Edge Runtime设置
- **KubeEdge**: 适用于标准边缘计算场景
- **OpenYurt**: 适用于云原生边缘场景
- **无**: 纯Kubernetes场景

## 资源配额配置

### 计算资源配额

#### CPU配额
- **requests.cpu**: CPU请求总和限制
- **limits.cpu**: CPU限制总和限制
- **默认值**: 新Pod的默认CPU值
- **默认限制**: 新Pod的默认CPU限制

#### 内存配额
- **requests.memory**: 内存请求总和限制
- **limits.memory**: 内存限制总和限制
- **默认值**: 新Pod的默认内存值
- **默认限制**: 新Pod的默认内存限制

### 存储资源配额

#### 存储卷配额
- **persistentvolumeclaims**: PVC数量限制
- **requests.storage**: 存储请求总量限制
- **存储类限制**: 特定存储类的限制

#### 配置资源配额
- **configmaps**: ConfigMap数量限制
- **secrets**: Secret数量限制
- **资源配额示例**:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources
  namespace: tenant-namespace
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
```

### 对象数量配额

#### API对象限制
- **pods**: Pod数量限制
- **services**: Service数量限制
- **deployments**: Deployment数量限制
- **configmaps**: ConfigMap数量限制
- **secrets**: Secret数量限制

#### 对象数量配置示例
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: object-counts
  namespace: tenant-namespace
spec:
  hard:
    pods: "50"
    services: "10"
    deployments: "20"
    configmaps: "20"
    secrets: "10"
```

## 网络配置

### 网络策略

#### 基础网络策略
- **默认拒绝**: 租户间默认网络隔离
- **入站规则**: 控制入站流量
- **出站规则**: 控制出站流量
- **端口规则**: 特定端口访问控制

#### 网络策略配置示例
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-network-policy
  namespace: tenant-namespace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 53
```

### 服务发现

#### DNS配置
- **内部DNS**: 租户内部服务发现
- **外部DNS**: (可选) 外部DNS配置
- **DNS策略**: Pod的DNS解析策略
- **HostAliases**: 自定义DNS解析

#### 服务网格
- **启用条件**: 根据需要启用服务网格
- **流量管理**: 服务间流量管理
- **安全通信**: 服务间安全通信
- **可观测性**: 服务可观测性

## 存储配置

### 存储类配置

#### 默认存储类
- **存储类型**: 块存储、文件存储、对象存储
- **回收策略**: Delete或Retain
- **允许扩展**: 是否允许卷扩展
- **挂载选项**: 挂载选项配置

#### 存储类配置示例
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: tenant-storage
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Delete
allowVolumeExpansion: true
```

### 持久卷配置

#### 持久卷策略
- **访问模式**: ReadWriteOnce、ReadOnlyMany、ReadWriteMany
- **存储容量**: 持久卷容量大小
- **存储类**: 使用的存储类
- **卷模式**: Filesystem或Block

## 安全配置

### 权限配置

#### 角色配置
- **内置角色**: 使用系统内置角色
- **自定义角色**: 创建自定义角色
- **权限规则**: 细粒度权限配置
- **角色绑定**: 用户角色绑定

#### 权限配置示例
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-user
  namespace: tenant-namespace
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
```

### 密钥管理

#### 密钥策略
- **密钥加密**: 启用密钥加密
- **密钥轮换**: 定期密钥轮换
- **访问控制**: 密钥访问权限控制
- **审计日志**: 密钥使用审计

#### 密钥管理配置
- **加密算法**: 强加密算法
- **密钥长度**: 充足的密钥长度
- **存储方式**: 安全的密钥存储
- **传输方式**: 安全的密钥传输

## 监控配置

### 监控指标

#### 资源监控
- **CPU使用率**: CPU使用情况监控
- **内存使用率**: 内存使用情况监控
- **存储使用率**: 存储使用情况监控
- **网络流量**: 网络流入流出监控

#### 应用监控
- **应用性能**: 应用响应时间监控
- **错误率**: 应用错误率监控
- **可用性**: 应用可用性监控
- **业务指标**: 业务相关指标监控

### 告警配置

#### 告警规则
- **阈值告警**: 基于阈值的告警规则
- **趋势告警**: 基于趋势的告警规则
- **异常检测**: 自动异常检测
- **告警聚合**: 告警聚合和去重

#### 通知配置
- **通知渠道**: 邮件、短信、Webhook等
- **通知策略**: 不同级别的通知策略
- **静默规则**: 告警静默规则
- **值班安排**: 值班和升级策略

## EdgeX配置

### EdgeX框架

#### 启用EdgeX
- **启用条件**: IoT应用场景
- **配置标签**: 系统自动添加EdgeX标签
- **验证状态**: 检查EdgeX启用状态
- **资源配置**: EdgeX相关资源配置

#### EdgeX配置
- **设备管理**: EdgeX设备管理配置
- **数据采集**: EdgeX数据采集配置
- **消息总线**: EdgeX消息总线配置
- **安全配置**: EdgeX安全配置

## 配置管理最佳实践

### 配置规划

#### 分层配置
1. **平台配置**: 平台级别的配置
2. **租户配置**: 租户级别的配置
3. **应用配置**: 应用级别的配置
4. **组件配置**: 组件级别的配置

#### 配置版本控制
- **配置文件**: 使用Git管理配置文件
- **变更记录**: 记录配置变更历史
- **回滚机制**: 配置变更回滚机制
- **审批流程**: 重要配置变更审批

### 配置优化

#### 性能优化
- **资源配置**: 合理的资源配置
- **缓存策略**: 适当的缓存策略
- **连接池**: 优化连接池配置
- **超时设置**: 合理的超时设置

#### 安全优化
- **最小权限**: 授予最小必要权限
- **网络隔离**: 严格的网络隔离
- **加密配置**: 启用加密配置
- **审计配置**: 启用审计日志

### 配置验证

#### 配置检查
- **语法检查**: 配置文件语法检查
- **逻辑检查**: 配置逻辑一致性检查
- **安全检查**: 配置安全合规检查
- **性能检查**: 配置性能影响检查

#### 测试验证
- **功能测试**: 配置功能测试
- **性能测试**: 配置性能测试
- **安全测试**: 配置安全测试
- **兼容性测试**: 配置兼容性测试

## 配置故障排除

### 常见配置问题

#### 资源配置问题
- **配额不足**: 资源配额设置不足
- **限制过严**: 资源限制过于严格
- **默认值缺失**: 缺少合理的默认值
- **配置冲突**: 不同配置间存在冲突

#### 网络配置问题
- **策略过严**: 网络策略过于严格
- **DNS解析**: DNS配置问题
- **端口冲突**: 端口配置冲突
- **网络延迟**: 网络配置导致延迟

#### 安全配置问题
- **权限不足**: 用户权限配置不足
- **密钥问题**: 密钥配置问题
- **认证失败**: 认证配置问题
- **访问拒绝**: 访问控制配置问题

### 调试方法

#### 配置诊断
1. **检查日志**: 查看相关日志信息
2. **验证配置**: 验证配置是否正确
3. **测试连接**: 测试网络连接
4. **权限检查**: 检查用户权限

#### 配置修复
1. **回滚配置**: 回滚到正常配置
2. **逐步调整**: 逐步调整配置参数
3. **测试验证**: 每次调整后测试
4. **文档记录**: 记录问题和解决方案

## 配置自动化

### 自动化工具

#### 配置管理工具
- **Kubectl**: Kubernetes命令行工具
- **Helm**: Kubernetes包管理工具
- **Kustomize**: Kubernetes配置管理工具
- **Terraform**: 基础设施即代码工具

#### 自动化脚本
- **创建脚本**: 租户创建自动化脚本
- **配置脚本**: 配置管理自动化脚本
- **监控脚本**: 配置监控自动化脚本
- **备份脚本**: 配置备份自动化脚本

### CI/CD集成

#### 持续集成
- **配置检查**: CI流程中配置检查
- **自动化测试**: 配置自动化测试
- **构建集成**: 配置与构建集成
- **质量门禁**: 配置质量门禁

#### 持续部署
- **配置部署**: 自动化配置部署
- **版本管理**: 配置版本管理
- **回滚机制**: 自动化回滚机制
- **部署策略**: 蓝绿部署、金丝雀发布

## 配置文档

#### 配置说明
- **配置参数**: 详细的配置参数说明
- **配置示例**: 常用配置示例
- **最佳实践**: 配置最佳实践
- **故障排除**: 配置故障排除指南

## 常见问题

### Q: 如何修改租户资源配额？
A: 通过修改ResourceQuota对象来调整租户资源配额，需要注意不要超过集群总容量。

### Q: 网络策略配置错误怎么办？
A: 首先回滚到之前的网络策略，然后逐步调试规则，可以使用kubectl测试网络连通性。

### Q: 如何优化租户配置？
A: 根据实际使用情况分析资源配置、网络配置和安全配置，进行针对性的优化。

### Q: 配置变更会影响运行中的应用吗？
A: 大部分配置变更不会影响运行中的应用，但网络策略和资源配额变更可能会有影响。

## 相关文档

- [租户空间概览](./tenant-overview.md)
- [资源管理指南](./resource-management.md)
- [安全配置指南](./security-setup.md)
- [监控配置指南](./monitoring-setup.md)