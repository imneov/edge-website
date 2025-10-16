---
sidebar_position: 1
---

# 快速入门：安装边缘节点

本指南将帮助你设置第一个边缘节点并将其连接到 Edge Platform 控制平面。

## 前置条件

开始之前，请确保你具备：

- ✅ 一个 Kubernetes 集群（推荐 1.24+）
- ✅ kubectl 已配置并连接到集群
- ✅ 集群管理员权限
- ✅ 到控制平面的网络连接
- ✅ 至少 4GB RAM 和 2 CPU 核心

## 步骤 1：安装 Edge Platform 控制平面

如果你还没有设置控制平面，请按照以下步骤操作：

```bash
# 添加 Edge Platform Helm 仓库
helm repo add edge-platform https://charts.theriseunion.io
helm repo update

# 安装控制平面组件
helm install edge-platform edge-platform/edge-platform \
  --namespace edge-system \
  --create-namespace \
  --set global.domain=your-domain.com
```

等待所有 Pod 运行：

```bash
kubectl get pods -n edge-system
```

预期输出：
```
NAME                                READY   STATUS    RESTARTS   AGE
edge-apiserver-7d8f9c5b4d-abc12    1/1     Running   0          2m
edge-controller-6c7b8d9f5e-def34   1/1     Running   0          2m
edge-console-5a6b7c8d9e-ghi56      1/1     Running   0          2m
```

## 步骤 2：获取控制平面访问信息

获取控制平面端点：

```bash
export CONTROL_PLANE_ENDPOINT=$(kubectl get svc edge-apiserver \
  -n edge-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "控制平面: $CONTROL_PLANE_ENDPOINT"
```

获取引导令牌：

```bash
export BOOTSTRAP_TOKEN=$(kubectl get secret edge-bootstrap-token \
  -n edge-system \
  -o jsonpath='{.data.token}' | base64 -d)

echo "引导令牌: $BOOTSTRAP_TOKEN"
```

## 步骤 3：准备边缘集群

在你的边缘 Kubernetes 集群上，创建命名空间：

```bash
# 切换到边缘集群上下文
kubectl config use-context edge-cluster

# 创建命名空间
kubectl create namespace edge-system
```

## 步骤 4：安装边缘代理

为边缘代理创建配置文件：

```yaml title="edge-agent-config.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-agent-config
  namespace: edge-system
data:
  config.yaml: |
    controlPlane:
      endpoint: "https://${CONTROL_PLANE_ENDPOINT}:6443"
      token: "${BOOTSTRAP_TOKEN}"

    cluster:
      name: "edge-cluster-01"
      location: "datacenter-east"
      labels:
        env: "production"
        region: "us-east-1"

    agent:
      syncInterval: 30s
      heartbeatInterval: 10s
      logLevel: "info"
```

应用配置：

```bash
# 替换环境变量
envsubst < edge-agent-config.yaml | kubectl apply -f -
```

安装边缘代理：

```bash
kubectl apply -f https://raw.githubusercontent.com/theriseunion/edge-platform/main/deploy/edge-agent.yaml
```

## 步骤 5：验证安装

检查边缘代理是否运行：

```bash
kubectl get pods -n edge-system
```

预期输出：
```
NAME                          READY   STATUS    RESTARTS   AGE
edge-agent-5b6c7d8e9f-xyz12   1/1     Running   0          1m
```

查看代理日志：

```bash
kubectl logs -n edge-system -l app=edge-agent --tail=20
```

你应该看到表示成功注册的日志：
```
INFO  成功连接到控制平面
INFO  集群已注册: edge-cluster-01
INFO  发送心跳，状态: healthy
```

## 步骤 6：从控制平面验证

切换回控制平面集群：

```bash
kubectl config use-context control-plane
```

列出已注册的集群：

```bash
kubectl get clusters -n edge-system
```

预期输出：
```
NAME              STATUS   AGE   REGION      NODES
edge-cluster-01   Ready    2m    us-east-1   3
```

查看集群详情：

```bash
kubectl describe cluster edge-cluster-01 -n edge-system
```

## 步骤 7：访问控制台

在浏览器中打开 Edge Platform 控制台：

```bash
# 获取控制台 URL
kubectl get ingress edge-console -n edge-system
```

使用默认凭据登录：
- 用户名：`admin`
- 密码：（从 secret 获取）

```bash
kubectl get secret edge-admin-password \
  -n edge-system \
  -o jsonpath='{.data.password}' | base64 -d
```

你应该在仪表板中看到新注册的集群！

## 故障排查

### 代理无法连接到控制平面

**症状**：边缘代理日志显示连接错误

```bash
ERROR  无法连接到控制平面: connection refused
```

**解决方案**：
1. 验证控制平面端点可访问：
   ```bash
   curl -k https://${CONTROL_PLANE_ENDPOINT}:6443/healthz
   ```

2. 检查防火墙规则是否允许端口 6443 上的流量

3. 验证引导令牌是否有效：
   ```bash
   kubectl get secret edge-bootstrap-token -n edge-system
   ```

### 集群显示为"未就绪"

**症状**：控制台中集群状态为"未就绪"

**解决方案**：
1. 检查代理心跳是否正常：
   ```bash
   kubectl logs -n edge-system -l app=edge-agent | grep heartbeat
   ```

2. 验证集群资源是否健康：
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces
   ```

3. 检查边缘和控制平面之间的网络连接问题

### 证书错误

**症状**：TLS/证书验证错误

**解决方案**：
1. 确保系统时钟同步（NTP）

2. 验证证书未过期：
   ```bash
   kubectl get secret -n edge-system edge-agent-cert -o yaml
   ```

3. 如果使用自签名证书，确保已配置 CA 捆绑包

## 下一步

恭喜！你已成功设置了第一个边缘节点。现在你可以：

1. [部署第一个应用](/zh-Hans/docs/quick-start/deploy-app)
2. [配置访问控制](/zh-Hans/docs/quick-start/access-control)
3. [设置监控](/zh-Hans/docs/management/monitoring)
4. [探索高级特性](/zh-Hans/docs/management/advanced)

## 需要帮助？

- 📖 阅读[安装指南](/zh-Hans/docs/installation)了解生产部署
- 💬 加入我们的[社区论坛](https://community.theriseunion.io)
- 🐛 在 [GitHub](https://github.com/imneov/edge-platform/issues) 上报告问题
