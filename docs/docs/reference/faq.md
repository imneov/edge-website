---
sidebar_position: 1
title: 常见问题
---

# 常见问题（FAQ）

本文档收集了边缘智能管理平台使用过程中的常见问题和解答。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 通用问题

### 边缘平台支持哪些 Kubernetes 版本？

边缘平台支持 Kubernetes 1.24 及以上版本，推荐使用 1.26+ 版本以获得更好的稳定性和性能。

对于边缘计算场景，推荐使用 OpenYurt 1.6+ 版本。

### 平台有哪些核心组件？

边缘平台主要包含以下核心组件：

- **Console** - Web 管理界面
- **API Server** - API 网关和业务逻辑
- **Controller** - Kubernetes 资源控制器
- **OAuth Server** - 认证授权服务

## 🔐 认证与授权

### 如何重置管理员密码？

如果忘记管理员密码，可以通过以下方式重置：

1. 联系其他管理员通过界面重置
2. 通过 kubectl 直接修改 User 资源
3. 重新部署平台（仅测试环境）

详见 [用户管理文档](../user-guide/platform/users.md)。

### 支持哪些认证方式？

平台支持多种认证方式：

- **本地用户认证** - 用户名密码
- **LDAP/AD** - 企业目录服务集成
- **OAuth 2.0 / OIDC** - 第三方身份提供商
- **多因素认证（MFA）** - 增强安全性

配置方法请参考 [平台设置文档](../user-guide/platform/settings.md)。

## 🖥️ 集群管理

### 如何添加多个集群？

平台支持管理多个 Kubernetes 集群。对每个集群重复执行 [添加集群](../quick-start/first-cluster.md) 流程即可。

### 移除集群会删除实际集群吗？

不会。从边缘平台移除集群只是删除管理关系，不会对实际 Kubernetes 集群进行任何操作。

### 集群状态显示离线怎么办？

请按以下步骤排查：

1. 检查集群 API Server 是否正常运行
2. 验证网络连通性
3. 确认 Kubeconfig 凭证有效
4. 查看 Controller 日志

详见 [故障排查指南](../deployment/troubleshooting.md)。

## 👥 用户与权限

### 权限模型是怎样的？

边缘平台采用多层级 RBAC 权限模型：

- **角色模板（RoleTemplate）** - 定义可复用的权限规则
- **角色（IAMRole）** - 聚合多个角色模板形成完整角色
- **角色绑定（IAMRoleBinding）** - 将角色分配给用户

详见 [角色管理文档](../user-guide/platform/roles.md)。

### 如何创建自定义角色？

1. 进入"平台管理" > "角色管理"
2. 点击"创建角色"
3. 选择或创建角色模板
4. 配置权限规则
5. 保存并测试

详细步骤参考 [角色管理文档](../user-guide/platform/roles.md)。

## 🔧 安装与部署

### 最低硬件要求是什么？

**测试环境**：
- CPU: 4 核
- 内存: 8GB
- 磁盘: 50GB

**生产环境**：
- CPU: 8 核
- 内存: 16GB
- 磁盘: 100GB SSD

详见 [安装前准备](../quick-start/prerequisites.md)。

### 支持离线安装吗？

支持。平台提供离线安装包，包含所有必需的容器镜像和配置文件。

详见 [安装指南](../deployment/install-platform.md)。

### 如何升级平台版本？

使用 Helm 升级命令：

```bash
helm upgrade edge-platform edge-platform/edge-platform \
  --namespace edge-system \
  --reuse-values
```

升级前请备份重要数据。

## 📊 监控与日志

### 如何查看平台监控指标？

平台集成 Prometheus 和 Grafana：

1. 访问 Grafana 仪表盘
2. 查看预置的监控面板
3. 自定义监控查询和告警

配置方法参考 [平台设置文档](../user-guide/platform/settings.md)。

### 日志保存在哪里？

- **容器日志** - 通过 kubectl logs 查看
- **审计日志** - 存储在持久化存储中
- **事件日志** - Kubernetes Events

可以集成 Loki 或 Elasticsearch 进行集中日志管理。

## 🆘 故障处理

### Console 页面加载缓慢

可能原因：

1. 网络延迟 - 检查网络质量
2. 资源不足 - 增加 Pod 资源配额
3. 浏览器缓存 - 清除缓存后重试

### API 请求超时

排查步骤：

1. 检查 API Server Pod 状态
2. 查看 API Server 日志
3. 验证网络连通性
4. 检查资源使用情况

## 📖 更多帮助

找不到答案？请访问：

- [故障排查指南](../deployment/troubleshooting.md)
- [支持中心](./support.md)
- [开发者文档](../../developer/intro.md)

---

**问题反馈**：如果您发现文档中的错误或有改进建议，欢迎通过 [支持中心](./support.md) 联系我们。
