# 第三章：基础设施就绪 — 应用运行的基石

> **应用面对的问题**：在应用部署之前，边缘硬件怎么快速纳管？集群怎么建？镜像怎么到达边缘？

---

## 引言：应用的第一个前提是"地基"

第六章和第七章分别讲述了应用的打包上架和拓扑部署。但在应用开始部署之前，有一个更基础的问题需要回答：**应用运行的基础设施从哪里来？**

一个典型的边缘计算项目，在应用上线之前需要完成三项基础工作：

1. **硬件接入**：数十甚至数千台边缘服务器如何快速上架、安装驱动、配置环境？如果每台服务器都需要运维人员到现场操作，那么光是硬件准备就要消耗数月时间。
2. **集群建立**：边缘服务器接入后，如何将它们组织成可管理的 Kubernetes 集群？云端与边缘之间的网络连接如何解决？
3. **镜像到位**：应用容器镜像从中心仓库到边缘节点，跨越数千公里的网络链路，如何保证高效可靠？

本章介绍平台在这三个维度上的技术方案：OTA 批量运维系统解决硬件接入问题，集群联邦管理解决集群创建和连接问题，分层镜像分发解决应用镜像的"最后一公里"问题。

---

## 3.1 硬件快速接入 — OTA 批量运维系统

### 问题：一千台边缘服务器如何上架

大规模边缘计算项目的第一个运维挑战发生在硬件上架阶段。以一家制造企业在全国 50 个工厂部署边缘服务器为例，每个工厂 10-20 台服务器，总计 500-1000 台。每台服务器上架后需要：

- 安装操作系统和基础软件（Docker、containerd）
- 安装 GPU/NPU 驱动（NVIDIA Driver、CUDA Toolkit 等）
- 配置网络和存储环境
- 注册到平台管理系统

如果采用传统的"运维人员到现场操作"方式，即使每台服务器只需要 2 小时，1000 台服务器也需要 2000 人时——这还不算差旅时间和多次返工。

### 解决方案：声明式任务驱动的批量运维

OTA（Over-The-Air）模块将硬件上架过程从"人工操作问题"转化为"声明式任务问题"。运维人员不需要登录每台服务器执行命令，而是创建一个任务声明"在这批服务器上执行这些操作"，平台自动分发到每台设备并行执行。

#### 四种任务类型

OTA 支持四种原子任务类型，覆盖硬件接入的所有操作场景：

| 任务类型 | 用途 | 典型场景 |
|---------|------|---------|
| **exec（执行命令）** | 在多个节点上同时执行 Shell 命令 | 批量安装 Docker、NVIDIA 驱动、配置系统参数 |
| **read（读取文件）** | 从多个节点读取指定文件内容 | 批量检查配置文件、收集系统日志、审计环境一致性 |
| **write（写入文件）** | 向多个节点写入文件 | 批量分发配置文件、更新证书、统一网络配置 |
| **playbook（运行 Playbook）** | 在多个节点上运行自动化脚本 | 编排多步骤纳管流程、复杂环境初始化 |

四种任务类型可以组合使用。例如，一个完整的"边缘服务器纳管"流程可以编排为：

```
Step 1 (write)    → 写入 apt/yum 镜像源配置
Step 2 (exec)     → 安装 Docker 和 containerd
Step 3 (exec)     → 安装 NVIDIA Driver 和 CUDA Toolkit
Step 4 (read)     → 读取 nvidia-smi 输出，验证 GPU 驱动安装成功
Step 5 (exec)     → 注册到 Kubernetes 集群
Step 6 (playbook) → 运行完整的健康检查 Playbook
```

#### 分布式执行与结果聚合

OTA 的执行模型是分布式的：一个任务被创建后，Controller 将其分发到目标设备，每个设备的 OTA Agent 独立执行并上报结果。

```
Task（声明式任务定义）
  │
  ├── Controller 分发
  │
  ├── Device-1: OTA Agent 执行 → DeviceResult（成功）
  ├── Device-2: OTA Agent 执行 → DeviceResult（成功）
  ├── Device-3: OTA Agent 执行 → DeviceResult（失败：驱动版本不兼容）
  ├── Device-4: OTA Agent 执行 → DeviceResult（执行中）
  └── ...
  │
  └── Task Status（自动聚合）
      ├── succeeded: 2
      ├── failed: 1
      ├── running: 1
      └── queued: N-4
```

**关键设计**：每个设备的执行结果是独立跟踪的。Device-3 失败不影响 Device-1 和 Device-2 的成功结果，也不阻塞 Device-4 的执行。Task 级别自动聚合 succeeded/failed/running/queued 计数，运维人员可以一眼看到全局进展。

#### 万级节点支持

OTA 的设计目标是支持万级节点的并行执行：

- **队列化执行**：不是同时向所有设备下发任务，而是通过队列控制并发度，避免 Controller 过载
- **独立结果追踪**：每个设备的 DeviceResult 是独立的资源对象，不存在全局锁竞争
- **自动超时处理**：设备离线或执行超时会被自动标记为失败，不阻塞整体任务

### OTA 的定位澄清

需要特别说明的是：**OTA 解决的是硬件接入问题，不是应用更新问题。** 应用的版本更新通过 ApplicationDeployment 的版本切换实现（第七章），不需要通过 OTA。

OTA 的核心价值在于：将"一千台边缘服务器上架"这个运维问题，从人工操作变成声明式任务。每个节点的成败互不影响，全局进展一目了然。

---

## 3.2 集群联邦管理

### 问题：边缘集群怎么建、怎么连

硬件接入后，下一步是将边缘服务器组织成可管理的 Kubernetes 集群，并建立与云端管控面的连接。边缘场景下的集群管理面临两个特有挑战：

1. **网络多样性**：有的边缘站点与云端在同一机房（或通过 VPN 连接），可以直接访问；有的站点在公网另一侧，需要穿透 NAT。
2. **运行时多样性**：不同场景对边缘运行时有不同需求——资源极度受限的嵌入式场景需要 KubeEdge，标准服务器级边缘需要 OpenYurt，独立运行的边缘站点需要轻量级集群。

### 双模式连接

平台支持两种集群连接模式，适配不同的网络环境：

> **源码实证**：连接模式通过 `ConnectionType` 类型定义：
> ```go
> const (
>     ConnectionTypeDirect ConnectionType = "direct"
>     ConnectionTypeProxy  ConnectionType = "proxy"
> )
> ```
> — `api/scope/v1alpha1/cluster_types.go:54-56`

| 连接模式 | 适用场景 | 要求 | 特点 |
|---------|---------|------|------|
| **Direct（直接连接）** | 同机房、VPN、专线 | 提供 KubeConfig 和 API Endpoint | 低延迟，直接访问边缘 API Server |
| **Proxy（反向隧道）** | 跨公网、NAT 穿透 | 边缘 Agent 主动连接云端 | 无需暴露边缘端口，自动建立隧道 |

Direct 模式下，云端直接使用 KubeConfig 访问边缘集群的 API Server：

```go
type Connection struct {
    Type ConnectionType `json:"type,omitempty"`

    // Direct 模式需要提供 API Endpoint 和 KubeConfig
    KubernetesAPIEndpoint string `json:"kubernetesAPIEndpoint,omitempty"`
    KubeConfig            []byte `json:"kubeconfig,omitempty"`

    // Proxy 模式由 Agent 反向连接，自动填充
    Token                     string `json:"token,omitempty"`
    KubernetesAPIServerPort   uint16 `json:"kubernetesAPIServerPort,omitempty"`
    TheriseunionAPIServerPort uint16 `json:"theriseunionAPIServerPort,omitempty"`
}
```

> — `api/scope/v1alpha1/cluster_types.go:58-111`

Proxy 模式下，边缘 Agent 使用 Token 主动连接云端的反向代理。云端为每个 Proxy 集群分配独立的端口（`KubernetesAPIServerPort` 和 `TheriseunionAPIServerPort`），所有请求通过隧道转发到边缘。

**关键优势**：Proxy 模式下，边缘站点无需暴露任何公网端口，只需出方向连接到云端即可。这解决了大多数边缘站点的网络安全限制问题。

### VCluster 支持

对于需要完整 Kubernetes 控制面但不希望部署独立物理集群的场景，平台支持通过 VCluster（虚拟集群）快速创建轻量级边缘集群。

VCluster 的创建完全由 Controller 自动化管理，通过 Helm Chart 安装，支持 K3s/K0s/K8s 三种发行版（Distro）。

> **源码实证**：Cluster Controller 在 Reconcile 时检查是否启用了 VCluster：
> ```go
> // 1. 检查是否需要安装 vCluster
> if isVClusterEnabled(instance) && !isVClusterReady(instance) {
>     err := r.ensureVCluster(ctx, instance)
>     if err != nil {
>         return ctrl.Result{}, err
>     }
>     return updateCondition(instance, scopev1alpha1.ClusterVirtualClusterReady, ...)
> }
> ```
> — `internal/controller/cluster/cluster_controller.go:217-223`

VCluster 安装完成后，KubeConfig 自动同步到 Cluster CRD 的 Connection 字段，后续所有请求通过标准 Kubernetes API 路由到虚拟集群。

### Condition 状态链

每个 Cluster 的生命周期通过 Condition 状态链精确追踪。每个 Condition 独立跟踪，外部系统可以精确读取集群所处的阶段：

```
Initialized          → 集群初始化完成，等待 Agent 连接
    ↓
AgentAvailable       → Agent 已连接，通信正常
    ↓
CoreReady            → 平台核心组件（APIServer/Controller）已就绪
    ↓
Ready                → 集群整体就绪，可以接受应用部署
    ↓
Schedulable          → 集群可调度，节点资源充足
```

以及可选的运行时 Condition：

| Condition | 含义 |
|-----------|------|
| `VirtualClusterReady` | VCluster 安装完成并就绪 |
| `OpenyurtReady` | OpenYurt 运行时就绪 |
| `KubeedgeReady` | KubeEdge 运行时就绪 |

> **源码实证**：完整的 Condition 类型定义：
> ```go
> const (
>     ClusterInitialized         ClusterConditionType = "Initialized"
>     ClusterAgentAvailable      ClusterConditionType = "AgentAvailable"
>     ClusterReady               ClusterConditionType = "Ready"
>     ClusterSchedulable         ClusterConditionType = "Schedulable"
>     ClusterCoreReady           ClusterConditionType = "CoreReady"
>     ClusterVirtualClusterReady ClusterConditionType = "VirtualClusterReady"
>     ClusterOpenyurtReady       ClusterConditionType = "OpenyurtReady"
>     ClusterKubeedgeReady       ClusterConditionType = "KubeedgeReady"
> )
> ```
> — `api/scope/v1alpha1/cluster_types.go:115-149`

### 并发控制

Cluster Controller 支持多集群并发 Reconcile，同时通过 InstanceLock 确保同一集群不会被并发处理：

```go
// MaxConcurrentReconciles: 3，允许同时处理 3 个不同的集群
// 同一集群的 Reconcile 通过 InstanceLock 串行化

getLock := r.TryLock(instance.Name)
if !getLock {
    // 当前集群正在被处理，5 秒后重试
    return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
}
defer r.Unlock(instance.Name)
```

> — `internal/controller/cluster/cluster_controller.go:87-92`

### 删除流程

集群删除通过 Finalizer 保护，确保资源的正确清理：

```
DeletionTimestamp 被设置
  │
  ├── undoReconcile 执行清理逻辑
  │   ├── 如果启用了 VCluster → cleanupVCluster（卸载 Helm Release）
  │   └── 清理关联组件
  │
  └── 移除 Finalizer → K8s 完成删除
```

> **源码实证**：
> ```go
> const ClusterFinalizer = "finalizer.cluster.theriseunion.io"
> ```
> — `api/scope/v1alpha1/cluster_types.go:20`

---

## 3.3 可插拔边缘运行时

### 问题：不同场景需要不同的运行时

边缘计算没有"一种运行时解决所有问题"的银弹。不同的场景对运行时有截然不同的需求：

| 场景 | 特征 | 适合的运行时 |
|------|------|-------------|
| 嵌入式边缘（ARM 网关、树莓派） | 资源极度受限（<1GB 内存） | KubeEdge |
| 标准服务器级边缘（工厂、门店） | 资源充足，需要与云端无缝协作 | OpenYurt |
| 独立运行的边缘站点 | 需要完整 K8s 控制面，独立自治 | VCluster（K3s/K0s） |

平台通过可插拔的 ComponentInstaller 接口支持多种边缘运行时，新增运行时只需要实现这个接口并通过 `init()` 注册。

### ComponentInstaller 接口

```go
// ComponentInstaller 组件管理器接口，定义组件安装的完整流程
type ComponentInstaller interface {
    // PreInstall 安装前的准备工作，例如检查前置条件、创建命名空间等
    PreInstall(ctx context.Context, cluster *scopev1alpha1.Cluster,
        config *ComponentConfig) (*ComponentCondition, error)

    // Install 执行实际的安装逻辑，返回组件配置
    Install(ctx context.Context, cluster *scopev1alpha1.Cluster,
        config *ComponentConfig) (*ComponentCondition, error)

    // PostInstall 安装后的处理，例如验证安装结果、设置状态等
    PostInstall(ctx context.Context, cluster *scopev1alpha1.Cluster,
        config *ComponentConfig) (*ComponentCondition, error)
}
```

> — `internal/component/types.go:22-40`

每个安装步骤返回一个 `ComponentCondition`，Controller 据此更新 Cluster 的 Condition 状态。这意味着外部系统可以精确观测到"OpenYurt 正在安装""KubeEdge 安装失败"等细粒度状态。

### 插件注册机制

新的运行时通过 `init()` 函数注册到全局注册表，无需修改 Controller 核心逻辑：

```go
// 注册组件安装器实现
func RegisterComponentInstallerFunc(name string, fn ComponentInstallerFunc) {
    if _, ok := componentInstallerFuncs[name]; ok {
        klog.Errorf("component installer func name %s already exists", name)
        return
    }
    componentInstallerFuncs[name] = fn
}
```

> — `internal/component/types.go:64-70`

已注册的组件在 Local Cluster Reconcile 时自动遍历安装：

```go
var components = []string{
    "apiserver",
    "controller",
    openyurt.COMPONENT_NAME,
    kubeedge.COMPONENT_NAME,
    "etcd",
}

// 遍历所有需要安装的组件
for _, componentName := range components {
    if err := installComponent(ctx, r, logger, clusterCopy, componentName); err != nil {
        logger.Error(err, "Failed to install component", "component", componentName)
    }
}
```

> — `internal/controller/cluster/cluster_controller_local_cluster.go:16-41`

每个组件的安装过程是完整的三阶段流程（PreInstall → Install → PostInstall），每个阶段独立反馈状态：

```go
componentCondition, err := componentInstaller.PreInstall(ctx, instance, componentConfig)
if componentCondition != nil {
    r.setClusterCondition(instance, componentCondition.ConditionType, ...)
}
// ... Install ... PostInstall 同理
```

> — `internal/controller/cluster/cluster_controller_local_cluster.go:75-101`

### 已注册组件

| 组件 | 命名空间 | 对应 Condition | 作用 |
|------|---------|----------------|------|
| APIServer | edge-system | CoreReady | 平台 API 服务 |
| Controller | edge-system | CoreReady | 平台控制器 |
| OpenYurt | kube-system | OpenyurtReady | 边缘自治运行时 |
| KubeEdge | ke-system | KubeedgeReady | 轻量级边缘运行时 |
| VCluster | 动态创建 | VirtualClusterReady | 虚拟集群运行时 |

### 开放架构的关键体现

ComponentInstaller 接口是平台开放架构的关键体现。未来如果需要支持新的边缘运行时（例如 SuperEdge 或自研方案），只需要：

1. 创建一个新文件，实现 `ComponentInstaller` 接口的三个方法
2. 在 `init()` 函数中注册到全局注册表
3. 将组件名称添加到 `components` 列表

**不需要修改 Controller 核心逻辑，不需要修改已有组件的代码，不需要改动 CRD Schema。**

---

## 3.4 分层镜像分发

### 问题：应用镜像如何到达边缘

应用容器镜像是应用运行的"原材料"。在边缘场景下，镜像分发面临独特的挑战：

- **带宽有限**：边缘站点到中心仓库的网络带宽远低于数据中心内部
- **延迟较高**：跨地域的网络延迟导致镜像拉取时间显著增加
- **可靠性要求**：镜像拉取失败意味着应用无法启动，业务中断

### 四级分发架构

平台采用分层缓存的镜像分发架构，将镜像的传输路径缩短到最近的可用节点：

```
第一级：Registry（总部管控集群的镜像仓库）
   │      —— 存储所有镜像的权威来源
   │
   ▼
第二级：ClusterRegistry（云端统一入口）
   │      —— Cluster 级别的镜像入口，跨集群可见
   │
   ▼
第三级：Repository / ClusterRepository（边缘站点缓存）
   │      —— 边缘站点本地的镜像仓库/缓存
   │
   ▼
第四级：边缘节点
          —— 从最近的缓存拉取镜像
```

### 四种镜像资源 CRD

平台通过四种 CRD 管理镜像分发链路的每一层：

| CRD | 作用域 | 职责 |
|-----|--------|------|
| **Registry** | Namespace 级 | 命名空间内的镜像仓库定义，包含认证信息 |
| **ClusterRegistry** | Cluster 级 | 集群级别的镜像仓库定义，跨命名空间可见 |
| **Repository** | Namespace 级 | 具体的镜像存储库（含拉取统计） |
| **ClusterRepository** | Cluster 级 | 集群级别的镜像存储库 |

> **源码实证**：Registry 和 ClusterRegistry 共享相同的 `RegistrySpec` 结构（认证信息、域名、Provider），区别在于作用域——Registry 限制在特定 Namespace，ClusterRegistry 全集群可见。
> — `api/registry/v1alpha1/registry_types.go` 和 `api/registry/v1alpha1/clusterregistry_types.go`

Registry 通过 Finalizer 保护，确保删除时不会遗留关联的 Repository 资源：

```go
const RegistryFinalizer = "finalizer.registry.theriseunion.io"
const ClusterRegistryFinalizer = "finalizer.clusterregistry.theriseunion.io"
```

> — `api/registry/v1alpha1/registry_types.go:26-29`

### Repository 的运行时统计

每个 Repository 跟踪镜像的运行时统计信息：

```go
type RepositoryStatus struct {
    Status        string `json:"status,omitempty"`
    ArtifactCount int64  `json:"artifactCount,omitempty"`  // 镜像制品数量
    PullCount     int64  `json:"pullCount,omitempty"`      // 拉取次数
}
```

> — `api/registry/v1alpha1/repository_types.go:37-43`

这些统计数据帮助运维人员了解每个边缘站点的镜像使用情况——哪些镜像拉取频率最高、哪些站点的镜像缓存需要扩容。

### 多架构支持

边缘设备的 CPU 架构多样（x86_64、ARM64、RISC-V），同一个应用可能需要支持多种架构的镜像。平台的镜像管理原生支持 multi-arch manifest，确保：

- 同一个 Repository 可以存储 x86 和 ARM 版本的镜像
- 边缘节点拉取时自动匹配本地架构
- 推送时只同步变化的镜像层（增量同步），节省带宽

### 分层缓存的价值

分层缓存架构的核心价值在于：**即使云端到边缘的网络不稳定，只要边缘站点本地有缓存，应用就能快速启动。**

这与第八章将介绍的边缘离线自治能力形成互补——离线自治保证应用在断网时持续运行，分层镜像缓存保证新应用在弱网环境下也能快速部署。

---

## 3.5 本章小结

基础设施就绪回答了"应用部署之前需要准备什么"的问题：

| 环节 | 机制 | 效果 |
|------|------|------|
| 硬件接入 | OTA 声明式任务（exec/read/write/playbook） | 千台服务器的纳管从人工操作变成声明式任务 |
| 集群连接 | 双模式连接（Direct/Proxy） | 同机房直连 + 跨公网隧道，覆盖所有网络场景 |
| 虚拟集群 | VCluster 自动安装（K3s/K0s/K8s） | 无需独立物理集群即可获得完整 K8s 控制面 |
| 运行时多样性 | ComponentInstaller 插件接口 | 新增运行时只需一个文件 |
| Condition 追踪 | 每个组件独立 Condition | 精确观测集群的每个就绪阶段 |
| 镜像分发 | 四级缓存（Registry → ClusterRegistry → Repository → Node） | 弱网环境下镜像仍可快速拉取 |
| 并发安全 | InstanceLock + MaxConcurrentReconciles: 3 | 多集群并发处理，单集群串行化 |

这些基础设施能力本身不直接产生业务价值，但它们是第二章提出的"应用价值持续释放"的前提条件。**应用无法在不存在的集群上运行，无法使用不存在的镜像启动，无法部署到没有纳管的服务器上。** 基础设施就绪，是应用旅程的第零步。

---

*下一章：第四章 — 算力就绪，让应用无需感知硬件差异*
