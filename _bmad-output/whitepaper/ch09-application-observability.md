# 第九章：应用可观测 — 看得见才管得住

> **应用面对的问题**：怎么知道应用在每个边缘站点运行是否健康？出了问题怎么快速定位？GPU 利用率是不是太低？

---

## 引言：边缘的监控比云端更难

云端应用的监控有成熟的 SaaS 方案——Datadog、New Relic、Grafana Cloud。但边缘场景的监控面临三个独特挑战：

- **规模分散**：100 个边缘站点分布在全国各地，每个站点有不同的应用组合和硬件配置。
- **网络受限**：边缘站点到云端的带宽有限，不可能将所有原始指标实时传输到中心。
- **多租户隔离**：AI 团队只应该看到自己应用的指标，运维团队需要看到基础设施指标，管理层需要看到全局概览。

传统的"每个站点部署一套 Prometheus + Grafana"方式可以解决单站点的监控问题，但无法提供跨站点的统一视图。而"所有指标汇聚到中心"的方式在边缘网络条件下又不现实。

本章介绍平台的三层监控架构——采集层预聚合、查询层多维度、展示层自适应——以及多租户指标隔离和算力设备监控能力。

---

## 9.1 三层监控架构

### 采集层：Prometheus + Recording Rules 预聚合

每个边缘集群运行独立的 Prometheus 实例，负责本地指标的采集和存储。指标来源包括：

| 采集器 | 指标维度 | 典型指标 |
|--------|---------|---------|
| **node_exporter** | 节点资源 | CPU/内存/磁盘/网络使用率 |
| **kube-state-metrics** | K8s 对象状态 | Pod 状态、Deployment 副本数、Service 端点 |
| **cadvisor** | 容器资源 | 容器级 CPU/内存/IO |
| **GPU Exporter** | 算力设备 | GPU 利用率、显存、温度、功耗 |

**关键设计：Recording Rules 预聚合**

平台在 Prometheus 层面配置了大量 Recording Rules（预计算规则），将高基数的原始指标预聚合为租户维度的汇总指标。例如：

```
原始指标：container_cpu_usage_seconds_total{namespace="ai-team-prod", pod="model-xyz"}
  ↓ Recording Rule 预聚合
汇总指标：workspace:container_cpu_usage_seconds:sum_rate{workspace="ai-team"}
```

> **源码实证**：
> ```go
> var promQLTemplatesEdgePlatform = map[string]string{
>     // Workspace 级别的 Recording Rule 引用
>     "workspace_cpu_usage":
>         `workspace:container_cpu_usage_seconds:sum_rate`,
>     "workspace_memory_usage":
>         `workspace:container_memory_usage_bytes:sum`,
>     "workspace_pod_count":
>         `workspace:kube_pod_info:count`,
>
>     // Namespace 级别的 Recording Rule 引用
>     "namespace_cpu_usage":
>         `namespace:container_cpu_usage_seconds:sum_rate`,
>     "namespace_memory_usage":
>         `namespace:container_memory_usage_bytes:sum`,
> }
> ```
> — `monitoring-service/pkg/client/prometheus/promql_edge_platform.go`

**为什么 Recording Rules 是性能关键？**

在管理 1000+ 集群、10000+ 节点的规模下，如果每次查询都需要实时聚合原始指标，查询延迟将从毫秒级退化到秒级甚至分钟级。Recording Rules 在数据写入时就完成聚合计算，查询时只需读取预计算结果——**查询延迟从 O(N) 降低到 O(1)，N 是原始时间序列数量。**

### 查询层：monitoring-service + 并行查询

monitoring-service 是平台的监控查询中间层，提供 **291+ 预定义指标**的统一查询接口。

**291+ 预定义指标覆盖 15 个监控维度**：

| 维度 | 指标数量 | 目标读者 |
|------|---------|---------|
| **集群（Cluster）** | 49 | 平台管理员 |
| **节点（Node）** | 30 | 运维工程师 |
| **工作空间（Workspace）** | 26 | 工作空间管理员 |
| **命名空间（Namespace）** | 28 | 项目负责人 |
| **节点组（NodeGroup）** | 27 | 站点运维 |
| **工作负载（Workload）** | 6 | 应用开发者 |
| **Pod** | 14 | 应用开发者 |
| **容器（Container）** | 14 | 应用开发者 |
| **API Server** | 19 | 平台管理员 |
| **调度器（Scheduler）** | 11 | 平台管理员 |
| **Controller Manager** | 11 | 平台管理员 |
| **ETCD** | 14 | 平台管理员 |
| **Kubelet** | 24 | 运维工程师 |
| **Kube Proxy** | 10 | 运维工程师 |
| **CoreDNS** | 8 | 运维工程师 |
| **合计** | **291** | — |

> — `monitoring-service/MONITORING_METRICS_API_REFERENCE.md`

**并行查询架构**

monitoring-service 使用 goroutine 并行执行多个指标的查询，显著降低多指标查询的总延迟：

> **源码实证**：
> ```go
> func (p prometheus) QueryInstantCustomMetrics(
>     metrics []string, ts time.Time, o client.QueryOption,
> ) []client.Metric {
>     var wg sync.WaitGroup
>     res := make([]client.Metric, len(metrics))
>
>     for i, metric := range metrics {
>         wg.Add(1)
>         go func(i int, metric string) {
>             defer wg.Done()
>             expr := makeExpr(metric, *opts)
>             instantQueryFunc := func() (model.Value, v1.Warnings, error) {
>                 return p.client.Query(context.Background(), expr, ts)
>             }
>             tempResult := p.executeQuery(instantQueryFunc,
>                 parseQueryResp, params)
>             tempResult.MetricName = metric
>             res[i] = tempResult
>         }(i, metric)
>     }
>
>     wg.Wait()
>     return res
> }
> ```
> — `monitoring-service/pkg/client/prometheus/prometheus_client.go:148-184`

当前端仪表盘请求 20 个指标时，monitoring-service 启动 20 个并行查询，总延迟等于最慢的那个查询——而不是 20 个查询的总和。

**自定义 PromQL 透传**

除了 291 个预定义指标，monitoring-service 还支持自定义 PromQL 表达式的透传——高级用户可以直接编写 PromQL 查询，monitoring-service 将其转发到 Prometheus 并返回结果。

### 展示层：edge-console 自适应刷新

前端控制台（edge-console）提供 30+ 监控组件，采用自适应刷新策略：

| 场景 | 刷新间隔 | 原因 |
|------|---------|------|
| 实时监控（最近 1 小时） | 5 秒 | 需要及时发现异常 |
| 历史趋势（最近 24 小时） | 5 分钟 | 数据变化较慢，节省查询开销 |
| 长期分析（最近 7 天） | 15 分钟 | 关注趋势而非实时值 |

---

## 9.2 多租户指标隔离

### 三个扩展维度

在开源 Prometheus 的基础上，平台扩展了三个租户维度的 Recording Rules：

**1. Workspace（工作空间）级别 — 26 个指标**

工作空间管理员可以查看自己工作空间的资源总量和使用情况：

```go
var workspaceMetrics = []string{
    // CPU 指标
    "workspace_cpu_usage",
    "workspace_cpu_utilisation",
    "workspace_cpu_requests_total",
    "workspace_cpu_limits_total",

    // 内存指标
    "workspace_memory_usage",
    "workspace_memory_rss",
    "workspace_memory_utilisation",
    "workspace_memory_requests_total",
    "workspace_memory_limits_total",

    // 工作负载统计
    "workspace_deployment_count",
    "workspace_statefulset_count",
    "workspace_daemonset_count",
    // ... 共 26 个指标
}
```

> — `monitoring-service/pkg/api/monitoring/v1/named_metrics_edge.go`

**2. Namespace（项目）级别 — 28 个指标**

项目负责人可以查看自己项目的资源使用细节。

**3. NodeGroup（节点组）级别 — 27 个指标**

站点运维人员可以查看自己负责的边缘站点的节点和应用状况。

### 查询隔离机制

monitoring-service 通过 QueryOption 实现查询的租户隔离——每个查询携带 Scope 信息，只返回对应范围内的指标：

```go
// 配置 Workspace 级别查询
func WithWorkspaceName(name string) QueryOption {
    return func(o *QueryOptions) {
        o.Level = LevelWorkspace
        o.WorkspaceName = name
    }
}

// 配置 NodeGroup 级别查询
func WithNodeGroupName(name string) QueryOption {
    return func(o *QueryOptions) {
        o.Level = LevelNodeGroup
        o.NodeGroupName = name
    }
}
```

> — `monitoring-service/pkg/client/query_options_edge.go`

结合第五章的五层权限模型，一个 Workspace 用户调用监控 API 时，权限系统确保其只能查看自己 Workspace 的指标——即使 PromQL 表达式试图查询其他 Workspace 的数据，权限层也会拒绝。

---

## 9.3 算力与设备监控

### GPU/NPU 设备指标

第四章介绍了平台的算力管理体系。算力监控是对算力管理的闭环补充——不仅要"管得了"，还要"看得见"。

设备监控覆盖以下维度：

| 指标类别 | 具体指标 | 价值 |
|---------|---------|------|
| **算力指标** | core Request/Usage/Total、分配率/利用率 | 评估算力是否被充分利用 |
| **显存指标** | memory Request/Usage/Total、分配率/利用率 | 判断显存是否成为瓶颈 |
| **环境指标** | 温度、功耗、风速、健康状态 | 预防硬件故障 |
| **效率指标** | GPU 引擎活跃度 | 识别空闲或低效的 GPU |
| **可视化** | GPU 利用率排行 Top5、显卡类型分布 | 快速定位异常 |

### 设备健康检查

设备健康状态通过 Device Plugin 实时上报：

| 健康状态 | 含义 | 触发动作 |
|---------|------|---------|
| `Healthy` | 设备正常运行 | 参与正常调度 |
| `UnHealthy` | 设备异常（温度过高、驱动异常等） | 触发告警 + 可能从调度池中移除 |

> **源码实证**：
> ```go
> const (
>     DeviceHealthy   = "Healthy"
>     DeviceUnHealthy = "UnHealthy"
> )
> ```
> — `pkg/constants/device.go:168-170`

结合 GlobalConfig 的告警级别配置（第四章 4.4），设备异常时可以触发 critical/high/middle/low 不同级别的告警。

### 算力监控与算力管理的闭环

```
第四章：算力管理（分配侧）
  DeviceModel → ComputeTemplate → ResourcePool → NodeConfig
  "应用需要多少算力？分配给它。"

第九章：算力监控（使用侧）
  GPU Exporter → Prometheus → monitoring-service → 仪表盘
  "分配的算力用了多少？效率如何？"

闭环：
  分配率高但利用率低 → ComputeTemplate 需要调整超卖比例
  利用率高且温度异常 → 可能需要增加散热或减少负载
  多张 GPU 利用率为零 → 资源被预留但未使用，需要重新分配
```

---

## 9.4 告警管理

### 四级告警体系

平台的告警按严重程度分为四个级别：

| 级别 | 含义 | 典型场景 |
|------|------|---------|
| **Critical** | 需要立即处理 | 节点 NotReady、GPU 温度超阈值、磁盘满 |
| **High** | 需要尽快处理 | CPU 利用率持续 > 90%、内存压力大 |
| **Middle** | 需要关注 | Pod 重启次数异常、网络延迟增加 |
| **Low** | 信息提示 | 磁盘使用率 > 70%、证书即将过期 |

告警规则支持自定义——运维人员可以根据自身场景定义告警阈值和触发条件。

### 设备故障码告警

GPU/NPU 设备的特殊告警通过 GlobalConfig 配置的 `AlertLevel` 字段与监控系统对接：

```go
type GlobalConfigSpec struct {
    // 设备故障码告警级别配置
    AlertLevel []v1alpha1.Severity `json:"alertLevel,omitempty"`
}
```

> — `api/device/v1alpha1/globalconfig_types.go`

当 GPU 设备上报 ECC 错误、温度超限、功耗异常等故障码时，平台根据预设的告警级别触发对应的告警通知。

---

## 9.5 全局拓扑可视化

### 从全局到细节的钻取路径

平台提供从全局到单节点的逐层钻取视图：

```
全局仪表盘
  └── 所有集群的概览（健康/告警/异常）
       │
       ├── 集群 A（北京）
       │     ├── 节点组：beijing-factory-a
       │     │     ├── 节点 node-001（CPU/内存/GPU 仪表盘）
       │     │     │     ├── Pod 状态
       │     │     │     └── 网络流量
       │     │     └── 节点 node-002
       │     └── 节点组：beijing-factory-b
       │
       └── 集群 B（上海）
             └── ...
```

每一层都提供对应粒度的监控指标：

- **全局层**：集群健康状态概览、告警数量汇总
- **集群层**：49 个集群级指标（CPU/内存总量、节点数、Pod 数）
- **节点组层**：27 个节点组指标（站点级资源统计）
- **节点层**：30 个节点指标（单节点详细资源使用）
- **Pod/容器层**：14+14 个指标（应用实例级监控）

### 节点级仪表盘

每个节点的仪表盘提供以下信息：

- **资源使用**：CPU/内存/磁盘实时使用率和趋势
- **GPU 状态**：每张 GPU 的利用率、显存、温度
- **Pod 列表**：节点上运行的所有 Pod 及其资源消耗
- **网络流量**：入站/出站流量和错误包数

---

## 9.6 本章小结

应用可观测回答了"怎么知道应用在每个站点是否健康"的问题：

| 环节 | 机制 | 效果 |
|------|------|------|
| 指标采集 | Prometheus + Recording Rules 预聚合 | 查询延迟毫秒级，不受原始数据量影响 |
| 统一查询 | monitoring-service 291+ 预定义指标 | 15 个维度全覆盖 |
| 并行查询 | goroutine 并行执行 | 20 个指标的查询时间 ≈ 1 个指标 |
| 多租户隔离 | Workspace/Namespace/NodeGroup Recording Rules | 每个租户只看到自己的指标 |
| 算力监控 | GPU 利用率、显存、温度、功耗 | 算力管理（分配侧）与监控（使用侧）闭环 |
| 告警管理 | 四级告警 + 设备故障码 | 从 Critical 到 Low 精确分级 |
| 拓扑可视化 | 全局 → 集群 → 节点组 → 节点 → Pod | 逐层钻取，快速定位问题 |

这套可观测体系的核心价值在于：**让分散在全国各地的边缘应用"看得见"。** 运维人员不需要登录每个站点的监控系统，而是在一个统一的仪表盘上看到所有站点的应用状态。Recording Rules 预聚合策略确保了即使管理 1000+ 集群，查询性能也不会退化。

这是第二章提出的"应用运维成本"指标的直接回答：**跨站点的应用监控和故障排查，从"逐站点查看"变成"统一视图一眼看全"。**

---

*下一章：第十章 — 平台架构设计*
