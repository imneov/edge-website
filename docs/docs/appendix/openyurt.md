---
sidebar_position: 6
title: "OpenYurt 参考"
description: "OpenYurt 核心概念、架构原理与版本说明"
---

# OpenYurt 参考

> **官方文档**：[https://openyurt.io/docs](https://openyurt.io/docs)
> **项目仓库**：[https://github.com/openyurtio/openyurt](https://github.com/openyurtio/openyurt)
> **CNCF 状态**：沙箱项目（Sandbox）

## 什么是 OpenYurt

OpenYurt 是阿里巴巴开源、CNCF 托管的云原生边缘计算平台，是业界首个对云原生体系非侵入式的边缘计算平台。它基于原生 Kubernetes 能力扩展，无需修改 Kubernetes 核心代码，通过在云端和边缘端新增组件，实现边缘节点自治、跨地域流量闭环、节点池化管理等能力，适用于 CDN 边缘节点、IoT、弱网等大规模边缘场景。

---

## 核心架构

```
┌──────────────────────────────────────────────┐
│                云端（Cloud）                   │
│  ┌─────────────────┐  ┌──────────────────┐   │
│  │   Yurt-Manager  │  │  Kubernetes      │   │
│  │ (控制器 + Webhook)│  │  API Server      │   │
│  └─────────────────┘  └──────────────────┘   │
│  ┌─────────────────┐                          │
│  │ Raven Controller│  （云边 VPN 管理）         │
│  └─────────────────┘                          │
└──────────────────┬───────────────────────────┘
                   │ HTTPS（经由 YurtHub 代理）
┌──────────────────▼───────────────────────────┐
│               边缘侧（Edge）                   │
│  ┌───────────────┐  ┌─────────────────────┐  │
│  │   YurtHub     │  │   Raven Agent       │  │
│  │ (本地代理缓存) │  │  (VPN 隧道网关)     │  │
│  └───────────────┘  └─────────────────────┘  │
│  kubelet / kube-proxy / 业务容器               │
└──────────────────────────────────────────────┘
```

---

## 主要组件

### 云端组件

| 组件 | 说明 |
|------|------|
| **Yurt-Manager** | 云端核心控制器集合，整合了原有的 yurt-controller-manager、yurt-app-manager 和 raven-controller-manager，统一管理 NodePool、YurtAppSet、YurtAppDaemon 等 CRD 资源 |
| **Raven Controller Manager** | 管理云边和边边 VPN 网络，为每个 NodePool 选举网关节点，维护跨池网络拓扑 |

### 边缘组件

| 组件 | 说明 |
|------|------|
| **YurtHub** | 边缘节点上的本地代理，以 Static Pod 形式运行。所有 kubelet、kube-proxy 等组件对 API Server 的请求都经由 YurtHub 转发，YurtHub 在本地缓存资源数据。断网时使用缓存响应请求，保障边缘节点自治 |
| **Raven Agent** | 以 DaemonSet 形式部署在所有节点，负责建立跨 NodePool 的 VPN 隧道（WireGuard/IPSec），实现云→边、边→边的网络互通，包括 Host 网络和容器网络 |

### 核心 CRD 资源

| 资源 | 说明 |
|------|------|
| **NodePool** | 将具有相同特征（地理位置、CPU 架构、云服务商等）的节点抽象为节点池，是 OpenYurt 多地域管理的基础单元 |
| **YurtAppSet** | 类似 Deployment，支持按 NodePool 差异化部署应用，同一应用在不同节点池可使用不同镜像或配置 |
| **YurtAppDaemon** | 类似 DaemonSet，按 NodePool 维度保证每个节点池中运行指定数量的 Pod 副本 |
| **YurtStaticSet** | 管理边缘节点上的 Static Pod，支持 OTA（Over-The-Air）升级模式 |

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **边缘节点自治** | YurtHub 在本地缓存 API Server 数据，断网后 Pod 不会被驱逐，节点继续正常运行 |
| **跨池网络互通** | Raven 通过 VPN 隧道（WireGuard）实现不同节点池间的 Pod 直接通信，无需公网暴露 |
| **节点池化管理** | NodePool 将边缘节点按地域或属性分组，支持批量部署和差异化配置 |
| **弱网适配** | 支持 OTA 升级，边缘节点可自主决定是否接受更新，避免弱网环境下升级失败 |
| **非侵入式** | 不修改 Kubernetes 核心组件，可平滑升级和兼容上游 K8s 版本 |
| **带宽优化** | NodePool 内 Pod 可共享 configmap/secret 元数据，减少边缘与云端的重复流量 |

---

## 版本说明

| 版本 | Kubernetes 兼容范围 | 重要变化 |
|------|-------------------|---------|
| **v1.2** | K8s 1.20 - 1.24 | 引入 Raven 替代 YurtTunnel |
| **v1.3** | K8s 1.22 - 1.25 | Yurt-Manager 整合多个控制器 |
| **v1.4** | K8s 1.24 - 1.26 | NodePool 增强，支持 Raven v2 |
| **v1.5** | K8s 1.24 - 1.27 | YurtStaticSet OTA 升级正式发布 |
| **v1.6** | K8s 1.24 - 1.28 | 当前稳定版本，增强 YurtHub 性能 |

> **平台当前使用版本**：**OpenYurt v1.6.0**，Kubernetes v1.24.17，容器运行时 Docker 24.0.9（配合 cri-dockerd）。
>
> **⚠️ 注意**：边缘节点上的 kubelet 版本必须与目标集群的 Kubernetes API Server 版本保持一致。例如集群为 K8s v1.24.17，则边缘节点的 kubelet 也必须是 v1.24.17；托管 K8s 集群若为 v1.30.12，则边缘节点 kubelet 也需为 v1.30.12。平台生成的安装命令已自动处理此逻辑，若节点加入失败可优先排查版本是否匹配。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **CDN / 边缘节点** | 将分布在全国的 CDN 节点统一纳管，通过 NodePool 按地域分组管理 |
| **弱网/离网环境** | 工厂、矿山、海上平台等网络不稳定场景，边缘自治保障业务连续 |
| **多地域应用分发** | YurtAppSet 支持同一应用在不同地域差异化配置，如使用不同镜像仓库 |
| **IoT 设备接入** | 结合 EdgeX Foundry 等框架管理边缘 IoT 设备 |
| **云边协同计算** | 边缘执行实时推理，云端做模型训练和策略下发 |

---

## 基本用法

> 以下为 yurtadm 原生命令，在平台中通过界面操作自动生成，无需手动执行。

```bash
# ---- 安装 OpenYurt 控制平面组件（helm）----
helm repo add openyurt https://openyurtio.github.io/openyurt-helm
helm repo update
helm install openyurt openyurt/openyurt -n kube-system

# ---- 边缘节点加入集群 ----
# 下载 yurtadm
wget https://github.com/openyurtio/openyurt/releases/download/v1.6.0/yurtadm-v1.6.0-linux-amd64.tar.gz
tar -zxvf yurtadm-v1.6.0-linux-amd64.tar.gz && cp yurtadm /usr/local/bin/

# 节点加入（Docker 运行时）
yurtadm join <API_SERVER_IP>:6443 \
  --token=<TOKEN> \
  --node-type=edge \
  --node-name=<NODE_NAME> \
  --discovery-token-unsafe-skip-ca-verification \
  --v=5

# 节点加入（Containerd 运行时）
yurtadm join <API_SERVER_IP>:6443 \
  --token=<TOKEN> \
  --node-type=edge \
  --node-name=<NODE_NAME> \
  --cri-socket=/run/containerd/containerd.sock \
  --discovery-token-unsafe-skip-ca-verification

# 启用节点自治模式
kubectl annotate node <NODE_NAME> node.beta.openyurt.io/autonomy=true

# 验证 YurtHub 运行状态
kubectl get pod -n kube-system | grep yurt-hub
systemctl status kubelet

# 查看节点池
kubectl get nodepool
```

---

## 在平台中的使用

平台集成了 OpenYurt 作为推荐的边缘运行时，相关文档：

- [配置集群边缘运行时](../edge-nodes/cluster-runtime-setup) — 创建集群时选择 OpenYurt（推荐）
- [添加边缘节点](../edge-nodes/add-edge-node) — 通过平台界面生成 yurtadm join 命令
- [节点上线后的容器运行情况](../edge-nodes/add-edge-node#节点上线后的容器运行情况) — OpenYurt 边缘节点运行的组件列表

---

## 参考资料

- [OpenYurt 官方文档](https://openyurt.io/docs)
- [OpenYurt GitHub 仓库](https://github.com/openyurtio/openyurt)
- [YurtHub 组件文档](https://openyurt.io/docs/core-concepts/yurthub/)
- [Raven 网络组件](https://openyurt.io/docs/core-concepts/raven/)
- [NodePool 使用指南](https://openyurt.io/docs/user-manuals/workload/node-pool-management)
