---
sidebar_position: 1
---

# Welcome to Edge Platform

**Edge Platform** is an intelligent edge computing platform designed for cloud-native applications, enabling seamless management of distributed edge infrastructure with Kubernetes.

## 🎯 What is Edge Platform?

Edge Platform extends Kubernetes capabilities to the edge, providing:

- **Cloud-Native Edge Management**: Manage edge nodes and workloads using familiar Kubernetes APIs
- **Distributed Architecture**: Support for geographically distributed edge locations
- **Intelligent Orchestration**: Automated workload placement and lifecycle management
- **Unified Observability**: Centralized monitoring and logging across cloud and edge
- **Security & Compliance**: Built-in security policies and compliance controls

## 🌟 Key Features

### Multi-Cluster Management
- Manage multiple edge clusters from a single control plane
- Cross-cluster workload orchestration
- Unified resource management and monitoring

### Edge-Native Capabilities
- Network autonomy for disconnected scenarios
- Edge node auto-registration and discovery
- Local data processing and aggregation

### Developer-Friendly
- Standard Kubernetes APIs
- GitOps-ready with ArgoCD/Flux support
- Rich CLI and Web Console interfaces
- Comprehensive RESTful APIs

### Enterprise-Grade
- Multi-tenancy with workspace isolation
- Role-based access control (RBAC)
- Audit logging and compliance
- High availability and disaster recovery

## 🚀 Learning Path

### 📚 Learn
Get familiar with Edge Platform concepts and architecture:
- [Product Introduction](/docs/introduction/overview) - Understand what Edge Platform offers
- [Architecture](/docs/introduction/architecture) - Learn about the system design
- [Use Cases](/docs/introduction/use-cases) - Discover real-world scenarios

### 🎓 Get Started
Set up your first edge cluster:
- [Quick Start](/docs/quick-start/install-edge-node) - Install your first edge node
- [Deploy Applications](/docs/quick-start/deploy-app) - Deploy sample applications
- [Access Control](/docs/quick-start/access-control) - Configure user permissions

### 🔧 Manage
Learn platform management and operations:
- [Installation Guide](/docs/installation) - Production deployment options
- [Platform Management](/docs/management/platform) - Configure platform settings
- [Cluster Management](/docs/management/clusters) - Manage edge clusters
- [User Management](/docs/management/users) - Control user access

## 🏗️ Architecture Overview

Edge Platform consists of three core components:

```
┌─────────────────────────────────────────────────┐
│              Cloud Control Plane                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  API Server  │  │  Controller  │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Console    │  │  Monitoring  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│                 Edge Clusters                    │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Edge Node 1  │  │ Edge Node 2  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

## 💡 Why Edge Platform?

Traditional cloud infrastructure struggles with edge computing challenges:
- **High Latency**: Round-trip delays to centralized cloud
- **Bandwidth Costs**: Expensive data transfer from edge to cloud
- **Connectivity Issues**: Unreliable network connections
- **Data Sovereignty**: Regulatory requirements for local data processing

Edge Platform addresses these by:
- Processing data close to the source
- Maintaining autonomy during network disruptions
- Reducing bandwidth usage through local aggregation
- Enabling compliance with data residency requirements

## 📖 What's Next?

Choose your path based on your role:

**For Platform Administrators:**
1. Review [System Requirements](/docs/installation/requirements)
2. Follow the [Installation Guide](/docs/installation)
3. Configure [Platform Settings](/docs/management/platform)

**For Developers:**
1. Learn about [Edge Node Setup](/docs/quick-start/install-edge-node)
2. Explore [Application Deployment](/docs/quick-start/deploy-app)
3. Check out [API Documentation](/docs/api-reference)

**For End Users:**
1. Access the [Console Guide](/docs/console/overview)
2. Learn about [Workload Management](/docs/workloads)
3. Review [Best Practices](/docs/best-practices)