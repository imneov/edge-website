# 第四章：算力就绪 — 让应用无需感知硬件差异

> **应用面对的问题**：我的 AI 模型需要 GPU，但边缘有 NVIDIA、昇腾、海光各种卡，怎么办？一张卡太浪费，怎么切分共享？

---

## 引言：算力是手段，应用是目的

上一章解决了基础设施的就绪问题——硬件接入、集群建立、镜像到位。但对于 AI 推理类应用，还有一个关键问题：**应用需要 GPU 算力，而边缘的 GPU 硬件五花八门。**

这不是一个理论问题。在实际的边缘部署中，一家企业可能同时使用：

- **NVIDIA A100**：早期采购的高端推理卡
- **昇腾 310P**：国产化替代的首选
- **海光 DCU**：特定合规场景的要求
- **寒武纪 MLU270**：与特定框架深度集成

如果应用开发者需要为每种 GPU 编写不同的部署配置——不同的 Device Plugin、不同的资源请求格式、不同的调度标签——那么"应用与硬件解耦"就是一句空话。

本章介绍平台的异构算力管理体系。其核心设计理念是：**应用只需声明"我需要多少算力"，平台负责将这个需求映射到具体的 GPU 硬件上。** 这通过四层 CRD 抽象、双模虚拟化切分和全局调度策略三个机制实现。

---

## 4.1 九大 GPU 厂商统一建模

### 覆盖范围

平台原生支持 9 大 GPU/NPU/DCU 厂商，覆盖国内外主流异构计算平台：

| 厂商 | 英文标识 | 中文名称 | 代表产品 |
|------|---------|---------|---------|
| NVIDIA | `NVIDIA` | 英伟达 | A100、H100、T4 |
| Hygon | `Hygon` | 海光 | DCU Z100 |
| Ascend | `Ascend` | 昇腾 | 310P、910B |
| Metax | `Metax` | 沐曦 | C200、N100 |
| Kunlunxin | `Kunlunxin` | 昆仑芯 | R200、R480 |
| Alibaba | `Alibaba` | 平头哥 | 含光 800 |
| Iluvatar | `Iluvatar` | 天数智芯 | BI150 |
| Enflame | `Enflame` | 燧原 | S60、T20 |
| Cambricon | `Cambricon` | 寒武纪 | MLU270、MLU370 |

> **源码实证**：所有厂商定义在统一的常量文件中：
> ```go
> type Manufacturer string
>
> const (
>     ManufacturerNVIDIA    = "NVIDIA"
>     ManufacturerHygon     = "Hygon"
>     ManufacturerAscend    = "Ascend"
>     ManufacturerMetax     = "Metax"
>     ManufacturerKunlunxin = "Kunlunxin"
>     ManufacturerAlibaba   = "Alibaba"
>     ManufacturerIluvatar  = "Iluvatar"
>     ManufacturerEnflame   = "Enflame"
>     ManufacturerCambricon = "Cambricon"
> )
> ```
> — `pkg/constants/device.go:28-39`

每个厂商都有对应的 HAMi Device Plugin 适配：

```go
const (
    DevicePluginNVIDIA           = "nvidia"
    DevicePluginNVIDIAHAMI       = "nvidia-hami"
    DevicePluginHygonHAMI        = "hygon-hami"
    DevicePluginKunlunHAMI       = "kunlunxin-hami"
    DevicePluginIluvatarHAMI     = "iluvatar-hami"
    DevicePluginCambriconHAMI    = "cambricon-hami"
    DevicePluginMetaxGPUHAMI     = "metax-gpu-hami"
    DevicePluginAscendVNPUHAMI   = "ascend-vnpu-hami"
)
```

> — `pkg/constants/device.go:139-148`

### 统一标签体系

无论什么厂商的 GPU，都通过统一的 Label 体系标识：

| Label Key | 用途 | 示例值 |
|-----------|------|--------|
| `theriseunion.io/manufacturer` | GPU 厂商 | `NVIDIA` |
| `theriseunion.io/model` | GPU 型号 | `nvidia-a100-pcie-40gb` |
| `theriseunion.io/virtual-model` | 是否为虚拟设备 | `true` |
| `theriseunion.io/config-type` | 配置类型（内置/自定义） | `fixed` / `custom` |
| `theriseunion.io/resource-pool` | 所属资源池 | `default` |

> — `pkg/constants/device.go:80-93`

---

## 4.2 四层 CRD 抽象架构

### 设计哲学：从物理硬件到应用可用算力

平台通过四层 CRD 将物理 GPU 硬件逐步抽象为应用可用的算力资源。每一层解决一个特定的问题：

```
第 1 层  DeviceModel       "这张卡是什么？"     → 硬件规格定义
            ↓
第 2 层  ComputeTemplate   "怎么切分和超卖？"   → 算力配比模板
            ↓
第 3 层  ResourcePool      "分给谁用？"         → 资源池与调度策略
            ↓
第 4 层  NodeConfig        "这个节点怎么配？"   → 节点级配置
```

### 第 1 层：DeviceModel — 硬件规格定义

DeviceModel 定义了 GPU 硬件的物理规格，是整个算力管理体系的基础数据。

```go
type DeviceModelSpec struct {
    // 设备类型：物理卡或虚拟卡
    DeviceType DeviceType `json:"deviceType"`

    // GPU 厂商
    Manufacturer constants.Manufacturer `json:"manufacturer,omitempty"`

    // GPU 型号
    Model string `json:"model,omitempty"`

    // 显存大小（MB）
    MemorySize int `json:"memorySize,omitempty"`

    // 算力百分比（0-100）
    // 物理卡：必须为 100（全部算力）
    // 虚拟卡：必须 < 100（部分算力）
    Core int `json:"core,omitempty"`

    // 多精度算力定义
    ComputeCapabilities []ComputeCapability `json:"computeCapabilities,omitempty"`

    // 是否支持虚拟化切分
    SupportVirtualDevice bool `json:"supportVirtualDevice,omitempty"`

    // 支持的切分模式（硬切分/软切分）
    SupportComputeSplitMode []ComputeSplitMode `json:"supportComputeSplitMode,omitempty"`

    // MIG 切分模板（如果支持硬切分）
    MigTemplates [][]MigTemplate `json:"migTemplates,omitempty"`

    // 显存步长（MB），某些显卡最小使用单位
    MemoryStep int `json:"memoryStep,omitempty"`
}
```

> — `api/device/v1alpha1/devicemodel_types.go:117-182`

**关键设计：物理卡与虚拟卡的统一建模**

DeviceModel 通过 `DeviceType` 字段区分物理设备和虚拟设备：

| DeviceType | Core 约束 | 含义 |
|-----------|-----------|------|
| `physical` | 必须为 100 | 代表一张完整的物理 GPU 卡 |
| `virtual` | 必须 < 100 | 代表物理卡的一个虚拟切分 |

> **源码实证**：验证逻辑确保 Core 值与 DeviceType 一致：
> ```go
> func (s *DeviceModelSpec) Validate() error {
>     isPhysical := s.IsPhysical()
>     if isPhysical && s.Core != constants.PhysicalDeviceCore {
>         return fmt.Errorf("physical device must have core=%d, got %d",
>             constants.PhysicalDeviceCore, s.Core)
>     }
>     if !isPhysical && s.Core >= constants.PhysicalDeviceCore {
>         return fmt.Errorf("virtual device must have core<%d, got %d",
>             constants.PhysicalDeviceCore, s.Core)
>     }
>     return nil
> }
> ```
> — `api/device/v1alpha1/devicemodel_types.go:252-261`

**多精度算力定义**

不同的 AI 应用对浮点精度的需求不同——训练通常使用 FP32，推理可以使用 FP16 或 INT8。DeviceModel 通过 `ComputeCapability` 结构支持多精度的算力定义：

```go
type ComputeCapability struct {
    // 精度类型：FP32、FP16、BF16、FP8
    Precision Precision `json:"precision"`

    // 算力值（字符串，避免浮点精度问题）
    Value string `json:"value"`

    // 单位：TFLOPS、GFLOPS、MFLOPS
    Unit ComputeUnit `json:"unit,omitempty"`
}
```

> — `api/device/v1alpha1/devicemodel_types.go:64-76`

以 NVIDIA A100 为例，同一张卡在不同精度下的算力差异巨大：

| 精度 | 算力 | 适用场景 |
|------|------|---------|
| FP32 | 19.5 TFLOPS | 科学计算、高精度训练 |
| FP16 | 312 TFLOPS | AI 推理 |
| BF16 | 312 TFLOPS | 大模型训练 |
| FP8 | 624 TFLOPS | 量化推理 |

**设计细节：为什么算力值使用字符串？**

`Value` 字段使用 `string` 而非 `float64`：

```go
// Value represents the compute capability value as a string (e.g., "19.5", "312").
// Using string type to avoid precision issues across different languages in CRD.
Value string `json:"value"`
```

这是对 CRD 跨语言互操作性的务实考量——浮点数在 JSON 序列化/反序列化时可能出现精度丢失（如 0.1 + 0.2 != 0.3），而算力规格是精确的硬件参数，不允许精度偏差。

**MIG 切分模板**

对于支持 NVIDIA MIG（Multi-Instance GPU）的硬件，DeviceModel 通过二维数组定义多种切分方案：

```go
type MigTemplate struct {
    Name   string `json:"name"`    // 切分名称，如 "1g.10gb"
    Memory int32  `json:"memory"`  // 显存（MB）
    Count  int32  `json:"count"`   // 实例数量
}

// 二维数组：外层是不同的切分方案，内层是方案内的实例组合
MigTemplates [][]MigTemplate `json:"migTemplates,omitempty"`
```

> — `api/device/v1alpha1/devicemodel_types.go:107-114`

例如 A100 80GB 可以有以下切分方案：

| 方案 | 切分配置 | 总实例数 |
|------|---------|---------|
| 方案 A | 7 x 1g.10gb | 7 个 10GB 实例 |
| 方案 B | 3 x 2g.20gb + 1 x 1g.20gb | 4 个实例 |
| 方案 C | 2 x 3g.40gb | 2 个 40GB 实例 |

### 第 2 层：ComputeTemplate — 算力配比模板

ComputeTemplate 定义了如何对物理设备进行算力切分和超卖配比。

```go
type ComputeTemplateSpec struct {
    // GPU 厂商
    Manufacturer constants.Manufacturer `json:"manufacturer"`

    // GPU 型号（或 "all" 表示适用于该厂商所有型号）
    Model string `json:"model"`

    // 显存超分比例（字符串，如 "1.5" 表示 1.5 倍超卖）
    DeviceMemoryScaling string `json:"deviceMemoryScaling,omitempty"`

    // 算力超分比例（字符串，如 "2.0" 表示 2 倍超卖）
    DeviceCoreScaling string `json:"deviceCoreScaling,omitempty"`

    // 切分数量（1-20）
    DeviceSplitCount int `json:"deviceSplitCount,omitempty"`

    // 切分模式：硬切分（MIG）或软切分（HAMi-Core）
    ComputeSplitMode ComputeSplitMode `json:"computeSplitMode,omitempty"`
}
```

> — `api/device/v1alpha1/computetemplate_types.go:8-51`

**超分比例（Scaling Factor）**

超分是边缘场景的常见需求。以推理场景为例，GPU 的显存利用率通常只有 40-60%，合理的超卖可以提高资源利用率：

| 参数 | 默认值 | 含义 |
|------|--------|------|
| `deviceMemoryScaling` | `"1.0"` | 显存超分比例。`"1.5"` 表示 40GB 显存可分配 60GB |
| `deviceCoreScaling` | `"1.0"` | 算力超分比例。`"2.0"` 表示 100% 算力可分配 200% |
| `deviceSplitCount` | 10 | 切分数量。10 表示一张卡最多切分为 10 个虚拟 GPU |

**缩放因子同样使用字符串存储**，与 ComputeCapability 的 Value 字段设计一致，避免浮点精度问题。

**切分模式联动**

ComputeTemplate 的 `ComputeSplitMode` 与 `DeviceSplitCount` 联动：

| 切分模式 | ComputeSplitMode | 切分特点 |
|---------|------------------|---------|
| **硬切分（MIG）** | `"hard"` | 硬件级 GPU 分区，需要特定硬件支持（A100/H100），切分方案受 MigTemplates 约束 |
| **软切分（HAMi-Core）** | `"soft"` | 软件级虚拟化，所有 GPU 厂商通用，支持 1%-99% 任意比例切分 |

> **源码实证**：
> ```go
> const (
>     // 硬切分（英伟达 MIG 模式）
>     ComputeSplitModeHard = "hard"
>     // 软切分（HAMi-Core 模式）
>     ComputeSplitModeSoft = "soft"
> )
> ```
> — `api/device/v1alpha1/devicemodel_types.go:80-85`

### 第 3 层：ResourcePool — 资源池与调度策略

ResourcePool 将设备组织成逻辑资源池，并关联调度器：

```go
type ResourcePoolSpec struct {
    // 调度器名称：hami、volcano、kubernetes
    Scheduler string `json:"scheduler,omitempty"`
}

type ResourcePoolStatus struct {
    Items       []ItemDetail             `json:"items,omitempty"`
    Allocatable *v1alpha1.DeviceResource `json:"allocatable,omitempty"` // 可分配资源
    Request     *v1alpha1.DeviceResource `json:"request,omitempty"`     // 已请求资源
    Limit       *v1alpha1.DeviceResource `json:"limit,omitempty"`       // 资源上限
}
```

> — `api/device/v1alpha1/resourcepool_types.go:29-41`

**三种调度器**

| 调度器 | 标识 | 适用场景 | 中文说明 |
|--------|------|---------|---------|
| **HAMi** | `hami` | AI 推理、开发调试 | 支持虚拟 GPU 切分，按算力/显存细粒度分配 |
| **Volcano** | `volcano` | AI 训练、微调 | 支持 Gang Scheduling，确保训练任务的 GPU 同时分配 |
| **Kubernetes** | `kubernetes` | 标准工作负载 | 使用 K8s 原生调度器，适用于不需要 GPU 虚拟化的场景 |

> **源码实证**：
> ```go
> const (
>     SchedulerHAMI       = "hami"
>     SchedulerVolcano    = "volcano"
>     SchedulerKubernetes = "kubernetes"
> )
> ```
> — `pkg/constants/device.go:134-136`

**三种资源池策略**

ResourcePool 通过 Label 标记其使用策略：

| 策略 | 含义 | 适用场景 |
|------|------|---------|
| `shared` | 共享资源池 | 多个团队/应用共享 GPU 资源 |
| `dedicated` | 独占资源池 | 特定应用独占 GPU，保证性能隔离 |
| `reserved` | 预留资源池 | 为未来扩展预留，当前不参与调度 |

> **源码实证**：
> ```go
> type ResourcePoolStrategy string
> const (
>     ResourcePoolStrategyShared    ResourcePoolStrategy = "shared"
>     ResourcePoolStrategyDedicated ResourcePoolStrategy = "dedicated"
>     ResourcePoolStrategyReserved  ResourcePoolStrategy = "reserved"
> )
> ```
> — `pkg/constants/device.go:119-125`

**资源池的三级作用域**

ResourcePool 的成员可以按三种作用域定义：

```go
const (
    ResourcePoolScopeGlobal ResourcePoolScope = "global"  // 全局：所有 GPU 设备
    ResourcePoolScopeNode   ResourcePoolScope = "node"    // 节点级：指定节点上的 GPU
    ResourcePoolScopeDevice ResourcePoolScope = "device"  // 设备级：指定的 GPU 设备
)
```

> — `pkg/constants/device.go:128-131`

通过 `ResourcePoolItem` CRD 将具体的节点或设备关联到资源池：

```go
type ResourcePoolItemSpec struct {
    Scope            constants.ResourcePoolScope `json:"scope,omitempty"`
    ResourcePoolName string                      `json:"resourcePoolName,omitempty"`
}
```

> — `api/device/v1alpha1/resourcepoolitem_types.go:28-36`

### 第 4 层：NodeConfig — 节点级配置

NodeConfig 是每个计算节点的算力配置聚合体。它将 DeviceModel、ComputeTemplate 和 Device Plugin 在节点级别关联起来：

```go
type NodeConfigSpec struct {
    // 每个厂商的独立配置
    ManufacturerSpecs []ManufacturerSpec `json:"manufacturerSpec,omitempty"`
}

type ManufacturerSpec struct {
    // Device Plugin 名称
    DevicePlugin string `json:"devicePlugin,omitempty"`

    // 默认 ComputeTemplate
    ComputeTemplate string `json:"computeTemplate,omitempty"`

    // 每个设备可以使用不同的 ComputeTemplate
    DeviceComputes []DeviceComputeTemplate `json:"deviceComputeTemplate,omitempty"`

    // 禁用的设备列表（用于故障隔离）
    DisabledDevices []string `json:"disabledDevices,omitempty"`
}
```

> — `api/device/v1alpha1/nodeconfig_types.go:27-36`

NodeConfig 的设计体现了"每个厂商独立配置"的原则——同一个节点可能插着 NVIDIA 和昇腾两种卡，每种卡有不同的 Device Plugin 和 ComputeTemplate。

NodeConfig 的 Status 包含运行时信息：

```go
type ManufactureStatus struct {
    DevicePlgingMeta    v1alpha1.DevicePluginMeta `json:"devicePluginMeta,omitempty"`
    DevicePlgingRuntime DevicePlgingRuntime       `json:"devicePlgingRuntime,omitempty"`
}

type DevicePlgingRuntime struct {
    DevicePluginStatus string              `json:"devicePluginStatus,omitempty"` // init/running/error
    DriverVersion      string              `json:"driverVersion,omitempty"`
    ToolkitVersion     string              `json:"toolkitVersion,omitempty"`
    ComputeTemplate    ComputeTemplateSpec `json:"computeTemplate,omitempty"`
}
```

> — `api/device/v1alpha1/nodeconfig_types.go:43-55`

### 四层抽象的协作关系

四层 CRD 的数据流形成了一条从物理硬件到可分配算力的丰富化管线：

```
物理 GPU 设备
    │
    ▼
DeviceModel 匹配（根据 Manufacturer + Model 标签）
    │  → 获取：显存大小、算力规格、切分支持
    │
    ▼
ComputeTemplate 关联（通过 NodeConfig 或 Label）
    │  → 获取：超分比例、切分数量、切分模式
    │
    ▼
ResourcePool 归属（通过 ResourcePoolItem）
    │  → 获取：调度器类型、资源池策略
    │
    ▼
可分配算力（Allocatable）
    → 对外暴露：core（算力百分比）、memory（显存 MB）、TFLOPS 值
```

---

## 4.3 GPU 虚拟化 — 双模切分

### 为什么需要 GPU 虚拟化

一张物理 GPU 的算力远超单个推理任务的需求。以 NVIDIA A100 为例，其 FP16 算力达到 312 TFLOPS，而一个典型的质检推理模型只需要 10-20 TFLOPS。如果每个推理任务独占一张卡，GPU 利用率不到 10%。

GPU 虚拟化的核心价值是：**将一张物理卡切分为多个虚拟 GPU，让多个推理任务共享同一张卡，显著提高利用率。**

### 硬切分（MIG 模式）

**适用硬件**：NVIDIA A100、H100 等支持 MIG（Multi-Instance GPU）的型号。

MIG 是 NVIDIA 提供的硬件级 GPU 分区技术。它将一张 GPU 在硬件层面切分为多个独立的实例，每个实例拥有独立的显存、缓存和计算引擎，实现**硬件级隔离**。

MIG 的切分方案是预定义的，通过 DeviceModel 的 `MigTemplates` 字段配置。切分后的每个实例作为一个独立的虚拟 DeviceModel 注册到系统中。

**优势**：硬件级隔离，一个实例的故障不影响其他实例。
**局限**：只有特定的 NVIDIA 高端卡支持，切分粒度受硬件限制。

### 软切分（HAMi-Core 模式）

**适用硬件**：所有 9 大 GPU 厂商的硬件，无硬件限制。

HAMi-Core 是软件层面的 GPU 虚拟化方案。它通过拦截 CUDA/ROCm 等 GPU 运行时的 API 调用，实现算力和显存的动态分配。

```
ComputeTemplate 配置：
  DeviceSplitCount: 10       → 一张卡最多切分为 10 个虚拟 GPU
  DeviceMemoryScaling: "1.5" → 显存超卖 1.5 倍
  DeviceCoreScaling: "1.0"   → 算力不超卖
  ComputeSplitMode: "soft"   → 使用 HAMi-Core 软切分
```

**优势**：所有厂商通用，支持 1%-99% 任意比例切分，灵活性极高。
**局限**：软件隔离，极端负载下可能存在资源争抢。

### 效果对比

| 指标 | 切分前 | 切分后 |
|------|--------|--------|
| GPU 数量 | 4 张 A100 | 2 张 A100（每张切分为 5 个 vGPU） |
| 并行推理任务 | 4 个 | 10 个 |
| 平均 GPU 利用率 | < 50% | ~92% |
| GPU 采购成本 | 基准 | 节省 50% |

**这是第二章"同样的硬件，价值倍增"的直接体现**——通过 GPU 虚拟化，同样数量的 GPU 卡可以服务 2.5 倍的推理任务。

---

## 4.4 全局调度策略

### GlobalConfig — 集群级调度配置

`GlobalConfig` CRD 定义了集群维度的全局调度策略：

```go
type GlobalConfigSpec struct {
    // 资源感知模式：按分配率 / 按使用率
    ResourceAwareness ResourceAwarenessMode `json:"resourceAwareness,omitempty"`

    // 节点调度策略：紧凑 / 均衡
    NodeScheduling SchedulingStrategy `json:"nodeScheduling,omitempty"`

    // GPU 调度策略：紧凑 / 均衡
    GPUScheduling SchedulingStrategy `json:"gpuScheduling,omitempty"`

    // 是否启用资源池
    ResourcePoolEnabled bool `json:"resourcePoolEnabled"`

    // 故障码告警级别：critical/high/middle/low
    AlertLevel []v1alpha1.Severity `json:"alertLevel,omitempty"`
}
```

> — `api/device/v1alpha1/globalconfig_types.go:47-78`

### 资源感知模式

| 模式 | 含义 | 适用场景 |
|------|------|---------|
| `allocation_rate`（默认） | 按已分配资源的比例进行调度决策 | 稳定负载，关注资源分配的均衡性 |
| `usage_rate` | 按实际使用率进行调度决策 | 动态负载，关注实际利用率 |

> **源码实证**：
> ```go
> const (
>     AllocationRate ResourceAwarenessMode = "allocation_rate"
>     UsageRate      ResourceAwarenessMode = "usage_rate"
> )
> ```
> — `api/device/v1alpha1/globalconfig_types.go:28-33`

### 调度策略组合

调度策略分为两个维度——节点级和 GPU 级：

| 维度 | Binpack（紧凑） | Spread（均衡） |
|------|----------------|---------------|
| **节点调度** | 尽量把 Pod 集中到少数节点 | 尽量把 Pod 分散到不同节点 |
| **GPU 调度** | 尽量把任务集中到少数 GPU | 尽量把任务分散到不同 GPU |

**默认组合**：节点级 Binpack + GPU 级 Spread。

```go
// NodeScheduling 默认紧凑
// +kubebuilder:default:=binpack
NodeScheduling SchedulingStrategy `json:"nodeScheduling,omitempty"`

// GPUScheduling 默认均衡
// +kubebuilder:default:=spread
GPUScheduling SchedulingStrategy `json:"gpuScheduling,omitempty"`
```

> — `api/device/v1alpha1/globalconfig_types.go:54-64`

**为什么这个默认组合是边缘场景的最佳选择？**

- **节点级 Binpack**：边缘场景下节点数量有限且分散。紧凑调度意味着尽量利用已有节点的资源，减少需要开机的边缘节点数量——在能耗敏感的边缘站点（如偏远基站），这直接降低了电力成本。
- **GPU 级 Spread**：单个 GPU 故障是边缘场景的常见问题（高温、灰尘、震动）。分散调度意味着即使一张 GPU 故障，只有部分推理任务受影响——而不是所有任务都集中在同一张卡上全军覆没。

这个默认组合体现了对边缘场景的深度理解：**节点资源紧凑使用（减少边缘开机成本），GPU 内分散调度（提高单节点容错性）。**

---

## 4.5 设备状态与健康管理

### 设备状态

每个 GPU 设备有三种状态：

| 状态 | 含义 |
|------|------|
| `Available`（启用） | 设备正常，参与调度 |
| `Unschedulable`（禁用） | 设备被人工禁用，不参与调度 |
| `Unknown`（未知） | 设备状态不可知 |

### 健康检查

设备健康状态通过 Device Plugin 上报：

| 健康状态 | 含义 |
|---------|------|
| `Healthy`（已就绪） | 设备正常运行 |
| `UnHealthy`（异常） | 设备存在故障（温度过高、驱动异常等） |

> **源码实证**：
> ```go
> const (
>     DeviceHealthy   = "Healthy"
>     DeviceUnHealthy = "UnHealthy"
> )
> ```
> — `pkg/constants/device.go:168-170`

结合 GlobalConfig 的告警级别配置（`AlertLevel`），设备异常时可以触发 critical/high/middle/low 不同级别的告警，对接第九章的可观测体系。

### 设备禁用机制

NodeConfig 的 `DisabledDevices` 字段支持在不物理移除硬件的情况下禁用特定 GPU：

```go
// 禁用的设备列表（用于故障隔离）
DisabledDevices []string `json:"disabledDevices,omitempty"`
```

这在边缘场景下特别有用——当某张 GPU 出现间歇性故障时，运维人员可以远程禁用该设备（通过修改 NodeConfig），等待现场维修，而不影响同一节点上其他 GPU 的正常调度。

---

## 4.6 国产化适配策略

### 为什么国产 GPU 适配是刚需

随着国产化替代政策的推进，越来越多的边缘项目要求使用国产 GPU/NPU。但国产 GPU 的生态成熟度远不如 NVIDIA，具体表现为：

- Device Plugin 实现各不相同，资源请求格式不统一
- 部分厂商缺少虚拟化支持
- 调度器集成程度参差不齐

### 平台的适配策略

平台通过四层 CRD 架构实现了对国产 GPU 的透明适配：

1. **DeviceModel 层**：每种国产 GPU 型号注册为独立的 DeviceModel，定义其算力规格和切分能力
2. **ComputeTemplate 层**：通过 `theriseunion.io/model-scope: "all"` 标签，可以为一个厂商的所有型号设置统一的超卖模板
3. **NodeConfig 层**：每个节点按厂商独立配置 Device Plugin，互不影响
4. **ResourcePool 层**：国产 GPU 和 NVIDIA GPU 可以在同一个资源池中统一调度

**对应用开发者而言，底层是 NVIDIA 还是昇腾是透明的。** 应用只需声明算力需求（如 `core: 50, memory: 20480`），调度器自动选择满足需求的 GPU，无论其厂商和型号。

---

## 4.7 本章小结

算力就绪回答了"应用的 GPU 需求如何被透明满足"的问题：

| 能力 | 实现方式 | 效果 |
|------|---------|------|
| 9 大厂商统一 | Manufacturer 常量 + 统一 Label 体系 | 应用无需感知底层是哪家的 GPU |
| 硬件规格抽象 | DeviceModel CRD（物理/虚拟统一建模） | 多精度算力、MIG 模板、显存步长全面描述 |
| 算力切分配比 | ComputeTemplate CRD（超分 + 切分） | 一张卡切分为 1-20 个虚拟 GPU |
| 资源池管理 | ResourcePool + ResourcePoolItem | shared/dedicated/reserved 三种策略 |
| 节点级配置 | NodeConfig CRD（按厂商独立配置） | 同一节点支持多厂商 GPU 共存 |
| 双模虚拟化 | MIG 硬切分 + HAMi-Core 软切分 | GPU 利用率从 <50% 提升到 ~92% |
| 全局调度 | GlobalConfig（节点 Binpack + GPU Spread） | 边缘场景的最佳成本/容错平衡 |
| 国产化支持 | 四层 CRD 透明适配 | 应用定义不包含任何厂商细节 |

这套算力管理体系的核心价值在于：**将"应用需要 GPU"这个需求，从硬件选型问题转化为声明式配置问题。** 应用开发者不需要知道边缘有什么 GPU，不需要关心 Device Plugin 的配置方式，只需要声明算力需求——其他一切由平台自动处理。

这是第二章提出的"应用与硬件解耦"的关键实现。**换 GPU 不改应用，加 GPU 不改调度。**

---

*下一章：第五章 — 组织与安全，多团队安全共享应用平台*
