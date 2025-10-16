---
sidebar_position: 2
---

# System Architecture

## Architecture Overview

Edge Platform adopts a cloud-edge collaborative architecture, consisting of a centralized cloud control plane and distributed edge nodes.

```
                        ┌─────────────────────────────────────┐
                        │      Cloud Control Plane            │
                        │                                     │
                        │  ┌──────────────────────────────┐  │
                        │  │   edge-apiserver             │  │
                        │  │   - Authentication           │  │
                        │  │   - Authorization            │  │
                        │  │   - API Gateway              │  │
                        │  └──────────────────────────────┘  │
                        │                                     │
                        │  ┌──────────────────────────────┐  │
                        │  │   edge-controller            │  │
                        │  │   - Reconciliation           │  │
                        │  │   - Lifecycle Management     │  │
                        │  │   - Policy Enforcement       │  │
                        │  └──────────────────────────────┘  │
                        │                                     │
                        │  ┌──────────────────────────────┐  │
                        │  │   edge-console               │  │
                        │  │   - Web UI                   │  │
                        │  │   - Management Interface     │  │
                        │  └──────────────────────────────┘  │
                        │                                     │
                        │  ┌──────────────────────────────┐  │
                        │  │   Monitoring Service         │  │
                        │  │   - Prometheus               │  │
                        │  │   - Alertmanager             │  │
                        │  └──────────────────────────────┘  │
                        └─────────────────────────────────────┘
                                      ↕ ↕ ↕
                              Network / Internet
                                      ↕ ↕ ↕
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Edge Cluster 1    │  │   Edge Cluster 2    │  │   Edge Cluster N    │
│                     │  │                     │  │                     │
│  ┌──────────────┐   │  │  ┌──────────────┐   │  │  ┌──────────────┐   │
│  │ Kubernetes   │   │  │  │ Kubernetes   │   │  │  │ Kubernetes   │   │
│  │ Cluster      │   │  │  │ Cluster      │   │  │  │ Cluster      │   │
│  └──────────────┘   │  │  └──────────────┘   │  │  └──────────────┘   │
│                     │  │                     │  │                     │
│  ┌──────────────┐   │  │  ┌──────────────┐   │  │  ┌──────────────┐   │
│  │ Edge Agent   │   │  │  │ Edge Agent   │   │  │  │ Edge Agent   │   │
│  └──────────────┘   │  │  └──────────────┘   │  │  └──────────────┘   │
│                     │  │                     │  │                     │
│  ┌──────────────┐   │  │  ┌──────────────┐   │  │  ┌──────────────┐   │
│  │ Workloads    │   │  │  │ Workloads    │   │  │  │ Workloads    │   │
│  └──────────────┘   │  │  └──────────────┘   │  │  └──────────────┘   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Component Details

### Cloud Control Plane

#### edge-apiserver

The central API gateway providing:

- **Authentication**: OAuth2/OIDC integration, token validation
- **Authorization**: RBAC, policy evaluation
- **API Gateway**: RESTful API endpoints for all resources
- **Multi-tenancy**: Workspace and namespace isolation
- **Audit Logging**: Complete request/response logging

**Key Features:**
- Built on Kubernetes API machinery
- Extensible with Custom Resource Definitions (CRDs)
- High availability with multiple replicas
- TLS encryption for all communications

#### edge-controller

The orchestration engine responsible for:

- **Cluster Lifecycle**: Registration, health checks, decommissioning
- **Resource Reconciliation**: Desired state vs actual state
- **Policy Enforcement**: Placement policies, resource quotas
- **Workload Distribution**: Intelligent scheduling across clusters
- **Configuration Management**: Centralized config distribution

**Key Features:**
- Kubernetes Operator pattern
- Event-driven reconciliation
- Retry logic with exponential backoff
- Comprehensive status reporting

#### edge-console

Web-based management interface providing:

- **Dashboard**: Overview of clusters, nodes, workloads
- **Resource Management**: CRUD operations for all resources
- **User Management**: User, role, and permission management
- **Monitoring Integration**: Metrics dashboards and charts
- **Audit Viewer**: Search and filter audit logs

**Tech Stack:**
- Next.js 14 with React 18
- TypeScript for type safety
- TailwindCSS for styling
- React Query for data fetching

#### Monitoring Service

Observability infrastructure including:

- **Prometheus**: Time-series metrics database
- **Alertmanager**: Alert routing and notification
- **Grafana**: Metrics visualization (optional)
- **ReverseProxy**: Multi-cluster metrics aggregation

### Edge Components

#### Kubernetes Cluster

Each edge location runs a standard Kubernetes cluster:

- **Control Plane**: API server, controller manager, scheduler
- **Worker Nodes**: kubelet, container runtime (containerd/docker)
- **Network**: CNI plugin (Calico, Flannel, etc.)
- **Storage**: CSI driver for persistent storage

#### Edge Agent

Local agent running on edge clusters:

- **Registration**: Automatic cluster registration to control plane
- **Heartbeat**: Periodic health status reporting
- **Resource Sync**: Bidirectional resource synchronization
- **Local Cache**: Cache frequently accessed data
- **Metrics Export**: Forward metrics to control plane

#### Edge Autonomy

Continues operations during network partition:

- **Local API Server**: Cached API responses
- **Workload Management**: Existing workloads continue running
- **State Synchronization**: Auto-sync when connection restored

## Data Flow

### 1. User Request Flow

```
User → Console/CLI → edge-apiserver → Authentication → Authorization → CRD Controller → Kubernetes API
```

### 2. Cluster Registration Flow

```
Edge Cluster → Edge Agent → edge-apiserver → edge-controller → Cluster CRD Created → Status Update
```

### 3. Workload Deployment Flow

```
User → edge-apiserver → Workload CRD → edge-controller → Target Cluster Selection → Edge Agent → Kubernetes Apply
```

### 4. Monitoring Flow

```
Edge Cluster Metrics → Prometheus → ReverseProxy → Monitoring Service → edge-console Dashboard
```

## Security Architecture

### Authentication & Authorization

- **Multi-level Auth**: OAuth2, OIDC, static tokens
- **RBAC**: Role-based access control at platform and cluster levels
- **Service Accounts**: Automated service authentication
- **Certificate Management**: Auto-rotation, mutual TLS

### Network Security

- **TLS Everywhere**: Encrypted communication between all components
- **Network Policies**: Kubernetes-native network segmentation
- **Ingress Control**: Rate limiting, IP whitelisting
- **Secret Management**: Kubernetes secrets, external secret stores

### Data Security

- **Encryption at Rest**: etcd encryption, encrypted volumes
- **Encryption in Transit**: TLS 1.3 for all connections
- **Audit Logging**: Immutable audit trail
- **Compliance**: GDPR, SOC 2 ready

## High Availability

### Control Plane HA

- **Multi-replica Deployment**: 3+ replicas of critical components
- **Load Balancing**: Kubernetes service load balancing
- **Leader Election**: Raft consensus for controllers
- **Database HA**: etcd clustering, automated backups

### Edge HA

- **Node Redundancy**: Multiple worker nodes per cluster
- **Workload Redundancy**: Pod replicas across nodes
- **Network Redundancy**: Multiple network paths
- **Data Replication**: Persistent volume replication

## Scalability

### Horizontal Scalability

- **Control Plane**: Scale replicas based on load
- **Edge Clusters**: Support 1000+ clusters
- **Edge Nodes**: Support 10,000+ nodes per cluster
- **Workloads**: Support 100,000+ pods

### Vertical Scalability

- **Resource Limits**: Configurable CPU/memory limits
- **Storage**: Scalable persistent storage
- **Network**: High-throughput networking

## Next Steps

- Learn about [Use Cases](/docs/introduction/use-cases)
- Review [Installation Requirements](/docs/installation/requirements)
- Get started with [Quick Start Guide](/docs/quick-start/install-edge-node)
