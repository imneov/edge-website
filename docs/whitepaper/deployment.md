---
title: 第五章 部署架构
description: Edge Platform 不同场景下的部署方案与最佳实践
sidebar_position: 6
tags: [whitepaper, deployment, 部署架构]
---

# 第五章 部署架构

## 最小化部署

### 部署目标

最小化部署适用于**开发测试环境**、**POC验证**、**快速体验**等场景，以最少的资源快速搭建Edge Platform。

#### 适用场景

- 开发测试环境
- 产品功能验证
- 技术选型评估
- 培训演示环境

#### 不适用场景

❌ 生产环境
❌ 高可用要求
❌ 大规模集群管理

### 硬件要求

**宿主集群最小配置**：

| 组件 | CPU | 内存 | 磁盘 | 数量 |
|-----|-----|------|------|------|
| **Master节点** | 4核 | 8GB | 100GB | 1 |
| **Worker节点** | 4核 | 8GB | 100GB | 2 |
| **总计** | 12核 | 24GB | 300GB | 3台 |

### 软件要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Kubernetes** | 1.25+ | 宿主K8s集群 |
| **Docker** | 20.10+ | 容器运行时 |
| **Helm** | 3.10+ | 包管理工具 |
| **kubectl** | 1.25+ | K8s命令行工具 |

### 部署架构

```mermaid
graph TB
    subgraph 最小化部署架构
        subgraph 控制节点
            M1[Master Node<br/>4C8G]
            K1[Kube-apiserver]
            K2[Controller]
            K3[Scheduler]
            E1[etcd]
        end

        subgraph 工作节点
            W1[Worker Node-1<br/>4C8G]
            W2[Worker Node-2<br/>4C8G]
        end

        subgraph Edge Platform组件
            API[API Server<br/>单实例]
            CON[Controller<br/>单实例]
            WEB[Console<br/>单实例]
            PM[Prometheus<br/>单实例]
            LOK[Loki<br/>单实例]
        end
    end

    M1 --> W1
    M1 --> W2

    W1 --> API
    W1 --> CON
    W2 --> WEB
    W2 --> PM
    W2 --> LOK
```

### 部署步骤

#### 1. 准备Kubernetes集群

```bash
# 安装Kubernetes（以kubeadm为例）
kubeadm init --pod-network-cidr=10.244.0.0/16

# 配置kubectl
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 安装网络插件（Flannel）
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# 添加工作节点
kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash <hash>
```

#### 2. 安装Edge Platform

```bash
# 添加Edge Platform Helm仓库
helm repo add edge-platform https://charts.edge.theriseunion.io
helm repo update

# 安装最小化配置
helm install edge-platform edge-platform/edge-platform \
  --namespace edge-platform \
  --create-namespace \
  --set global.mode=minimal \
  --set api-server.replicas=1 \
  --set controller.replicas=1 \
  --set console.replicas=1 \
  --set monitoring.enabled=true \
  --set logging.enabled=true
```

#### 3. 验证部署

```bash
# 检查Pod状态
kubectl get pods -n edge-platform

# 检查服务状态
kubectl get svc -n edge-platform

# 访问Console
kubectl port-forward svc/edge-platform-console 3000:80 -n edge-platform
```

## 高可用部署

### 部署目标

高可用部署适用于**生产环境**，提供99.9%+的服务可用性，支持故障自动转移。

### 硬件要求

**生产环境推荐配置**：

| 组件 | CPU | 内存 | 磁盘 | 数量 |
|-----|-----|------|------|------|
| **Master节点** | 8核 | 16GB | 200GB | 3 |
| **Worker节点** | 16核 | 32GB | 500GB | 5 |
| **存储节点** | 8核 | 16GB | 2TB | 3 |
| **总计** | 104核 | 208GB | 4.3TB | 11台 |

### 高可用架构

```mermaid
graph TB
    subgraph 高可用部署架构
        subgraph 控制平面高可用
            LB[Load Balancer<br/>HAProxy/Keepalived]

            M1[Master-1<br/>8C16G]
            M2[Master-2<br/>8C16G]
            M3[Master-3<br/>8C16G]

            ETCD1[etcd-1]
            ETCD2[etcd-2]
            ETCD3[etcd-3]
        end

        subgraph 应用层高可用
            API1[API Server-1]
            API2[API Server-2]
            API3[API Server-3]

            CON1[Controller-1]
            CON2[Controller-2]
            CON3[Controller-3]

            WEB1[Console-1]
            WEB2[Console-2]
        end

        subgraph 存储高可用
            DB1[(PostgreSQL-1)]
            DB2[(PostgreSQL-2)]
            DB3[(PostgreSQL-3)]

            REDIS1[(Redis-1)]
            REDIS2[(Redis-2)]
            REDIS3[(Redis-3)]
        end
    end

    LB --> M1
    LB --> M2
    LB --> M3

    M1 --> ETCD1
    M2 --> ETCD2
    M3 --> ETCD3

    M1 --> API1
    M2 --> API2
    M3 --> API3

    API1 --> CON1
    API2 --> CON2
    API3 --> CON3

    CON1 --> WEB1
    CON2 --> WEB2

    API1 --> DB1
    API2 --> DB2
    API3 --> DB3

    CON1 --> REDIS1
    CON2 --> REDIS2
    CON3 --> REDIS3
```

### 关键高可用特性

#### 控制平面高可用

**etcd集群**：
- 3节点奇数集群
- 跨节点部署
- 自动故障选举

**API Server高可用**：
- 多实例部署
- 负载均衡分发
- 健康检查机制

#### 数据库高可用

**PostgreSQL主从复制**：
```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-ha
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised

  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"

  bootstrap:
    initdb:
      database: edge_platform
      owner: edge_platform
      secret:
        name: postgres-credentials

  storage:
    size: 100Gi
    storageClass: fast-ssd
```

**Redis Cluster**：
```yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: redis-cluster
spec:
  clusterSize: 6
  clusterVersion: v7.0.4
  persistenceEnabled: true
  redisExporter:
    enabled: true
    image: oliver006/redis_exporter:latest
  storage:
    volumeClaimTemplate:
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
        storageClassName: fast-ssd
```

### 部署配置

```bash
# 高可用部署
helm install edge-platform edge-platform/edge-platform \
  --namespace edge-platform \
  --create-namespace \
  --set global.mode=production \
  --set api-server.replicas=3 \
  --set controller.replicas=3 \
  --set console.replicas=2 \
  --set api-server.resources.requests.cpu=2000m \
  --set api-server.resources.requests.memory=4Gi \
  --set controller.resources.requests.cpu=1000m \
  --set controller.resources.requests.memory=2Gi \
  --set postgresql.enabled=true \
  --set redis.enabled=true \
  --set monitoring.enabled=true \
  --set logging.enabled=true
```

## 多集群部署

### 部署目标

多集群部署适用于**跨地域部署**、**混合云架构**、**多租户SaaS平台**等复杂场景。

### 部署架构

```mermaid
graph TB
    subgraph 多集群部署架构
        subgraph 管理集群 - 北京
            MGMT[Management Cluster<br/>管理平面]
            LB1[Global Load Balancer]
            UI[Global Console]
        end

        subgraph 边缘集群 - 华东区
            subgraph 上海集群
                EC1[Edge Cluster-1]
                VCA1[vcluster-1...N]
            end

            subgraph 杭州集群
                EC2[Edge Cluster-2]
                VCA2[vcluster-1...N]
            end
        end

        subgraph 边缘集群 - 华北区
            subgraph 北京集群
                EC3[Edge Cluster-3]
                VCA3[vcluster-1...N]
            end

            subgraph 天津集群
                EC4[Edge Cluster-4]
                VCA4[vcluster-1...N]
            end
        end

        subgraph 边缘集群 - 华南区
            subgraph 深圳集群
                EC5[Edge Cluster-5]
                VCA5[vcluster-1...N]
            end
        end
    end

    LB1 --> UI
    UI --> EC1
    UI --> EC2
    UI --> EC3
    UI --> EC4
    UI --> EC5

    MGMT --> EC1
    MGMT --> EC2
    MGMT --> EC3
    MGMT --> EC4
    MGMT --> EC5

    EC1 --> VCA1
    EC2 --> VCA2
    EC3 --> VCA3
    EC4 --> VCA4
    EC5 --> VCA5
```

### 网络架构

#### 网络连接方案

**VPN隧道**：
```yaml
# WireGuard VPN配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: wireguard-config
data:
  wg0.conf: |
    [Interface]
    Address = 10.0.0.1/24
    ListenPort = 51820
    PrivateKey = <private-key>

    [Peer]
    PublicKey = <beijing-public-key>
    AllowedIPs = 10.0.1.0/24

    [Peer]
    PublicKey = <shanghai-public-key>
    AllowedIPs = 10.0.2.0/24
```

**专线连接**：
- SD-WAN组网方案
- MPLS专线连接
- 跨地域负载均衡

### 数据同步策略

#### 配置同步

```mermaid
graph LR
    subgraph 配置同步流程
        A[管理集群<br/>配置变更] --> B[配置推送]
        B --> C[边缘集群<br/>配置接收]
        C --> D[配置应用]
        D --> E[状态上报]
        E --> F[状态同步]
        F --> A
    end
```

#### 应用分发

```yaml
apiVersion: edge.theriseunion.io/v1alpha1
kind: ApplicationDeployment
metadata:
  name: cross-region-app
spec:
  applicationVersionRef: monitoring-stack-v2.0.0
  targets:
    # 华东区所有集群
    - region: east-china
      clusters:
        - shanghai-cluster
        - hangzhou-cluster
      nodeGroupRef: monitoring-nodes
      replicas: 2

    # 华北区生产集群
    - region: north-china
      clusters:
        - beijing-cluster
      nodeGroupRef: production-nodes
      replicas: 3

    # 华南区测试集群
    - region: south-china
      clusters:
        - shenzhen-cluster
      nodeGroupRef: test-nodes
      replicas: 1
```

## 配置参数参考

### Helm Chart 完整配置

```yaml
# values.yaml
global:
  # 部署模式：minimal | production | multi-cluster
  mode: production

  # 镜像仓库配置
  imageRegistry: registry.edge.theriseunion.io
  imageTag: "v1.0.0"

  # 存储配置
  storageClass: "fast-ssd"

# API Server配置
apiServer:
  # 副本数
  replicas: 3

  # 资源配置
  resources:
    requests:
      cpu: 2000m
      memory: 4Gi
    limits:
      cpu: 4000m
      memory: 8Gi

  # 数据库配置
  database:
    host: postgres-ha.edge-platform.svc.cluster.local
    port: 5432
    database: edge_platform
    user: edge_platform

  # Redis配置
  redis:
    addresses:
      - "redis-cluster-1.edge-platform.svc.cluster.local:6379"
      - "redis-cluster-2.edge-platform.svc.cluster.local:6379"
      - "redis-cluster-3.edge-platform.svc.cluster.local:6379"

# Controller配置
controller:
  replicas: 3

  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi

# Console配置
console:
  replicas: 2

  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1000m
      memory: 2Gi

  # 网络配置
  service:
    type: LoadBalancer
    loadBalancerIP: 192.168.1.100

# 数据库配置
postgresql:
  enabled: true

  primary:
    persistence:
      size: 100Gi

  readReplicas:
    replicaCount: 2

# Redis配置
redis:
  enabled: true

  cluster:
    nodes: 6

  persistence:
    size: 10Gi

# 监控配置
monitoring:
  enabled: true

  prometheus:
    retention: 15d
    storage:
      size: 50Gi

  grafana:
    persistence:
      size: 10Gi

# 日志配置
logging:
  enabled: true

  loki:
    retention: 30d
    storage:
      size: 100Gi

# ChartMuseum配置
chartMuseum:
  enabled: true

  persistence:
    size: 50Gi

  # 离线模式
  offlineMode: true

  # 内置Chart列表
  builtinCharts:
    - name: monitoring-stack
      version: "1.5.0"
    - name: logging-stack
      version: "1.2.0"
    - name: ingress-nginx
      version: "4.8.0"
```

### 环境变量配置

```bash
# API Server环境变量
API_SERVER_ARGS="
  --log-level=info
  --metrics-bind-address=0.0.0.0:8080
  --health-probe-bind-address=0.0.0.0:8081
  --leader-elect
  --leader-elect-lease-duration=15s
  --leader-elect-renew-deadline=10s
  --leader-elect-retry-period=2s
"

# 数据库连接字符串
DATABASE_URL="postgres://edge_platform:password@postgres-ha:5432/edge_platform?sslmode=verify-full"

# Redis连接地址
REDIS_ADDRESSES="redis-cluster-1:6379,redis-cluster-2:6379,redis-cluster-3:6379"

# JWT密钥
JWT_SECRET="your-jwt-secret-key"

# OAuth配置
OAUTH_CLIENT_ID="edge-console"
OAUTH_CLIENT_SECRET="edge-secret"
OAUTH_ISSUER="https://oauth.example.com"
```

---

白皮书到此结束。希望这份技术白皮书能够帮助您全面了解Edge Platform的技术架构和核心优势。

**更多资源**：
- [在线文档](https://docs.edge.theriseunion.io)
- [GitHub仓库](https://github.com/theriseunion/edge-platform)
- [技术支持](mailto:support@theriseunion.io)