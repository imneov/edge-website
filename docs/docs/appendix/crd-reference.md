---
sidebar_position: 1
title: CRD 参考
---

# CRD 参考

本文档列出边缘智能管理平台定义的所有自定义资源（Custom Resource Definition），包括 API Group、资源类型、关键字段和使用说明。

## CRD 总览

平台使用以下 API Group 组织资源：

| API Group | 版本 | 说明 | 包含资源 |
|-----------|------|------|---------|
| `scope.theriseunion.io` | v1alpha1 | 基础设施资源 | Cluster, Workspace, NodeGroup |
| `app.theriseunion.io` | v1alpha1 | 应用管理资源 | Application, ApplicationVersion, ApplicationDeployment |
| `iam.theriseunion.io` | v1alpha1 | 身份与权限资源 | User, IAMRole, IAMRoleBinding, RoleTemplate, LoginRecord |
| `registry.theriseunion.io` | v1alpha1 | 镜像仓库资源 | Registry, ClusterRegistry, Repository, ClusterRepository |
| `device.theriseunion.io` | v1alpha1 | 设备与算力资源 | DeviceModel, ComputeTemplate, ResourcePool, ResourcePoolItem, GlobalConfig, NodeConfig |

---

## scope.theriseunion.io/v1alpha1

### Cluster

集群资源，代表一个 Kubernetes 集群的注册和管理状态。

| 属性 | 值 |
|------|-----|
| **Kind** | Cluster |
| **作用域** | Cluster-scoped |
| **类别** | scope |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `joinFederation` | bool | 否 | 是否加入集群联邦 |
| `enable` | bool | 否 | 集群启用/禁用状态 |
| `provider` | string | 否 | 集群提供商描述 |
| `connection.type` | string | 是 | 连接类型：`direct`（直连）或 `proxy`（代理） |
| `connection.kubernetesAPIEndpoint` | string | 是 | Kubernetes API 端点地址 |
| `connection.kubeConfig` | []byte | 否 | 连接用的 kubeconfig 内容 |
| `connection.token` | string | 否 | 代理连接令牌 |
| `config` | []byte | 否 | 自定义 Helm values 配置 |
| `externalKubeAPIEnabled` | bool | 否 | 是否通过 LoadBalancer 暴露 kube-apiserver |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `conditions` | []Condition | 集群状态条件列表 |
| `kubernetesVersion` | string | Kubernetes 版本号 |
| `nodeCount` | int | 节点总数 |
| `zones` | []string | 可用区列表 |
| `region` | string | 地域 |
| `uid` | string | 集群唯一标识（kube-system 命名空间 UID） |

**条件类型（Condition Types）**

| 条件 | 说明 |
|------|------|
| `Initialized` | 集群 Agent 已初始化 |
| `AgentAvailable` | 集群 Agent 可用 |
| `Ready` | 集群整体就绪 |
| `Schedulable` | 集群可调度工作负载 |
| `CoreReady` | 核心系统组件就绪 |
| `VirtualClusterReady` | 虚拟集群就绪 |
| `OpenyurtReady` | OpenYurt 边缘运行时就绪 |
| `KubeedgeReady` | KubeEdge 边缘运行时就绪 |

**常用标签**

| 标签 | 说明 | 示例 |
|------|------|------|
| `cluster-role.theriseunion.io/host` | 标记宿主集群 | `""` |
| `cluster.theriseunion.io/region` | 地域标识 | `beijing` |
| `cluster.theriseunion.io/group` | 集群分组 | `production` |
| `cluster.theriseunion.io/visibility` | 可见性 | `public` / `private` |

**边缘运行时注解**

| 注解 | 说明 | 值 |
|------|------|-----|
| `cluster.theriseunion.io/edge-runtime` | 边缘运行时类型 | `openyurt` / `kubeedge` |
| `cluster.theriseunion.io/cri-socket` | CRI 容器运行时 | `containerd` / `docker` / `crio` |
| `cluster.theriseunion.io/vcluster-enabled` | 是否启用 vCluster | `true` / `false` |
| `cluster.theriseunion.io/vcluster-distro` | vCluster 发行版 | `k3s` / `k0s` / `k8s` |

---

### Workspace

工作空间资源，用于多租户隔离和资源配额管理。

| 属性 | 值 |
|------|-----|
| **Kind** | Workspace |
| **作用域** | Cluster-scoped |
| **类别** | scope |
| **Finalizer** | `finalizer.workspace.theriseunion.io` |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `manager` | string | 否 | 工作空间管理员用户名 |
| `template.namespaces` | []string | 否 | 初始化时自动创建的命名空间列表 |
| `template.resourceQuotas` | object | 否 | 默认资源配额模板 |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `phase` | string | 生命周期阶段 |
| `conditions` | []Condition | 状态条件列表 |
| `namespaceCount` | int | 关联命名空间数量 |
| `memberCount` | int | 成员数量 |

---

### NodeGroup

节点组资源，按标签选择器对节点进行逻辑分组。

| 属性 | 值 |
|------|-----|
| **Kind** | NodeGroup |
| **作用域** | Cluster-scoped |
| **类别** | scope |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `selector.matchLabels` | map[string]string | 否 | 基于标签匹配的节点选择器 |
| `selector.matchExpressions` | []LabelSelectorRequirement | 否 | 基于表达式的节点选择器 |
| `template.labels` | map[string]string | 否 | 自动应用到组内节点的标签 |
| `template.annotations` | map[string]string | 否 | 自动应用到组内节点的注解 |
| `template.taints` | []Taint | 否 | 自动应用到组内节点的污点 |

**常用注解**

| 注解 | 说明 |
|------|------|
| `theriseunion.io/node-count` | 节点组内总节点数 |
| `theriseunion.io/ready-node-count` | 节点组内就绪节点数 |

---

## app.theriseunion.io/v1alpha1

### Application

应用资源，代表一个可部署的应用定义。应用的元数据信息通过标签和注解管理。

| 属性 | 值 |
|------|-----|
| **Kind** | Application |
| **作用域** | Cluster-scoped |
| **类别** | app |

**必要标签**

| 标签 | 说明 | 值 |
|------|------|-----|
| `app.theriseunion.io/provisioner` | 部署方式（不可变） | `workload` / `helm` / `model` |
| `app.theriseunion.io/category` | 应用分类 | 自定义分类名称 |
| `theriseunion.io/workspace` | 所属工作空间 | 工作空间名称 |

**常用注解**

| 注解 | 说明 |
|------|------|
| `theriseunion.io/display-name` | 应用显示名称 |
| `theriseunion.io/description` | 应用描述 |
| `theriseunion.io/creator` | 创建者用户名 |

---

### ApplicationVersion

应用版本资源，包含具体的部署配置（工作负载、Helm Chart 或 AI 模型配置）。

| 属性 | 值 |
|------|-----|
| **Kind** | ApplicationVersion |
| **作用域** | Cluster-scoped |
| **类别** | app |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `applicationRef` | string | 是 | 关联的 Application 资源名称 |
| `version` | string | 是 | 语义化版本号，如 `1.0.0` |
| `workloadConfig` | WorkloadConfig | 条件 | Kubernetes 原生工作负载配置（provisioner=workload 时使用） |
| `helmConfig` | HelmConfig | 条件 | Helm Chart 配置（provisioner=helm 时使用） |
| `modelConfig` | ModelConfig | 条件 | AI 模型配置（provisioner=model 时使用） |

**HelmConfig 结构**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chartName` | string | 是 | Chart 名称 |
| `chartVersion` | string | 是 | Chart 版本 |
| `repository` | string | 是 | Helm 仓库 URL |
| `values` | string | 否 | YAML 格式的 values 覆盖值 |

**ModelConfig 结构**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelName` | string | 是 | 模型名称 |
| `modelVersion` | string | 是 | 模型版本 |
| `framework` | string | 否 | 推理框架：`PyTorch` / `TensorFlow` / `ONNX` |
| `runtime` | string | 否 | 推理运行时：`TorchServe` / `TensorFlow Serving` / `Triton` |
| `storageURI` | string | 是 | 模型存储 URI（S3 或其他对象存储） |
| `gpu` | int | 否 | GPU 卡数需求 |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `phase` | string | 生命周期阶段 |
| `reviewPhase` | string | 审核状态：`Pending` / `Approved` / `Rejected` |
| `reviewMessage` | string | 审核意见或拒绝原因 |
| `reviewTime` | Time | 审核时间 |
| `reviewer` | string | 审核人 |

---

### ApplicationDeployment

应用部署实例资源，代表一个应用版本在指定位置的部署。

| 属性 | 值 |
|------|-----|
| **Kind** | ApplicationDeployment |
| **作用域** | Namespaced |
| **简称** | appd |
| **类别** | app |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `application` | string | 是 | Application 资源名称 |
| `version` | string | 否 | 版本号或 `latest` |
| `applicationVersion` | string | 否 | ApplicationVersion 资源名称 |
| `topologies` | []DeploymentTopology | 否 | 部署拓扑配置 |
| `topologies[].nodeGroup` | string | 否 | 目标节点组 |
| `topologies[].nodeName` | string | 否 | 目标节点名称 |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `phase` | string | 部署阶段（见下表） |
| `workloadCount` | int | 工作负载总数 |
| `readyWorkloadCount` | int | 就绪工作负载数 |
| `totalReplicas` | int | Pod 副本总数 |
| `readyReplicas` | int | 就绪 Pod 副本数 |
| `readyStatus` | string | 就绪状态格式：`readyReplicas/totalReplicas` |
| `history` | []HistoryEntry | 部署变更历史（最多 10 条） |

**部署阶段（Phase）**

| 阶段 | 说明 |
|------|------|
| `Pending` | 等待部署 |
| `Deploying` | 部署中 |
| `Running` | 正常运行 |
| `Failed` | 部署失败 |
| `Upgrading` | 升级中 |

---

## iam.theriseunion.io/v1alpha1

### User

用户资源，存储用户认证信息和状态。

| 属性 | 值 |
|------|-----|
| **Kind** | User |
| **作用域** | Cluster-scoped |
| **类别** | iam |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 否 | 用户邮箱 |
| `displayName` | string | 否 | 显示名称 |
| `description` | string | 否 | 用户描述 |
| `groups` | []string | 否 | 所属用户组列表 |
| `encryptedPassword` | string | 是 | Bcrypt 加密后的密码（仅写入） |
| `lang` | string | 否 | 偏好语言 |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `state` | string | 用户状态：`Active` / `Pending` / `Disabled` |
| `lastLoginTime` | Time | 最后登录时间 |

---

### IAMRole

权限角色资源，定义一组 Kubernetes RBAC 规则和 UI 权限。

| 属性 | 值 |
|------|-----|
| **Kind** | IAMRole |
| **作用域** | Cluster-scoped |
| **类别** | iam |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rules` | []PolicyRule | 否 | Kubernetes 标准 RBAC 策略规则 |
| `uiPermissions` | []string | 否 | UI 权限标识列表（如 `workload/deployment/create`） |
| `aggregationRoleTemplates.templateNames` | []string | 否 | 聚合的 RoleTemplate 名称列表 |
| `aggregationRoleTemplates.roleSelector` | LabelSelector | 否 | 基于标签的 RoleTemplate 选择器 |

---

### IAMRoleBinding

角色绑定资源，将用户/组与角色关联。

| 属性 | 值 |
|------|-----|
| **Kind** | IAMRoleBinding |
| **作用域** | Cluster-scoped |
| **类别** | iam |

**Spec 字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `subjects` | []Subject | 是 | 绑定目标（User/Group/ServiceAccount） |
| `roleRef` | RoleRef | 是 | 关联的 IAMRole 引用 |

**作用域标签**

| 标签 | 说明 | 值 |
|------|------|-----|
| `iam.theriseunion.io/scope` | 权限作用域类型 | `platform` / `cluster` |
| `iam.theriseunion.io/scope-value` | 作用域标识 | 集群名称等 |

---

## registry.theriseunion.io/v1alpha1

### Registry / ClusterRegistry

镜像仓库资源，管理容器镜像仓库的注册信息。

| 属性 | 值 |
|------|-----|
| **Kind** | Registry（命名空间级）/ ClusterRegistry（集群级） |
| **Finalizer** | `finalizer.registry.theriseunion.io` |

**常用标签**

| 标签 | 说明 |
|------|------|
| `registry.theriseunion.io/provider` | 仓库提供商 |
| `registry.theriseunion.io/domain` | 仓库域名 |

### Repository / ClusterRepository

镜像仓库中的项目/命名空间资源。

---

## device.theriseunion.io/v1alpha1

### ComputeTemplate

算力模板资源，定义 GPU/NPU 等加速卡的算力能力。

**ComputeCapability 结构**

| 字段 | 类型 | 说明 | 值 |
|------|------|------|-----|
| `precision` | string | 计算精度 | `FP32` / `FP16` / `BF16` / `FP8` |
| `value` | string | 算力值 | 如 `19.5`、`312` |
| `unit` | string | 算力单位 | `TFLOPS` / `GFLOPS` / `MFLOPS`（默认 TFLOPS） |

### ResourcePool

资源池资源，管理集群中的加速设备资源分配。

| 属性 | 值 |
|------|-----|
| **Kind** | ResourcePool |
| **作用域** | Cluster-scoped |

**Spec 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `scheduler` | string | 调度器名称（默认 `hami`） |

**Status 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | []ItemDetail | 设备列表详情 |
| `allocatable` | ResourceList | 可分配设备资源 |
| `request` | ResourceList | 已请求资源 |
| `limit` | ResourceList | 资源上限 |

### DeviceModel / GlobalConfig / NodeConfig

设备模型定义和全局/节点级设备配置资源。
