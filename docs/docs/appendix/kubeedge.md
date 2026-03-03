---
sidebar_position: 5
title: "KubeEdge 参考"
description: "KubeEdge 核心概念、架构原理与版本说明"
---

# KubeEdge 参考

> **官方文档**：[https://kubeedge.io/docs](https://kubeedge.io/docs)
> **项目仓库**：[https://github.com/kubeedge/kubeedge](https://github.com/kubeedge/kubeedge)
> **CNCF 状态**：已毕业项目（Graduated）

## 什么是 KubeEdge

KubeEdge 是 CNCF 孵化并已毕业的开源边缘计算框架，将 Kubernetes 的容器编排和设备管理能力延伸到边缘节点。它在云端保留标准 Kubernetes 控制平面，在边缘侧运行轻量化代理，通过可靠的消息通道实现云边协同，支持边缘节点在弱网或断网环境下的离线自治。

---

## 核心架构

```
┌─────────────────────────────────────┐
│              云端（CloudCore）        │
│  ┌──────────┐  ┌─────────────────┐  │
│  │ CloudHub │  │ EdgeController  │  │
│  │ (WS/QUIC)│  │ DeviceController│  │
│  └──────────┘  └─────────────────┘  │
│         Kubernetes API Server        │
└──────────────┬──────────────────────┘
               │ WebSocket / QUIC
┌──────────────▼──────────────────────┐
│             边缘侧（EdgeCore）        │
│  ┌─────────┐ ┌──────────────────┐   │
│  │ EdgeHub │ │ Edged (kubelet)  │   │
│  └─────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────────────┐  │
│  │EventBus  │ │  DeviceTwin      │  │
│  │(MQTT)    │ │  MetaManager     │  │
│  └──────────┘ └──────────────────┘  │
└─────────────────────────────────────┘
```

---

## 主要组件

### 云端组件（CloudCore）

| 组件 | 说明 |
|------|------|
| **CloudHub** | 云边通信网关，支持 WebSocket 和 QUIC 协议，负责接收边缘节点的连接请求并转发消息 |
| **EdgeController** | 扩展的 Kubernetes 控制器，管理边缘节点的 Pod 元数据，确保资源状态同步到指定边缘节点 |
| **DeviceController** | 设备控制器，负责在云端和边缘端之间同步设备元数据和状态（与 DeviceTwin 配合工作） |

### 边缘组件（EdgeCore）

| 组件 | 说明 |
|------|------|
| **EdgeHub** | 云边通信客户端，维持边缘节点与云端 CloudHub 的 WebSocket 长连接，负责消息的收发和断线重连 |
| **Edged** | 轻量化的 kubelet 实现，负责在边缘节点上管理容器（Pod）的生命周期，支持 Docker/Containerd/CRI-O |
| **EventBus** | MQTT 客户端，作为边缘端的消息总线，连接 MQTT Broker（默认 Eclipse Mosquitto），实现设备消息的发布/订阅 |
| **DeviceTwin** | 设备数字孪生，在边缘端维护设备的期望状态（desired）和实际状态（reported），支持设备属性的云边同步 |
| **MetaManager** | 元数据管理器，在边缘端持久化缓存 Kubernetes 资源（Pod、ConfigMap、Secret 等），保障断网时 Edged 可正常工作 |
| **ServiceBus** | HTTP 客户端，为云端应用提供访问边缘侧 HTTP 服务的通道 |

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **边缘离线自治** | 边缘节点断网后，MetaManager 缓存的元数据保障 Pod 继续运行，不会因失联触发驱逐 |
| **设备管理** | 通过 DeviceTwin 和 EventBus 实现 IoT 设备接入，支持 MQTT、Modbus、OPC-UA 等协议 |
| **轻量化边缘代理** | EdgeCore 对硬件要求极低，可运行在树莓派等资源受限设备上 |
| **双向消息通道** | 基于 WebSocket/QUIC 的可靠消息通道，支持云→边指令下发和边→云状态上报 |
| **Kubernetes 原生** | 使用标准 kubectl 管理边缘节点和 Pod，兼容原生 K8s 工作流 |
| **容器运行时支持** | 支持 Docker（配合 cri-dockerd）、Containerd、CRI-O |

---

## 版本说明

| 版本 | Kubernetes 兼容范围 | 重要变化 |
|------|-------------------|---------|
| **v1.13** | K8s 1.23 - 1.26 | 引入 QUIC 协议支持 |
| **v1.15** | K8s 1.24 - 1.27 | EdgeMesh 独立为子项目 |
| **v1.17** | K8s 1.26 - 1.29 | 增强设备管理 API v1beta2 |
| **v1.18** | K8s 1.26 - 1.29 | 改进 HA CloudCore 部署 |
| **v1.19** | K8s 1.27 - 1.30 | 支持 containerd v2 |
| **v1.20** | K8s 1.28 - 1.31 | 当前稳定版本，增强边缘自治能力 |

> **平台当前使用版本**：**KubeEdge v1.20.0**，Kubernetes v1.24.17，容器运行时 Docker 24.0.9（配合 cri-dockerd）。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **IoT 设备管理** | 通过 DeviceTwin 和 MQTT 统一管理大量 IoT 设备，适合工厂、园区传感器接入 |
| **边缘 AI 推理** | 将训练好的模型下发到边缘节点执行推理，降低延迟和带宽消耗 |
| **工业边缘计算** | 在工厂边缘服务器上运行容器化应用，实现实时数据处理 |
| **弱网/离网环境** | 边缘节点与云端网络不稳定时仍能维持运行 |
| **资源受限设备** | EdgeCore 可运行在 512MB 内存、ARM 处理器的设备上 |

---

## 基本用法

> 以下为 keadm 原生安装命令，在平台中通过界面操作自动生成，无需手动执行。

```bash
# ---- 云端安装 CloudCore ----
# 下载 keadm
wget https://github.com/kubeedge/kubeedge/releases/download/v1.20.0/keadm-v1.20.0-linux-amd64.tar.gz
tar -zxvf keadm-v1.20.0-linux-amd64.tar.gz && cp keadm-v1.20.0-linux-amd64/keadm /usr/local/bin/

# 初始化云端（在 K8s 控制平面节点执行）
keadm init \
  --advertise-address="<CLOUD_IP>" \
  --kubeedge-version=v1.20.0 \
  --kube-config=/root/.kube/config

# 获取边缘节点加入 Token
keadm gettoken

# ---- 边缘端安装 EdgeCore ----
# 在边缘节点执行（需能访问云端 10000 端口）
keadm join \
  --cloudcore-ipport="<CLOUD_IP>:10000" \
  --token=<TOKEN> \
  --kubeedge-version=v1.20.0 \
  --edgenode-name=<NODE_NAME>

# 验证边缘节点状态
kubectl get nodes        # 云端查看节点
systemctl status edgecore  # 边缘端查看服务

# 查看 KubeEdge 组件
kubectl get all -n kubeedge
```

---

## 在平台中的使用

平台集成了 KubeEdge 作为边缘运行时之一，相关文档：

- [配置集群边缘运行时](../edge-nodes/cluster-runtime-setup) — 创建集群时选择 KubeEdge
- [添加边缘节点](../edge-nodes/add-edge-node) — 通过平台界面生成 keadm join 命令
- [节点上线后的容器运行情况](../edge-nodes/add-edge-node#节点上线后的容器运行情况) — KubeEdge 边缘节点运行的组件

---

## 参考资料

- [KubeEdge 官方文档](https://kubeedge.io/docs)
- [KubeEdge GitHub 仓库](https://github.com/kubeedge/kubeedge)
- [keadm 安装指南](https://kubeedge.io/docs/setup/install-with-keadm)
- [KubeEdge 架构设计](https://kubeedge.io/docs/category/architecture)
