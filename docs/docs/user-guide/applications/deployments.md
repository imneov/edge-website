---
sidebar_position: 1
title: 部署应用
---

# 部署应用

本文档介绍如何在边缘平台上部署和管理应用。

:::info 文档状态
本文档正在编写中，敬请期待。
:::

## 📋 概述

边缘平台支持多种应用部署方式：

- **YAML 部署** - 使用 Kubernetes YAML 文件
- **Helm Chart** - 使用 Helm 包管理
- **应用模板** - 使用预定义模板
- **容器镜像** - 直接从镜像创建

## 🎯 前置条件

- 已创建工作空间
- 具有工作空间部署权限
- 准备好应用镜像或配置

## 📝 部署应用

### 使用 YAML 部署

1. 进入工作空间
2. 点击"应用" > "创建"
3. 选择"YAML 部署"
4. 粘贴或上传 YAML 文件
5. 点击"创建"

**示例 YAML**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-app
  namespace: default
spec:
  replicas: 3
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
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: default
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### 使用应用模板

1. 进入应用商店
2. 选择应用模板
3. 配置应用参数
4. 选择目标工作空间
5. 点击"部署"

### 使用容器镜像

1. 点击"从镜像创建"
2. 输入镜像地址
3. 配置基本信息：
   - 应用名称
   - 副本数
   - 端口映射
   - 环境变量
4. 点击"创建"

## 🔧 应用配置

### 资源限制

```yaml
resources:
  limits:
    cpu: "1"
    memory: "512Mi"
  requests:
    cpu: "0.5"
    memory: "256Mi"
```

### 环境变量

```yaml
env:
- name: ENV_NAME
  value: "production"
- name: DB_HOST
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: database.host
```

### 存储挂载

```yaml
volumeMounts:
- name: data
  mountPath: /data
volumes:
- name: data
  persistentVolumeClaim:
    claimName: app-data-pvc
```

## 📊 应用管理

### 查看应用状态

1. 进入工作空间
2. 点击"应用"标签
3. 查看应用列表和状态

### 扩缩容

```bash
kubectl scale deployment nginx-app --replicas=5
```

或通过 Console 界面操作。

### 更新应用

```bash
kubectl set image deployment/nginx-app nginx=nginx:1.22
```

### 回滚应用

```bash
kubectl rollout undo deployment/nginx-app
```

## 🌐 应用访问

### 创建 Service

暴露应用服务：

- **ClusterIP** - 集群内部访问
- **NodePort** - 通过节点端口访问
- **LoadBalancer** - 负载均衡器访问

### 创建 Ingress

配置外部访问路由：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service
            port:
              number: 80
```

## 📈 监控和日志

### 查看应用监控

1. 进入应用详情
2. 点击"监控"标签
3. 查看 CPU、内存、网络等指标

### 查看应用日志

```bash
kubectl logs -f deployment/nginx-app
```

或通过 Console 日志查看器。

## 🆘 故障排查

### Pod 启动失败

检查：
- 镜像是否存在
- 资源配额是否充足
- 配置是否正确

### 应用无法访问

检查：
- Service 配置
- 网络策略
- Ingress 规则

## 📖 相关文档

- [工作空间管理](../workspaces/create.md)
- [监控和告警](../observability/metrics.md)
- [故障排查](../../deployment/troubleshooting.md)

---

**需要帮助？** 请查看 [常见问题](../../reference/faq.md) 或 [技术支持](../../reference/support.md)。
