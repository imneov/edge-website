---
sidebar_position: 10
title: 故障排查指南
---

# 故障排查指南

本文档提供边缘智能管理平台常见问题的排查方法和解决方案。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 🔍 排查工具

### 查看 Pod 状态

```bash
# 查看所有组件状态
kubectl get pods -n edge-system

# 查看特定 Pod 详情
kubectl describe pod <pod-name> -n edge-system

# 查看 Pod 日志
kubectl logs <pod-name> -n edge-system

# 实时查看日志
kubectl logs -f <pod-name> -n edge-system
```

### 查看事件

```bash
# 查看命名空间事件
kubectl get events -n edge-system --sort-by='.lastTimestamp'

# 查看特定资源事件
kubectl describe <resource-type> <resource-name> -n edge-system
```

## 🚨 常见问题

### Console 无法访问

**症状**：浏览器无法打开 Console 页面

**排查步骤**：

1. 检查 Console Pod 状态
2. 检查 Service 配置
3. 检查网络连通性
4. 查看 Console 日志

### API Server 连接失败

**症状**：Console 显示 API 连接错误

**排查步骤**：

1. 检查 API Server Pod 状态
2. 验证 Service 配置
3. 检查认证配置
4. 查看 API Server 日志

### 集群状态异常

**症状**：添加的集群显示离线或错误

**排查步骤**：

1. 验证 Kubeconfig 有效性
2. 检查网络连通性
3. 查看 Controller 日志
4. 验证 RBAC 权限

### Pod 一直处于 Pending 状态

**症状**：Pod 创建后长时间 Pending

**可能原因**：

- 资源不足
- 镜像拉取失败
- 节点选择器不匹配
- 持久卷挂载问题

### 权限错误

**症状**：操作提示权限不足

**排查步骤**：

1. 检查用户角色绑定
2. 验证角色权限配置
3. 查看授权器日志
4. 确认 RBAC 规则

## 📊 日志收集

### 收集诊断信息

```bash
# 收集所有组件日志
kubectl logs -n edge-system -l app=edge-console > console.log
kubectl logs -n edge-system -l app=edge-apiserver > apiserver.log
kubectl logs -n edge-system -l app=edge-controller > controller.log

# 导出资源配置
kubectl get all -n edge-system -o yaml > edge-system-resources.yaml
```

## 🆘 获取支持

如果以上方法无法解决问题，请访问 [支持中心](../reference/support.md) 获取技术支持。

提交问题时，请提供：

- 问题描述和复现步骤
- 相关组件日志
- 环境信息（Kubernetes 版本、平台版本等）
- 资源配置文件

---

**相关文档**：
- [安装指南](./install-platform.md)
- [常见问题](../reference/faq.md)
