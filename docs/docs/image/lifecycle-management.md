# 镜像生命周期管理

## 概述

镜像生命周期管理涵盖了从镜像引入、使用、更新到最终清理的完整过程。良好的生命周期管理可以优化存储使用、提高部署效率、降低安全风险。

## 镜像生命周期阶段

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  引入阶段     │ → │  使用阶段     │ → │  维护阶段     │ → │  清理阶段     │
│              │    │              │    │              │    │              │
│ - 配置镜像源  │    │ - 应用部署   │    │ - 更新镜像   │    │ - 删除配置   │
│ - 添加镜像    │    │ - 镜像拉取   │    │ - 监控状态   │    │ - 清理数据   │
│ - 同步数据    │    │ - 运行容器   │    │ - 修复问题   │    │ - 释放资源   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

## 引入阶段

### 1. 规划镜像需求

#### 需求分析

在引入镜像前，需要考虑：

| 因素 | 考虑内容 |
|------|----------|
| 业务需求 | 应用需要哪些镜像？版本要求是什么？ |
| 资源规划 | 镜像大小？存储空间是否足够？ |
| 网络环境 | 拉取时间？同步频率？ |
| 安全要求 | 镜像来源是否可信？是否需要扫描？ |
| 依赖关系 | 镜像之间是否有依赖？ |

#### 版本策略

**固定版本策略**（推荐生产环境）：
```yaml
# 使用确切的版本号
tag: "v1.2.3"
```

**环境版本策略**：
```yaml
# 不同环境使用不同版本
dev:     tag: "latest"
staging: tag: "v1.2.3-rc"
prod:    tag: "v1.2.3"
```

### 2. 配置镜像源

#### 选择合适的镜像源

**选择标准**：
- 网络延迟低
- 带宽充足
- 可靠性高
- 安全性好

#### 配置镜像源

详细步骤请参考 [镜像源管理](./registry-management.md)

### 3. 添加镜像配置

#### 创建镜像仓库资源

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: myapp-v1.0.0
  namespace: production
  annotations:
    theriseunion.io/display-name: "MyApp v1.0.0"
    theriseunion.io/description: "生产环境 MyApp v1.0.0 版本"
    theriseunion.io/owner: "platform-team"
    theriseunion.io/support-contact: "platform@example.com"
spec:
  repository: "myapp/myapp"
  tag: "v1.0.0"
  registryRef:
    name: harbor-prod
    namespace: "production"
  syncInterval: "24h"
```

#### 等待首次同步

首次同步可能需要较长时间，特别是对于大型镜像：
- 检查同步状态
- 查看同步日志
- 确认同步完成

## 使用阶段

### 1. 应用部署

#### 引用镜像配置

在应用部署中引用已同步的镜像：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: harbor.example.com/myapp/myapp:v1.0.0
        imagePullPolicy: IfNotPresent
```

#### 镜像拉取策略

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| `IfNotPresent` | 本地不存在时拉取 | 生产环境（推荐） |
| `Always` | 总是拉取最新镜像 | 开发环境 |
| `Never` | 只使用本地镜像 | 离线环境 |

### 2. 监控镜像使用

#### 镜像使用指标

**关键指标**：
- 镜像拉取成功率
- 镜像拉取延迟
- 镜像存储使用量
- 镜像同步成功率

#### 监控面板

```yaml
# Prometheus 监控规则
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: image-usage-metrics
spec:
  groups:
  - name: image.lifecycle
    rules:
    - record: image:pull:success_rate
      expr: |
        sum(rate(image_pull_success_total[5m])) /
        sum(rate(image_pull_total[5m]))

    - record: image:storage:usage_bytes
      expr: |
        sum(image_storage_bytes)
```

## 维护阶段

### 1. 镜像更新

#### 更新策略

**滚动更新**（推荐）：
```yaml
# 逐步替换旧版本镜像
1. 部署新版本 (v1.0.1)
2. 验证新版本运行正常
3. 逐步替换旧版本实例
4. 删除旧版本配置
```

**蓝绿部署**：
```yaml
# 同时维护两个版本
1. 部署新版本到新环境
2. 验证新版本
3. 切换流量到新版本
4. 回收旧版本资源
```

#### 版本管理

**保留策略**：
```yaml
# 生产环境保留最近的 3 个版本
v1.0.3  ← 当前使用
v1.0.2  ← 回滚版本
v1.0.1  ← 紧急回滚版本
# v1.0.0 可以删除
```

### 2. 健康检查

#### 连接状态检查

```bash
# 定期检查镜像源连接状态
kubectl get registrysecrets -o custom-columns=NAME:.metadata.name,STATUS:.metadata.annotations.'theriseunion\.io/verify-status'
```

#### 同步状态检查

```bash
# 检查镜像同步状态
kubectl get repositories -o custom-columns=NAME:.metadata.name,STATUS:.status.syncStatus,LAST_SYNC:.status.lastSynced
```

### 3. 故障处理

#### 同步失败处理

**故障诊断流程**：
1. 检查镜像源连接状态
2. 验证镜像路径和标签
3. 查看同步错误日志
4. 检查网络连接
5. 验证镜像仓库服务

**自动重试**：
```yaml
spec:
  # 配置重试策略
  retryCount: 5
  retryInterval: "5m"
  timeout: "10m"
```

## 清理阶段

### 1. 识别待清理资源

#### 不再使用的镜像

**清理条件**：
- 应用已下线
- 版本已过期
- 标签数量超过保留策略
- 长时间未使用

#### 存储空间压力

**监控指标**：
```bash
# 检查镜像存储使用情况
df -h /var/lib/docker
```

### 2. 清理策略

#### 自动清理策略

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: ImageCleanupPolicy
metadata:
  name: auto-cleanup
  namespace: production
spec:
  # 保留最近的 N 个版本
  keepRecent: 3

  # 清理超过 N 天未使用的镜像
  unusedDays: 30

  # 清理调度
  schedule: "0 2 * * *"  # 每天凌晨 2 点

  # 清理范围
  namespaces:
  - "production"
  - "staging"

  # 排除规则
  exclude:
  - name: "critical-app"
    tag: "v1.0.0"
```

#### 手动清理

**单个删除**：
```bash
# 删除特定的镜像配置
kubectl delete repository myapp-old-version -n production
```

**批量删除**：
```bash
# 删除所有标签为 old 的镜像
kubectl get repositories -n production -o json | \
  jq -r '.items[] | select(.spec.tag | contains("old")) | .metadata.name' | \
  xargs -I {} kubectl delete repository {} -n production
```

### 3. 验证清理结果

#### 确认资源已删除

```bash
# 验证镜像配置已删除
kubectl get repositories -n production | grep myapp-old-version

# 应该返回空结果
```

#### 检查存储释放

```bash
# 检查存储空间是否释放
df -h /var/lib/docker
```

## 最佳实践

### 1. 版本管理

#### 语义化版本控制

```
主版本号.次版本号.修订号 (v1.2.3)
│     │     │
│     │     └─ 修订版本：Bug 修复
│     └─ 次版本：新功能，向后兼容
└─ 主版本：重大变更，可能不兼容
```

#### 版本命名示例

```
生产环境：v1.2.3
预发布：  v1.2.3-rc.1
开发版：   v1.2.3-dev.20240108
```

### 2. 环境隔离

#### 不同环境使用不同的命名空间

```
dev-namespace
├── myapp:latest
└── nginx:latest

test-namespace
├── myapp:v1.2.3-rc
└── nginx:1.21-alpine

prod-namespace
├── myapp:v1.2.3
└── nginx:1.20-alpine
```

### 3. 保留策略

#### 生产环境保留策略

```yaml
# 保留策略
major_versions: 2      # 保留 2 个主版本
minor_versions: 3      # 每个主版本保留 3 个次版本
patches: 5             # 每个次版本保留 5 个修订版本
```

#### 开发环境保留策略

```yaml
# 保留策略
keep_recent: 5         # 只保留最近的 5 个版本
keep_days: 7           # 或保留 7 天内的版本
```

### 4. 监控告警

#### 关键告警规则

```yaml
# 镜像同步失败告警
- alert: ImageSyncFailure
  expr: image_sync_failures > 3
  for: 15m
  annotations:
    summary: "镜像同步连续失败"
    description: "镜像 {{ $labels.image }} 同步失败 {{ $value }} 次"

# 存储空间告警
- alert: ImageStorageHigh
  expr: image_storage_usage_percent > 80
  for: 5m
  annotations:
    summary: "镜像存储空间不足"
    description: "存储使用率 {{ $value }}%，请及时清理"

# 镜像版本过多告警
- alert: TooManyImageVersions
  expr: count(image_versions) > 20
  annotations:
    summary: "镜像版本过多"
    description: "存在 {{ $value }} 个镜像版本，建议清理"
```

### 5. 自动化

#### CI/CD 集成

```yaml
# CI/CD Pipeline 自动化镜像管理
stages:
  - build
  - push
  - update_config

# 构建并推送镜像
build_and_push:
  script:
    - docker build -t myapp:v1.2.3 .
    - docker push harbor.example.com/myapp:v1.2.3

# 更新镜像配置
update_repository:
  script:
    - kubectl apply -f myapp-v1.2.3-repository.yaml
    - kubectl wait --for=condition=Synced repository/myapp-v1.2.3

# 触发应用部署
deploy:
  script:
    - kubectl set image deployment/myapp myapp=harbor.example.com/myapp:v1.2.3
```

## 故障排查

### 常见问题

#### 1. 镜像同步失败

**症状**：
- 同步状态显示"同步失败"
- 同步时间长时间不更新

**排查步骤**：
```bash
# 1. 检查镜像源连接
kubectl get registrysecrets -o wide

# 2. 查看同步错误日志
kubectl describe repository myapp-failed -n production

# 3. 手动触发同步
kubectl annotate repository myapp-failed -n production \
  theriseunion.io/manual-sync="true"
```

#### 2. 镜像拉取慢

**症状**：
- Pod 启动时间长
- 镜像拉取超时

**优化方法**：
```yaml
# 1. 使用本地镜像源
spec:
  registryRef:
    name: harbor-local  # 优先使用本地镜像源

# 2. 调整拉取超时
spec:
  containers:
  - name: myapp
    image: myapp:v1.2.3
    imagePullPolicy: IfNotPresent
```

#### 3. 存储空间不足

**症状**：
- 镜像拉取失败
- 磁盘空间告警

**解决方法**：
```bash
# 1. 清理未使用的镜像
docker system prune -a

# 2. 清理旧的镜像配置
kubectl delete repository -l version=old -n production

# 3. 扩容存储
# 根据实际情况调整节点存储容量
```

## 工具和脚本

### 镜像管理脚本

#### 批量清理脚本

```bash
#!/bin/bash
# cleanup-old-images.sh

NAMESPACE=${1:-"production"}
KEEP_VERSIONS=${2:-3}

echo "清理命名空间 $NAMESPACE 中超过 $KEEP_VERSIONS 个版本的镜像"

# 获取所有镜像名称
images=$(kubectl get repositories -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')

for image in $images; do
  echo "处理镜像: $image"

  # 获取该镜像的所有版本
  versions=$(kubectl get repositories -n $NAMESPACE -o json | \
    jq -r ".items[] | select(.metadata.name == \"$image\") | .spec.tag" | \
    sort -V | \
    head -n -$KEEP_VERSIONS)

  for version in $versions; do
    echo "  删除版本: $version"
    kubectl delete repository "${image}-${version}" -n $NAMESPACE
  done
done
```

#### 镜像同步检查脚本

```bash
#!/bin/bash
# check-sync-status.sh

echo "检查镜像同步状态"

# 获取所有镜像仓库
repos=$(kubectl get repositories -A -o jsonpath='{.items[*].metadata.namespace}/{.items[*].metadata.name}')

for repo in $repos; do
  namespace=$(echo $repo | cut -d'/' -f1)
  name=$(echo $repo | cut -d'/' -f2)

  status=$(kubectl get repository $name -n $namespace -o jsonpath='{.status.syncStatus}')
  last_sync=$(kubectl get repository $name -n $namespace -o jsonpath='{.status.lastSynced}')

  echo "[$namespace/$name] 状态: $status, 最后同步: $last_sync"
done
```

## 相关文档

- [镜像源管理](./registry-management.md)
- [镜像仓库管理](./repository-management.md)
- [镜像安全与认证](./security-authentication.md)
- [故障排查指南](./troubleshooting.md)