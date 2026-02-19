---
sidebar_position: 5
title: "第五章：组织与安全 — 多团队安全共享应用平台"
---

# 第五章：组织与安全 — 多团队安全共享应用平台

> **应用面对的问题**：多个团队共用一个平台开发和部署应用，怎么隔离？谁能部署到哪里？谁能看到什么？

---

## 引言：应用越多，权限越关键

前两章解决了应用的供应链（第六章）和部署（第七章）问题。但在实际企业环境中，一个边缘平台不是只有一个团队在使用——AI 算法团队在开发质检模型，运维团队在管理集群，工厂 A 的人员不应该看到工厂 B 的数据。

当平台上的应用数量从个位数增长到数十个、使用团队从一个增长到多个时，权限管理就从"有比没有好"变成了"必须精确到位"。一个权限设计不当的平台会带来两类问题：

- **安全风险**：开发者可以访问不属于自己的生产数据；实习生可以删除关键部署。
- **管理混乱**：无法回答"谁在什么时间做了什么操作"；出了事故无法定位责任人。

本章介绍平台的多租户隔离架构、五层权限模型、认证审计机制和数据安全策略。

---

## 5.1 多租户隔离架构

### 问题：多个团队如何在一个平台上互不干扰

在边缘计算场景中，"多租户"不是一个抽象的企业管理概念，而是非常具体的物理隔离需求：

- **工厂 A 的运维人员**不应该看到工厂 B 的节点和应用
- **算法团队**只需要开发和提交应用，不需要管理集群基础设施
- **平台管理员**需要审核所有应用、管理所有集群，但不直接操作业务应用

### 三层隔离模型

平台通过 Workspace（工作空间）、Namespace（项目）和 NodeGroup（节点组）三个 CRD 实现逻辑隔离：

```
Platform（平台全局）
  │
  ├── Cluster A（北京集群）
  │     ├── NodeGroup: beijing-factory-a
  │     └── NodeGroup: beijing-factory-b
  │
  ├── Cluster B（上海集群）
  │     └── NodeGroup: shanghai-factory
  │
  ├── Workspace: ai-team（算法团队工作空间）
  │     ├── Namespace: ai-team-dev（开发项目）
  │     └── Namespace: ai-team-prod（生产项目）
  │
  └── Workspace: ops-team（运维团队工作空间）
        └── Namespace: ops-monitoring（监控项目）
```

### Workspace CRD — 团队的逻辑边界

Workspace 是团队级别的隔离边界。每个 Workspace 拥有独立的成员列表、资源配额和项目空间。

```go
type WorkspaceSpec struct {
    Manager  string             `json:"manager,omitempty"`    // 工作空间管理员
    Template *WorkspaceTemplate `json:"template,omitempty"`   // 模板配置
}

type WorkspaceTemplate struct {
    Namespaces     []string          `json:"namespaces,omitempty"`     // 关联的命名空间列表
    ResourceQuotas map[string]string `json:"resourceQuotas,omitempty"` // 资源配额
}

type WorkspaceStatus struct {
    Phase          string `json:"phase,omitempty"`          // 工作空间状态
    NamespaceCount int32  `json:"namespaceCount,omitempty"` // 命名空间数量
    MemberCount    int32  `json:"memberCount,omitempty"`    // 成员数量
}
```

> — `api/scope/v1alpha1/workspace_types.go`

Workspace Controller 负责两项核心工作：

1. **自动初始化默认角色**：每个新创建的 Workspace 自动获得一组标准角色（workspace-admin、workspace-viewer、workspace-regular、workspace-self-provisioner），运维人员无需手动配置。

> **源码实证**：
> ```go
> // 动态查询 scope="workspace" 的 RoleTemplate，自动创建默认角色
> if err := roletemplate.InitializeDefaultRoles(ctx, r.Client, workspace,
>     constants.ScopeTypeWorkspace); err != nil {
>     return ctrl.Result{RequeueAfter: time.Minute}, err
> }
> ```
> — `internal/controller/tenant/workspace_controller.go`

2. **统计信息维护**：定期更新 Workspace 下的命名空间数量和成员数量，供管理界面展示。成员计数通过扫描 IAMRoleBinding 中的 Subject 去重实现，确保同一用户在不同角色下只计数一次。

### NodeGroup CRD — 物理站点的权限边界

NodeGroup 不仅是应用部署的拓扑单元（第七章），也是权限控制的重要边界。

```go
type NodeGroupSpec struct {
    Selector *NodeSelector      `json:"selector,omitempty"`  // 节点选择器
    Template *NodeGroupTemplate `json:"template,omitempty"`  // 节点组模板
}

type NodeSelector struct {
    MatchLabels      map[string]string                 `json:"matchLabels,omitempty"`
    MatchExpressions []metav1.LabelSelectorRequirement `json:"matchExpressions,omitempty"`
}
```

> — `api/scope/v1alpha1/nodegroup_types.go`

NodeGroup 级别的权限控制意味着：**"北京工厂的运维人员可以管理北京工厂的节点，但看不到上海工厂的节点"** 不是运维约定，而是系统级强制。

---

## 5.2 五层权限模型

### 设计理念：Scope-Aware 授权链

Kubernetes 原生的 RBAC（Role-Based Access Control）是单集群、两层模型——Role（Namespace 级）和 ClusterRole（集群级）。这在边缘多租户场景下严重不足：

- 没有 Workspace 的概念——无法限制"这个用户只能在算法团队的工作空间内操作"
- 没有 NodeGroup 的概念——无法限制"这个运维人员只能管理北京工厂的节点"
- 没有跨集群的概念——无法限制"这个管理员只能管理北京集群"

平台在 K8s 原生 RBAC 的基础上，扩展了五层 Scope（作用域）授权模型：

```
Platform（平台全局）       ← 最高权限，平台管理员
    ↓
Cluster（集群级）           ← 集群管理员
    ↓
Workspace（工作空间级）     ← 工作空间管理员
    ↓
NodeGroup（节点组级）       ← 站点运维人员
    ↓
Namespace（项目级）         ← 项目开发者
```

### 授权检查流程

当一个用户发起 API 请求时，Authorizer 按照从最具体到最宽泛的顺序检查权限，找到匹配的权限即停止（短路优化）：

> **源码实证**：
> ```go
> func (a *Authorizer) checkScopeChain(ctx context.Context,
>     attrs authorizer.Attributes, chain *ScopeChain) *AuthResult {
>
>     // Level 1: Namespace（最具体）
>     if chain.Namespace != "" {
>         if result := a.checkAtScope(ctx, attrs,
>             constants.ScopeTypeNamespace, chain.Namespace); result.Allowed {
>             result.Level = constants.ScopeTypeNamespace
>             return result
>         }
>     }
>
>     // Level 2: Workspace
>     if chain.Workspace != "" {
>         if result := a.checkAtScope(ctx, attrs,
>             constants.ScopeTypeWorkspace, chain.Workspace); result.Allowed {
>             result.Level = constants.ScopeTypeWorkspace
>             return result
>         }
>     }
>
>     // Level 3: NodeGroup
>     // Level 4: Cluster
>     // Level 5: Platform（最宽泛）
>     // ...
>
>     // 兜底：匿名角色（系统级默认权限）
>     if result := a.checkAnonymousRole(ctx, attrs); result.Allowed {
>         result.Level = constants.AuthLevelAnonymous
>         return result
>     }
>
>     return &AuthResult{
>         Allowed:  false,
>         Decision: authorizer.DecisionDeny,
>         Reason:   fmt.Sprintf("no RBAC permission for %s:%s:%s",
>             user, verb, resource),
>     }
> }
> ```
> — `internal/authorizer/authorizer.go:358-433`

### 两个核心原则

**1. 就近原则（Proximity Principle）**：从最具体的 Scope 开始检查。一个在 Namespace 级别有权限的用户，不需要向上搜索 Workspace 或 Cluster 级别的权限。

**2. 权限继承（Permission Accumulation）**：高层级的权限自动覆盖低层级。一个拥有 Platform Admin 权限的用户，自动拥有所有 Cluster、Workspace、NodeGroup 和 Namespace 的权限——无需在每个层级重复绑定。

### Scope 提取机制

Authorizer 需要从每个 API 请求中提取出 Scope 上下文（"这个请求属于哪个 Workspace？哪个 NodeGroup？"）。平台通过三种机制实现 Scope 提取：

**机制一：ScopePattern — URL 模式匹配**

ScopePattern CRD 定义了 URL 路径与 Scope 的映射关系：

```go
type ScopePatternSpec struct {
    Pattern   string `json:"pattern"`   // URL 模式，如 "/api/edge/{nodegroup}/*"
    ScopeType string `json:"scopeType"` // 提取的 Scope 类型
}
```

> — `api/iam/v1alpha1/scopepattern_types.go`

例如，请求 `GET /api/edge/beijing-factory-a/nodes/node-123` 会被模式 `/api/edge/{nodegroup}/*` 匹配，提取出 `nodegroup = beijing-factory-a`，然后在 NodeGroup 层级检查权限。

**机制二：Namespace Label 传播**

Namespace 资源上的 Label（如 `theriseunion.io/workspace: ai-team`）被用来推导其所属的 Workspace。对于 Namespace 级别的请求，Authorizer 自动从 Namespace 的 Label 中提取 Workspace 和 Cluster 信息。

**机制三：请求信息解析**

RequestInfoResolver 从 HTTP 请求中解析出 Cluster、Resource、Verb 等信息，为 Scope 提取提供基础数据。

### IAM CRD 体系

五层权限模型通过 7 个 IAM CRD 实现：

| CRD | 职责 | 关键设计 |
|-----|------|---------|
| **User** | 用户身份 | bcrypt 密码、Active/Pending/Disabled 状态 |
| **IAMRole** | 角色定义 | 兼容 K8s PolicyRule + UI 权限 + RoleTemplate 聚合 |
| **IAMRoleBinding** | 角色绑定 | Scope Label 标记作用域 |
| **RoleTemplate** | 权限模板 | 可复用的权限集合，按 Scope 类型组织 |
| **Category** | 分类 | 将 RoleTemplate 组织为类别，支持 i18n |
| **ScopePattern** | Scope 提取 | URL 模式 → Scope 映射 |
| **LoginRecord** | 登录审计 | 记录每次认证的成功/失败 |

### IAMRole 的双层设计

IAMRole 的设计兼顾了 K8s 原生生态兼容和企业管理需求：

```go
type IAMRoleSpec struct {
    // 标准 K8s RBAC PolicyRule，完全兼容 K8s 生态
    Rules []rbacv1.PolicyRule `json:"rules,omitempty"`

    // 前端 UI 权限标识符
    UIPermissions []string `json:"uiPermissions,omitempty"`

    // RoleTemplate 聚合，组合式权限构建
    AggregationRoleTemplates *AggregationRoleTemplates `json:"aggregationRoleTemplates,omitempty"`
}
```

> — `api/iam/v1alpha1/iamrole_types.go`

**K8s 兼容层**：`Rules` 字段使用标准的 `rbacv1.PolicyRule`，IAMRole Controller 将其自动转换为 K8s ClusterRole。这意味着平台的权限模型完全建立在 K8s 原生 RBAC 之上——不是替代，而是扩展。

> **源码实证**：IAMRole Controller 将每个 IAMRole 转换为带有 Scope Label 的 ClusterRole：
> ```go
> return &rbacv1.ClusterRole{
>     ObjectMeta: metav1.ObjectMeta{
>         Name: clusterRoleName,
>         Labels: map[string]string{
>             "iam.theriseunion.io/managed":     "true",
>             "iam.theriseunion.io/scope":       naming.GetScope(iamRole),
>             "iam.theriseunion.io/scope-value": naming.GetScopeValue(iamRole),
>         },
>     },
>     Rules: rules,
> }
> ```
> — `internal/controller/iam/iamrole_controller.go`

**UI 权限层**：`UIPermissions` 字段允许前端根据用户角色动态显示或隐藏功能入口——后端 API 权限和前端界面权限通过同一个角色定义统一管理。

**模板聚合层**：通过 `AggregationRoleTemplates`，管理员可以将多个 RoleTemplate 组合成一个 IAMRole，而不需要手动拼装 PolicyRule。例如，"工作空间管理员"角色可以由"应用管理"、"成员管理"、"资源查看"三个模板聚合而成。

### 跨集群权限同步

平台级和集群级的角色需要在所有成员集群中生效。IAMRole Controller 和 IAMRoleBinding Controller 在检测到 Platform 级别的角色变更时，自动将其同步到所有成员集群。

> **源码实证**：
> ```go
> // 平台级角色自动同步到成员集群
> scope := naming.GetScope(iamRole)
> if scope == v1alpha1.ScopePlatform {
>     if err := r.syncRoleToMemberClusters(ctx, iamRole); err != nil {
>         klog.ErrorS(err, "Failed to sync role to member clusters",
>             "role", iamRole.Name)
>     }
> }
> ```
> — `internal/controller/iam/iamrole_controller.go`

### 授权缓存

五层 Scope 检查需要多次查询 ClusterRole/ClusterRoleBinding，性能开销不可忽视。平台通过 SimpleCache 实现授权缓存：

```go
type SimpleCache struct {
    data            map[string]*cacheEntry         // 授权结果缓存
    namespaceLabels map[string]*namespaceCacheEntry // Namespace Label 缓存
    mu              sync.RWMutex
    ttl             time.Duration                  // 默认 5 分钟
}
```

> — `internal/authorizer/cache.go`

**缓存 Key 设计**：`user:verb:resource:scopeType:scopeValue:resourceName`。注意 Key 中包含了 `resourceName`——这确保了即使缓存了用户对"pods"资源的权限，也不会错误地允许访问特定名称的 Pod（如果用户只有对部分 Pod 的权限）。

**CRD 变化触发失效**：CacheInvalidator 是一个独立的 Controller，监听 IAMRoleBinding、IAMRole 和 ClusterRoleBinding 的变化事件。当角色或绑定发生变更时，精确失效相关用户的缓存条目：

> **源码实证**：
> ```go
> func (c *CacheInvalidator) SetupWithManager(mgr manager.Manager) error {
>     return ctrl.NewControllerManagedBy(mgr).
>         For(&iamv1alpha1.IAMRoleBinding{}).
>         Watches(&iamv1alpha1.IAMRole{},
>             handler.EnqueueRequestsFromMapFunc(c.mapIAMRoleToUsers)).
>         Watches(&rbacv1.ClusterRoleBinding{},
>             handler.EnqueueRequestsFromMapFunc(c.mapClusterRoleBindingToUsers)).
>         Complete(c)
> }
> ```
> — `internal/authorizer/cache_invalidator.go`

**双重失效机制**：TTL 过期是兜底策略（5 分钟内权限变更一定生效），CRD 变化触发是即时策略（权限变更秒级生效）。两者结合确保了性能与一致性的平衡。

---

## 5.3 认证与审计

### OAuth2/OIDC Server

平台内置了完整的 OAuth2/OIDC 认证服务器，支持四种授权模式：

| 授权模式 | 用途 | 适用场景 |
|---------|------|---------|
| **Password Grant** | 用户名/密码直接认证 | 管理控制台登录 |
| **Authorization Code** | OAuth2 标准授权码流程 | 第三方应用集成 |
| **Refresh Token** | Token 续期 | 长时间会话保持 |
| **Client Credentials** | 服务账号认证 | 服务间调用 |

> — `pkg/oapis/oauth/handler.go`

### JWT Token 结构

认证成功后，平台签发 JWT（JSON Web Token），包含用户的基本信息和组成员关系：

```go
type Claims struct {
    Subject          string   `json:"sub"`                       // 用户名
    Name             string   `json:"name,omitempty"`            // 显示名称
    PreferredUsername string  `json:"preferred_username,omitempty"`
    Email            string   `json:"email,omitempty"`
    Groups           []string `json:"groups,omitempty"`          // 用户组
    Issuer           string   `json:"iss,omitempty"`             // 签发者
    Audience         string   `json:"aud,omitempty"`             // 受众
    ExpiresAt        time.Time `json:"exp,omitempty"`            // 过期时间
}
```

> — `pkg/oapis/oauth/types.go`

Token 使用 **RS256**（RSA + SHA-256）签名算法，确保不可篡改。Authorizer 通过验证 Token 签名获取用户身份，然后执行五层 Scope 授权检查。

### LoginRecord — 登录审计记录

每次认证尝试（无论成功还是失败）都会创建一条 LoginRecord CRD：

```go
type LoginRecordSpec struct {
    Type      string `json:"type"`       // 认证方式：Password/OAuth/Token
    Provider  string `json:"provider"`   // 认证提供者：LDAP/GitHub 等
    SourceIP  string `json:"sourceIP"`   // 来源 IP
    Success   bool   `json:"success"`    // 是否成功
    Reason    string `json:"reason"`     // 结果原因
    UserAgent string `json:"userAgent"`  // 客户端标识
}
```

> — `api/iam/v1alpha1/loginrecord_types.go`

LoginRecord 通过 Label `iam.theriseunion.io/username` 关联到用户，支持按用户名快速查询其登录历史。

> **源码实证**：认证失败时同样记录，用于安全审计和入侵检测：
> ```go
> // 密码验证失败
> if !utils.VerifyPassword(password, user.Spec.EncryptedPassword) {
>     ua.createLoginRecord(ctx, username, "Password", "LDAP", req,
>         false, "invalid password")
>     return nil, fmt.Errorf("invalid password")
> }
>
> // 认证成功
> ua.createLoginRecord(ctx, username, "Password", "LDAP", req,
>     true, "Login successful")
> ```
> — `pkg/oapis/oauth/user_auth.go`

**审计价值**：LoginRecord 不仅记录"谁在什么时间登录了"，还记录"谁尝试登录但失败了"。后者对安全分析至关重要——短时间内大量失败的登录尝试可能意味着暴力破解攻击。

---

## 5.4 数据安全

### 密码安全

平台对用户密码的处理遵循三项原则：

**原则一：bcrypt 加密存储**

所有密码使用 bcrypt 算法加密存储，成本因子（Cost）为 10（约 100ms 计算时间）：

```go
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return "", err
    }
    return string(bytes), nil
}
```

> — `pkg/utils/password.go`

bcrypt 的核心优势在于**自适应安全**——随着硬件算力提升，可以增加 Cost 参数来保持破解难度。当前 Cost=10 意味着即使攻击者获取了数据库中的密码哈希，每次暴力破解尝试也需要约 100ms，使大规模暴力破解在时间上不可行。

**原则二：写保护（Write Protection）**

密码哈希字段 `EncryptedPassword` 是**只写**的——API 响应中永远不返回密码哈希：

> **源码实证**：
> ```go
> func (h *Handler) GetUser(request *restful.Request,
>     response *restful.Response) {
>     // ...
>     // 返回响应前清除密码字段
>     responseUser := user.DeepCopy()
>     responseUser.Spec.EncryptedPassword = ""
>     response.WriteEntity(responseUser)
> }
> ```
> — `pkg/oapis/iam/v1alpha1/handler_user.go`

这确保了即使有人获取了 API 访问权限（如通过泄露的 Token），也无法从 API 响应中获取密码哈希。

**原则三：密码复杂度校验**

创建用户和重置密码时，平台强制执行密码复杂度校验：

```go
complexity := utils.DefaultPasswordComplexity()
if err := utils.ValidatePassword(userReq.Spec.Password, complexity); err != nil {
    response.WriteError(http.StatusBadRequest,
        fmt.Errorf("password does not meet complexity requirements: %v", err))
    return
}
```

> — `pkg/oapis/iam/v1alpha1/handler_user.go`

### User 状态管理

用户 CRD 通过 `Status.State` 字段管理账号的生命周期：

| 状态 | 含义 | 是否可登录 |
|------|------|-----------|
| `Active` | 正常活跃 | 是 |
| `Pending` | 等待激活 | 否 |
| `Disabled` | 已禁用 | 否 |

认证时，系统检查用户状态——只有 Active 状态的用户才能通过认证：

```go
if user.Status.State != "" && user.Status.State != iamv1alpha1.UserActive {
    ua.createLoginRecord(ctx, username, "Password", "LDAP", req,
        false, fmt.Sprintf("user account is not active: %s", user.Status.State))
    return nil, fmt.Errorf("user account is not active: %s", user.Status.State)
}
```

> — `pkg/oapis/oauth/user_auth.go`

### 敏感信息保护

平台在多个层面防止敏感信息泄露：

| 层面 | 保护措施 |
|------|---------|
| API 响应 | 密码哈希字段在返回前清除 |
| 日志输出 | 密码和 Token 不记录到日志 |
| CRD 存储 | 密码使用 bcrypt 单向加密，即使 etcd 被泄露也无法还原 |
| 网络传输 | JWT Token 使用 RS256 签名，防篡改 |

---

## 5.5 与竞品的差异

| 能力 | 本平台 | 云厂商方案 | Rancher |
|------|--------|----------|---------|
| 权限层级 | **5 层**（Platform→Cluster→Workspace→NodeGroup→Namespace） | 2 层（云 IAM + Namespace） | 3 层（Global→Cluster→Project） |
| Workspace 隔离 | CRD 原生支持 | 无 | 无 |
| NodeGroup 权限 | 节点组级别细粒度控制 | 无 | 无 |
| 认证方式 | 内置 OAuth2/OIDC（不依赖云服务） | 依赖各自云 IAM | 内置 |
| 审计追踪 | LoginRecord CRD 原生记录 | 依赖云审计服务 | 有（审计日志） |
| 授权缓存 | TTL + CRD 变化触发失效 | 云端缓存 | 无缓存 |

**关键差异**：云厂商的权限体系依赖各自的云 IAM 系统——华为 IAM、阿里 RAM、腾讯 CAM。其粒度止于 Namespace 级别，无法实现"节点组 A 的运维人员不能操作节点组 B"的场景。本平台的 5 层 Scope 模型是专为边缘多团队场景设计的。

Workspace 和 NodeGroup 两个层级是竞品中不存在的——在大型企业的边缘场景中，这两个层级恰好对应"业务团队"和"物理站点"两个最重要的隔离边界。

---

## 5.6 本章小结

组织与安全回答了"多团队怎么安全共享一个平台"的问题：

| 环节 | 机制 | 效果 |
|------|------|------|
| 团队隔离 | Workspace CRD + 自动角色初始化 | 每个团队拥有独立的工作空间，默认角色自动就位 |
| 站点隔离 | NodeGroup 级权限控制 | 工厂 A 的运维看不到工厂 B 的节点 |
| 五层授权 | Namespace→Workspace→NodeGroup→Cluster→Platform | 精确到每个层级的权限控制 |
| 认证安全 | OAuth2/OIDC + JWT RS256 + bcrypt 密码 | 内置认证，不依赖外部服务 |
| 审计追踪 | LoginRecord CRD | 每次登录（成功/失败）可查可追溯 |
| 性能优化 | SimpleCache（TTL 5min + CRD 变化触发失效） | 授权延迟毫秒级，权限变更秒级生效 |
| K8s 兼容 | IAMRole → ClusterRole 自动转换 | 完全建立在 K8s 原生 RBAC 之上 |

这套权限体系的核心价值在于：**让"谁能在哪里做什么"成为系统级保证，而非运维约定。** 当多个团队共享一个边缘平台时，权限的精确性直接决定了平台的可信度。五层 Scope 模型确保了从全局管理员到项目开发者，每个角色只能看到和操作属于自己的资源。

这是第二章提出的"应用并行能力"的制度性保障——多个团队的多个应用可以安全地在同一硬件上并行运行，互不干扰。

---

*下一章：第八章 — 应用运行，断网不断服务*
