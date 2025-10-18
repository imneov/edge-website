---
sidebar_position: 1
title: 监控和指标
---

# 监控和指标

本文档介绍边缘平台的监控和指标功能。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 概述

边缘平台集成 Prometheus 和 Grafana，提供完整的监控解决方案：

- **集群监控** - 集群级别的资源和性能监控
- **节点监控** - 节点 CPU、内存、磁盘、网络监控
- **应用监控** - Pod 和容器级别的监控
- **自定义指标** - 业务自定义监控指标

## 🎯 监控架构

```
┌─────────────────────────────────────┐
│         边缘平台 Console            │
│    (监控数据查询和可视化)            │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│          Prometheus                 │
│      (指标采集和存储)                │
│  ┌───────────────────────────┐     │
│  │ - 集群指标                 │     │
│  │ - 节点指标                 │     │
│  │ - Pod 指标                 │     │
│  │ - 自定义指标               │     │
│  └───────────────────────────┘     │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│       监控数据源                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Node     │  │ kube-    │        │
│  │ Exporter │  │ state-   │        │
│  │          │  │ metrics  │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

## 📊 监控指标类型

### 集群级指标

**资源使用**：

| 指标 | 说明 | PromQL |
|------|------|--------|
| CPU 使用率 | 集群 CPU 使用百分比 | `sum(rate(container_cpu_usage_seconds_total{container!=""}[5m]))` |
| 内存使用率 | 集群内存使用百分比 | `sum(container_memory_working_set_bytes{container!=""})` |
| Pod 数量 | 运行中的 Pod 总数 | `count(kube_pod_info)` |
| 存储使用率 | 持久卷使用情况 | `kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes` |

**集群健康**：

- API Server 响应时间
- etcd 健康状态
- 调度器性能
- 控制器管理器状态

### 节点级指标

**系统资源**：

```promql
# 节点 CPU 使用率
100 - (avg by (node) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 节点内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 节点磁盘使用率
(node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100

# 节点网络流量
rate(node_network_receive_bytes_total[5m])
```

**节点状态**：

- 节点就绪状态
- 节点压力状态（CPU、内存、磁盘）
- 节点条件（Ready、MemoryPressure、DiskPressure）

### 应用级指标

**Pod 资源使用**：

```promql
# Pod CPU 使用
sum(rate(container_cpu_usage_seconds_total{pod="<pod-name>"}[5m])) by (pod)

# Pod 内存使用
sum(container_memory_working_set_bytes{pod="<pod-name>"}) by (pod)

# Pod 网络流量
sum(rate(container_network_receive_bytes_total{pod="<pod-name>"}[5m])) by (pod)
```

**应用状态**：

- Pod 运行状态
- 容器重启次数
- 就绪探针状态
- 存活探针状态

## 🖥️ 查看监控数据

### 通过 Console 查看

**集群监控**：

1. 进入"集群管理"
2. 点击集群名称
3. 选择"监控"标签
4. 查看监控图表

**节点监控**：

1. 进入集群详情
2. 点击"节点"标签
3. 选择节点查看详情
4. 查看节点监控指标

**应用监控**：

1. 进入工作空间
2. 点击"应用"
3. 选择应用查看详情
4. 查看应用监控数据

### 通过 Grafana 查看

访问 Grafana 仪表盘：

```bash
# 获取 Grafana 地址
kubectl get svc -n edge-system grafana

# 端口转发（如果需要）
kubectl port-forward -n edge-system svc/grafana 3000:3000
```

默认登录凭据：
- 用户名: `admin`
- 密码: 从 Secret 获取

预置仪表盘：
- Kubernetes Cluster Overview
- Node Exporter Dashboard
- Pod Metrics
- Namespace Metrics

## 📈 告警配置

### 创建告警规则

**通过 Console**：

1. 进入"监控" > "告警规则"
2. 点击"创建规则"
3. 配置告警条件：

```yaml
规则名称: 节点 CPU 使用率过高
告警级别: warning
条件:
  指标: node_cpu_usage
  操作符: >
  阈值: 80
  持续时间: 5m
通知渠道:
  - 邮件
  - 钉钉
  - 企业微信
```

**通过 YAML**：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: node-alerts
  namespace: edge-system
spec:
  groups:
  - name: node
    interval: 30s
    rules:
    - alert: NodeCPUHigh
      expr: |
        100 - (avg by (node) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "节点 {{ $labels.node }} CPU 使用率过高"
        description: "CPU 使用率已达到 {{ $value }}%"
```

### 常用告警规则

**节点告警**：

- CPU 使用率 > 80%
- 内存使用率 > 85%
- 磁盘使用率 > 85%
- 节点不可用

**Pod 告警**：

- Pod 崩溃循环
- Pod 不健康
- 容器内存 OOM
- 容器重启频繁

**集群告警**：

- API Server 不可用
- etcd 不健康
- 集群资源不足

## 🔔 通知配置

### 配置通知渠道

**邮件通知**：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: edge-system
data:
  config.yml: |
    receivers:
    - name: email
      email_configs:
      - to: ops-team@example.com
        from: alertmanager@example.com
        smarthost: smtp.example.com:587
        auth_username: alertmanager
        auth_password: <password>
```

**钉钉通知**：

```yaml
receivers:
- name: dingtalk
  webhook_configs:
  - url: https://oapi.dingtalk.com/robot/send?access_token=<token>
```

**企业微信通知**：

```yaml
receivers:
- name: wechat
  wechat_configs:
  - corp_id: <corp-id>
    agent_id: <agent-id>
    api_secret: <secret>
```

## 📊 自定义指标

### 暴露应用指标

**在应用中集成 Prometheus Client**：

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestCount = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
)

func init() {
    prometheus.MustRegister(requestCount)
}

// 暴露指标端点
http.Handle("/metrics", promhttp.Handler())
```

### 配置 ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-metrics
  namespace: default
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

## 📖 相关文档

- [平台设置](../platform/settings.md) - 配置监控集成
- [集群管理](../clusters/overview.md) - 查看集群监控
- [应用部署](../applications/deployments.md) - 应用监控集成

---

**需要帮助？** 请查看 [故障排查指南](../../deployment/troubleshooting.md)。
