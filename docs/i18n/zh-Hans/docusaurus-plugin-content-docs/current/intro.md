---
sidebar_position: 1
---

# 欢迎使用 Edge Platform

**Edge Platform** 是一个为云原生应用设计的智能边缘计算平台，能够通过 Kubernetes 实现对分布式边缘基础设施的无缝管理。

## 🎯 什么是 Edge Platform？

Edge Platform 将 Kubernetes 的能力扩展到边缘，提供：

- **云原生边缘管理**：使用熟悉的 Kubernetes API 管理边缘节点和工作负载
- **分布式架构**：支持地理分布的边缘位置
- **智能编排**：自动化工作负载放置和生命周期管理
- **统一可观测性**：跨云端和边缘的集中式监控和日志
- **安全与合规**：内置安全策略和合规控制

## 🌟 核心特性

### 多集群管理
- 从单一控制平面管理多个边缘集群
- 跨集群工作负载编排
- 统一的资源管理和监控

### 边缘原生能力
- 断网场景下的网络自治
- 边缘节点自动注册和发现
- 本地数据处理和聚合

### 开发者友好
- 标准 Kubernetes API
- GitOps 就绪，支持 ArgoCD/Flux
- 丰富的 CLI 和 Web 控制台界面
- 全面的 RESTful API

### 企业级
- 支持工作空间隔离的多租户
- 基于角色的访问控制（RBAC）
- 审计日志和合规性
- 高可用和灾难恢复

## 🚀 学习路径

### 📚 了解
熟悉 Edge Platform 的概念和架构：
- [产品介绍](/zh-Hans/docs/introduction/overview) - 了解 Edge Platform 提供的功能
- [系统架构](/zh-Hans/docs/introduction/architecture) - 学习系统设计
- [应用场景](/zh-Hans/docs/introduction/use-cases) - 发现真实场景

### 🎓 快速开始
搭建你的第一个边缘集群：
- [快速入门](/zh-Hans/docs/quick-start/install-edge-node) - 安装第一个边缘节点
- [部署应用](/zh-Hans/docs/quick-start/deploy-app) - 部署示例应用
- [访问控制](/zh-Hans/docs/quick-start/access-control) - 配置用户权限

### 🔧 管理
学习平台管理和运维：
- [安装指南](/zh-Hans/docs/installation) - 生产环境部署选项
- [平台管理](/zh-Hans/docs/management/platform) - 配置平台设置
- [集群管理](/zh-Hans/docs/management/clusters) - 管理边缘集群
- [用户管理](/zh-Hans/docs/management/users) - 控制用户访问

## 🏗️ 架构概览

Edge Platform 由三个核心组件组成：

```
┌─────────────────────────────────────────────────┐
│              云端控制平面                         │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  API 服务器  │  │  控制器      │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  控制台      │  │  监控服务    │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│                 边缘集群                          │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ 边缘节点 1   │  │ 边缘节点 2   │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

## 💡 为什么选择 Edge Platform？

传统云基础设施在边缘计算场景中面临挑战：
- **高延迟**：到中心云的往返延迟
- **带宽成本**：从边缘到云端的数据传输成本高昂
- **连接问题**：不可靠的网络连接
- **数据主权**：本地数据处理的监管要求

Edge Platform 通过以下方式解决这些问题：
- 在数据源附近处理数据
- 在网络中断期间保持自治
- 通过本地聚合减少带宽使用
- 支持数据驻留要求的合规性

## 📖 下一步

根据你的角色选择路径：

**平台管理员：**
1. 查看[系统要求](/zh-Hans/docs/installation/requirements)
2. 按照[安装指南](/zh-Hans/docs/installation)操作
3. 配置[平台设置](/zh-Hans/docs/management/platform)

**开发者：**
1. 了解[边缘节点设置](/zh-Hans/docs/quick-start/install-edge-node)
2. 探索[应用部署](/zh-Hans/docs/quick-start/deploy-app)
3. 查看 [API 文档](/zh-Hans/docs/api-reference)

**最终用户：**
1. 访问[控制台指南](/zh-Hans/docs/console/overview)
2. 了解[工作负载管理](/zh-Hans/docs/workloads)
3. 查看[最佳实践](/zh-Hans/docs/best-practices)
