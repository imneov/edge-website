---
sidebar_position: 1
title: 部署与运维指南
---

# 部署与运维指南

本章面向平台管理员和运维工程师，介绍边缘智能管理平台的部署流程、日常运维操作、升级策略和灾备方案。

## 部署架构概览

边缘智能管理平台采用云原生架构，核心组件均以 Kubernetes 工作负载形式运行：

```
┌──────────────────────────────────────────────────────────┐
│                    管理集群 (Host Cluster)                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ edge-apiserver│  │edge-controller│  │ edge-console │   │
│  │  (API 网关)   │  │ (编排引擎)    │  │ (Web 控制台)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘   │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────┐  ┌──────────────┐   │
│  │       Kubernetes API Server    │  │ 监控服务组件  │   │
│  │           (etcd 存储)          │  │ Prometheus等  │   │
│  └────────────────────────────────┘  └──────────────┘   │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
   ┌──────▼──┐  ┌──────▼──┐  ┌─────▼───┐
   │边缘集群A │  │边缘集群B │  │边缘集群C │
   │ Edge-A  │  │ Edge-B  │  │ Edge-C  │
   └─────────┘  └─────────┘  └─────────┘
```

### 核心组件说明

| 组件 | 功能 | 部署方式 | 默认端口 |
|------|------|---------|---------|
| edge-apiserver | API 网关，提供认证、授权和资源管理 | Deployment | 8080 |
| edge-controller | 集群编排引擎，管理集群生命周期和工作负载分发 | Deployment | 8443 |
| edge-console | Web 管理控制台（Next.js） | Deployment | 3000 |
| 监控服务 | Prometheus + Alertmanager + Grafana | StatefulSet/Deployment | 9090/3000 |

---

## 环境准备

### 硬件要求

#### POC/测试环境

| 角色 | 数量 | CPU | 内存 | 存储 |
|------|------|-----|------|------|
| Master 节点 | 1 | 4 核 | 8 GB | 100 GB SSD |
| Worker 节点 | 2 | 4 核 | 8 GB | 100 GB SSD |

#### 生产环境

| 角色 | 数量 | CPU | 内存 | 存储 |
|------|------|-----|------|------|
| Master 节点 | 3 | 8 核+ | 16 GB+ | 200 GB+ SSD |
| Worker 节点 | 5+ | 8 核+ | 16 GB+ | 200 GB+ SSD |
| 监控节点 | 1-2 | 4 核+ | 8 GB+ | 500 GB+ SSD |

### 软件依赖

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| Kubernetes | 1.24.0 | 1.28.x | 管理集群 |
| Helm | 3.10.0 | 3.14.x | Chart 部署工具 |
| kubectl | 与集群版本一致 | 1.28.x | 命令行管理工具 |
| cert-manager | 1.10.0 | 1.14.x | TLS 证书管理（可选） |
| Prometheus | 2.40.0 | 2.50.x | 监控（可选） |

### 网络要求

确保以下端口在防火墙中放行：

| 端口 | 协议 | 方向 | 用途 |
|------|------|------|------|
| 6443 | TCP | 入站 | Kubernetes API Server |
| 8080 | TCP | 入站 | edge-apiserver HTTP |
| 443 | TCP | 入站 | HTTPS（Ingress） |
| 2379-2380 | TCP | 集群内部 | etcd 通信 |
| 10250 | TCP | 集群内部 | Kubelet API |
| 10550 | TCP | 边缘入站 | YurtHub（OpenYurt 边缘运行时） |

---

## 部署流程

### 方式一：使用 edge-installer 快速部署

edge-installer 是平台提供的一键部署工具，适用于标准部署场景。

**步骤 1：获取安装包**

```bash
# 克隆安装仓库
git clone https://github.com/theriseunion/edge-installer.git
cd edge-installer
```

**步骤 2：配置部署参数**

编辑环境变量或直接通过命令行参数传递：

```bash
# 必选参数
export NAMESPACE=edge-system           # 部署命名空间
export REGISTRY=your-registry.com/edge # 镜像仓库地址
export TAG=v1.0.0                      # 镜像版本标签

# 可选参数
export ENABLE_MONITORING=true          # 启用监控组件
export PULL_POLICY=IfNotPresent        # 镜像拉取策略
export INSTALL_OPENYURT=false          # 是否安装 OpenYurt 边缘运行时
```

**步骤 3：执行部署**

```bash
./deploy.sh
```

部署脚本按顺序安装以下组件：
1. 创建命名空间和基础资源
2. 部署 edge-controller
3. 部署 edge-apiserver
4. 部署 edge-console
5. （可选）部署监控组件

**步骤 4：验证部署**

```bash
# 检查 Pod 状态，所有 Pod 应为 Running
kubectl get pods -n edge-system

# 检查服务端点
kubectl get svc -n edge-system

# 验证 API Server 健康状态
kubectl exec -n edge-system deploy/edge-apiserver -- curl -s http://localhost:8080/healthz
```

### 方式二：使用 Helm Chart 分步部署

适用于需要精细控制的生产环境。

**部署 Controller**

```bash
helm upgrade --install controller ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set image.repository=your-registry.com/edge/controller \
  --set image.tag=v1.0.0 \
  --set replicaCount=2 \
  --set resources.limits.cpu=1 \
  --set resources.limits.memory=1Gi \
  --wait --timeout 10m
```

**部署 API Server**

```bash
helm upgrade --install apiserver ./edge-apiserver \
  --namespace edge-system \
  --set image.repository=your-registry.com/edge/apiserver \
  --set image.tag=v1.0.0 \
  --set replicaCount=3 \
  --set autoscaling.enabled=true \
  --set autoscaling.minReplicas=3 \
  --set autoscaling.maxReplicas=10 \
  --set ingress.enabled=true \
  --set 'ingress.hosts[0].host=api.edge.example.com' \
  --wait --timeout 10m
```

**部署 Console**

```bash
helm upgrade --install console ./edge-console \
  --namespace edge-system \
  --set image.repository=your-registry.com/edge/console \
  --set image.tag=v1.0.0 \
  --set replicaCount=2 \
  --set ingress.enabled=true \
  --set 'ingress.hosts[0].host=edge.example.com' \
  --wait --timeout 10m
```

---

## 配置管理

### 核心配置项

edge-apiserver 通过 ConfigMap 管理运行时配置：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-apiserver
  namespace: edge-system
data:
  edge.yaml: |
    server:
      port: 8080
      readTimeout: 30s
      writeTimeout: 30s
    authentication:
      tokenExpiration: 24h
    authorization:
      cacheEnabled: true
      cacheTTL: 5m
```

### 配置变更流程

1. 修改 ConfigMap 中的配置值
2. 触发 Deployment 滚动更新（Helm Chart 通过 `checksum/config` 注解自动触发）
3. 观察新 Pod 启动并通过健康检查
4. 确认旧 Pod 被正常终止

```bash
# 修改配置后重新部署
helm upgrade apiserver ./edge-apiserver \
  --namespace edge-system \
  --reuse-values \
  --set 'configMap.data.edge\.yaml=<new-config>'
```

### 资源配额建议

| 组件 | CPU Request | CPU Limit | Memory Request | Memory Limit |
|------|------------|-----------|---------------|-------------|
| edge-apiserver | 100m | 1000m | 256Mi | 1Gi |
| edge-controller | 100m | 500m | 128Mi | 512Mi |
| edge-console | 50m | 500m | 128Mi | 512Mi |

---

## 日常运维操作

### 健康检查

平台提供两种健康检查端点：

- **存活探针** `/healthz`：检查进程是否正常运行。失败时 Kubernetes 自动重启容器。
- **就绪探针** `/readyz`：检查服务是否能接收流量。依赖 Kubernetes API 连接等外部条件。

```bash
# 手动检查服务健康状态
curl http://<apiserver-endpoint>:8080/healthz
curl http://<apiserver-endpoint>:8080/readyz
```

### 日志管理

**查看实时日志**

```bash
# 查看 API Server 日志
kubectl logs -f deploy/edge-apiserver -n edge-system

# 查看 Controller 日志
kubectl logs -f deploy/edge-controller -n edge-system

# 查看上一次崩溃的日志
kubectl logs deploy/edge-apiserver -n edge-system --previous
```

**日志级别调整**

通过环境变量 `LOG_LEVEL` 控制日志级别，支持 `debug`、`info`、`warn`、`error`：

```bash
kubectl set env deploy/edge-apiserver LOG_LEVEL=debug -n edge-system
```

### 证书管理

平台使用 TLS 加密所有通信。证书管理方式取决于部署配置：

- **cert-manager 自动管理**：推荐方案，自动签发和续期证书
- **手动管理**：需要定期检查证书有效期并手动更新

```bash
# 检查证书有效期（cert-manager 场景）
kubectl get certificate -n edge-system

# 手动检查 TLS Secret 中的证书到期时间
kubectl get secret edge-platform-tls -n edge-system -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -dates
```

---

## 备份与恢复

### 备份策略

| 备份对象 | 备份方式 | 建议频率 | 保留周期 |
|---------|---------|---------|---------|
| etcd 数据 | etcdctl snapshot | 每日 | 30 天 |
| CRD 资源定义 | kubectl get -o yaml | 每周 | 90 天 |
| Helm Release 配置 | helm get values | 每次变更后 | 永久 |
| 监控数据 | Prometheus 快照 | 每周 | 按需 |

### etcd 备份

```bash
# 创建 etcd 快照
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### CRD 资源备份

```bash
# 备份所有平台 CRD 实例
for crd in clusters.scope.theriseunion.io \
           workspaces.scope.theriseunion.io \
           nodegroups.scope.theriseunion.io \
           applications.app.theriseunion.io \
           applicationversions.app.theriseunion.io \
           users.iam.theriseunion.io \
           iamroles.iam.theriseunion.io; do
  kubectl get $crd -o yaml > /backup/$(echo $crd | cut -d. -f1)-$(date +%Y%m%d).yaml
done
```

### 灾难恢复

**恢复 etcd**

```bash
# 停止 kube-apiserver
# 恢复 etcd 快照
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-20250101.db \
  --data-dir=/var/lib/etcd-restored

# 替换 etcd 数据目录并重启
```

**恢复 CRD 资源**

```bash
# 重新应用 CRD 定义
kubectl apply -f /backup/clusters-20250101.yaml
kubectl apply -f /backup/workspaces-20250101.yaml
# ... 按依赖顺序恢复其他资源
```

---

## 升级流程

### 升级前检查

1. 确认当前版本和目标版本的兼容性（参阅发布说明）
2. 完成 etcd 和 CRD 资源备份
3. 确认无正在运行的关键任务（如 OTA 升级任务）
4. 通知相关用户计划维护窗口

### 滚动升级

平台采用 Kubernetes 原生滚动更新策略，确保升级过程中服务不中断：

```bash
# 更新镜像版本
helm upgrade apiserver ./edge-apiserver \
  --namespace edge-system \
  --reuse-values \
  --set image.tag=v1.1.0 \
  --wait --timeout 10m

helm upgrade controller ./edge-controller \
  --namespace edge-system \
  --reuse-values \
  --set image.tag=v1.1.0 \
  --wait --timeout 10m

helm upgrade console ./edge-console \
  --namespace edge-system \
  --reuse-values \
  --set image.tag=v1.1.0 \
  --wait --timeout 10m
```

### 升级验证

```bash
# 确认 Pod 运行正常
kubectl get pods -n edge-system

# 检查服务版本
curl http://<apiserver-endpoint>:8080/oapis/version

# 验证 API 可用性
curl -H "Authorization: Bearer $TOKEN" \
  http://<apiserver-endpoint>:8080/oapis/tenant/v1alpha1/clusters
```

### 回滚

如果升级后出现问题，使用 Helm 快速回滚：

```bash
# 查看发布历史
helm history apiserver -n edge-system

# 回滚到上一版本
helm rollback apiserver -n edge-system

# 回滚到指定版本
helm rollback apiserver 5 -n edge-system
```

---

## 监控与告警运维

### 监控组件部署

```bash
helm upgrade --install edge-monitoring ./edge-monitoring \
  --namespace observability-system \
  --create-namespace \
  --wait --timeout 15m
```

### 关键监控指标

| 指标类别 | 关键指标 | 告警阈值建议 |
|---------|---------|------------|
| API Server | 请求延迟 P99 | > 2s |
| API Server | 错误率 (5xx) | > 1% |
| Controller | 协调队列深度 | > 100 |
| Controller | 协调失败率 | > 5% |
| 集群 | 节点 NotReady 数 | > 0 |
| 资源 | CPU 使用率 | > 80% |
| 资源 | 内存使用率 | > 85% |
| 存储 | etcd 磁盘使用率 | > 70% |

### 监控访问

```bash
# 访问 Grafana 仪表盘
kubectl port-forward svc/edge-grafana 3000:3000 -n observability-system

# 访问 Prometheus 查询界面
kubectl port-forward svc/edge-prometheus 9090:9090 -n observability-system
```

---

## 故障排查

### 排查流程

```
问题发生 → 检查 Pod 状态 → 查看事件日志 → 分析容器日志 → 检查网络/RBAC → 定位根因
```

### 常见故障及处理

| 故障现象 | 可能原因 | 排查命令 | 处理方案 |
|---------|---------|---------|---------|
| Pod 持续 Pending | 资源不足或调度限制 | `kubectl describe pod <name>` | 增加节点资源或调整 requests |
| Pod CrashLoopBackOff | 配置错误或依赖不可用 | `kubectl logs <pod> --previous` | 检查日志定位异常并修复配置 |
| ImagePullBackOff | 镜像地址错误或凭据失效 | `kubectl describe pod <name>` | 检查镜像地址和 imagePullSecrets |
| API 返回 401 | Token 过期或认证配置错误 | 重新获取 Token | 检查 OAuth 配置，重新登录 |
| API 返回 403 | 权限不足 | `kubectl auth can-i` | 检查用户角色绑定 |
| 边缘节点离线 | 网络中断 | `kubectl get nodes` | 检查边缘节点网络连通性 |

### 调试工具

```bash
# 检查集群事件
kubectl get events -n edge-system --sort-by='.lastTimestamp'

# 检查资源使用情况
kubectl top pods -n edge-system
kubectl top nodes

# 网络连通性测试
kubectl run debug --rm -it --image=nicolaka/netshoot --restart=Never -- \
  curl http://edge-apiserver.edge-system.svc.cluster.local:8080/healthz
```

---

## 运维检查清单

### 每日检查

- [ ] 所有 Pod 处于 Running 状态
- [ ] 健康检查端点返回正常
- [ ] 无异常告警触发
- [ ] API 响应时间正常

### 每周检查

- [ ] 节点资源使用率趋势
- [ ] etcd 数据库大小
- [ ] 证书有效期（距到期 > 30 天）
- [ ] 日志存储空间

### 每月检查

- [ ] 安全补丁更新评估
- [ ] 备份恢复演练
- [ ] 容量规划评估
- [ ] 审计日志审查
