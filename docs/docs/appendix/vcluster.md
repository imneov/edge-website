---
sidebar_position: 4
title: "vCluster 参考"
description: "vCluster 核心概念、架构原理与版本说明"
---

# vCluster 参考

> **官方文档**：[https://www.vcluster.com/docs](https://www.vcluster.com/docs)
> **项目仓库**：[https://github.com/loft-sh/vcluster](https://github.com/loft-sh/vcluster)

## 什么是 vCluster

vCluster 是一个开源的虚拟 Kubernetes 集群方案，可在一个物理 Kubernetes 集群（Host 集群）内运行多个完全隔离的虚拟 Kubernetes 集群。每个虚拟集群拥有独立的控制平面（API Server、etcd/SQLite、Controller Manager），但共享 Host 集群的底层计算节点和网络资源。

vCluster 通过 CNCF 认证的 Kubernetes 一致性测试，虚拟集群对使用者而言与真实 Kubernetes 集群体验完全相同。

---

## 核心架构

```
┌─────────────────────────────────────────────────┐
│                   Host 集群                       │
│  ┌─────────────────────────────────────────────┐ │
│  │            vCluster（虚拟集群）               │ │
│  │  ┌──────────────┐   ┌────────────────────┐  │ │
│  │  │  控制平面     │   │     Syncer         │  │ │
│  │  │  - API Server │   │ 同步虚拟资源到 Host │  │ │
│  │  │  - etcd/SQLite│   │ 反向同步节点/事件  │  │ │
│  │  │  - Controller │   └────────────────────┘  │ │
│  │  └──────────────┘                            │ │
│  └─────────────────────────────────────────────┘ │
│  共享：计算节点 / 网络 / 存储                       │
└─────────────────────────────────────────────────┘
```

### 工作原理

1. **虚拟控制平面**：vCluster 在 Host 集群的一个 Namespace 中以 Pod 方式运行独立的 API Server 和 Controller Manager
2. **Syncer 同步器**：核心组件，负责将虚拟集群中的资源（Pod、Service、PVC 等）同步到 Host 集群，并将 Host 集群的节点状态、事件等反向同步回虚拟集群
3. **资源隔离**：虚拟集群内的资源名称经过重写后映射到 Host Namespace，避免冲突
4. **无需额外节点**：所有 Pod 实际调度到 Host 集群的真实节点上运行

---

## 主要组件

| 组件 | 说明 |
|------|------|
| **API Server** | 虚拟集群的 Kubernetes API 入口，接受来自虚拟集群用户的所有请求 |
| **Controller Manager** | 运行虚拟集群的核心控制器（Deployment、ReplicaSet 等） |
| **Syncer** | 双向同步引擎，将虚拟资源投影到 Host 集群，并同步 Host 状态回虚拟集群 |
| **etcd** | 虚拟集群的状态存储，保障控制平面数据持久化 |
| **Distro（发行版）** | 虚拟集群内运行的 Kubernetes 发行版，平台使用标准 **k8s** 发行版 |

---

## 核心特性

- **强隔离性**：独立控制平面，虚拟集群内的 RBAC、CRD、Webhook 相互独立，互不影响
- **资源共享**：共享 Host 集群节点，无需独立服务器，成本极低
- **秒级创建**：创建一个虚拟集群通常在 30 秒内完成
- **多租户**：多个团队或项目可在同一 Host 集群中运行各自独立的虚拟集群
- **完整 K8s 体验**：支持 kubectl、Helm、标准 API，用户无感知
- **CRD 隔离**：每个虚拟集群可安装不同版本的 CRD，不影响 Host 集群

---

## 版本说明

| 版本 | Kubernetes 兼容范围 | 重要变化 |
|------|-------------------|---------|
| **v0.19+** | K8s 1.26 - 1.29 | 引入 vCluster Platform，Syncer 大幅重构 |
| **v0.20+** | K8s 1.27 - 1.30 | 支持 vNode，控制平面稳定性增强 |
| **v0.21+** | K8s 1.28 - 1.31 | 稳定版本，推荐生产使用 |

> **平台当前使用版本**：k8s 发行版，具体版本见集群创建时的注解 `cluster.theriseunion.io/vcluster-distro`。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **多租户隔离** | 多团队共享一个 K8s 集群，各自拥有独立的虚拟集群 |
| **开发测试环境** | 快速为开发者创建独立的 K8s 环境，用完即删 |
| **CI/CD 流水线** | 每次流水线运行创建独立集群，完全隔离，避免测试污染 |
| **多版本测试** | 在同一 Host 集群同时运行不同 K8s 版本的虚拟集群 |
| **边缘计算** | 在边缘节点上运行轻量虚拟集群，复用现有基础设施 |

---

## 基本用法

> 以下为 vCluster CLI 的原生用法，在平台中通过界面操作即可，无需手动执行这些命令。

```bash
# 安装 vcluster CLI
curl -L -o vcluster "https://github.com/loft-sh/vcluster/releases/latest/download/vcluster-linux-amd64"
chmod +x vcluster && mv vcluster /usr/local/bin/

# 创建虚拟集群（k8s 发行版）
vcluster create my-vcluster -n my-namespace --distro k8s

# 连接到虚拟集群（自动切换 kubeconfig）
vcluster connect my-vcluster -n my-namespace

# 断开连接
vcluster disconnect

# 删除虚拟集群
vcluster delete my-vcluster -n my-namespace

# 列出所有虚拟集群
vcluster list
```

---

## 在平台中的使用

平台通过 vCluster 实现子集群的自动创建，相关文档：

- [创建 vCluster 子集群](../clusters/cluster-management#创建-vcluster-子集群) — 通过平台界面创建虚拟集群
- [配置集群边缘运行时](../edge-nodes/cluster-runtime-setup) — 为 vCluster 子集群配置 KubeEdge 或 OpenYurt
- [添加边缘节点](../edge-nodes/add-edge-node) — 向 vCluster 子集群添加边缘节点

---

## 参考资料

- [vCluster 官方文档](https://www.vcluster.com/docs)
- [vCluster GitHub 仓库](https://github.com/loft-sh/vcluster)
- [vCluster 架构设计](https://www.vcluster.com/docs/vcluster/introduction/architecture/)
