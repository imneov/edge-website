# 第十章：平台架构设计 — 统一的技术底座

> 前面七章从应用的视角，依次讲述了基础设施就绪、算力就绪、组织安全、应用供应链、应用部署、应用运行和应用可观测。这一章给架构师看：**平台是怎么把这些能力统一在一个一致的技术架构下的。**

---

## 引言：一个平台，不是七个系统

前面的章节分别解决了应用生命周期中的不同问题：OTA 解决硬件接入，DeviceModel 解决算力抽象，IAMRole 解决权限控制，Provisioner 解决应用打包，Topology 解决应用分发，EdgeNode 解决离线运行，monitoring-service 解决可观测。

一个自然的问题是：这些能力是七个独立系统的简单拼凑，还是一个统一架构的有机组成？

答案在源码中。打开 `edge-apiserver` 的入口文件，所有能力共享同一个 HTTP Filter Chain、同一套 CRD 资源模型、同一组 Controller Reconcile 模式。从一个 HTTP 请求进入平台，到它被路由到正确的集群、通过权限验证、触发 Controller 调谐、最终在边缘节点上产生效果——整个链路是一条完整的、可追踪的数据通路。

本章从四个维度展开平台的架构设计：请求处理链路（Filter Chain）、多集群请求路由、CRD 资源模型与 Controller 设计模式、以及 OpenAPI 驱动的前后端类型安全。

---

## 10.1 整体架构全景

### 四大组件协作

平台的运行时由四个核心组件构成，各自承担明确的职责：

```
┌─────────────────────────────────────────────────────────┐
│                   云端控制面                              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │edge-apiserver│  │edge-controller│  │monitoring-    │  │
│  │              │  │              │  │service        │  │
│  │· Filter Chain│  │· 12+ Ctrl    │  │· 291+ Metrics │  │
│  │· 5 API Group │  │· State Machine│ │· Parallel Query│ │
│  │· OAuth/OIDC  │  │· Finalizer   │  │· Recording    │  │
│  │· OpenAPI     │  │· Condition   │  │  Rules        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                 │            │
│  ┌──────┴─────────────────┴─────────────────┴────────┐  │
│  │              edge-console (Next.js 14)             │  │
│  │  · 304 API Functions · 400+ TS Types · 85+ Hooks  │  │
│  └────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   边缘数据面                              │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ K8s Cluster │  │ Edge Agent  │  │ Local Cache     │  │
│  │ (KubeEdge / │  │ (Component  │  │ (Autonomy       │  │
│  │  OpenYurt / │  │  Installers)│  │  Support)       │  │
│  │  VCluster)  │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

| 组件 | 角色 | 关键能力 |
|------|------|---------|
| **edge-apiserver** | API 网关 + 认证授权 + 多集群路由 | Filter Chain、OAuth2/OIDC、RequestInfo 解析、多集群代理 |
| **edge-controller** | 声明式调谐引擎 | 12+ Controller、Condition 状态机、Finalizer 资源保护 |
| **monitoring-service** | 可观测查询层 | 291+ 预定义指标、Recording Rules 预聚合、并行查询 |
| **edge-console** | 前端交互层 | OpenAPI 自动生成、类型安全 API 客户端、85+ 自定义 Hooks |

四个组件通过两条纽带连接：**CRD 资源模型**（5 个 API 组、24+ CRD 类型）提供统一的数据契约，**Controller-Runtime** 提供统一的事件驱动调谐框架。任何一个前端操作——无论是创建集群、部署应用还是配置权限——最终都转化为 CRD 对象的 CRUD 操作，由对应的 Controller 完成实际的状态调谐。

---

## 10.2 六层 Filter Chain 架构

### HTTP 请求的完整旅程

edge-apiserver 的所有 HTTP 请求都经过一条由六层 Filter 组成的处理链。这条链路借鉴了 Kubernetes API Server 的 Filter Chain 模式，扩展了多集群路由和多租户权限能力。

> **源码实证**：Filter Chain 的构建过程在 `buildHandlerChain` 函数中完整展现：
> ```go
> func (s *APIServer) buildHandlerChain(handler http.Handler) http.Handler {
>     // Build filter chain (from inner to outer):
>     // 1. Core handler (restful container)
>     // 2. Authorization filter
>     // 3. Authentication filter
>     // 4. Multicluster filter
>     // 5. RequestInfo filter
>
>     finalHandler := handler
>     finalHandler = filters.WithAuthorization(finalHandler, s.Authorizer, s.AuthorizationMode)
>     finalHandler = filters.WithAuthentication(finalHandler, s.Authenticator)
>     finalHandler = filters.WithMulticluster(finalHandler, s.ClusterClient)
>     finalHandler = filters.WithRequestInfo(finalHandler, s.RequestInfoResolver)
>     return finalHandler
> }
> ```
> — `pkg/apiserver/apiserver.go:498-546`

由于 Go 的 HTTP middleware 采用"从外到内包裹"的构造方式，代码中最后添加的 Filter 最先执行。请求的实际执行顺序为：

```
HTTP 请求
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 1: RequestInfo Filter                             │
│  · 解析 URL → 提取 Cluster/Workspace/Resource/Verb     │
│  · 识别 API 前缀：api / apis / oapis                    │
│  · 确定资源作用域：Global / Cluster / Workspace / NS     │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Multicluster Dispatcher                        │
│  · 无 Cluster → 本地处理                                │
│  · Host Cluster → 去掉集群前缀，本地处理                 │
│  · Member Cluster → 代理到目标集群的 edge-apiserver       │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Authentication Filter                          │
│  · Bearer Token → JWT 验证 → 提取用户身份                │
│  · 支持 User Impersonation（K8s 标准）                   │
│  · 认证失败 → 降级为匿名用户                             │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Authorization Filter                           │
│  · 公开端点白名单放行（/oauth/token, /healthz 等）       │
│  · AlwaysAllow 模式：跳过授权（开发/测试用）             │
│  · RBAC 模式：5 层 Scope Chain 授权检查                  │
├─────────────────────────────────────────────────────────┤
│ Layer 5: Core Handler (go-restful Container)            │
│  · /oapis/* → 组织级 API（IAM、Tenant、App 等）          │
│  · /api/*, /apis/* → 标准 K8s API 代理                  │
│  · /oauth/* → OAuth2/OIDC 认证端点                      │
├─────────────────────────────────────────────────────────┤
│ Layer 6: KubeAPIServer Proxy (规划中)                   │
│  · 标准 K8s API 请求透传到本地 kube-apiserver            │
│  · UpgradeAwareHandler 支持 WebSocket/exec              │
└─────────────────────────────────────────────────────────┘
```

### 每一层完全解耦

Filter Chain 的关键设计原则是：**每一层只做一件事，通过 `http.Handler` 接口串联。** 每个 Filter 都是一个独立的 `struct`，实现 `ServeHTTP` 方法，持有 `next http.Handler` 引用。这意味着：

- **可独立测试**：每个 Filter 可以用 `httptest.NewRecorder()` 独立验证，不依赖其他 Filter。
- **可独立禁用**：认证、授权、多集群路由都可以通过传入 `nil` 独立跳过。
- **可独立替换**：任何一层的实现都可以替换为另一种策略，不影响其他层。

> **源码实证**：每个 Filter 都检查依赖是否为 nil，为 nil 时直接退化为透传：
> ```go
> func WithMulticluster(next http.Handler, clusterClient clusterclientutil.Interface) http.Handler {
>     if clusterClient == nil {
>         klog.V(4).Infof("Multicluster dispatcher is disabled")
>         return next  // 直接返回下一层，跳过本层
>     }
>     return &multiclusterDispatcher{next: next, Interface: clusterClient}
> }
> ```
> — `pkg/apiserver/filters/multicluster.go:42-53`

这种设计让平台在不同部署场景下可以灵活裁剪：单集群部署可以禁用多集群路由，开发环境可以启用 AlwaysAllow 跳过授权，边缘独立集群可以精简到只保留核心 Handler。

---

## 10.3 RequestInfo：请求的语义化解析

### 从 URL 到结构化语义

Filter Chain 的第一层是 `RequestInfoResolver`，它的职责是将一个原始的 HTTP 请求解析为结构化的语义信息。这一层决定了后续所有 Filter 的决策基础。

> **源码实证**：`RequestInfo` 的结构定义展现了平台扩展 K8s 标准请求模型的方式：
> ```go
> type RequestInfo struct {
>     Path              string  // URL 路径
>     Verb              string  // K8s 语义动词：create/get/list/update/delete/watch/patch
>     APIPrefix         string  // api / apis / oapis
>     APIGroup          string  // 如 app.theriseunion.io
>     APIVersion        string  // 如 v1alpha1
>     Namespace         string  // 命名空间
>     Resource          string  // 资源类型
>     Name              string  // 资源名称
>     IsResourceRequest bool    // 是否为资源请求
>     IsKubernetesRequest bool  // 是否应由 K8s API Server 处理
>
>     // ===== 以下为平台扩展字段 =====
>     Workspace     string  // 工作空间（多租户）
>     Cluster       string  // 集群（多集群）
>     NodeGroup     string  // 节点组（边缘计算）
>     ResourceScope string  // 资源作用域：Global/Cluster/Workspace/Namespace
>     SourceIP      string  // 请求来源 IP
>     UserAgent     string  // 用户代理
> }
> ```
> — `pkg/apiserver/request/requestinfo.go:68-123`

值得注意的是 `RequestInfo` 在 K8s 标准字段基础上增加了 `Workspace`、`Cluster`、`NodeGroup`、`ResourceScope` 四个扩展字段。这四个字段不是独立于 K8s 模型之外的"私货"，而是通过 URL 路径模式自然提取的——与 K8s 从 URL 中提取 Namespace 的方式完全一致。

### URL 路径的解析规则

`RequestInfoResolver` 支持三种 API 前缀，对应不同的请求来源：

| API 前缀 | 含义 | 示例 |
|----------|------|------|
| `api` | K8s 核心 API（无 Group） | `/api/v1/pods` |
| `apis` | K8s 扩展 API（有 Group） | `/apis/apps/v1/deployments` |
| `oapis` | 平台组织级 API | `/oapis/app.theriseunion.io/v1alpha1/applications` |

多集群和多租户信息通过 URL 前缀模式提取：

```
/clusters/{cluster}/oapis/{group}/{version}/workspaces/{workspace}/namespaces/{ns}/{resource}
     │                                           │                      │
     └── info.Cluster                            └── info.Workspace     └── info.Namespace
```

> **源码实证**：集群信息的提取在 URL 解析的最早阶段完成，确保后续所有层都能使用：
> ```go
> // URL forms: /clusters/{cluster}/*
> if currentParts[0] == constants.ResourceTypeClusters {
>     if len(currentParts) > 1 {
>         requestInfo.Cluster = currentParts[1]
>         requestInfo.Path = strings.TrimPrefix(requestInfo.Path,
>             fmt.Sprintf("/clusters/%s", requestInfo.Cluster))
>     }
>     if len(currentParts) > 2 {
>         currentParts = currentParts[2:]
>     }
> }
> ```
> — `pkg/apiserver/request/requestinfo.go:207-216`

### 资源作用域的自动推断

解析完成后，`resolveResourceScope` 根据请求中携带的信息自动推断资源的作用域层级：

```go
func (r *RequestInfoResolver) resolveResourceScope(request RequestInfo) string {
    if r.isGlobalScopeResource(request.APIGroup, request.Resource) {
        if request.Workspace != "" {
            return WorkspaceScope
        }
        return GlobalScope
    }
    if request.Namespace != "" { return NamespaceScope }
    if request.Workspace != "" { return WorkspaceScope }
    return ClusterScope
}
```

这个四级作用域（Global → Cluster → Workspace → Namespace）与第五章介绍的五层权限模型完全对齐，为授权 Filter 提供了精确的决策依据。

### ScopePattern：动态 URL 模式匹配

除了内置的 URL 解析规则，平台还支持通过 `ScopePattern` CRD 动态注册新的 URL 模式。`RequestInfoResolver` 通过 `controller-runtime` 的共享缓存监听 `ScopePattern` 资源的变化，实时更新匹配规则——无需重启 API Server 即可扩展新的作用域提取规则。

---

## 10.4 多集群请求路由

### 路由决策树

当 `RequestInfo` 中包含 `Cluster` 字段时，Multicluster Dispatcher 接管请求的路由决策。路由逻辑遵循一棵清晰的决策树：

```
info.Cluster == "" ?
    ├── 是 → 本地处理（单集群模式）
    └── 否 → 获取 Cluster 对象
              │
              ├── Cluster 不存在 → 400 Bad Request
              ├── IsHostCluster → 去掉集群前缀，本地处理
              ├── !IsReady     → 503 Service Unavailable
              └── IsReady      → 代理到目标集群
                    │
                    ├── Direct + 无 APIEndpoint → K8s Service Proxy
                    └── Direct + 有 APIEndpoint → 直连 edge-apiserver
```

> **源码实证**：完整的路由决策在 `multiclusterDispatcher.ServeHTTP` 中实现：
> ```go
> func (m *multiclusterDispatcher) ServeHTTP(w http.ResponseWriter, req *http.Request) {
>     info, ok := request.RequestInfoFrom(req.Context())
>     if !ok { ... }
>
>     // 无集群 → 本地处理
>     if info.Cluster == "" {
>         m.next.ServeHTTP(w, req)
>         return
>     }
>
>     // 获取集群对象
>     cluster, err := m.GetCluster(info.Cluster)
>     if err != nil { ... }
>
>     // Host 集群 → 去掉前缀，本地处理
>     if clusterutil.IsHostCluster(cluster) {
>         req.URL.Path = strings.Replace(req.URL.Path,
>             fmt.Sprintf("/clusters/%s", info.Cluster), "", 1)
>         m.next.ServeHTTP(w, req)
>         return
>     }
>
>     // 未就绪 → 503
>     if !clusterutil.IsReadyCluster(cluster) {
>         responsewriters.WriteRawJSON(http.StatusServiceUnavailable, ...)
>         return
>     }
>
>     // 就绪 → 代理
>     client, err := m.GetClusterClient(cluster.Name)
>     ...
> }
> ```
> — `pkg/apiserver/filters/multicluster.go:59-157`

### 两种连接模式

平台支持两种到达成员集群的网络路径，适配不同的网络拓扑：

| 连接模式 | 适用场景 | 路由方式 | 认证传递 |
|----------|---------|---------|---------|
| **Direct（K8s Service Proxy）** | 中心与边缘在同一网络 | 通过 K8s Service 代理到目标集群的 edge-apiserver | `Authorization` 转为 `X-Edge-Authorization` |
| **Direct（API Endpoint）** | 边缘有独立的公网地址 | 直连目标集群的 edge-apiserver URL | 标准 HTTP 转发 |

在 K8s Service Proxy 模式下，请求通过 Kubernetes 的 Service 代理机制到达目标集群。代理路径的格式为：

```
/api/v1/namespaces/{ns}/services/:{service}:{port}/proxy{path}
```

这种方式利用了 K8s 已有的网络基础设施，无需额外的网络组件。同时，为了避免与 K8s API Server 自身的 Bearer Token 认证冲突，平台在代理请求时将 `Authorization` 头转换为 `X-Edge-Authorization`——目标集群的 edge-apiserver 会识别这个自定义头并还原认证信息。

### UpgradeAwareHandler：协议升级支持

多集群代理不仅需要处理普通的 HTTP 请求，还需要支持 WebSocket 连接（如 Pod 终端）和 SPDY 流式传输（如 `kubectl exec`）。平台使用 Kubernetes 的 `UpgradeAwareHandler` 实现协议透明升级：

```go
upgrade := httpstream.IsUpgradeRequest(req)
httpProxy := proxy.NewUpgradeAwareHandler(location, transport, true, upgrade, &responder{})
httpProxy.UpgradeTransport = proxy.NewUpgradeRequestRoundTripper(transport, transport)
httpProxy.ServeHTTP(w, newReq)
```

这意味着运维人员可以在中心控制面通过浏览器终端直接操作边缘集群中的 Pod，WebSocket 连接会被透明地代理到正确的边缘节点——与操作本地集群的 Pod 体验完全一致。

---

## 10.5 CRD 资源模型

### 五组 API，一个哲学

平台的所有资源都通过 CRD（Custom Resource Definition）定义，遵循 Kubernetes 的声明式 API 规范。5 个 API 组覆盖了平台的全部能力域：

| API 组 | 域名 | CRD 数量 | 核心资源 | 设计哲学 |
|--------|------|---------|---------|---------|
| **Scope** | scope.theriseunion.io | 3 | Cluster, Workspace, NodeGroup | 层级化资源边界，Finalizer 保护删除 |
| **IAM** | iam.theriseunion.io | 7+ | User, IAMRole, IAMRoleBinding, RoleTemplate, Category, ScopePattern, LoginRecord | K8s RBAC 的多层级扩展 |
| **App** | app.theriseunion.io | 3 | Application, ApplicationVersion, ApplicationDeployment | 类 PVC 声明式 + 可插拔 Provisioner |
| **Device** | device.theriseunion.io | 6 | DeviceModel, ComputeTemplate, ResourcePool, ResourcePoolItem, NodeConfig, GlobalConfig | 四层硬件抽象，配置与定义分离 |
| **Registry** | registry.theriseunion.io | 4 | Registry, Repository, ClusterRegistry, ClusterRepository | 分级镜像管理，Cluster 级与 Namespace 级 |

这些 CRD 不是各自独立的"配置表"，而是通过引用关系形成了完整的资源图谱。以应用部署为例：

```
Application ──引用──→ Workspace（所属工作空间）
    │
    └── ApplicationVersion ──引用──→ Application（父应用）
            │
            └── ApplicationDeployment ──引用──→ ApplicationVersion（部署版本）
                    │                      └──→ NodeGroup（部署拓扑）
                    └──→ K8s Deployment ──→ ReplicaSet ──→ Pod
```

每一层引用都有对应的保护机制：Finalizer 阻止有活跃子资源的父资源被删除，OwnerReference 保证父资源删除时级联清理子资源。

### 统一的 CRD 结构规范

所有 CRD 都遵循相同的结构约定：

```go
type SomeResource struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec   SomeResourceSpec   `json:"spec,omitempty"`
    Status SomeResourceStatus `json:"status,omitempty"`
}
```

**Spec**（期望状态）由用户声明，Controller 不修改。**Status**（实际状态）由 Controller 维护，用户不修改。这种分离确保了声明式 API 的基本契约：用户描述"我要什么"，系统负责"怎么实现"。

元数据的管理遵循两条规则：

1. **Labels 用于机器读取**：Provisioner 类型、作用域标识、厂商分类等通过 Labels 管理，支持高效的列表查询和选择器过滤。
2. **Annotations 用于人类阅读**：显示名称（displayName）、描述（description）、多语言信息等通过 Annotations 存储，不影响 API 行为。

---

## 10.6 Controller 设计模式

### 八个核心架构模式

平台的 12+ Controller 共享一组经过生产验证的设计模式。这些模式不是理论上的"最佳实践"，而是从实际的并发冲突、资源泄漏、状态不一致等问题中沉淀出来的工程约束。

#### 模式一：幂等 Reconcile

每个 Controller 的 `Reconcile` 函数都是幂等的——无论被调用一次还是一百次，最终效果相同。这是 Controller-Runtime 框架的基本要求，但实现起来需要纪律。

核心原则：**Reconcile 不依赖"上一次的状态"，而是每次都从当前实际状态推导应该做什么。**

```go
func (r *WorkspaceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    workspace := &scopev1alpha1.Workspace{}
    if err := r.Get(ctx, req.NamespacedName, workspace); err != nil {
        if errors.IsNotFound(err) {
            return reconcile.Result{}, nil  // 资源已删除，无事可做
        }
        return reconcile.Result{}, err
    }

    // 每次都检查 Finalizer 是否存在，而不是假设"上次已经加了"
    if !controllerutil.ContainsFinalizer(workspace, scopev1alpha1.WorkspaceFinalizer) {
        controllerutil.AddFinalizer(workspace, scopev1alpha1.WorkspaceFinalizer)
        if err := r.Update(ctx, workspace); err != nil {
            return reconcile.Result{}, err
        }
        return reconcile.Result{Requeue: true}, nil
    }

    // 每次都初始化默认角色，InitializeDefaultRoles 内部判断是否已存在
    if err := roletemplate.InitializeDefaultRoles(ctx, r.Client, workspace, constants.ScopeTypeWorkspace); err != nil {
        return reconcile.Result{RequeueAfter: time.Minute}, err
    }
    ...
}
```

#### 模式二：Condition 状态机

Controller 通过 `Conditions` 数组跟踪资源的每个状态维度，而不是用单一的 `Phase` 字段表示整体状态。每个 Condition 独立跟踪，外部系统可以精确读取每个维度的状态。

> **源码实证**：Cluster Controller 的 Condition 管理函数展示了这一模式：
> ```go
> func (r *ClusterReconciler) setClusterCondition(
>     cluster *scopev1alpha1.Cluster,
>     conditionType scopev1alpha1.ClusterConditionType,
>     status metav1.ConditionStatus,
>     reason, message string) {
>
>     var condition *scopev1alpha1.ClusterCondition
>     for i := range cluster.Status.Conditions {
>         if cluster.Status.Conditions[i].Type == conditionType {
>             condition = &cluster.Status.Conditions[i]
>             break
>         }
>     }
>
>     if condition == nil {
>         cluster.Status.Conditions = append(cluster.Status.Conditions, scopev1alpha1.ClusterCondition{
>             Type: conditionType,
>         })
>         condition = &cluster.Status.Conditions[len(cluster.Status.Conditions)-1]
>     }
>
>     now := metav1.Now()
>     if condition.Status != string(status) {
>         condition.LastTransitionTime = now
>     }
>     condition.Status = string(status)
>     condition.Reason = reason
>     condition.Message = message
> }
> ```
> — `internal/controller/cluster/cluster_utils.go:46-78`

以 Cluster 为例，其状态包含多个独立的 Condition（如 VCluster 安装状态、Kubeconfig 验证状态、系统核心组件状态等），每个 Condition 独立变化、独立恢复，不会因为某一个维度的异常导致整个资源被标记为"失败"。

#### 模式三：Finalizer 保护

所有管理子资源的 CRD 都使用 Finalizer 保护删除流程。Finalizer 的作用是：**在资源被标记为删除后，阻止 Kubernetes 立即从 etcd 中移除它，给 Controller 一个清理窗口。**

删除流程始终遵循相同的模板：

```
创建阶段：添加 Finalizer → 正常处理
    │
删除阶段：DeletionTimestamp 非零
    │
    ├── 执行清理逻辑（undoReconcile / handleDeletion）
    │   · 删除子资源（ApplicationVersion → K8s Deployment）
    │   · 卸载组件（Cluster → Helm Release）
    │   · 清理关联资源（Workspace → 默认角色）
    │
    └── 移除 Finalizer → K8s 从 etcd 中删除资源
```

> **源码实证**：Cluster Controller 的删除流程：
> ```go
> if !instance.ObjectMeta.DeletionTimestamp.IsZero() {
>     if sliceutil.HasString(instance.ObjectMeta.Finalizers, finalizer) {
>         if _, err := r.undoReconcile(ctx, instance); err != nil {
>             logger.Error(err, "undoReconcile failed")
>         }
>         // 清理完成后移除 Finalizer
>         if err := r.UpdateCluster(rootCtx, req.NamespacedName, func(_instance *scopev1alpha1.Cluster) error {
>             _instance.ObjectMeta.Finalizers = sliceutil.RemoveString(
>                 _instance.ObjectMeta.Finalizers,
>                 func(item string) bool { return item == finalizer },
>             )
>             return nil
>         }); err != nil {
>             return ctrl.Result{}, err
>         }
>     }
>     return ctrl.Result{}, nil
> }
> ```
> — `internal/controller/cluster/cluster_controller.go:110-129`

#### 模式四：Patch 优先（避免并发冲突）

所有对现有资源的修改都优先使用 `Patch` 而非 `Update`。`Update` 需要匹配 `resourceVersion`，在 Controller 并发修改同一资源时容易产生 409 Conflict。`Patch` 是增量修改，不需要 `resourceVersion`，天然适合并发场景。

> **源码实证**：DeviceModel Controller 使用 `MergeFrom` 生成 Patch：
> ```go
> original := deviceModel.DeepCopy()
> labelsChanged := r.updateLabels(deviceModel)
> if labelsChanged {
>     if err := r.Patch(ctx, deviceModel, client.MergeFrom(original)); err != nil {
>         logger.Error(err, "failed to patch DeviceModel labels")
>         return ctrl.Result{}, err
>     }
> }
> ```
> — `internal/controller/device/devicemodel_controller.go:75-91`

#### 模式五：Label 路由

资源的分类和路由不通过 Spec 字段硬编码，而是通过 Labels 实现声明式的服务发现。

典型场景：Application 的 Provisioner 类型通过 Label `app.theriseunion.io/provisioner` 指定，ApplicationVersion Controller 在 Reconcile 时从关联的 Application 读取这个 Label，决定使用哪个 Provisioner 处理部署。这种设计让新增 Provisioner 类型只需要注册一个新的 Label 值，不需要修改任何 CRD Schema。

#### 模式六：并发控制

在多集群场景下，同一个 Controller 可能同时处理数十个集群的 Reconcile 事件。Cluster Controller 使用自定义的 `InstanceLock` 实现每资源独立锁定：

```go
// 每个 Cluster 独立锁，不互相阻塞
if !r.InstanceLock.TryLock(req.Name) {
    return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
}
defer r.InstanceLock.Unlock(req.Name)
```

配合 `MaxConcurrentReconciles: 3` 的设置，平台在保证并发效率的同时，避免了同一集群被多个 Goroutine 同时调谐导致的状态竞争。

#### 模式七：事件记录

所有显著的状态变化都通过 `EventRecorder` 记录为 K8s Event，提供完整的审计跟踪：

```go
r.Recorder.Event(iamRole, "Normal", "Created",
    fmt.Sprintf("Created ClusterRole: %s", clusterRole.Name))
r.Recorder.Eventf(deviceModel, corev1.EventTypeWarning, "DeviceManagerNotInitialized",
    "DefaultDeviceManager is not initialized, will retry after %v", waitTime)
```

Event 记录遵循两条规则：正常操作使用 `EventTypeNormal`，需要关注的异常使用 `EventTypeWarning`。这让运维人员可以通过 `kubectl get events` 快速定位问题。

#### 模式八：定期重调谐

状态同步不仅依赖事件触发，还通过定期重调谐（Periodic Requeue）保证最终一致性：

```go
return reconcile.Result{RequeueAfter: time.Minute * 5}, nil
```

即使没有外部事件触发，Controller 也会定期检查资源状态，自动修复任何偏移。这种"自愈"能力对边缘场景尤为重要——边缘节点的网络恢复后，Controller 能够在下一个调谐周期自动完成状态同步，无需人工干预。

---

## 10.7 API 注册与 Installer 模式

### 可插拔的 API 组注册

平台的 API 端点不是在一个巨大的路由表中硬编码，而是通过 `APIInstaller` 接口实现可插拔注册：

> **源码实证**：
> ```go
> type APIInstaller interface {
>     Install(c *restful.Container) error    // 安装 API 到容器
>     GetGroupVersion() schema.GroupVersion  // 获取 API 的 GroupVersion
>     GetAPIPath() string                    // 获取 API 路径
> }
> ```
> — `pkg/apiserver/runtime/runtime.go:92-102`

每个 API 组实现 `APIInstaller` 接口，在 `Install` 方法中注册自己的路由。API Server 启动时统一调用所有 Installer：

```go
func (s *APIServer) installAPIGroups() error {
    handlers := []oapis.Handler{
        configv1alpha1.NewHandler(s.RuntimeClient),
        iamapiv1alpha1.NewHandlerWithAuthorizer(s.RuntimeClient, s.Authorizer, s.RequestInfoResolver),
        tenantv1.NewHandler(s.RuntimeClient),
        appapiv1alpha1.NewHandlerWithAuthorizer(s.RuntimeClient, s.Authorizer, s.RequestInfoResolver),
        devicev1alpha1.NewHandler(s.RuntimeClient, s.ServerConfig, s.DeviceManager, s.FaultManager),
        registryv1alpha1.NewHandler(s.RuntimeClient, s.ServerConfig),
        ...
    }

    for _, handler := range handlers {
        if err := handler.Install(s.container); err != nil {
            return fmt.Errorf("failed to install handler: %w", err)
        }
    }
    ...
}
```

这种设计的好处是：**新增一个 API 组只需要实现三个方法，注册到 handlers 列表中，不需要修改 API Server 的核心逻辑。** 每个 API 组的路由定义、参数验证、响应格式都封装在自己的 Handler 中，职责边界清晰。

### WebService 工厂

每个 API 组使用统一的 `NewWebService` 工厂函数创建 `restful.WebService`，自动生成符合规范的 API 路径：

```go
func NewWebService(gv schema.GroupVersion) *restful.WebService {
    webservice := restful.WebService{}
    path := ApiRootPath + "/" + gv.String()  // /oapis/{group}/{version}
    webservice.Path(path).
        Produces(restful.MIME_JSON).
        Consumes(restful.MIME_JSON)
    return &webservice
}
```

这确保了所有 API 组的路径格式一致，与 `RequestInfoResolver` 的解析规则对齐。

---

## 10.8 OpenAPI 驱动的全链路类型安全

### 从 CRD 到前端组件的类型传导

传统前后端协作中，API 接口的定义通常靠文档同步，类型一致性靠人工保证。平台通过 OpenAPI 建立了从后端 CRD 到前端组件的自动类型传导链路：

```
Go CRD 类型定义                      TypeScript 类型 + API 客户端
┌─────────────────┐                  ┌────────────────────────┐
│ ApplicationSpec │                  │ ApplicationSpec        │
│ ApplicationList │  ── 自动生成 ──→  │ listApplications()     │
│ ClusterStatus   │                  │ ClusterStatus          │
└─────────────────┘                  └────────────────────────┘
        │                                       │
   go-restful 路由注册                      Kubb 代码生成
   → /openapi/v2 端点                     → 304 个 API 函数
   → Swagger 2.0 Schema                   → 400+ TypeScript 类型
                                          → 85+ 自定义 React Hooks
```

具体的工作流程：

1. **后端**：CRD 的 Go 类型通过 `go-restful-openapi` 自动生成 OpenAPI Schema，暴露在 `/openapi/v2` 端点。路由注册时使用 `Reads()` 和 `Returns()` 声明请求和响应类型，Schema 自动包含所有字段定义。
2. **代码生成**：前端通过 `pnpm codegen` 命令，使用 Kubb 代码生成器读取 `openapi.json`，自动生成类型安全的 API 客户端函数和 TypeScript 类型定义。
3. **前端**：开发者使用生成的 API 函数和类型，IDE 提供完整的类型提示和编译时检查。

> **源码实证**：路由注册时同步声明请求/响应类型，OpenAPI Schema 自动生成：
> ```go
> ws.Route(ws.GET("/clusters").
>     To(h.ListClusters).
>     Doc("List all clusters with pagination and sorting").
>     Returns(http.StatusOK, "OK", scopev1alpha1.ClusterList{}).
>     Param(ws.QueryParameter("limit", "Maximum number of items").DataType("integer")).
>     Param(ws.QueryParameter("page", "Page number").DataType("integer")))
>
> ws.Route(ws.POST("/clusters").
>     To(h.CreateCluster).
>     Reads(scopev1alpha1.Cluster{}).
>     Returns(http.StatusCreated, "Created", scopev1alpha1.Cluster{}))
> ```
> — `pkg/oapis/tenant/v1/register.go:25-55`

### 零手写 API 调用代码

这条链路的最终效果是：**前端没有一行手写的 API 调用代码。** 所有 API 请求都通过生成的类型安全函数发起，后端接口变更后执行 `pnpm codegen` 一键同步。如果后端修改了某个字段的类型或删除了某个端点，前端在编译时就会报错——不是在运行时，更不是在用户点击后。

前端技术栈与生成代码的集成：

| 技术组件 | 版本 | 角色 |
|---------|------|------|
| Next.js | 14 | SSR/SSG + 路由 + 中间件 |
| React | 18 | UI 组件渲染 |
| TypeScript | 5.9 | 静态类型检查 |
| Kubb | — | OpenAPI → TS 代码生成 |
| TanStack Query | — | 数据获取 + 缓存 + 状态管理 |
| Monaco Editor | — | YAML/JSON 在线编辑（应用配置） |
| Xterm.js | — | Pod 终端（WebSocket） |
| @xyflow/react | — | 集群拓扑可视化 |

---

## 10.9 本章小结

本章从架构师的视角，展示了平台的技术底座如何将前面七章的能力统一在一个一致的架构下：

- **Filter Chain** 是平台的神经中枢——每个请求经过语义解析、多集群路由、认证和授权四道关卡，确保到达正确的处理端点时已经携带了完整的上下文信息。
- **CRD 资源模型** 是平台的骨架——5 个 API 组、24+ CRD 类型构成了统一的数据契约，所有组件通过 CRD 对话，不通过私有 RPC。
- **Controller 设计模式** 是平台的肌肉——幂等 Reconcile、Condition 状态机、Finalizer 保护、Patch 优先等八个模式，确保声明式 API 的"自动驾驶"能力。
- **OpenAPI 类型链路** 是平台的感知神经——从后端 CRD 到前端组件的类型传导链路，消除了前后端协作中最常见的"接口不一致"问题。

回到第二章的核心论点：**平台的使命是让应用在每个边缘节点上更快地产生业务价值。** 本章展示的架构设计解释了"为什么这个平台能做到"——不是因为功能列表更长，而是因为所有能力都建立在同一个声明式、事件驱动、类型安全的技术底座上。新增一种应用类型只需要实现一个 Provisioner；新增一个边缘站点只需要创建一个 Cluster CRD；新增一个 API 只需要实现一个 Installer。**统一的架构让扩展的边际成本趋近于零。**
