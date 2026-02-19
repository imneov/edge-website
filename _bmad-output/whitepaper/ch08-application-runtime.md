# 第八章：应用运行 — 断网不断服务

> **应用面对的问题**：边缘网络不稳定，断网了应用还能跑吗？应用需要操作传感器等 IoT 设备怎么办？

---

## 引言：边缘的常态是"不完美"

前面几章描述了应用从打包、审核、上架到部署的完整旅程。但在边缘场景下，应用部署成功只是起点——应用在运行期间面临的挑战远比云端复杂：

- **网络不可靠**：边缘站点与云端的网络连接可能因为专线故障、移动网络波动、恶劣天气等原因中断。2023 年的行业调研显示，超过 60% 的边缘站点每月至少经历一次网络中断。
- **必须持续运行**：工厂的质检模型不能因为网络断了就停止工作——每停止一分钟，未检测的瑕疵品就在流入市场。
- **需要操作物理设备**：边缘应用不只是"容器里的服务"——很多应用需要采集传感器数据、控制执行器、与 PLC 通信。

本章介绍平台在应用运行阶段的两项核心能力：边缘离线自治（断网不断服务）和 IoT 设备交互（应用与物理世界的桥梁）。

---

## 8.1 边缘离线自治

### 问题：断网了应用还能跑吗

Kubernetes 的设计假设是"网络可靠"——API Server 是集群的控制中心，kubelet 需要持续与 API Server 通信来获取 Pod 的期望状态。如果网络断开，kubelet 无法确认 Pod 的最新配置，默认行为是逐渐驱逐 Pod。

**这在边缘场景下是灾难性的。** 一次短暂的网络波动不应该导致应用停机。

### 三种离线方案适配不同场景

平台不是只提供一种离线方案，而是通过第三章介绍的可插拔运行时架构（ComponentInstaller）同时支持三种方案：

| 场景 | 特征 | 适合的方案 | 原理 |
|------|------|-----------|------|
| 嵌入式边缘 | ARM 网关、树莓派、内存 < 1GB | **KubeEdge** | 轻量级 EdgeCore 代理，本地保存 Pod 元数据 |
| 标准服务器边缘 | 工厂服务器、门店服务器 | **OpenYurt** | YurtHub 本地缓存代理，透明拦截 API 请求 |
| 独立边缘站点 | 需要完整 K8s 控制面 | **VCluster（K3s/K0s）** | 本地运行完整的 K8s 控制面，完全独立自治 |

### KubeEdge 方案：资源极度受限的嵌入式边缘

**工作原理**：KubeEdge 在边缘部署一个极轻量的 EdgeCore 代理（内存占用 < 70MB）。EdgeCore 缓存 Pod 的期望状态到本地 SQLite 数据库。当网络断开时，EdgeCore 使用本地缓存维持 Pod 的运行状态。

**适用场景**：
- ARM 架构的边缘网关
- 资源极度受限的嵌入式设备
- 千级以上边缘节点的大规模部署

**局限性**：EdgeCore 只缓存 Pod 级别的元数据，断网期间无法处理 Service、Ingress 等高级网络策略的变更。

### OpenYurt 方案：标准服务器级边缘

**工作原理**：OpenYurt 在每个边缘节点部署 YurtHub——一个本地 API 缓存代理。YurtHub 透明地拦截 kubelet 到 API Server 的所有请求，将响应缓存到本地。当网络断开时，YurtHub 直接从本地缓存返回数据，kubelet 感知不到网络中断。

**自动离线自治启用**：平台的 EdgeNode Controller 自动为边缘节点启用离线自治能力。当新的边缘节点加入集群时，Controller 检测其类型并自动添加自治标注：

> **源码实证**：
> ```go
> func (r *EdgeNodeReconciler) handleNodeAutonomy(ctx context.Context,
>     node *corev1.Node) (bool, error) {
>     // 1. 检查是否为边缘节点
>     nodeType, isEdgeNode := node.Labels[constants.NodeTypeLabelKey]
>     if !isEdgeNode || nodeType != constants.NodeTypeEdge {
>         return false, nil
>     }
>
>     // 2. 检查是否已添加自治标注
>     if _, exists := node.Annotations[constants.NodeAutonomyAnnotation]; exists {
>         return false, nil
>     }
>
>     // 3. 自动启用离线自治
>     node.Annotations[constants.NodeAutonomyAnnotation] =
>         constants.NodeAutonomyEnabled
>     r.Recorder.Eventf(node, corev1.EventTypeNormal, "AutonomyEnabled",
>         "Automatically enabled node autonomy for edge node")
>     return true, nil
> }
> ```
> — `internal/controller/edgenode/edge_node_controller.go`

相关常量定义：

```go
// 兼容 OpenYurt 的边缘节点自治标注
NodeAutonomyAnnotation = "node.beta.openyurt.io/autonomy"
NodeAutonomyEnabled    = "true"

// 边缘运行时类型标注
EdgeRuntimeAnnotation = "cluster.theriseunion.io/edge-runtime"
EdgeRuntimeOpenYurt   = "openyurt"
EdgeRuntimeKubeEdge   = "kubeedge"
```

> — `pkg/constants/constants.go`

**关键设计**：自治能力的启用是**幂等的**——Controller 只在标注不存在时添加，避免重复操作。同时，Controller 会为边缘节点自动添加 `node-role.kubernetes.io/edge:NoSchedule` 污点（Taint），防止非边缘工作负载被意外调度到边缘节点。

**适用场景**：
- 标准 x86/ARM64 服务器
- 工厂、门店、边缘数据中心
- 需要与云端保持弱连接的场景

**优势**：对应用完全透明——应用不需要做任何适配，YurtHub 在网络层自动处理了离线场景。

### VCluster 方案：独立运行的边缘站点

**工作原理**：在边缘站点部署一个完整的 K8s 控制面（通过 VCluster 虚拟集群）。VCluster 运行在边缘的宿主集群内，但拥有完全独立的 API Server、etcd 和调度器。网络断开时，VCluster 作为独立集群继续运行，甚至可以处理新的 Pod 创建和调度。

**适用场景**：
- 偏远的独立站点（如海上平台、矿区）
- 网络长时间断开（数小时到数天）
- 需要在断网期间部署新应用

**优势**：最强的自治能力——断网期间几乎所有 K8s 操作都可以正常执行。

### 三种方案不是"选择困难"

需要强调的是：三种离线方案不是"选择困难"，而是**为不同场景提供最合适的解法**。

```
场景特征                    → 推荐方案
───────────────────────────────────────────
资源极度受限（<1GB 内存）    → KubeEdge
标准服务器 + 弱网连接        → OpenYurt
完全独立 + 长时间断网        → VCluster
```

平台通过 ComponentInstaller 可插拔接口（第三章 3.3）同时支持三种方案，运维人员可以为不同的边缘站点选择最合适的方案。**选择权在用户手中，而不是被平台绑定。**

### 与分层镜像缓存的协同

离线自治保证了**已运行的应用**在断网时持续运行。但如果需要在断网期间**启动新应用**呢？

这就需要第三章介绍的分层镜像缓存（3.4）配合：边缘站点本地的 Repository 缓存了常用的应用镜像。即使云端网络断开，只要镜像在本地缓存中，新应用仍然可以快速启动。

```
断网场景下的应用保障

已运行的应用 → 离线自治保证持续运行
  └── KubeEdge: 本地 SQLite 缓存 Pod 元数据
  └── OpenYurt: YurtHub 缓存 API 响应
  └── VCluster: 本地完整控制面

新应用启动 → 分层镜像缓存保证镜像可用
  └── 边缘站点本地 Repository 有缓存 → 直接拉取启动
  └── 本地无缓存 → 等待网络恢复
```

---

## 8.2 IoT 设备交互

### 问题：应用不只运行在容器里

在工业边缘场景中，应用通常需要与物理世界的设备交互：

- **质检应用**需要从工业相机获取图像数据
- **环境监控应用**需要读取温湿度传感器
- **设备控制应用**需要向 PLC 发送指令
- **能耗优化应用**需要读取电表和水表数据

传统 IoT 平台使用私有 SDK 和私有协议来管理这些设备。但正如第二章 2.4 所述，这些能力已经被开源社区以云原生方式重新实现。

### 云原生化的 IoT 设备管理

平台将 IoT 设备管理完全 CRD 化——管理设备和管理 Pod 用同一套 Kubernetes API。

**设备模型（DeviceProfile）**：定义设备的属性和能力，类似于面向对象编程中的"类定义"。

```
DeviceProfile（设备模板）
  │
  ├── 属性：温度、湿度、压力、电压...
  ├── 命令：启动、停止、重置...
  └── 协议：Modbus、MQTT、OPC-UA...
```

**设备实例（Device）**：对应一个实际的物理设备，类似于"类的实例"。

```
Device（设备实例）
  │
  ├── profile: temperature-sensor-v1   ← 引用设备模板
  ├── service: modbus-device-service   ← 关联设备服务
  ├── protocols:                       ← 通信配置
  │     └── Modbus: {address: 1, port: 502}
  └── status:
        ├── operatingState: ENABLED
        └── lastReported: 2024-01-15T10:30:00Z
```

### 设备状态机

每个设备有明确的生命周期状态：

```
创建 → 未同步 → Device Service 同步 → 运行中
                                     ↕
                                   已停止
                                     ↓
                                   已锁定
```

| 状态 | 含义 | 可执行操作 |
|------|------|-----------|
| 未同步 | 设备已创建但 Device Service 尚未处理 | 等待同步 |
| 运行中（ENABLED） | 设备正常运行，可以收发数据 | 读取/控制/停止 |
| 已停止（DISABLED） | 设备已停止，不收发数据 | 启动/锁定 |
| 已锁定（LOCKED） | 设备被锁定，禁止任何操作 | 解锁 |

### 与 EdgeX Foundry 集成

平台的 IoT 能力不是从零构建的，而是基于 EdgeX Foundry 这一成熟的开源边缘 IoT 框架。EdgeX Foundry 提供了：

- **多协议适配**：Modbus、MQTT、OPC-UA、BACnet、REST 等
- **设备服务（Device Service）**：负责与物理设备通信的边缘微服务
- **核心数据服务（Core Data）**：设备数据的采集、存储和转发

平台的贡献在于：**将 EdgeX Foundry 的设备管理能力从私有 API 提升为 Kubernetes CRD**。

```
传统 EdgeX 管理方式：
  EdgeX REST API → 私有客户端 → 手动管理

平台化管理方式：
  Device CRD → kubectl / K8s API → 声明式管理
                                   ↓
                            与 Pod、Deployment 用同一套 API
                            与 Workspace、NodeGroup 用同一套权限
```

### CRD 化的核心价值

IoT 设备管理 CRD 化带来了三个关键价值：

**1. 统一 API**：运维人员使用 `kubectl get devices` 查看设备列表，与 `kubectl get pods` 使用完全相同的命令体验。不需要学习另一套管理工具。

**2. 统一权限**：五层权限模型（第五章）自动覆盖设备资源。"工作空间 A 的用户只能操作工作空间 A 的设备"是权限系统的标准功能，不需要额外的权限配置。

**3. 声明式管理**：设备的期望状态通过 CRD 声明，Device Service 负责将期望状态同步到实际设备。设备异常时，Controller 可以自动尝试恢复——与 Kubernetes 管理 Pod 的逻辑完全一致。

### 与传统 IoT 平台的对比

| 能力 | 传统 IoT 平台 | 本平台 |
|------|-------------|--------|
| 设备管理 API | 厂商私有 REST API | Kubernetes 标准 CRD API |
| 权限控制 | 独立的权限系统 | 复用五层 Scope 权限模型 |
| 设备发现 | 厂商私有协议 | EdgeX Foundry 多协议适配 |
| 与应用集成 | 需要编写适配代码 | 同一个集群内，Pod 直接访问 Device Service |
| 平台锁定 | 换平台需重写对接代码 | 基于标准 CRD，可替换实现 |

---

## 8.3 边缘节点管理

### 自动化的边缘节点生命周期

EdgeNode Controller 不仅处理离线自治的启用，还管理边缘节点的完整生命周期：

**1. 节点类型识别**

通过 Label `node.theriseunion.io/type: edge` 标识边缘节点。Controller 根据节点类型执行不同的管理策略。

**2. 自动污点管理**

边缘节点自动添加 `NoSchedule` 污点，确保只有显式声明容忍（Toleration）的工作负载才会调度到边缘。这防止了云端的管理 Pod 被意外调度到资源有限的边缘节点。

**3. 节点统计**

NodeGroup Controller 自动统计每个节点组的节点数量和就绪节点数量，存储在 Annotation 中：

```go
annotations:
  theriseunion.io/node-count: "10"       // 总节点数
  theriseunion.io/ready-node-count: "8"  // 就绪节点数
```

这些统计信息供管理界面展示，帮助运维人员快速了解每个边缘站点的节点健康状况。

---

## 8.4 本章小结

应用运行回答了"应用在边缘如何持续稳定运行"的问题：

| 环节 | 机制 | 效果 |
|------|------|------|
| 离线自治 | 三种方案适配不同场景 | 嵌入式用 KubeEdge、服务器用 OpenYurt、独立站点用 VCluster |
| 自动启用 | EdgeNode Controller 自动添加自治标注 | 边缘节点加入即自治，无需手动配置 |
| 镜像保障 | 分层缓存（第三章 3.4） | 弱网环境新应用仍可启动 |
| IoT 交互 | Device CRD + EdgeX Foundry | 管理设备与管理 Pod 用同一套 API |
| 统一权限 | 五层 Scope 覆盖设备资源 | 设备权限与应用权限统一管理 |
| 边缘管理 | 自动污点 + 节点统计 | 防止误调度，健康状况一目了然 |

这套应用运行保障体系的核心价值在于：**让边缘的"不完美"对应用透明。** 网络断了，应用感知不到；需要读传感器数据，用标准 K8s API；节点需要特殊管理，Controller 自动处理。

这是第二章提出的"断不了"承诺的技术实现——边缘离线自治确保应用持续运行，IoT CRD 化确保应用与物理设备的交互标准化。

---

*下一章：第九章 — 应用可观测，看得见才管得住*
