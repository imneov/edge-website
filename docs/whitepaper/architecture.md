---
title: 第四章 技术架构
description: Edge Platform 系统架构设计与技术实现细节
sidebar_position: 5
tags: [whitepaper, architecture, 技术架构]
---

# 第四章 技术架构

## 系统逻辑架构

### 分层架构设计

```mermaid
graph TB
    subgraph 用户层
        U1[平台管理员]
        U2[集群管理员]
        U3[应用开发者]
        U4[运维人员]
    end

    subgraph 接入层
        P1[Web Console]
        P2[kubectl CLI]
        P3[Helm CLI]
        P4[API Client]
    end

    subgraph API层
        A1[REST API Server]
        A2[K8s API Server]
        A3[Webhook Server]
    end

    subgraph 业务逻辑层
        B1[权限管理]
        B2[多集群管理]
        B3[应用商店]
        B4[组件管理]
    end

    subgraph Controller层
        C1[RoleTemplate Controller]
        C2[IAMRole Controller]
        C3[Cluster Controller]
        C4[Application Controller]
        C5[Component Controller]
    end

    subgraph 数据存储层
        D1[etcd]
        D2[Prometheus]
        D3[Loki]
        D4[ChartMuseum]
    end

    U1 --> P1
    U2 --> P2
    U3 --> P3
    U4 --> P4

    P1 --> A1
    P2 --> A2
    P3 --> A2
    P4 --> A1

    A1 --> B1
    A1 --> B2
    A1 --> B3
    A1 --> B4
    A2 --> C1
    A2 --> C2
    A2 --> C3
    A2 --> C4
    A2 --> C5

    C1 --> D1
    C2 --> D1
    C3 --> D1
    C4 --> D1
    C5 --> D1
    B1 --> D2
    B2 --> D3
    B4 --> D4
```

### 各层职责

#### 用户层
- **平台管理员**：负责平台级配置和用户管理
- **集群管理员**：负责集群和节点管理
- **应用开发者**：负责应用开发和部署
- **运维人员**：负责系统运维和监控

#### 接入层
- **Web Console**：基于React的Web管理界面
- **kubectl CLI**：Kubernetes命令行工具
- **Helm CLI**：Helm包管理工具
- **API Client**：REST API客户端

#### API层
- **REST API Server**：提供业务API接口
- **K8s API Server**：Kubernetes原生API
- **Webhook Server**：准入控制和验证

#### 业务逻辑层
- **权限管理**：5层Scope权限模型实现
- **多集群管理**：vcluster虚拟集群管理
- **应用商店**：应用生命周期管理
- **组件管理**：Chart组件管理

#### Controller层
- **RoleTemplate Controller**：权限模板控制器
- **IAMRole Controller**：权限角色控制器
- **Cluster Controller**：集群控制器
- **Application Controller**：应用控制器
- **Component Controller**：组件控制器

#### 数据存储层
- **etcd**：Kubernetes元数据存储
- **Prometheus**：监控指标存储
- **Loki**：日志数据存储
- **ChartMuseum**：Helm Chart仓库

## 系统技术架构

### 后端架构

#### 微服务设计

```mermaid
graph TB
    subgraph 网关层
        G[API Gateway]
        LB[Load Balancer]
    end

    subgraph 业务服务
        S1[User Service<br/>用户管理]
        S2[Auth Service<br/>认证授权]
        S3[Cluster Service<br/>集群管理]
        S4[App Service<br/>应用管理]
        S5[Component Service<br/>组件管理]
    end

    subgraph 基础设施
        K8s[Kubernetes]
        ETCD[etcd Cluster]
        DB[(PostgreSQL)]
        REDIS[(Redis)]
    end

    LB --> G
    G --> S1
    G --> S2
    G --> S3
    G --> S4
    G --> S5

    S1 --> DB
    S2 --> REDIS
    S3 --> K8s
    S4 --> DB
    S5 --> ETCD
```

#### 核心技术栈

| 组件 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| **编程语言** | Go | 1.21+ | 高性能、并发友好 |
| **Web框架** | Gin | v1.9+ | 轻量级HTTP框架 |
| **ORM框架** | GORM | v1.25+ | 数据库操作框架 |
| **缓存** | Redis | 7.0+ | 会话、权限缓存 |
| **消息队列** | NATS | 2.9+ | 轻量级消息队列 |
| **配置中心** | etcd | 3.5+ | 配置管理和服务发现 |

### 前端架构

#### 技术栈

| 技术栈 | 选型 | 版本 | 说明 |
|--------|------|------|------|
| **框架** | React | 18.3+ | 用户界面框架 |
| **构建工具** | Vite | 5.0+ | 现代化构建工具 |
| **状态管理** | Zustand | 4.4+ | 轻量级状态管理 |
| **UI组件库** | Ant Design | 5.12+ | 企业级UI组件库 |
| **图表库** | Apache ECharts | 5.4+ | 数据可视化 |
| **类型检查** | TypeScript | 5.3+ | 类型安全 |

#### 模块架构

```mermaid
graph TB
    subgraph 前端应用
        A[App.tsx<br/>应用入口]

        subgraph 核心模块
            B1[Layout<br/>布局组件]
            B2[Router<br/>路由管理]
            B3[Auth<br/>认证模块]
            B4[API<br/>接口模块]
        end

        subgraph 业务模块
            C1[User<br/>用户管理]
            C2[Cluster<br/>集群管理]
            C3[Application<br/>应用管理]
            C4[Monitor<br/>监控中心]
        end

        subgraph 公共组件
            D1[Table<br/>表格组件]
            D2[Form<br/>表单组件]
            D3[Chart<br/>图表组件]
            D4[Modal<br/>弹窗组件]
        end
    end

    A --> B1
    A --> B2
    A --> B3
    A --> B4

    B1 --> C1
    B1 --> C2
    B1 --> C3
    B1 --> C4

    C1 --> D1
    C1 --> D2
    C2 --> D1
    C3 --> D3
    C4 --> D4
```

### 网络架构

#### 网络拓扑

```mermaid
graph TB
    subgraph 负载均衡层
        LB1[External LB<br/>外部负载均衡]
        LB2[Internal LB<br/>内部负载均衡]
    end

    subgraph 控制平面
        API[API Server<br/>控制平面API]
        CON[Controller<br/>控制器]
        WEB[Console<br/>Web控制台]
    end

    subgraph 数据平面
        subgraph 边缘集群1
            N1[Node-1]
            N2[Node-2]
            N3[Node-3]
        end

        subgraph 边缘集群2
            N4[Node-1]
            N5[Node-2]
            N6[Node-3]
        end
    end

    LB1 --> LB2
    LB2 --> API
    LB2 --> CON
    LB2 --> WEB

    API --> N1
    API --> N4
    CON --> N1
    CON --> N4

    N1 --> N2
    N1 --> N3
    N4 --> N5
    N4 --> N6
```

#### 网络安全

**TLS加密**：
- 所有外部通信使用TLS 1.3加密
- 内部服务间通信使用mTLS
- 证书自动轮换和管理

**网络隔离**：
- 基于Kubernetes NetworkPolicy的网络隔离
- 命名空间级别的访问控制
- 微服务间的细粒度访问控制

### 存储架构

#### 存储分类

```mermaid
graph LR
    subgraph 存储类型
        A[元数据存储<br/>etcd]
        B[时序数据<br/>Prometheus]
        C[日志数据<br/>Loki]
        D[文件存储<br/>MinIO]
        E[关系数据<br/>PostgreSQL]
    end

    subgraph 存储特性
        F[强一致性]
        G[高吞吐]
        H[压缩存储]
        I[对象存储]
        J[ACID事务]
    end

    A --> F
    B --> G
    C --> H
    D --> I
    E --> J
```

#### 高可用设计

**etcd集群**：
- 3节点或5节点奇数集群
- Raft一致性协议保证数据一致性
- 自动故障转移和选举

**Prometheus集群**：
- 远程存储支持
- 联邦集群架构
- 本地和远程存储分层

## 数据库架构

### etcd存储设计

#### 数据模型

```yaml
# 权限相关数据
/registry/edge.theriseunion.io/roletemplates/
/registry/edge.theriseunion.io/iamroles/
/registry/edge.theriseunion.io/iamrolebindings/

# 集群相关数据
/registry/edge.theriseunion.io/clusters/
/registry/edge.theriseunion.io/nodegroups/

# 应用相关数据
/registry/edge.theriseunion.io/applications/
/registry/edge.theriseunion.io/applicationversions/
/registry/edge.theriseunion.io/applicationdeployments/

# 组件相关数据
/registry/edge.theriseunion.io/components/
```

#### 性能优化

**批量操作优化**：
```go
func (r *RoleTemplateReconciler) reconcileRoleTemplates(ctx context.Context) error {
    // 批量获取RoleTemplate
    roleTemplates, err := r.roleTemplateLister.List(labels.Everything())
    if err != nil {
        return err
    }

    // 批量处理
    for _, rt := range roleTemplates {
        if err := r.reconcileRoleTemplate(ctx, rt); err != nil {
            return err
        }
    }
    return nil
}
```

**缓存策略**：
- Informer缓存机制
- 本地缓存和etcd数据同步
- 缓存失效和更新策略

### Prometheus监控存储

#### 数据采集架构

```mermaid
graph TB
    subgraph 数据采集层
        A1[Node Exporter]
        A2[App Metrics]
        A3[K8s Metrics]
        A4[Custom Metrics]
    end

    subgraph 数据聚合层
        B1[Prometheus Server]
        B2[Prometheus Relay]
        B3[Remote Write]
    end

    subgraph 存储层
        C1[本地存储]
        C2[远端存储<br/>Thanos]
        C3[长期存储<br/>对象存储]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1

    B1 --> B2
    B2 --> C1
    B2 --> B3
    B3 --> C2
    B3 --> C3
```

#### 存储策略

**本地存储**：
- 最近15天的高频访问数据
- SSD存储，保证查询性能
- 数据压缩，减少存储空间

**远端存储**：
- 超过15天的历史数据
- 对象存储，成本优化
- 数据分片和压缩

### Loki日志存储

#### 日志采集架构

```mermaid
graph LR
    subgraph 日志源
        A1[应用日志]
        A2[系统日志]
        A3[审计日志]
        A4[访问日志]
    end

    subgraph 采集层
        B1[Promtail Agent]
        B2[Fluentd]
        B3[Filebeat]
    end

    subgraph 聚合层
        C1[Loki Distributor]
        C2[Loki Ingester]
        C3[Loki Querier]
    end

    subgraph 存储层
        D1[本地缓存]
        D2[对象存储]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B1

    B1 --> C1
    B2 --> C1
    B3 --> C1

    C1 --> C2
    C2 --> D1
    C2 --> D2
    C3 --> D2
```

#### 存储优化

**日志压缩**：
- 自动识别和压缩重复日志
- 支持多种压缩算法（Gzip、Snappy、LZ4）
- 根据日志类型选择最优压缩策略

**索引优化**：
- 基于标签的快速检索
- 智能索引策略
- 查询性能优化

---

**下一章节**：[第五章 部署架构](./deployment.md)