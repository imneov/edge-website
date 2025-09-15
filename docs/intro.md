---
sidebar_position: 1
---

# EDGE APIServer 开发指南

欢迎来到 **EDGE APIServer** 开发指南！EDGE 是一个通用型的 Kubernetes 权限体系框架，提供灵活、可扩展的权限管理解决方案。

## 🎯 什么是 EDGE APIServer？

EDGE APIServer 是一个基于 Kubernetes 的通用权限管理框架，通过双组件架构和 Scope 级联权限模型，帮助开发者快速构建企业级权限管理系统。

### 核心特色

- **🏗️ 双组件架构**: APIServer 处理 HTTP 请求，Controller 管理权限转换
- **🔄 权限模型**: IAMRole + IAMRoleBinding 到 K8s RBAC 的无缝转换
- **📊 Scope 权限**: 支持多层级权限继承（Platform → Cluster → Workspace → Namespace）
- **🌐 API 扩展**: 基于 `/oapis/*` 的自定义 API 开发框架
- **🎨 前端集成**: UIPermissions 机制支持权限驱动的用户界面

## 🚀 快速了解

### [概述](./overview/)
了解 EDGE APIServer 的设计理念和核心概念
- [系统架构](./overview/architecture.md) - 双组件协作机制
- [权限模型](./overview/permission-model.md) - IAMRole 和 Scope 设计
- [API 设计](./overview/api-design.md) - oapis 扩展规范

### [快速入门](./quickstart/)
搭建开发环境，创建第一个扩展
- [环境搭建](./quickstart/setup-environment.md) - 开发环境配置
- [Hello World API](./quickstart/hello-world.md) - 创建第一个 OAPI 接口
- [权限集成](./quickstart/permission-integration.md) - 添加权限检查

### [扩展开发](./extension/)
深入了解各种扩展能力
- [OAPI 开发](./extension/oapi-development.md) - 自定义 API 开发
- [权限集成](./extension/permission-integration.md) - IAMRole 和权限检查
- [前端集成](./extension/ui-integration.md) - UIPermissions 使用

### [实践案例](./examples/)
实际的开发案例
- [用户管理 API](./examples/user-management.md) - 完整的用户管理示例
- [权限查询 API](./examples/permission-query.md) - 权限查询接口开发

### [部署运维](./deployment/)
部署和运维指南
- [本地开发](./deployment/local-development.md) - 本地环境搭建
- [生产部署](./deployment/production.md) - 生产环境部署

## 🔗 参考资料

- [API 参考](./references/api-reference.md) - 完整的 API 文档
- [配置参考](./references/configuration.md) - 配置参数说明

## 🚀 开始开发

1. 📖 阅读 [系统架构](./overview/architecture.md) 了解 EDGE 设计
2. 🔧 跟随 [环境搭建](./quickstart/setup-environment.md) 配置开发环境  
3. 💻 通过 [Hello World API](./quickstart/hello-world.md) 开始第一个扩展

---

**EDGE APIServer**: *通用型 Kubernetes 权限体系框架*