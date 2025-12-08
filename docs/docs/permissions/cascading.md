---
sidebar_position: 5
title: 级联权限继承
---

# 级联权限继承

级联权限继承是边缘平台权限体系的核心算法，通过 Scope Chain 实现权限的向上级联查找和继承。

## 核心算法

### 向上级联原则

```
检查顺序: namespace → workspace → cluster → platform
权限逻辑: 任何一层 Allow = 整体 Allow（短路返回）
```

### 算法实现

```go
func CascadingAuthorize(user, verb, resource, namespace string) Decision {
    // 1. 构建 Scope Chain
    chain := []Scope{
        {Type: "namespace", Value: namespace},
        {Type: "workspace", Value: getWorkspace(namespace)},
        {Type: "cluster", Value: getCurrentCluster()},
        {Type: "platform", Value: "global"},
    }

    // 2. 级联检查
    for _, scope := range chain {
        bindings := findUserBindings(user, scope)
        for _, binding := range bindings {
            if checkK8sRBAC(user, verb, resource, binding.Role) == Allow {
                return Allow  // 短路返回
            }
        }
    }

    return Deny
}
```

## 实战场景

### 场景 1: 开发者访问 Namespace 资源

**配置：**
```yaml
# Alice 在 workspace 级别有 developer 权限
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRoleBinding
metadata:
  name: alice-workspace-dev
  labels:
    iam.theriseunion.io/scope: workspace
    iam.theriseunion.io/scope-value: beijing
spec:
  subjects:
  - kind: User
    name: alice
  roleRef:
    kind: IAMRole
    name: workspace-developer
```

**请求处理：**
```
Request: alice GET /api/v1/namespaces/dongchengqu/pods

Scope Chain: [namespace-dongchengqu, workspace-beijing, cluster-china, platform]

Check 1: namespace-dongchengqu → No binding found
Check 2: workspace-beijing → Found alice-workspace-dev → Allow

Result: Allow (by workspace scope)
```

### 场景 2: 权限补充

用户在多个 Scope 有不同权限，高层权限补充低层缺失的权限：

```yaml
# Namespace scope: 只读
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRoleBinding
metadata:
  labels:
    iam.theriseunion.io/scope: namespace
    iam.theriseunion.io/scope-value: prod
spec:
  subjects:
  - kind: User
    name: carol
  roleRef:
    name: viewer  # 只能 get/list

---
# Workspace scope: 读写
apiVersion: iam.theriseunion.io/v1alpha1
kind: IAMRoleBinding
metadata:
  labels:
    iam.theriseunion.io/scope: workspace
    iam.theriseunion.io/scope-value: prod-workspace
spec:
  subjects:
  - kind: User
    name: carol
  roleRef:
    name: developer  # 可以 create/update
```

**权限行为：**
```bash
# 读操作 - namespace scope 允许
kubectl get pods -n prod --as=carol
# Allow (by namespace scope viewer role)

# 写操作 - namespace scope 拒绝，workspace scope 允许
kubectl create -f pod.yaml -n prod --as=carol
# namespace scope: Deny (viewer 无 create 权限)
# workspace scope: Allow (developer 有 create 权限)
# Result: Allow (by workspace scope)
```

## 性能优化

### 短路机制

找到第一个 Allow 立即返回，避免不必要的检查：

```go
for _, scope := range scopeChain {
    if decision := checkScope(scope); decision == Allow {
        return Allow  // 立即返回，不继续检查
    }
}
```

**性能提升：**
- 大多数用户在前 2 层就有权限
- 平均减少 50-70% 检查次数
- P95 延迟 < 10ms

### Scope Chain 缓存

```go
type ScopeChainCache struct {
    cache sync.Map  // namespace → []Scope
    ttl   time.Duration
}

func (c *ScopeChainCache) Get(namespace string) []Scope {
    if cached, ok := c.cache.Load(namespace); ok {
        return cached.([]Scope)
    }

    chain := buildScopeChain(namespace)
    c.cache.Store(namespace, chain)
    return chain
}
```

## 权限继承规则

### 规则 1: 向下传递

上级 Scope 的权限自动对下级生效：

```
Platform Admin → 可以访问所有 Cluster
Cluster Admin → 可以访问该 Cluster 下所有 Workspace/Namespace
Workspace Admin → 可以访问该 Workspace 下所有 Namespace
```

### 规则 2: 权限并集

同一用户在多个 Scope 的权限取并集：

```
Final Permission = namespace_perm ∪ workspace_perm ∪ cluster_perm ∪ platform_perm
```

### 规则 3: 无权限覆盖

下级 Scope 不能撤销上级 Scope 授予的权限。

## 边界情况

### 情况 1: Namespace 无 Workspace

```go
func buildScopeChain(namespace string) []Scope {
    chain := []Scope{{Type: "namespace", Value: namespace}}

    workspace := getWorkspace(namespace)
    if workspace == "" {
        // 跳过 workspace，直接到 cluster
        chain = append(chain, Scope{Type: "cluster", Value: getCurrentCluster()})
    } else {
        chain = append(chain, Scope{Type: "workspace", Value: workspace})
        // ...
    }

    return chain
}
```

### 情况 2: 循环引用检测

```go
func buildScopeChain(namespace string) []Scope {
    visited := make(map[string]bool)
    chain := []Scope{}

    current := namespace
    for current != "" && !visited[current] {
        visited[current] = true
        chain = append(chain, Scope{Type: "namespace", Value: current})
        current = getParent(current)
    }

    return chain
}
```

## 监控和调试

### 调试命令

```bash
# 检查用户在各层级的权限
kubectl auth can-i get pods --namespace=dev --as=alice
kubectl auth can-i get pods --as=alice  # cluster level

# 查看完整权限列表
kubectl auth can-i --list --namespace=dev --as=alice
```

### 日志示例

```
I0117 Authorization request: user=alice verb=get resource=pods namespace=dev
I0117 Scope chain: [namespace-dev, workspace-team1, cluster-prod, platform]
V4 Checking scope: namespace-dev → No bindings
V4 Checking scope: workspace-team1 → Found binding: alice-workspace-dev
I0117 Decision: Allow (by workspace scope)
```

## 最佳实践

1. **合理分配 Scope 层级** - 避免所有权限都放在 platform scope
2. **使用 RoleTemplate 复用** - 减少重复定义
3. **定期审计高层级权限** - cluster 和 platform scope 绑定
4. **监控级联检查性能** - 确保 P95 < 10ms

## 下一步

- 阅读 **[API 扩展](./api-extension.md)** - 扩展 API 的权限集成
- 实践 **[Controller 开发](../api/controller.md)** - 开发自定义 Controller
- 参考 **[设计文档](/Users/neov/src/github.com/edge/apiserver/docs/design/5-scope-cascading-permission-design.md)**
