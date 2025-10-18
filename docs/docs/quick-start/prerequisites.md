---
sidebar_position: 1
title: 前置要求
---

# 前置要求

在开始使用边缘平台之前，请确保满足以下前置条件。

## 🖥️ 系统要求

### 客户端要求

| 项目 | 要求 |
|------|------|
| **操作系统** | Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+, CentOS 7+) |
| **浏览器** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **屏幕分辨率** | 最低 1366×768, 推荐 1920×1080 |
| **网络** | 稳定的互联网连接, 推荐带宽 ≥ 10Mbps |

### 服务器要求

边缘平台运行在 Kubernetes 集群之上，需要满足以下要求：

#### 最小配置（POC 环境）

- **节点数量**: 1 个控制平面节点 + 2 个工作节点
- **CPU**: 每节点 4 核
- **内存**: 每节点 8GB
- **存储**: 每节点 100GB SSD
- **网络**: 节点间网络延迟 < 10ms

#### 生产环境配置

- **节点数量**: 3 个控制平面节点 + 5+ 个工作节点
- **CPU**: 每节点 8 核+
- **内存**: 每节点 16GB+
- **存储**: 每节点 200GB+ SSD
- **网络**: 高可用网络，节点间网络延迟 < 5ms

## 📦 软件依赖

### Kubernetes 集群

边缘平台支持以下 Kubernetes 发行版：

| 发行版 | 版本要求 | 推荐版本 |
|--------|----------|----------|
| **Kubernetes** | ≥ 1.24.0 | 1.28.x |
| **OpenYurt** | ≥ 1.4.0 | 1.6.x |
| **K3s** | ≥ 1.24.0 | 1.28.x |
| **RKE** | ≥ 1.4.0 | 1.5.x |

:::tip 推荐使用 OpenYurt
边缘平台针对 OpenYurt 进行了深度优化，提供最佳的边缘计算体验。
:::

### 存储后端

边缘平台需要持久化存储支持：

- **Local Path Provisioner** (开发/测试环境)
- **NFS** (生产环境)
- **Ceph RBD** (生产环境)
- **云存储** (AWS EBS, Azure Disk, GCP PD)

### 监控组件（可选）

如果需要使用监控功能，需要部署：

- **Prometheus** ≥ 2.40.0
- **Grafana** ≥ 9.0.0

## 🔑 访问权限

### 管理员权限

安装边缘平台需要以下权限：

- Kubernetes 集群 **cluster-admin** 权限
- SSH 访问所有节点的权限
- 防火墙和网络配置权限

### 用户权限

使用边缘平台的用户需要：

- 平台账号（由管理员创建）
- 分配的角色和权限
- 网络访问边缘平台 Console 的权限

## 🌐 网络要求

### 端口清单

边缘平台需要开放以下端口：

#### Console 和 APIServer

| 端口 | 协议 | 说明 | 方向 |
|------|------|------|------|
| **8080** | TCP | API Server HTTP | 入站 |
| **443** | TCP | Console HTTPS | 入站 |
| **9090** | TCP | Metrics | 入站（可选）|

#### Kubernetes 集群

| 端口 | 协议 | 说明 | 方向 |
|------|------|------|------|
| **6443** | TCP | Kubernetes API | 入站 |
| **2379-2380** | TCP | etcd 通信 | 入站 |
| **10250** | TCP | Kubelet API | 入站 |
| **10251** | TCP | kube-scheduler | 入站 |
| **10252** | TCP | kube-controller | 入站 |

#### 边缘节点

| 端口 | 协议 | 说明 | 方向 |
|------|------|------|------|
| **10550** | TCP | YurtHub | 入站 |
| **10255** | TCP | Kubelet 只读 | 入站（可选）|

### 域名和证书

**生产环境推荐配置**：

- 为 Console 配置独立域名（如 `console.edge-platform.io`）
- 为 API Server 配置独立域名（如 `api.edge-platform.io`）
- 使用有效的 TLS 证书（Let's Encrypt 或企业 CA）

## 📚 知识储备

### 必备知识

使用边缘平台需要掌握以下基础知识：

- ✅ **Kubernetes 基础** - Pod, Deployment, Service, ConfigMap 等核心概念
- ✅ **Linux 基础** - 文件系统、权限管理、网络配置
- ✅ **容器技术** - Docker 或 containerd 基本使用

### 推荐知识

以下知识有助于更好地使用边缘平台：

- 📖 **YAML 语法** - Kubernetes 资源定义
- 📖 **Helm** - 应用打包和部署
- 📖 **RBAC** - Kubernetes 权限控制
- 📖 **Prometheus** - 监控指标查询

## 🔍 环境检查

### 检查 Kubernetes 集群

```bash
# 检查集群状态
kubectl cluster-info

# 检查节点状态
kubectl get nodes

# 检查系统组件
kubectl get pods -n kube-system

# 检查存储类
kubectl get storageclass
```

**预期输出示例**：

```bash
$ kubectl get nodes
NAME           STATUS   ROLES           AGE   VERSION
master-1       Ready    control-plane   5d    v1.28.0
worker-1       Ready    <none>          5d    v1.28.0
worker-2       Ready    <none>          5d    v1.28.0
```

### 检查资源可用性

```bash
# 检查 CPU 和内存
kubectl top nodes

# 检查存储可用空间
df -h
```

### 检查网络连通性

```bash
# 测试节点间网络
ping <worker-node-ip>

# 测试 DNS 解析
nslookup kubernetes.default.svc.cluster.local

# 测试外部网络
curl -I https://github.com
```

## ✅ 准备检查清单

在开始安装之前，请确认以下清单：

- [ ] Kubernetes 集群版本 ≥ 1.24.0
- [ ] 所有节点状态为 Ready
- [ ] 存储类配置正常
- [ ] 网络连通性正常
- [ ] 具备 cluster-admin 权限
- [ ] 所需端口已开放
- [ ] 域名和证书已准备（生产环境）
- [ ] 监控组件已部署（可选）

## 🆘 常见问题

### Q: 是否支持单节点部署？

A: 支持，但仅推荐用于开发和测试环境。生产环境建议至少 3 个控制平面节点实现高可用。

### Q: 可以在已有的 Kubernetes 集群上安装吗？

A: 可以。边缘平台以 Kubernetes 应用的形式部署，不会影响现有工作负载。

### Q: 是否必须使用 OpenYurt？

A: 不是必须的。边缘平台支持标准 Kubernetes，但使用 OpenYurt 可以获得更好的边缘计算能力。

### Q: 存储要求有多大？

A: 最小配置需要 100GB，生产环境建议 200GB 以上。实际需求取决于应用数量和日志保留策略。

## 📖 下一步

完成前置条件检查后，您可以继续：

- [首次登录](./first-login.md) - 如果平台已安装
- [安装指南](../deployment/install-platform.md) - 如果需要部署平台

---

**需要帮助？** 请查看 [常见问题](../reference/faq.md) 或 [联系支持团队](../reference/support.md)。
