# 系统架构设计说明书

本文档详细描述边缘计算管理平台的系统架构设计，包括整体架构、核心组件、数据流和技术选型。

## 1. 系统概述

### 1.1 系统定位

边缘计算管理平台是一个面向企业的云边协同管理系统，提供：

- **边缘集群管理**：统一管理分布式边缘计算节点
- **应用生命周期管理**：支持容器化应用的部署、更新、监控
- **多租户隔离**：支持多组织、多项目的资源隔离
- **OTA 远程管理**：边缘设备的远程配置、升级和运维

### 1.2 设计目标

| 目标 | 指标 |
|------|------|
| 高可用性 | 99.9% SLA |
| 可扩展性 | 支持 10,000+ 边缘节点 |
| 低延迟 | 管控指令下发 < 500ms |
| 断网自治 | 边缘节点离线后应用持续运行 |

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户层                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Web 控制台  │  │   CLI 工具   │  │   第三方集成  │                  │
│  │ (Edge Console)│  │   (kubectl)  │  │   (API/SDK)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │ HTTPS / WebSocket
┌──────────────────────────────────────┼──────────────────────────────────┐
│                              网关层   │                                  │
│  ┌───────────────────────────────────┴───────────────────────────────┐ │
│  │                     API Gateway (Ingress)                         │ │
│  │           负载均衡 / TLS 终止 / 认证 / 限流                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────┐
│                             服务层    │                                  │
│  ┌─────────────────┐  ┌─────────────┴───────────┐  ┌─────────────────┐ │
│  │  Edge APIServer │  │     OTA Server          │  │ Monitoring Svc  │ │
│  │                 │  │                         │  │                 │ │
│  │  - IAM 管理     │  │  - 设备管理             │  │  - 指标采集     │ │
│  │  - 集群管理     │  │  - 任务调度             │  │  - 告警管理     │ │
│  │  - 工作空间     │  │  - Playbook 执行        │  │  - 日志聚合     │ │
│  │  - 节点组       │  │  - 实时推送             │  │                 │ │
│  │  - RBAC        │  │                         │  │                 │ │
│  └────────┬────────┘  └────────────┬────────────┘  └────────┬────────┘ │
│           │                        │                        │          │
│           │ K8s API                │ NATS                   │ Metrics  │
│           ▼                        ▼                        ▼          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         数据层                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │  ETCD    │  │   NATS   │  │ Prometheus│  │PostgreSQL│        │   │
│  │  │(K8s存储) │  │(消息队列)│  │ (时序DB) │  │ (业务DB) │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ MQTT over TLS
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              边缘层                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Edge Node 1   │  │   Edge Node 2   │  │   Edge Node N   │          │
│  │                 │  │                 │  │                 │          │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │          │
│  │  │ OTA Agent │  │  │  │ OTA Agent │  │  │  │ OTA Agent │  │          │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │          │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │          │
│  │  │  K3s/     │  │  │  │  K3s/     │  │  │  │  K3s/     │  │          │
│  │  │ KubeEdge  │  │  │  │ KubeEdge  │  │  │  │ KubeEdge  │  │          │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │          │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │          │
│  │  │ Workloads │  │  │  │ Workloads │  │  │  │ Workloads │  │          │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 3. 核心组件设计

### 3.1 Edge APIServer

基于 Kubernetes APIServer 构建的统一 API 服务。

**技术栈：**
- Go 1.21+
- k8s.io/apiserver
- sigs.k8s.io/controller-runtime

**核心功能：**

```
Edge APIServer
├── Authentication（认证）
│   ├── OAuth2 / OpenID Connect
│   ├── JWT Token
│   ├── K8s ServiceAccount
│   └── X-Remote-User Header
│
├── Authorization（授权）
│   └── UniversalAuthorizer
│       ├── Global Scope
│       ├── Cluster Scope
│       ├── Workspace Scope
│       ├── NodeGroup Scope
│       └── Namespace Scope
│
├── CRD Controllers
│   ├── IAMRole Controller
│   ├── RoleTemplate Controller
│   ├── NodeGroup Controller
│   └── Workspace Controller
│
└── API Extensions
    ├── /oapis/iam/v1alpha1/*
    ├── /oapis/cluster/v1alpha1/*
    └── /oapis/workspace/v1alpha1/*
```

**多级权限模型：**

```
Platform (平台级)
└── Cluster (集群级) - 基础设施层
    ├── Workspace (工作空间级)
    │   └── Project (项目级) - 对应 namespace
    └── NodeGroup (节点组级) - 边缘计算资源分组
        └── Node (节点级) - 具体计算节点
```

### 3.2 Edge Console

现代化的 Web 管理控制台。

**技术栈：**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- ShadcnUI

**模块划分：**

```
Edge Console
├── 仪表盘 (Dashboard)
│   ├── 集群概览
│   ├── 资源使用
│   └── 告警摘要
│
├── 集群管理 (Clusters)
│   ├── 集群列表
│   ├── 节点组管理
│   └── 项目管理
│
├── 应用管理 (Applications)
│   ├── 应用部署
│   ├── Helm 应用
│   └── 应用商店
│
├── IAM (身份与访问)
│   ├── 用户管理
│   ├── 角色管理
│   └── 权限配置
│
├── 可观测性 (Observability)
│   ├── 监控仪表盘
│   ├── 日志查询
│   └── 告警管理
│
└── 租户管理 (Tenant)
    ├── 租户配置
    ├── 资源配额
    └── 安全隔离
```

### 3.3 OTA Server

边缘设备远程管理服务。

**技术栈：**
- Go 1.21+
- NATS JetStream
- MQTT over NATS
- Kubernetes CRD

**核心 CRD：**

```yaml
# OTANode - 边缘节点
apiVersion: ota.theriseunion.io/v1alpha1
kind: OTANode
metadata:
  name: edge-node-001
spec:
  nodeId: "edge-node-001"
  labels:
    region: east
    type: gpu
status:
  phase: Ready
  lastHeartbeat: "2024-01-15T10:30:00Z"

# OTATask - 远程任务
apiVersion: ota.theriseunion.io/v1alpha1
kind: OTATask
metadata:
  name: upgrade-task-001
spec:
  targetNodes:
    - edge-node-001
    - edge-node-002
  taskType: Playbook
  playbook:
    name: system-upgrade
    version: v1.0.0
status:
  phase: Running
  progress: 50%
```

**通信协议：**

```
Topic 格式: edge/<scope>/<node_id>/<action>

示例:
- edge/node/+/heartbeat     # 心跳上报
- edge/node/+/status        # 状态上报
- edge/cmd/node-001/execute # 命令下发
- edge/task/node-001/result # 任务结果
```

### 3.4 Monitoring Service

监控与可观测性服务。

**技术栈：**
- Prometheus (指标)
- Loki (日志)
- Grafana (可视化)
- AlertManager (告警)

**监控指标：**

```
# 边缘节点指标
edge_node_cpu_usage_percent
edge_node_memory_usage_bytes
edge_node_disk_usage_percent
edge_node_network_rx_bytes
edge_node_network_tx_bytes

# OTA 任务指标
ota_task_total
ota_task_success_total
ota_task_failed_total
ota_task_duration_seconds

# 应用指标
edge_app_replicas
edge_app_restart_total
edge_app_response_latency_ms
```

## 4. 数据流设计

### 4.1 应用部署流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  用户    │───►│ Console  │───►│APIServer │───►│ K8s API  │
│ (部署)   │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
     ┌────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Controller│───►│ OTA Svc  │───►│Edge Node │
│ (调度)   │    │ (下发)   │    │ (执行)   │
└──────────┘    └──────────┘    └──────────┘
```

### 4.2 监控数据流

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Edge Node │───►│Prometheus│───►│  Grafana │───►│  用户    │
│(采集)    │    │(存储)    │    │(展示)    │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │
      │ 告警规则触发
      ▼
┌──────────┐    ┌──────────┐
│AlertMgr  │───►│  通知    │
│          │    │(钉钉/邮件)│
└──────────┘    └──────────┘
```

## 5. 关键技术决策

### 5.1 为什么选择 NATS

| 对比项 | NATS | Kafka | RabbitMQ |
|--------|------|-------|----------|
| 延迟 | < 1ms | 10-100ms | 5-50ms |
| 边缘部署 | 轻量 | 重量级 | 中等 |
| MQTT 支持 | 原生 | 不支持 | 插件 |
| 运维复杂度 | 低 | 高 | 中 |

### 5.2 为什么基于 K8s APIServer

- **生态兼容**：kubectl、Helm、GitOps 等工具开箱即用
- **RBAC 成熟**：复用 K8s 权限模型
- **扩展性强**：CRD + Controller 模式
- **稳定性高**：经过大规模生产验证

### 5.3 边缘框架兼容

同时支持 OpenYurt 和 KubeEdge：

```
┌─────────────────────────────────────────────────┐
│              Edge Platform                       │
│  ┌───────────────────────────────────────────┐  │
│  │          Abstraction Layer                │  │
│  │   (统一 API，屏蔽底层框架差异)             │  │
│  └───────────────────────────────────────────┘  │
│           │                    │                │
│           ▼                    ▼                │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │    OpenYurt     │  │    KubeEdge     │      │
│  │    Adapter      │  │    Adapter      │      │
│  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────┘
```

## 6. 安全设计

### 6.1 认证机制

```
┌─────────────────────────────────────────────────┐
│                 认证链                           │
│                                                 │
│  Request ──► OAuth2 ──► JWT ──► ServiceAccount │
│                          │                      │
│                          ▼                      │
│              X-Remote-User (开发)               │
└─────────────────────────────────────────────────┘
```

### 6.2 通信加密

- **管控平面**：HTTPS + mTLS
- **边缘通信**：MQTT over TLS (8883)
- **内部服务**：Service Mesh (Istio)

### 6.3 数据安全

- 敏感数据加密存储（K8s Secrets）
- 边缘节点证书自动轮换
- 审计日志记录所有操作

## 7. 高可用设计

### 7.1 管控平面

- APIServer: 多副本 + 负载均衡
- ETCD: 3 节点集群
- NATS: JetStream 集群模式

### 7.2 边缘自治

断网场景下：
- 本地 K3s 持续运行工作负载
- OTA Agent 缓存最近任务
- 恢复连接后自动同步状态

---

*版本：1.0*
*最后更新：2026年2月*
