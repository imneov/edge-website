# 第七章：应用部署 — 到达每一个边缘

> **应用面对的问题**：同一个应用要部署到北京、上海、云端多个位置，怎么统一管理？版本怎么批量切换？部署状态怎么一眼看全？

---

## 引言：部署不是一次性操作，是持续管理

在第六章中，应用完成了打包、审核和上架。接下来的问题是：**应用怎么从商店到达每一个边缘站点？**

传统方式下，部署一个应用到 N 个边缘站点意味着重复 N 次操作：登录每个站点的管理界面、选择应用和版本、配置参数、确认部署。当站点数量从 5 个增长到 50 个、500 个时，这种方式的运维成本呈线性增长。

更棘手的问题是版本管理。当质检模型从 v1.0 升级到 v1.1 时，运维人员需要：
1. 记住哪些站点部署了这个模型
2. 逐个站点执行版本更新
3. 逐个验证更新结果
4. 如果出错，逐个站点回滚

本章介绍平台的 Topology-Based 部署模型——通过一个声明式的 `ApplicationDeployment` 资源，统一管理应用在多个边缘站点的部署、版本切换和状态追踪。

---

## 7.1 Topology-Based 云边混合部署

### 核心概念：一个部署，多个拓扑

`ApplicationDeployment` 是应用部署的核心 CRD。它的设计思想是：**用一个资源声明应用在所有目标位置的部署期望，Controller 自动为每个位置创建和管理对应的工作负载。**

```yaml
apiVersion: app.theriseunion.io/v1alpha1
kind: ApplicationDeployment
metadata:
  name: quality-inspection-deploy
  namespace: manufacturing
spec:
  application: quality-inspection
  version: "1.1.0"
  topologies:
    - nodeGroup: "beijing-factory"      # 北京工厂站点
    - nodeGroup: "shanghai-factory"     # 上海工厂站点
    - nodeGroup: "guangzhou-factory"    # 广州工厂站点
    - nodeGroup: "__cloud__"            # 云端运行实例
```

这个简洁的声明背后，Controller 会自动执行以下操作：

1. 解析 `version: "1.1.0"` 找到对应的 `ApplicationVersion` 资源
2. 从 `ApplicationVersion` 中提取 `WorkloadConfig` 配置
3. 为每个 Topology 创建独立的 Kubernetes Deployment
4. 为边缘拓扑设置 `nodeSelector` 确保调度到正确的节点组
5. 为云端拓扑（`__cloud__`）使用默认调度策略
6. 持续追踪每个 Topology 的部署状态

### 云端与边缘的差异处理

Controller 根据 Topology 的 `nodeGroup` 值自动判断部署类型：

| nodeGroup 值 | 部署类型 | nodeSelector | 调度策略 |
|-------------|---------|-------------|---------|
| `__cloud__` | 云端部署 | 不设置 | K8s 默认调度器决定 |
| 其他值（如 `beijing-factory`） | 边缘部署 | `nodeGroup: beijing-factory` | 限定到指定节点组 |

> **源码实证**：Controller 通过 `__cloud__` 标识区分云端和边缘部署：
> ```go
> func (r *ApplicationDeploymentReconciler) isCloudDeployment(
>     ctx context.Context, appDeployment *appv1alpha1.ApplicationDeployment,
> ) (bool, error) {
>     for _, topology := range appDeployment.Spec.Topologies {
>         if topology.NodeGroup == "__cloud__" {
>             return true, nil
>         }
>     }
>     return false, nil
> }
> ```
> — `internal/controller/application/applicationdeployment_controller.go:292-309`

边缘部署时，Controller 为每个 Deployment 设置精确的 `nodeSelector`：

```go
// 添加拓扑相关的节点选择器
if topology.NodeGroup != "" {
    deploy.Spec.Template.Spec.NodeSelector[constants.NodeGroupLabelKey] = topology.NodeGroup
}
if topology.NodeName != "" {
    deploy.Spec.Template.Spec.NodeSelector["kubernetes.io/hostname"] = topology.NodeName
}
```

> — `internal/controller/application/applicationdeployment_controller.go:847-858`

### Topology 差异计算

当 `ApplicationDeployment` 的 Topology 列表发生变化时（例如新增了一个站点或移除了一个站点），Controller 通过三路差异计算精确执行操作：

```
期望拓扑列表（Spec）   vs   现有拓扑状态（Status）
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     toAdd            toUpdate          toRemove
   （新拓扑）        （需更新）         （需删除）
        │                 │                 │
   创建 Deployment   更新配置        删除 Deployment
```

> **源码实证**：
> ```go
> func (r *ApplicationDeploymentReconciler) calculateTopologyDifferences(
>     expectedTopologies []appv1alpha1.DeploymentTopology,
>     existingTopologyMap map[string]appv1alpha1.TopologyStatus,
> ) ([]topologyWithIndex, []appv1alpha1.TopologyStatus, []appv1alpha1.TopologyStatus) {
>     var toAdd []topologyWithIndex
>     var toUpdate []appv1alpha1.TopologyStatus
>     var toRemove []appv1alpha1.TopologyStatus
>     // ... 三路差异计算
> }
> ```
> — `internal/controller/application/applicationdeployment_controller.go:376-417`

这意味着：
- **新增站点**：在 Topology 列表中添加一项，Controller 自动创建该站点的 Deployment
- **移除站点**：从 Topology 列表中删除一项，Controller 自动清理该站点的 Deployment
- **无需逐个站点操作**：所有变更通过修改一个 `ApplicationDeployment` 资源一次性声明

---

## 7.2 部署状态聚合与追踪

### 每个 Topology 独立追踪

`ApplicationDeployment` 的 Status 中包含每个 Topology 的独立状态：

```go
type TopologyStatus struct {
    TopologyIndex int32               // 拓扑索引
    Topology      DeploymentTopology  // 拓扑定义
    WorkloadName  string              // 创建的 K8s Deployment 名称
    Nodes         []string            // Pod 实际运行的节点列表
    Replicas      int32               // 期望副本数
    ReadyReplicas int32               // 就绪副本数
    Phase         DeploymentPhase     // 当前状态
    Message       string              // 状态消息
}
```

每个 Topology 拥有独立的 Phase 状态：

| Phase | 含义 |
|-------|------|
| `Pending` | 等待部署或部署中 |
| `Deploying` | 部署进行中 |
| `Running` | 所有副本就绪，正常运行 |
| `Failed` | 部署失败 |
| `Upgrading` | 版本升级中 |

### 全局状态聚合

Controller 从所有 Topology 的状态中聚合出全局视图：

```go
func (r *ApplicationDeploymentReconciler) calculateOverallStatus(
    deployment *appv1alpha1.ApplicationDeployment,
) {
    var readyCount int32
    var totalReplicas int32
    var readyReplicas int32

    for _, topologyStatus := range deployment.Status.TopologyStatuses {
        if topologyStatus.Phase == appv1alpha1.DeploymentPhaseRunning {
            readyCount++
        }
        totalReplicas += topologyStatus.Replicas
        readyReplicas += topologyStatus.ReadyReplicas
    }

    deployment.Status.ReadyStatus = fmt.Sprintf("%d/%d", readyReplicas, totalReplicas)
    // ...
}
```

> — `internal/controller/application/applicationdeployment_controller.go:536-576`

运维人员通过 `kubectl get` 即可一眼看到全局部署状态：

```
$ kubectl get applicationdeployments -n manufacturing
NAME                          APPLICATION           VERSION   READY    PHASE
quality-inspection-deploy     quality-inspection    1.1.0     12/12    Running
energy-optimizer-deploy       energy-optimizer      2.0.0     8/10     Pending
```

`READY` 列的 `12/12` 表示所有 12 个副本（分布在 4 个站点）全部就绪。`8/10` 表示还有 2 个副本未就绪——可能某个边缘站点正在拉取镜像或等待资源调度。

### 事件驱动的状态更新

Controller 不仅监听 `ApplicationDeployment` 的变化，还通过 Watch 机制监听底层 K8s Deployment 的状态变化：

```go
return ctrl.NewControllerManagedBy(mgr).
    For(&appv1alpha1.ApplicationDeployment{}).
    Watches(
        &appsv1.Deployment{},
        &deploymentHandler{reconciler: r},
    ).
    Complete(r)
```

> — `internal/controller/application/applicationdeployment_controller.go:69-80`

当某个边缘站点的 K8s Deployment 状态发生变化（Pod 重启、副本数变化等），事件会自动传播到对应的 `ApplicationDeployment`，触发状态更新。这确保了 `ApplicationDeployment` 的状态始终反映最新的真实情况。

---

## 7.3 版本管理与变更历史

### 版本切换

更新应用版本只需修改 `ApplicationDeployment` 的 `version` 字段：

```yaml
spec:
  version: "1.1.0"  # 从 "1.0.0" 更新到 "1.1.0"
```

Controller 检测到版本变更后，会自动为所有 Topology 执行滚动更新：
1. 获取新版本的 `ApplicationVersion` 配置
2. 对比新旧配置的差异
3. 更新每个 Topology 对应的 K8s Deployment
4. K8s 的滚动更新策略确保零停机

### 变更历史追踪

每次版本变更都被记录在 `DeploymentHistory` 中：

```go
type DeploymentHistory struct {
    Application   string            // 应用名称
    FromVersion   string            // 变更前版本
    ToVersion     string            // 变更后版本
    Reason        HistoryReason     // 变更原因（Initial/Upgrade/Rollback）
    Timestamp     metav1.Time       // 变更时间
    Operator      string            // 操作人
    Message       string            // 变更说明
    WorkloadCount int32             // 变更时的工作负载数量
    TotalReplicas int32             // 变更时的总副本数
    ReadyReplicas int32             // 变更时的就绪副本数
    Topologies    []DeploymentTopology // 变更时的拓扑快照
}
```

变更原因（`HistoryReason`）区分三种场景：
- `Initial`：首次部署
- `Upgrade`：版本升级
- `Rollback`：版本回滚

每条历史记录不仅保存了版本信息，还保存了变更时刻的拓扑快照和副本状态，为事后审计和故障排查提供完整的上下文。

> **设计决策**：历史记录最多保留 10 条（`History []DeploymentHistory`，注释标注 "最多保留 10 条"），避免 Status 无限膨胀。

---

## 7.4 Label 体系与资源关联

### 精确的 Label 关联

Controller 为每个创建的 K8s Deployment 设置了完整的 Label 体系：

| Label | 用途 | 示例值 |
|-------|------|--------|
| `app.theriseunion.io/application` | 应用名称 | `quality-inspection` |
| `app.theriseunion.io/version` | 应用版本 | `1.1.0` |
| `app.theriseunion.io/deployment` | 部署实例名称 | `quality-inspection-deploy` |
| `app.theriseunion.io/topology-hash` | 拓扑哈希 | `a3f8c2b1e9` |
| `app.theriseunion.io/topology-index` | 拓扑索引 | `0` |
| `app.theriseunion.io/workload` | 工作负载名称 | `api-server` |
| `theriseunion.io/nodegroup` | 节点组 | `beijing-factory` |

这套 Label 体系支持多维度的资源查询：

```bash
# 查看某个应用的所有 Deployment
kubectl get deploy -l app.theriseunion.io/application=quality-inspection

# 查看某个站点的所有 Deployment
kubectl get deploy -l theriseunion.io/nodegroup=beijing-factory

# 查看某个部署实例的所有 Deployment
kubectl get deploy -l app.theriseunion.io/deployment=quality-inspection-deploy
```

### Annotation 补充信息

除 Label 外，Controller 使用 Annotation 存储非查询性的补充信息，如完整的 Topology Key：

```go
annotations := map[string]string{
    constants.ApplicationTopologyLabel: topologyKey,
}
```

Label 使用 Hash 值（`topology-hash`）用于选择器匹配，Annotation 存储完整的拓扑标识用于调试和展示。

---

## 7.5 删除与清理

### Finalizer 保护的删除流程

当 `ApplicationDeployment` 被删除时，Controller 通过 Finalizer 机制确保资源的正确清理：

```
删除 ApplicationDeployment
  │
  ├── DeletionTimestamp 被设置
  │
  ├── Controller 检测到 Finalizer 存在
  │   │
  │   ├── cleanupTopologies：删除所有关联的 K8s Deployment
  │   │     └── 遍历 getDeploymentsForApplication 的结果
  │   │         └── 逐个删除（忽略 NotFound 错误）
  │   │
  │   └── 移除 Finalizer
  │
  └── K8s 垃圾回收完成删除
```

> **源码实证**：清理逻辑对 NotFound 错误的容忍，确保了幂等性——即使某个 Deployment 已经被手动删除，清理过程不会因此中断：
> ```go
> for _, deploy := range deployments {
>     if err := r.Delete(ctx, &deploy); err != nil && !apierrors.IsNotFound(err) {
>         return err
>     }
> }
> ```
> — `internal/controller/application/applicationdeployment_controller.go:925-930`

---

## 7.6 端到端部署场景示例

### 场景：质检模型从试点到全国推广

**第一阶段：试点部署**

在一个工厂验证质检模型 v1.0.0：

```yaml
spec:
  application: quality-inspection
  version: "1.0.0"
  topologies:
    - nodeGroup: "beijing-factory-a"
```

结果：1 个 Topology，1 个 K8s Deployment。`ReadyStatus: "2/2"`。

**第二阶段：小范围推广**

验证通过，扩展到 3 个工厂：

```yaml
spec:
  topologies:
    - nodeGroup: "beijing-factory-a"
    - nodeGroup: "beijing-factory-b"
    - nodeGroup: "shanghai-factory"
```

Controller 计算差异：toAdd=2，toUpdate=0，toRemove=0。自动创建 2 个新的 K8s Deployment。

**第三阶段：模型升级**

v1.0.0 → v1.1.0，准确率从 85% 提升到 92%：

```yaml
spec:
  version: "1.1.0"  # 版本切换
  topologies:       # 拓扑不变
    - nodeGroup: "beijing-factory-a"
    - nodeGroup: "beijing-factory-b"
    - nodeGroup: "shanghai-factory"
```

Controller 为 3 个 Topology 同时执行滚动更新。变更历史记录 `Reason: Upgrade, FromVersion: 1.0.0, ToVersion: 1.1.0`。

**第四阶段：全国推广**

扩展到 50 个工厂站点：

```yaml
spec:
  version: "1.1.0"
  topologies:
    - nodeGroup: "beijing-factory-a"
    - nodeGroup: "beijing-factory-b"
    # ... 47 个更多站点 ...
    - nodeGroup: "chengdu-factory"
    - nodeGroup: "__cloud__"  # 云端也运行一个实例，用于演示和测试
```

Controller 差异计算后，自动创建 48 个新的 K8s Deployment。全局状态：`ReadyStatus: "100/100"`（50 个站点 x 2 副本）。

**全程操作次数**：4 次 YAML 修改。**传统方式的操作次数**：50 个站点 x 3 次操作（部署+升级+验证）= 150 次。

---

## 7.7 本章小结

Topology-Based 部署模型回答了"应用怎么到达每一个边缘"的问题：

| 能力 | 实现方式 | 效果 |
|------|---------|------|
| 一处声明，多处部署 | Topology 列表 + Controller 自动创建 K8s Deployment | 50 个站点只需一个 YAML |
| 云边统一 | `__cloud__` 标识 + nodeSelector 差异化 | 云端和边缘用同一套部署模型 |
| 状态全局可视 | TopologyStatus 独立追踪 + 全局聚合 | `ReadyStatus: "100/100"` 一眼看全局 |
| 版本批量切换 | 修改 version 字段 + Controller 滚动更新 | 所有站点同步升级 |
| 变更可追溯 | DeploymentHistory 记录 | 谁在什么时间做了什么变更 |
| 删除安全 | Finalizer + 清理逻辑 | 不残留孤儿 Deployment |

这套部署模型的核心价值在于：**将"应用推广到 N 个站点"的操作复杂度从 O(N) 降低到 O(1)。** 无论是 5 个站点还是 500 个站点，运维人员的操作步骤都是相同的——修改一个 ApplicationDeployment 资源。

这是第二章提出的"应用推广速度"指标的直接回答：**从分钟级别到分钟级别，不随站点数量增长。**

---

*下一章：第三章 — 基础设施就绪，应用运行的基石*
