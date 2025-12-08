---
sidebar_position: 1
title: 安装边缘平台
---

# 安装边缘平台

本文档将指导您完成边缘智能管理平台的安装部署。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 概述

边缘智能管理平台支持多种安装方式：

- **Helm Chart 安装** - 推荐用于生产环境
- **Kubernetes YAML 安装** - 适用于离线环境
- **一键安装脚本** - 快速体验和测试

## 🎯 安装前准备

### 系统要求

详见 [安装前准备](../quick-start/prerequisites.md) 文档。

### 必备组件

- Kubernetes 1.24+
- Helm 3.0+
- kubectl 命令行工具

## 📦 Helm Chart 安装

### 添加 Helm 仓库

```bash
helm repo add edge-platform https://charts.edge-platform.io
helm repo update
```

### 安装平台

```bash
helm install edge-platform edge-platform/edge-platform \
  --namespace edge-system \
  --create-namespace \
  --set console.service.type=NodePort
```

### 验证安装

```bash
kubectl get pods -n edge-system
```

## 🔧 配置选项

### 基本配置

主要配置参数包括：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `console.replicas` | Console 副本数 | `1` |
| `apiserver.replicas` | API Server 副本数 | `1` |
| `controller.replicas` | Controller 副本数 | `1` |

### 高级配置

更多配置选项请参考 Helm Chart values.yaml 文件。

## ✅ 验证安装

安装完成后，访问 Console 地址验证：

```bash
kubectl get svc -n edge-system edge-console
```

然后按照 [首次登录](../quick-start/first-login.md) 文档进行操作。

## 🆘 故障排查

如遇到安装问题，请参考 [故障排查指南](./troubleshooting.md)。

---

**需要帮助？** 请访问 [支持中心](../reference/support.md) 获取技术支持。
