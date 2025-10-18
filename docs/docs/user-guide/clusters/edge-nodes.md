---
sidebar_position: 2
title: 边缘节点管理
---

# 边缘节点管理

本文档介绍如何在边缘平台中管理 OpenYurt 边缘节点。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 什么是边缘节点

边缘节点是部署在边缘侧的 Kubernetes 节点，具有以下特点：

- **自治能力** - 云边网络断连时仍可正常运行
- **流量闭环** - 节点池内流量不出边缘
- **轻量运维** - YurtHub 提供节点自治能力

## 🎯 核心概念

### YurtHub

边缘节点的代理组件：

- **数据缓存** - 缓存云端数据，断网时使用
- **流量代理** - 代理 Kubelet 到 API Server 的流量
- **健康检查** - 节点健康状态监控

### NodePool

边缘节点池：

- **节点分组** - 按区域或业务分组节点
- **流量闭环** - 池内服务访问不跨池
- **独立配置** - 每个池可独立配置

### UnitedDeployment

跨节点池部署：

- **差异化配置** - 不同节点池使用不同配置
- **分区部署** - 控制每个池的副本数
- **灰度发布** - 按节点池灰度更新

## 📝 添加边缘节点

### 方式 1: 手动添加

**步骤**：

1. 安装 OpenYurt 组件到节点
2. 给节点打上边缘标签
3. 将节点加入节点池

**命令**：

```bash
# 1. 安装 YurtHub
curl -sSL https://get.openyurt.io | sh

# 2. 打边缘标签
kubectl label node <node-name> openyurt.io/is-edge-worker=true

# 3. 加入节点池
kubectl label node <node-name> apps.openyurt.io/nodepool=<pool-name>
```

### 方式 2: 使用 Console

1. 进入集群详情
2. 点击"边缘节点"标签
3. 点击"添加节点"
4. 选择添加方式
5. 按向导完成添加

## 🏗️ 节点池管理

### 创建节点池

```yaml
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: beijing-pool
spec:
  type: Edge
  annotations:
    location: beijing
    zone: north
```

### 配置节点池

**关键配置**：

| 字段 | 说明 | 示例 |
|------|------|------|
| `type` | 节点池类型 | `Edge` / `Cloud` |
| `annotations` | 池属性标注 | 位置、区域信息 |
| `taints` | 节点污点 | 调度限制 |

### 节点加入节点池

```bash
kubectl label node <node-name> apps.openyurt.io/nodepool=beijing-pool
```

## 📊 监控边缘节点

### 节点状态

- **在线/离线** - 节点连接状态
- **资源使用** - CPU、内存、磁盘
- **Pod 数量** - 运行的 Pod 统计
- **健康状态** - 节点健康检查结果

### 查看节点列表

```bash
# 查看所有边缘节点
kubectl get nodes -l openyurt.io/is-edge-worker=true

# 查看特定节点池的节点
kubectl get nodes -l apps.openyurt.io/nodepool=beijing-pool
```

### 查看节点详情

```bash
kubectl describe node <node-name>
```

## 🔧 边缘应用部署

### 使用 YurtAppSet

YurtAppSet 是面向边缘场景的工作负载：

```yaml
apiVersion: apps.openyurt.io/v1beta1
kind: YurtAppSet
metadata:
  name: edge-app
spec:
  workloadTemplate:
    deploymentTemplate:
      metadata:
        labels:
          app: nginx
      spec:
        replicas: 2
        selector:
          matchLabels:
            app: nginx
        template:
          metadata:
            labels:
              app: nginx
          spec:
            containers:
            - name: nginx
              image: nginx:1.21
  topology:
    pools:
    - name: beijing-pool
      replicas: 2
    - name: shanghai-pool
      replicas: 3
```

### 流量闭环配置

```yaml
apiVersion: v1
kind: Service
metadata:
  name: edge-service
  annotations:
    service.openyurt.io/topologyKeys: openyurt.io/nodepool
spec:
  selector:
    app: nginx
  ports:
  - port: 80
```

## 🆘 故障处理

### 节点离线

**排查步骤**：

1. 检查节点网络连接
2. 查看 YurtHub 日志
3. 验证云边隧道状态
4. 检查节点资源

```bash
# 查看 YurtHub 日志
journalctl -u yurthub -f

# 查看节点事件
kubectl describe node <node-name>
```

### 节点池不可用

**可能原因**：

- 节点池内所有节点离线
- 网络策略配置错误
- 资源不足

**解决方案**：

1. 检查节点状态
2. 验证网络配置
3. 查看资源使用情况

## 📖 相关文档

- [安装边缘节点](../../quick-start/install-edge-node.md)
- [集群管理概览](./overview.md)
- [应用部署](../applications/deployments.md)

---

**需要帮助？** 请查看 [故障排查指南](../../deployment/troubleshooting.md)。
