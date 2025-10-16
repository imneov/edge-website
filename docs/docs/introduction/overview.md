---
sidebar_position: 1
---

# Product Overview

## What is Edge Platform?

Edge Platform is a cloud-native edge computing platform built on Kubernetes, designed to extend cloud capabilities to edge locations while maintaining operational consistency and simplicity.

## Core Capabilities

### 1. Edge Cluster Management

Manage distributed edge infrastructure as easily as managing a single Kubernetes cluster:

- **Centralized Control**: Single control plane for all edge clusters
- **Unified API**: Standard Kubernetes APIs across cloud and edge
- **Cluster Lifecycle**: Automated cluster provisioning and upgrades
- **Health Monitoring**: Real-time cluster health and status tracking

### 2. Workload Orchestration

Deploy and manage applications across edge locations intelligently:

- **Automated Placement**: Smart workload scheduling based on resources and policies
- **Edge Autonomy**: Continue operations during cloud disconnection
- **Rolling Updates**: Zero-downtime application updates
- **Resource Optimization**: Efficient resource utilization across clusters

### 3. Multi-Tenancy & Access Control

Enterprise-grade security and isolation:

- **Workspace Isolation**: Logical separation of teams and projects
- **RBAC**: Fine-grained role-based access control
- **Network Policies**: Secure network communication
- **Audit Logging**: Complete audit trail for compliance

### 4. Observability

Comprehensive monitoring and troubleshooting:

- **Unified Monitoring**: Prometheus-based metrics collection
- **Centralized Logging**: Aggregated logs from all edge locations
- **Alerting**: Configurable alerts for critical events
- **Distributed Tracing**: End-to-end request tracing

## Technical Advantages

### Cloud-Native Architecture

Built on proven cloud-native technologies:
- **Kubernetes**: Industry-standard container orchestration
- **Operators**: Kubernetes-native lifecycle management
- **CRDs**: Extensible resource definitions
- **Helm**: Standardized application packaging

### Production-Ready

Designed for enterprise deployments:
- **High Availability**: Multi-replica components with failover
- **Scalability**: Support for thousands of edge nodes
- **Security**: TLS encryption, certificate management, secrets management
- **Compliance**: Audit logs, data residency controls

### Developer Experience

Built for productivity:
- **GitOps Ready**: Native integration with ArgoCD and Flux
- **REST API**: Comprehensive RESTful API
- **CLI Tools**: Command-line interface for automation
- **Web Console**: Intuitive web-based management UI

## Use Case Scenarios

Edge Platform excels in scenarios requiring:

1. **Low Latency Processing**: Real-time data processing at the edge
2. **Bandwidth Optimization**: Reduce data transfer costs
3. **Offline Operations**: Continue operations during network outages
4. **Data Sovereignty**: Meet regulatory requirements for data residency
5. **Distributed Applications**: Run applications across multiple locations

## Platform Components

### Control Plane Components

- **API Server**: Central API gateway and authentication
- **Controller Manager**: Resource reconciliation and orchestration
- **Console**: Web-based management interface
- **Monitoring Service**: Metrics collection and alerting

### Edge Components

- **Edge Agent**: Node-level orchestration and management
- **Edge Hub**: Local API server for edge autonomy
- **Edge Metrics**: Local metrics collection and forwarding

## Getting Started

Ready to try Edge Platform?

1. **Explore**: Learn more about the [Architecture](/docs/introduction/architecture)
2. **Install**: Follow the [Quick Start Guide](/docs/quick-start/install-edge-node)
3. **Deploy**: Try [Deploying Your First Application](/docs/quick-start/deploy-app)
