# 第六章：应用供应链 — 从开发到上架

> **应用面对的问题**：应用怎么打包？支持哪些部署形态？怎么让其他团队用到我的应用？怎么审核质量？

---

## 引言：应用的"最后一公里"不是部署，是上架

当我们谈论"应用到达边缘"时，最容易被忽视的环节不是部署，而是部署之前的准备：应用怎么定义？怎么打包？怎么让其他团队发现并使用？怎么确保质量？

传统边缘项目中，应用的交付方式通常是"打包一个容器镜像，写一份部署文档，交给运维手动操作"。这种方式在管理 3-5 个应用时尚可接受，但当应用数量增长到数十个、参与团队增长到数个时，就会暴露出根本性的缺陷：

- **无标准化打包**：每个应用的部署方式不同，有的是单个容器，有的是 Helm Chart，有的是 AI 模型，运维需要为每种类型编写不同的部署脚本。
- **无质量关卡**：任何应用都可以直接部署到生产边缘，缺少审核机制，质量失控的应用可能影响整个站点的稳定性。
- **无共享机制**：A 团队开发的优秀应用，B 团队无法发现也无法复用，应用的价值被限制在单个团队内。

本章介绍平台的应用供应链体系——从应用定义、多形态支持、审核上架到版本管理的完整链路。

---

## 6.1 三层应用资源模型

### 设计哲学：类 PVC 的声明式模型

平台的应用管理采用了类似 Kubernetes PersistentVolumeClaim（PVC）的设计模式。就像用户通过 PVC 声明"我需要 10GB 存储"而无需关心底层是 NFS 还是 Ceph，应用开发者通过 Application CRD 声明"这是一个什么应用"而无需关心底层的部署引擎。

> **源码实证**：`Application` CRD 的设计注释明确标注了这一设计哲学：
> ```go
> // ApplicationSpec defines the desired state of Application
> // Application 类似 PVC，用户申请的应用定义
> ```
> — `api/app/v1alpha1/application_types.go:24`

### 三层资源层级

应用资源通过三层 CRD 组织：

```
Application（应用定义）
  │
  ├── ApplicationVersion v1.0.0（版本 1，包含具体配置）
  ├── ApplicationVersion v1.1.0（版本 2，配置变更）
  └── ApplicationVersion v2.0.0（版本 3，大版本更新）
        │
        ├── ApplicationDeployment（部署到北京站点）
        └── ApplicationDeployment（部署到上海站点）
```

每一层的职责分离清晰：

| CRD 层级 | 职责 | 作用域 | 关键字段 |
|----------|------|--------|---------|
| **Application** | 应用的身份定义 | Cluster 级 | Provisioner 类型（Label）、类别、所属 Workspace |
| **ApplicationVersion** | 应用的具体配置 | Cluster 级 | 版本号、WorkloadConfig / HelmConfig / ModelConfig、审核状态 |
| **ApplicationDeployment** | 应用的部署实例 | Namespace 级 | 引用的应用版本、部署拓扑列表、运行状态 |

### 为什么 Application 的 Spec 几乎为空？

一个值得注意的设计决策是：`ApplicationSpec` 结构体几乎没有字段，所有元数据通过 Labels 和 Annotations 管理。

```go
type ApplicationSpec struct {
    // Spec 当前为空，所有配置通过 Labels 和 Annotations 管理
}
```

这不是偶然的简化，而是有意为之的架构选择：

1. **Provisioner 类型不可变**：通过 Label `app.theriseunion.io/provisioner` 指定，Webhook 验证确保创建后不可修改。这保证了应用的部署引擎在整个生命周期内一致。
2. **元数据灵活扩展**：显示名称、描述、分类等通过 Annotations 存储，无需修改 CRD Schema 即可扩展新的元数据。
3. **统计信息外置**：版本计数、部署计数等统计数据不存储在 CRD Status 中，而是通过可观测系统（Prometheus）查询，避免 Controller 复杂度增加和 etcd 写入压力。

> **源码实证**：
> ```go
> // 注意：统计信息（如 versionCount, latestVersion）应通过可观测系统（Prometheus）查询
> // 不应存储在 CRD Status 中，避免增加 Controller 复杂度和 etcd 压力
> ```
> — `api/app/v1alpha1/application_types.go:48-49`

---

## 6.2 可插拔 Provisioner 架构

### 问题：不同应用需要不同的部署引擎

边缘场景下的应用形态远比云端复杂：

- **标准微服务**：一个 Nginx 反向代理 + 一个业务 API 容器，需要 Kubernetes Deployment。
- **复杂多组件应用**：一个完整的监控栈（Prometheus + Grafana + AlertManager），需要 Helm Chart 统一管理。
- **AI 推理模型**：一个 PyTorch 质检模型，需要特定的推理运行时（TorchServe）和 GPU 资源配置。

如果为每种应用类型编写独立的管理逻辑，代码会迅速膨胀且难以维护。

### 解决方案：类 CSI 的 Provisioner 插件模式

平台借鉴了 Kubernetes CSI（Container Storage Interface）的设计思想：通过 Provisioner 标识路由到不同的部署引擎，所有 Provisioner 实现统一的操作接口。

#### 三种 Provisioner 类型

**1. Workload Provisioner（标准微服务）**

适用场景：由一个或多个容器组成的标准 Kubernetes 工作负载。

```go
type WorkloadConfig struct {
    // Deployments 定义 Deployment 列表
    Deployments []WorkloadDeployment `json:"deployments,omitempty"`
}

type WorkloadDeployment struct {
    Name string         `json:"name"`       // 工作负载名称
    Spec DeploymentSpec `json:"spec"`       // 简化的 Deployment 规格
}
```

Workload Provisioner 直接将 `WorkloadConfig` 中定义的 Deployment 转换为 Kubernetes 原生 Deployment 资源。一个 `ApplicationVersion` 可以包含多个 `WorkloadDeployment`，支持多容器组合的应用定义。

> **源码实证**：Controller 在 Reconcile 过程中遍历 `WorkloadConfig.Deployments` 列表，为每个 Deployment 配置创建对应的 K8s Deployment 资源。
> — `internal/controller/application/applicationdeployment_controller.go:666`

**2. Helm Provisioner（复杂多组件应用）**

适用场景：使用 Helm Chart 打包的复杂应用，包含多个 K8s 资源（Deployment、Service、ConfigMap、PVC 等）。

```go
type HelmConfig struct {
    ChartName    string `json:"chartName"`    // Helm Chart 名称
    ChartVersion string `json:"chartVersion"` // Helm Chart 版本
    Repository   string `json:"repository"`   // Helm 仓库地址
    Values       string `json:"values,omitempty"` // Helm Values（YAML 格式）
}
```

Helm Provisioner 利用 Helm 的成熟生态，支持：
- 标准 Helm 仓库的 Chart 引用
- 自定义 Values 覆盖
- Helm 的版本管理与回滚能力

**3. Model Provisioner（AI 模型）**

适用场景：AI 推理模型的部署，需要特定的模型框架、推理运行时和 GPU 资源。

```go
type ModelConfig struct {
    ModelName     string `json:"modelName"`     // 模型名称
    ModelVersion  string `json:"modelVersion"`  // 模型版本
    Framework     string `json:"framework"`     // 框架（PyTorch/TensorFlow/ONNX）
    Runtime       string `json:"runtime"`       // 运行时（TorchServe/Triton 等）
    StorageURI    string `json:"storageURI"`    // 模型存储地址
    Replicas      *int32 `json:"replicas"`      // 副本数
    GPU           int32  `json:"gpu"`           // GPU 数量
    CPURequest    string `json:"cpuRequest"`    // CPU 请求
    MemoryRequest string `json:"memoryRequest"` // 内存请求
}
```

Model Provisioner 将 AI 模型的部署抽象为声明式配置：开发者只需声明"用 PyTorch 框架、TorchServe 运行时、需要 1 个 GPU"，平台自动处理运行时环境配置、模型文件加载和服务暴露。

### Provisioner 的路由机制

Provisioner 类型通过 Application CRD 的 Label 指定，实现了配置与路由的解耦：

```yaml
metadata:
  labels:
    app.theriseunion.io/provisioner: "workload"  # 或 "helm" 或 "model"
```

Controller 在 Reconcile 时根据此 Label 选择对应的处理逻辑。这意味着：
- **添加新的 Provisioner 类型不需要修改已有代码**——只需注册新的处理函数
- **应用定义与 Provisioner 实现解耦**——Application 不知道自己将被哪种引擎部署
- **同一套管理 API 覆盖所有应用类型**——前端不需要为不同类型的应用编写不同的管理界面

### 与竞品的差异

| 能力 | 本平台 | 华为 IEF | 阿里 ACK@Edge |
|------|--------|---------|--------------|
| 应用类型抽象 | 三种 Provisioner 统一接口 | 容器应用 + 函数应用 | 容器应用 |
| AI 模型支持 | 原生 ModelConfig（框架+运行时+GPU） | 需自行编排 | 需自行编排 |
| 扩展性 | 新增 Provisioner 只需实现接口 | 固定类型 | 固定类型 |
| Helm 生态 | 原生 HelmConfig 支持 | 有限支持 | 有限支持 |

---

## 6.3 应用商店与审核流程

### 设计理念：借鉴 App Store 模式

平台的应用商店借鉴了移动端 App Store 的核心模式：**工作空间开发 → 平台审核 → 全域可见。**

这解决了企业内部应用共享的三个关键问题：
1. **发现性**：B 团队如何发现 A 团队开发的可复用应用？
2. **质量保障**：未经验证的应用是否会影响其他团队的稳定性？
3. **权限控制**：谁有权上架应用？谁有权审核？

### 审核状态机

每个 `ApplicationVersion` 拥有独立的审核状态（ReviewPhase），状态流转如下：

```
                        ┌──── 平台管理员 ────┐
                        │                    │
    Workspace 开发者     v                    v
  ──────────────────→ Pending ──────────→ Approved ──→ 全局商店可见
      提交审核          (待审核)     通过    (已通过)
                        │
                        │ 拒绝
                        v
                     Rejected
                     (已拒绝，可修改后重新提交)
```

> **源码实证**：审核状态定义清晰，三种状态互斥：
> ```go
> const (
>     ReviewPhasePending  ReviewPhase = "Pending"   // 待审核
>     ReviewPhaseApproved ReviewPhase = "Approved"  // 已通过
>     ReviewPhaseRejected ReviewPhase = "Rejected"  // 已拒绝
> )
> ```
> — `api/app/v1alpha1/applicationversion_types.go:28-35`

### 审核流程的完整链路

**第一步：Workspace 开发者提交审核**

开发者在自己的工作空间完成应用开发和测试后，调用提交接口：

```
POST /workspaces/{workspace}/applications/{application}/versions/{version}/review
```

系统执行以下验证：
1. 验证应用存在且属于指定 Workspace（Label 校验）
2. 查找匹配的版本（通过 `app.theriseunion.io/application` Label 过滤）
3. 检查版本未曾提交过（ReviewPhase 为空）
4. 设置 `ReviewPhase = Pending`，记录提交者和提交时间

> **源码实证**：提交审核时会进行严格的所属验证：
> ```go
> if app.Labels["theriseunion.io/workspace"] != workspace {
>     // 应用不属于此 Workspace，返回 404
> }
> ```
> — `pkg/oapis/app/v1alpha1/handler_review.go:102`

**第二步：平台管理员审核**

管理员可以查看所有待审核的应用版本，逐个审核通过或拒绝：

```
POST /applicationversions/{name}/approve   # 审核通过
POST /applicationversions/{name}/reject    # 审核拒绝
```

审核操作具备**幂等性**——对已通过的版本重复调用 approve 不会报错，直接返回成功：

```go
// 幂等性：如果已经是 Approved，直接返回成功
if appVersion.Status.ReviewPhase == appv1alpha1.ReviewPhaseApproved {
    resp.WriteHeaderAndEntity(http.StatusOK, appVersion)
    return
}
```

> — `pkg/oapis/app/v1alpha1/handler_review.go:185-188`

**第三步：全局商店展示**

审核通过后，应用出现在全局商店的浏览列表中。商店的 API 设计确保**只有审核通过的版本才可见**：

```
GET /store/applications             # 浏览所有有审核通过版本的应用
GET /store/applications/{name}      # 查看应用详情
GET /store/applications/{name}/versions  # 列出审核通过的版本
```

> **源码实证**：商店浏览接口严格过滤审核状态：
> ```go
> // 只返回 ReviewPhase=Approved 的应用版本
> for _, version := range versionList.Items {
>     if version.Status.ReviewPhase == appv1alpha1.ReviewPhaseApproved {
>         approvedApps[version.Spec.ApplicationRef] = true
>     }
> }
> ```
> — `pkg/oapis/app/v1alpha1/handler_store.go:96-98`

### 同一应用的多版本并行审核

一个关键设计：**同一个 Application 可以有多个 ApplicationVersion 处于不同的审核状态。** 例如：

| 版本 | 审核状态 | 说明 |
|------|---------|------|
| v1.0.0 | Approved | 当前生产版本，全局商店可见 |
| v1.1.0 | Pending | 新功能版本，等待审核 |
| v2.0.0 | （未提交） | 开发中，仅在 Workspace 内可用 |

这支持了应用的持续迭代——开发者可以在不影响已上架版本的情况下，提交新版本等待审核。

### 商店搜索能力

全局商店支持按 Provisioner 类型过滤和关键词搜索：

```
GET /store/applications?provisioner=model&search=质检
```

搜索覆盖应用名称、显示名称和描述三个维度，不区分大小写。

---

## 6.4 版本管理与资源所有权

### 版本的生命周期

每个 `ApplicationVersion` 记录完整的审核信息：

```go
type ApplicationVersionStatus struct {
    Phase         string       // 版本阶段
    ReviewPhase   ReviewPhase  // 审核状态
    ReviewMessage string       // 审核信息（拒绝原因等）
    ReviewTime    *metav1.Time // 审核时间
    Reviewer      string       // 审核人
    Conditions    []metav1.Condition // 状态条件
}
```

这确保了完整的审计追踪：谁在什么时间以什么理由通过或拒绝了这个版本。

### 资源所有权链

应用资源的层级关系通过 Kubernetes OwnerReference 机制管理：

```
Application
  └── ApplicationVersion（通过 spec.applicationRef 引用）
        └── ApplicationDeployment（通过 spec.applicationVersion 引用）
              └── K8s Deployment（OwnerReference 指向 ApplicationDeployment）
                    └── ReplicaSet → Pod
```

这个所有权链的关键设计：

1. **Finalizer 保护**：`ApplicationDeployment` 注册了 `applicationdeployment.finalizer.app.theriseunion.io`。删除时，Finalizer 确保先清理所有底层 K8s Deployment，再移除 Finalizer 允许删除。

> **源码实证**：
> ```go
> const TopologyFinalizer = "applicationdeployment.finalizer.app.theriseunion.io"
>
> // 正在删除，清理资源
> if hasStringTopology(appDeployment.ObjectMeta.Finalizers, TopologyFinalizer) {
>     if err := r.cleanupTopologies(ctx, appDeployment); err != nil {
>         return ctrl.Result{}, err
>     }
>     // 移除 Finalizer
>     appDeployment.ObjectMeta.Finalizers = removeStringTopology(...)
> }
> ```
> — `internal/controller/application/applicationdeployment_controller.go:47,115-127`

2. **OwnerReference 级联**：K8s Deployment 设置了 `Controller: true` 和 `BlockOwnerDeletion: true` 的 OwnerReference 指向 ApplicationDeployment。这意味着删除 ApplicationDeployment 会自动触发 K8s 的垃圾回收机制，级联删除所有底层 Deployment。

3. **双重保护**：Finalizer 确保清理逻辑的执行，OwnerReference 确保即使 Finalizer 逻辑有遗漏，K8s 原生的垃圾回收仍会兜底清理。

---

## 6.5 本章小结

应用供应链回答了"应用怎么从开发走向生产"的问题：

| 环节 | 机制 | 效果 |
|------|------|------|
| 应用定义 | 类 PVC 的三层 CRD 模型 | 身份、版本、部署三层分离 |
| 多形态支持 | 可插拔 Provisioner（Workload/Helm/Model） | 一套管理接口覆盖所有应用类型 |
| 质量关卡 | ReviewPhase 三态审核 | Workspace 开发 → 平台审核 → 全域可见 |
| 应用发现 | 全局应用商店 + 搜索过滤 | 跨团队应用共享和复用 |
| 生命周期保护 | Finalizer + OwnerReference 双重保护 | 删除安全，不残留孤儿资源 |

这套供应链体系的核心价值在于：**让应用的价值不被限制在单个团队、单个站点内。** 一个团队的优秀应用，经过审核后可以被全平台共享和复用——这是第二章提出的"应用价值持续释放"的制度性保障。

---

*下一章：第七章 — 应用部署，到达每一个边缘*
