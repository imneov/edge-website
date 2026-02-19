---
sidebar_position: 3
title: 术语表
---

# 术语表

本文档列出边缘智能管理平台涉及的关键技术术语及其定义，按字母顺序排列。

---

## 平台核心术语

### Application（应用）

平台中可部署的软件单元。每个 Application 通过 `provisioner` 标签标识其部署方式：`workload`（原生工作负载）、`helm`（Helm Chart）或 `model`（AI 模型）。

### ApplicationDeployment（应用部署）

Application 在指定命名空间和拓扑位置的运行实例。一个 Application 可以有多个 ApplicationDeployment，分别部署到不同的节点组或集群中。简称 `appd`。

### ApplicationVersion（应用版本）

Application 的具体版本定义，包含工作负载配置、Helm Chart 配置或模型配置的详细参数。版本需要经过审核（`Pending` → `Approved` / `Rejected`）后才能用于部署。

### Cluster（集群）

一个注册到平台的 Kubernetes 集群。集群可以是管理集群（Host Cluster）或被管理的边缘集群。每个集群通过 `connection` 配置与平台控制平面通信。

### edge-apiserver

平台的 API 网关组件。基于 go-restful 构建，提供 OAuth2 认证、RBAC 授权、多租户管理和 CRD 资源操作等功能。所有前端和外部请求均通过此组件访问平台资源。

### edge-console

平台的 Web 管理控制台。基于 Next.js 14、React 18 和 TailwindCSS 构建，提供图形化界面管理集群、应用、用户和资源。

### edge-controller

平台的编排引擎组件。负责集群生命周期管理、工作负载分发、CRD 资源协调和状态同步。通过 Kubernetes Controller 模式运行多个控制器。

### IAMRole（权限角色）

定义一组访问权限的资源。包含 Kubernetes 标准 RBAC 策略规则和 UI 权限标识，可通过聚合 RoleTemplate 组合权限。

### IAMRoleBinding（角色绑定）

将用户、组或服务账户与 IAMRole 关联的资源。通过作用域标签（`scope`、`scope-value`）控制权限的生效范围。

### NodeGroup（节点组）

按标签选择器对 Kubernetes 节点进行逻辑分组的资源。用于工作负载的拓扑调度，可指定应用部署到特定的节点组中。

### ResourcePool（资源池）

管理集群中 GPU/NPU 等加速设备的资源分配和调度。与 HAMi 调度器集成，提供设备级的资源管理。

### RoleTemplate（角色模板）

可复用的权限模板资源。多个 RoleTemplate 可以聚合到一个 IAMRole 中，实现权限的模块化管理。

### User（用户）

平台的用户账户资源。存储认证信息（加密密码）和账户状态（Active / Pending / Disabled）。

### Workspace（工作空间）

多租户隔离单元。每个 Workspace 拥有独立的命名空间、成员列表和资源配额，实现租户间的资源和权限隔离。

---

## Kubernetes 相关术语

### CRD（Custom Resource Definition / 自定义资源定义）

Kubernetes 提供的资源扩展机制。平台通过 CRD 定义 Cluster、Workspace、Application 等自定义资源类型，使用 Kubernetes etcd 存储所有状态数据。

### ConfigMap（配置映射）

Kubernetes 中用于存储非机密配置数据的资源对象。平台使用 ConfigMap 管理 edge-apiserver 的运行时配置。

### Controller（控制器）

Kubernetes 中通过监听资源变化并执行协调逻辑的组件。平台的 edge-controller 包含多个控制器，负责 CRD 资源的状态同步和生命周期管理。

### Deployment（部署）

Kubernetes 中声明式管理 Pod 副本集的资源对象。平台核心组件均以 Deployment 方式部署，支持滚动更新和自动恢复。

### etcd

Kubernetes 集群的分布式键值存储，用于保存所有集群数据。平台的 CRD 资源数据最终存储在 etcd 中。

### Finalizer（终结器）

Kubernetes 资源上的标记，在资源被删除前执行清理操作。平台在 Workspace 和 Registry 等资源上使用 Finalizer 确保关联资源被正确清理。

### Helm Chart

Kubernetes 应用的打包格式。平台使用 Helm Chart 管理自身组件的部署，也支持用户通过 Helm Chart 部署应用。

### Ingress（入口）

Kubernetes 中管理外部 HTTP/HTTPS 访问的资源对象。平台通过 Ingress 暴露 API Server 和 Console 的访问端点。

### Namespace（命名空间）

Kubernetes 中的逻辑隔离单元。平台使用 `edge-system` 命名空间部署核心组件，Workspace 下的项目对应不同的 Namespace。

### Pod

Kubernetes 中最小的可部署计算单元，包含一个或多个容器。平台组件和用户应用均以 Pod 形式运行。

### RBAC（Role-Based Access Control / 基于角色的访问控制）

Kubernetes 原生的授权机制。平台在此基础上构建了多层级权限模型，支持平台级、集群级、工作空间级和命名空间级的权限控制。

### Secret（密钥）

Kubernetes 中用于存储敏感数据（密码、令牌、TLS 证书等）的资源对象。

### Service（服务）

Kubernetes 中抽象 Pod 访问方式的资源对象，提供稳定的网络端点。平台组件通过 Service 实现内部通信。

### StatefulSet（有状态集）

Kubernetes 中管理有状态应用的资源对象。平台的监控组件（Prometheus）通常以 StatefulSet 方式部署。

---

## 边缘计算术语

### CRI（Container Runtime Interface / 容器运行时接口）

Kubernetes 与容器运行时之间的标准接口。平台支持 containerd、Docker 和 CRI-O 三种容器运行时。

### Edge Autonomy（边缘自治）

边缘节点在与云端控制平面断开连接时，仍能维持已部署工作负载正常运行的能力。通过 OpenYurt YurtHub 等组件实现。

### KubeEdge

华为开源的边缘计算框架，将 Kubernetes 的能力延伸到边缘。平台支持 KubeEdge 作为边缘运行时之一。

### OpenYurt

阿里云开源的边缘计算框架，基于 Kubernetes 原生能力构建。平台支持 OpenYurt 作为边缘运行时，通过 YurtHub 组件实现边缘自治。

### OTA（Over-The-Air / 空中下载）

通过网络远程更新设备软件或固件的技术。平台提供 OTA 升级管理功能，支持对边缘节点进行远程批量升级。

### vCluster（虚拟集群）

在物理 Kubernetes 集群内创建轻量级虚拟集群的技术。支持 k3s、k0s 和 k8s 三种发行版。平台通过 vCluster 实现更灵活的多租户隔离。

---

## 监控与可观测性术语

### Alertmanager

Prometheus 生态中的告警管理组件，处理告警的去重、分组、路由和通知发送。

### Grafana

开源的可视化和分析平台，用于创建监控仪表盘。平台集成 Grafana 提供集群和应用的可视化监控。

### Prometheus

开源的系统监控和告警工具。平台使用 Prometheus 采集集群指标、容器指标和自定义应用指标。

---

## 网络与安全术语

### cert-manager

Kubernetes 原生的证书管理控制器，自动签发和续期 TLS 证书。平台推荐使用 cert-manager 管理 HTTPS 证书。

### OAuth2

开放授权协议标准。平台使用 OAuth2 密码模式（Password Grant）实现用户认证，通过 `/oauth/token` 端点签发访问令牌。

### TLS（Transport Layer Security / 传输层安全）

加密通信协议，保护数据在网络传输中的机密性和完整性。平台要求所有组件间通信使用 TLS 加密。

---

## 应用部署术语

### Blue-Green Deployment（蓝绿部署）

一种零停机部署策略。同时维护两套完整的生产环境（蓝和绿），通过切换流量实现版本更新。平台支持蓝绿部署模式。

### Canary Release（金丝雀发布）

一种渐进式部署策略，先将新版本部署到小部分节点或用户，验证无误后再全量发布。

### Rolling Update（滚动更新）

Kubernetes 原生的更新策略，逐步替换旧版本 Pod 为新版本，确保更新过程中服务始终可用。平台默认使用此策略。

---

## 算力管理术语

### GPU（Graphics Processing Unit / 图形处理单元）

通用并行计算加速设备。平台通过资源池管理 GPU 的分配和调度。

### vGPU（Virtual GPU / 虚拟 GPU）

GPU 虚拟化技术，将一块物理 GPU 虚拟化为多块虚拟 GPU，实现更细粒度的资源分配。

### HAMi

异构加速设备管理调度器。平台默认使用 HAMi 作为 GPU/NPU 设备的调度后端。

### NPU（Neural Processing Unit / 神经网络处理单元）

专用于神经网络推理计算的加速设备。平台支持通过设备模型和资源池管理 NPU 资源。

### TFLOPS（Tera Floating-point Operations Per Second）

每秒万亿次浮点运算，衡量计算设备算力的单位。平台使用 TFLOPS、GFLOPS、MFLOPS 作为算力度量单位。

---

## IoT 相关术语

### DeviceModel（设备模型）

定义 IoT 设备的属性和能力的 CRD 资源。包含设备的通信协议、数据格式和控制接口描述。

### MQTT（Message Queuing Telemetry Transport）

轻量级消息传输协议，广泛用于 IoT 设备与云端的数据通信。平台支持 MQTT 协议接入 IoT 设备。

### Modbus

工业自动化领域的通信协议标准。平台支持 Modbus 协议接入工业设备。

### OPC UA（Open Platform Communications Unified Architecture）

工业通信协议标准，用于工业设备间的数据交换。平台支持 OPC UA 协议。

---

## 标签与注解速查

### 通用标签（Labels）

| 标签键 | 说明 | 示例值 |
|--------|------|--------|
| `theriseunion.io/cluster` | 集群标识 | `edge-cluster-01` |
| `theriseunion.io/nodegroup` | 节点组标识 | `gpu-nodes` |
| `theriseunion.io/workspace` | 工作空间标识 | `dev-workspace` |
| `theriseunion.io/username` | 用户名标识 | `admin` |
| `theriseunion.io/managed` | 平台托管标记 | `true` |
| `theriseunion.io/protected-resource` | 受保护资源标记 | `true` |
| `node.theriseunion.io/type` | 节点类型 | `edge` |
| `app.theriseunion.io/provisioner` | 应用部署方式 | `workload` / `helm` / `model` |
| `app.theriseunion.io/category` | 应用分类 | 自定义值 |
| `iam.theriseunion.io/scope` | 权限作用域 | `platform` / `cluster` |
| `iam.theriseunion.io/scope-value` | 作用域标识值 | 集群名等 |

### 通用注解（Annotations）

| 注解键 | 说明 | 示例值 |
|--------|------|--------|
| `theriseunion.io/display-name` | 资源显示名称 | `生产环境集群` |
| `theriseunion.io/description` | 资源描述 | `用于生产环境的边缘集群` |
| `theriseunion.io/creator` | 资源创建者 | `admin` |
| `cluster.theriseunion.io/edge-runtime` | 边缘运行时类型 | `openyurt` / `kubeedge` |
| `cluster.theriseunion.io/cri-socket` | CRI 运行时类型 | `containerd` / `docker` / `crio` |
| `cluster.theriseunion.io/vcluster-enabled` | vCluster 启用状态 | `true` / `false` |
| `cluster.theriseunion.io/vcluster-distro` | vCluster 发行版 | `k3s` / `k0s` / `k8s` |

---

## 系统常量速查

| 常量 | 值 | 说明 |
|------|-----|------|
| 系统命名空间 | `edge-system` | 平台核心组件部署的命名空间 |
| 系统工作空间 | `system-workspace` | 系统级工作空间名称 |
| 配置 API Group | `config.theriseunion.io` | 系统配置资源的 API Group |
| 默认 vCluster 发行版 | `k3s` | vCluster 的默认 Kubernetes 发行版 |
| 默认设备调度器 | `hami` | 资源池的默认设备调度器名称 |
