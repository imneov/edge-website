# 镜像管理故障排查指南

## 概述

本文档提供了镜像管理模块常见问题的诊断方法和解决方案，帮助用户快速定位和解决问题。

## 问题分类

### 1. 连接性问题
- 镜像源连接失败
- 网络超时
- DNS 解析失败

### 2. 认证性问题
- 凭证错误
- 权限不足
- Token 过期

### 3. 同步���问题
- 镜像同步失败
- 同步速度慢
- 同步卡住

### 4. 存储性问题
- 存储空间不足
- 镜像损坏
- 磁盘 I/O 错误

### 5. 性能问题
- 镜像拉取慢
- 同步效率低
- 资源占用高

## 常见问题及解决方案

### 问题 1：镜像源连接失败

#### 症状
- 测试连接时显示"连接失败"
- 状态徽章显示红色"连接失败"
- 无法同步镜像

#### 可能原因

1. **网络连接问题**
2. **域名配置错误**
3. **认证信息错误**
4. **镜像仓库服务不可用**

#### 诊断步骤

```bash
# 1. 检查网络连接
ping harbor.example.com

# 2. 检查 DNS 解析
nslookup harbor.example.com

# 3. 测试端口连通性
telnet harbor.example.com 443

# 4. 测试 HTTPS 连接
curl -v https://harbor.example.com/v2/

# 5. 查看 Kubernetes 网络策略
kubectl get networkpolicies -A
```

#### 解决方案

**1. 修复网络连接**
```bash
# 检查防火墙规则
sudo iptables -L -n | grep 443

# 如果是云环境，检查安全组规则
# 确保允许出站 HTTPS 连接
```

**2. 修正域名配置**
```yaml
# 确保域名配置正确
spec:
  domain: "harbor.example.com"  # 不要包含协议前缀
  # 错误示例: "https://harbor.example.com"
  # 错误示例: "harbor.example.com/v2/"
```

**3. 验证认证信息**
```bash
# 使用 docker login 测试凭证
docker login harbor.example.com
# 输入用户名和密码

# 如果登录成功，说明凭证正确
# 如果失败，需要在镜像仓库中重置密码
```

**4. 检查镜像仓库服务**
```bash
# 检查镜像仓库服务状态
# 对于 Harbor
curl https://harbor.example.com/api/v2.0/systeminfo

# 检查服务是否在维护
# 联系镜像仓库管理员
```

### 问题 2：镜像同步失败

#### 症状
- 同步状态显示"同步失败"
- 同步时间长时间不更新
- 镜像列表为空

#### 可能原因

1. **镜像路径不存在**
2. **标签名称错误**
3. **权限不足**
4. **网络传输中断**
5. **镜像过大导致超时**

#### 诊断步骤

```bash
# 1. 查看镜像详细状态
kubectl describe repository myapp-failed -n production

# 2. 查看相关日志
kubectl logs -l app=image-controller -n edge-system

# 3. 检查镜像是否存在
curl https://harbor.example.com/v2/myapp/myapp/tags/list

# 4. 测试手动拉取
docker pull harbor.example.com/myapp/myapp:v1.0.0
```

#### 解决方案

**1. 修正镜像路径**
```yaml
# 确保镜像路径正确
spec:
  repository: "myapp/myapp"  # 不要包含标签
  tag: "v1.0.0"              # 标签单独指定

# 错误示例
spec:
  repository: "myapp/myapp:v1.0.0"  # ❌ 标签不应包含在路径中
  tag: "latest"                       # ❌ 标签重复
```

**2. 增加超时时间**
```yaml
spec:
  # 对于大镜像，增加超时时间
  syncTimeout: "30m"  # 默认是 10m
  retryCount: 5       # 增加重试次数
```

**3. 检查权限**
```bash
# 确认镜像源凭证有权限访问该镜像
# 在镜像仓库中检查：
# 1. 用户是否有该项目/仓库的读权限
# 2. 项目是否设置为私有
# 3. 是否需要额外的访问令牌
```

**4. 重新同步**
```bash
# 手动触发重新同步
kubectl annotate repository myapp-failed -n production \
  theriseunion.io/manual-sync="$(date +%s)"

# 或者删除重建
kubectl delete repository myapp-failed -n production
kubectl apply -f myapp-repository.yaml
```

### 问题 3：镜像拉取慢

#### 症状
- Pod 启动时间过长
- 镜像拉取超时
- ImagePullBackOff 状态

#### 可能原因

1. **网络带宽不足**
2. **镜像过大**
3. **镜像仓库距离远**
4. **并发拉取过多**
5. **DNS 解析慢**

#### 诊断步骤

```bash
# 1. 检查网络速度
speedtest-cli

# 2. 检查镜像大小
docker manifest inspect harbor.example.com/myapp/myapp:v1.0.0 | jq '.layers[].size'

# 3. 检查 DNS 解析时间
time nslookup harbor.example.com

# 4. 检查当前拉取任务
kubectl get pods -A | grep ImagePull
```

#### 解决方案

**1. 使用本地镜像源**
```yaml
# 优先使用距离近的镜像源
spec:
  registryRef:
    name: harbor-local  # 本地镜像源
    # 而非
    # name: dockerhub-hk  # 虽然是香港节点，但还是远
```

**2. 优化镜像大小**
```dockerfile
# 使用多阶段构建减小镜像体积
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

FROM alpine:latest
COPY --from=builder /app/myapp /usr/local/bin/myapp
CMD ["myapp"]
```

**3. 使用镜像缓存**
```yaml
# 启用节点级镜像缓存
apiVersion: kubelet.config.k8s.io/v1alpha1
kind: KubeletConfiguration
imageGCHighThresholdPercent: 80
imageGCLowThresholdPercent: 70
```

**4. 调整并发限制**
```yaml
# 控制并发拉取数量
apiVersion: v1
kind: ConfigMap
metadata:
  name: image-controller-config
data:
  max_concurrent_pulls: "5"  # 限制并发数
```

### 问题 4：存储空间不足

#### 症状
- 镜像拉取失败
- 磁盘空间告警
- 节点 NotReady 状态

#### 可能原因

1. **镜像版本过多**
2. **未使用的镜像未清理**
3. **日志文件过大**
4. **其他数据占用空间**

#### 诊断步骤

```bash
# 1. 检查磁盘使用情况
df -h

# 2. 查看镜像占用空间
docker system df

# 3. 查看详细的镜像列表
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 4. 查找大文件
du -sh /var/lib/docker/* | sort -hr
```

#### 解决方案

**1. 清理未使用的镜像**
```bash
# 清理所有未使用的镜像
docker system prune -a --volumes

# 或者只清理悬空镜像
docker image prune

# 清理特定时间前的镜像
docker image prune -a --filter "until=240h"  # 10天前
```

**2. 删除旧的镜像配置**
```bash
# 删除已下线应用的镜像配置
kubectl delete repository -l app=deprecated-app -n production

# 删除特定时间前同步的镜像
kubectl get repositories -n production -o json | \
  jq -r '.items[] | select(.status.lastSynced < "2024-01-01") | .metadata.name' | \
  xargs kubectl delete repository -n production
```

**3. 设置自动清理策略**
```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: ImageCleanupPolicy
metadata:
  name: auto-cleanup
spec:
  # 保留最近的 N 个版本
  keepRecent: 3

  # 清理超过 N 天未使用的镜像
  unusedDays: 30

  # 每天凌晨 2 点执行清理
  schedule: "0 2 * * *"
```

**4. 扩容存储**
```bash
# 如果是云环境，可以扩容云盘
# 如果是物理机，可以：
# 1. 添加新磁盘
# 2. 将 docker 数据目录迁移到新磁盘
```

### 问题 5：镜像认证失败

#### 症状
- Pod 状态为 ErrImagePull 或 ImagePullBackOff
- 日志显示 "authentication required"
- 无法拉取私有镜像

#### 可能原因

1. **ImagePullSecret 未配置**
2. **凭证已过期**
3. **Secret 命名空间不匹配**
4. **Secret 内容错误**

#### 诊断步骤

```bash
# 1. 检查 Pod 配置
kubectl get pod myapp-pod -n production -o yaml | grep -A 5 imagePullSecrets

# 2. 检查 Secret 是否存在
kubectl get secret registry-harbor -n production

# 3. 查看 Secret 详细信息
kubectl describe secret registry-harbor -n production

# 4. 测试凭证
docker login harbor.example.com
```

#### 解决方案

**1. 创建 ImagePullSecret**
```bash
# 创建 docker-registry 类型的 Secret
kubectl create secret docker-registry registry-harbor \
  --docker-server=harbor.example.com \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --docker-email=admin@example.com \
  -n production
```

**2. 在 Pod 中引用 Secret**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  namespace: production
spec:
  containers:
  - name: myapp
    image: harbor.example.com/myapp/myapp:v1.0.0
  imagePullSecrets:
  - name: registry-harbor
```

**3. 自动注入 Secret**
```yaml
# 在 ServiceAccount 中配置默认的 ImagePullSecret
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: production
imagePullSecrets:
- name: registry-harbor
```

### 问题 6：镜像同步卡住

#### 症状
- 同步状态长时间显示"同步中"
- 同步进度不更新
- 无法取消同步

#### 可能原因

1. **网络连接中断**
2. **镜像文件损坏**
3. **同步服务异常**
4. **资源不足**

#### 诊断步骤

```bash
# 1. 检查同步服务状态
kubectl get pods -n edge-system | grep image

# 2. 查看服务日志
kubectl logs -f image-controller-xxx -n edge-system

# 3. 检查资源使用情况
kubectl top pods -n edge-system

# 4. 查看镜像仓库状态
kubectl get repository myapp-stuck -n production -o yaml
```

#### 解决方案

**1. 重启同步服务**
```bash
# 重启镜像同步控制器
kubectl rollout restart deployment image-controller -n edge-system
```

**2. 手动取消同步**
```bash
# 删除同步状态注解
kubectl annotate repository myapp-stuck -n production \
  theriseunion.io/sync-status-

# 或者删除重建
kubectl delete repository myapp-stuck -n production
```

**3. 增加资源限制**
```yaml
# 增加控制器的资源限制
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-controller
  namespace: edge-system
spec:
  template:
    spec:
      containers:
      - name: controller
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 诊断工具和命令

### 常用诊断命令

#### 检查镜像源状态
```bash
# 查看所有镜像源
kubectl get registrysecrets -A

# 查看镜像源详细信息
kubectl describe registrysecret harbor-prod -n production

# 查看镜像源连接状态
kubectl get registrysecrets -A -o custom-columns=NAME:.metadata.name,STATUS:.metadata.annotations.'theriseunion\.io/verify-status'
```

#### 检查镜像同步状态
```bash
# 查看所有镜像仓库
kubectl get repositories -A

# 查看同步失败的镜像
kubectl get repositories -A -o json | \
  jq -r '.items[] | select(.status.syncStatus == "Failed") | .metadata.namespace + "/" + .metadata.name'

# 查看同步进度
kubectl get repositories -A -o custom-columns=NAME:.metadata.name,STATUS:.status.syncStatus,PROGRESS:.status.syncProgress
```

#### 查看日志
```bash
# 查看镜像管理服务日志
kubectl logs -f deployment/image-controller -n edge-system

# 查看特定时间范围的日志
kubectl logs deployment/image-controller -n edge-system \
  --since-time="2024-01-08T10:00:00Z"

# 查看所有相关服务的日志
kubectl logs -l app.kubernetes.io/part-of=image-management -n edge-system
```

### 调试模式

#### 启用详细日志
```yaml
# 在环境变量中启用调试日志
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-controller
spec:
  template:
    spec:
      containers:
      - name: controller
        env:
        - name: LOG_LEVEL
          value: "debug"
```

#### 查看 API 请求
```bash
# 启用 Kubernetes API 访问日志
kubectl proxy

# 在另一个终端监控请求
curl http://localhost:8001/logs?logLevel=10
```

## 性能优化

### 网络优化

#### 使用镜像代理
```yaml
# 配置镜像缓存代理
apiVersion: v1
kind: ConfigMap
metadata:
  name: docker-proxy-config
data:
  config.yml: |
    proxy:
      upstream: "https://harbor.example.com"
      cache:
        max_size: "100GB"
        max_age: "720h"
```

#### 配置 DNS 缓存
```yaml
# 使用 NodeLocal DNSCache 减少DNS解析时间
apiVersion: v1
kind: ConfigMap
metadata:
  name: node-local-dns
  namespace: kube-system
data:
  Corefile: |
    cluster.local:53 {
        errors
        cache {
                success 9984 30
                denial 9984 5
        }
        reload
        loop
        bind 169.254.20.10
        forward . __PILLAR__CLUSTER__DNS__ {
                force_tcp
        }
        prometheus :9253
    }
```

### 存储优化

#### 使用存储驱动优化
```bash
# 使用 overlay2 存储驱动（推荐）
cat /etc/docker/daemon.json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
```

#### 配置镜像垃圾回收
```yaml
# 在 kubelet 配置中设置镜像 GC 参数
apiVersion: kubelet.config.k8s.io/v1alpha1
kind: KubeletConfiguration
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
minimumImageGCAge: 24h
```

## 获取帮助

### 日志收集

当需要技术支持时，请收集以下信息：

```bash
# 1. 镜像源列表
kubectl get registrysecrets -A -o yaml > registrysecrets.yaml

# 2. 镜像仓库列表
kubectl get repositories -A -o yaml > repositories.yaml

# 3. 相关服务日志
kubectl logs -l app.kubernetes.io/part-of=image-management -n edge-system > image-logs.txt

# 4. Pod 列表
kubectl get pods -A | grep -E "(image|registry)" > pods.txt

# 5. 事件列表
kubectl get events -A --sort-by='.lastTimestamp' > events.txt
```

### 联系方式

- **技术支持邮箱**: support@theriseunion.io
- **文档中心**: https://docs.theriseunion.io
- **GitHub Issues**: https://github.com/theriseunion/platform/issues

## 相关文档

- [镜像源管理](./registry-management.md)
- [镜像仓库管理](./repository-management.md)
- [镜像安全与认证](./security-authentication.md)
- [镜像生命周期管理](./lifecycle-management.md)