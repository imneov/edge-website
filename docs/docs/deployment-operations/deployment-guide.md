# 部署维护手册

本文档提供边缘计算平台的完整部署指南，包括在线部署、离线部署、故障排查和日常运维操作。

## 1. 环境要求

### 1.1 硬件最低配置

#### 管控平面（Control Plane）

| 组件 | CPU | 内存 | 磁盘 | 数量 |
|------|-----|------|------|------|
| Kubernetes Master | 4核 | 8GB | 100GB SSD | 3（高可用） |
| Edge APIServer | 2核 | 4GB | 50GB | 2 |
| Edge Console | 2核 | 4GB | 20GB | 2 |
| NATS Server | 2核 | 4GB | 50GB | 3 |
| 监控服务 | 4核 | 8GB | 200GB | 1 |

#### 边缘节点（Edge Node）

| 场景 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| 轻量级边缘 | 2核 | 2GB | 20GB |
| 标准边缘 | 4核 | 8GB | 100GB |
| AI推理边缘 | 8核+ | 16GB+ | 200GB+ GPU |

### 1.2 操作系统要求

**管控平面：**
- Ubuntu 20.04/22.04 LTS
- CentOS 7.9 / Rocky Linux 8.x
- 内核版本 ≥ 4.15

**边缘节点：**
- Ubuntu 18.04/20.04/22.04
- Debian 10/11
- CentOS 7.x / Rocky Linux 8.x
- 支持 ARM64 和 x86_64 架构

### 1.3 网络要求

| 端口 | 用途 | 协议 |
|------|------|------|
| 6443 | Kubernetes API | TCP |
| 8080 | Edge APIServer | TCP |
| 3000 | Edge Console | TCP |
| 4222 | NATS Client | TCP |
| 8222 | NATS Monitoring | TCP |
| 1883/8883 | MQTT (边缘通信) | TCP |
| 9090 | Prometheus | TCP |
| 3000 | Grafana | TCP |

## 2. 在线部署

### 2.1 部署 Kubernetes 集群

```bash
# 使用 kubeadm 初始化（示例）
kubeadm init --pod-network-cidr=10.244.0.0/16

# 配置 kubectl
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

# 安装网络插件（Calico）
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

### 2.2 一键安装（推荐）

使用 [edge-installer](https://github.com/theriseunion/edge-installer) 统一安装工具：

```bash
# 克隆安装仓库
git clone https://github.com/theriseunion/edge-installer.git
cd edge-installer

# 一键安装所有组件（Host 集群）
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace

# 成员集群（不含 Console）
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set global.mode=member
```

**验证安装：**

```bash
# 检查组件状态
kubectl get pods -n edge-system
kubectl get components -A

# 访问 Console
kubectl port-forward svc/edge-console 3000:3000 -n edge-system
# 浏览器访问: http://localhost:3000
```

### 2.3 安装模式说明

| 模式 | Controller | APIServer | Console | Monitoring | 适用场景 |
|------|------------|-----------|---------|------------|----------|
| **all** | ✅ | ✅ | ✅ | ✅ | 单机/测试环境 |
| **host** | ✅ | ✅ | ✅ | ✅ | 主集群 |
| **member** | ✅ | ✅ | ❌ | ✅ | 成员集群 |
| **none** | ✅ | ❌ | ❌ | ❌ | 仅基础设施 |

### 2.4 自定义安装

```bash
# 自定义镜像仓库
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set global.imageRegistry=your-registry.com/edge

# 自定义副本数
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set autoInstall.apiserver.values.replicaCount=3

# 禁用监控组件
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set autoInstall.monitoring.enabled=false
```

### 2.5 分步安装（可选）

如需分步安装各组件：

```bash
# 1. 安装 CRDs
kubectl apply -f edge-installer/edge-controller/crds/

# 2. 部署 APIServer
helm install edge-apiserver ./edge-apiserver \
  --namespace edge-system \
  --create-namespace

# 3. 部署 Console
helm install edge-console ./edge-console \
  --namespace edge-system

# 4. 部署 OTA 服务
helm install edge-ota ./edge-ota \
  --namespace edge-system

# 5. 部署监控服务
helm install edge-monitoring ./edge-monitoring \
  --namespace observability-system \
  --create-namespace
```

## 3. 离线部署

### 3.1 准备离线安装包

使用 edge-installer 构建离线包：

```bash
# 克隆安装仓库
git clone https://github.com/theriseunion/edge-installer.git
cd edge-installer

# 构建 ChartMuseum 镜像（包含所有 Charts）
make package-charts
make docker-build-museum MUSEUM_IMG=edge-museum:latest

# 导出所有镜像
docker save -o edge-platform-images.tar \
  edge-museum:latest \
  edge-apiserver:latest \
  edge-console:latest \
  edge-controller:latest \
  edge-ota-server:latest \
  edge-ota-agent:latest \
  monitoring-service:latest

# 打包安装仓库
tar -czvf edge-installer-offline.tar.gz \
  edge-controller/ \
  edge-platform-images.tar \
  scripts/
```

### 3.2 离线环境部署

```bash
# 1. 传输安装包到离线环境
scp edge-installer-offline.tar.gz user@offline-server:/opt/

# 2. 解压
cd /opt && tar -xzvf edge-installer-offline.tar.gz

# 3. 导入镜像到本地 Harbor
docker load -i edge-platform-images.tar

# 推送到本地仓库
for img in edge-museum edge-apiserver edge-console edge-controller edge-ota-server monitoring-service; do
  docker tag ${img}:latest harbor.local/edge/${img}:latest
  docker push harbor.local/edge/${img}:latest
done

# 4. 一键安装（使用本地镜像仓库）
helm install edge-platform ./edge-controller \
  --namespace edge-system \
  --create-namespace \
  --set global.imageRegistry=harbor.local/edge \
  --set chartmuseum.image.repository=harbor.local/edge/edge-museum \
  --set controller.image.repository=harbor.local/edge/edge-controller
```

### 3.3 验证离线安装

```bash
# 检查所有组件状态
kubectl get pods -n edge-system
kubectl get components -A

# 确认镜像来源
kubectl get pods -n edge-system -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u
```

## 4. 边缘节点部署

### 4.1 安装 OTA Agent

```bash
# 下载 Agent 安装脚本
curl -fsSL https://edge-platform.io/install-agent.sh | bash

# 或手动安装
wget https://releases.edge-platform.io/agent/latest/edge-ota-agent-linux-amd64
chmod +x edge-ota-agent-linux-amd64
mv edge-ota-agent-linux-amd64 /usr/local/bin/edge-agent

# 配置 Agent
cat > /etc/edge-agent/config.yaml << EOF
server:
  mqtt_broker: "mqtts://nats.edge-platform.io:8883"
  tls_enabled: true
node:
  id: "edge-node-001"
  labels:
    region: "east"
    type: "gpu"
EOF

# 启动服务
systemctl enable edge-agent
systemctl start edge-agent
```

### 4.2 节点注册验证

```bash
# 在管控平面检查节点状态
kubectl get otanodes

# 预期输出
# NAME           STATUS   AGE   LAST-HEARTBEAT
# edge-node-001  Ready    5m    10s
```

## 5. 故障排查

### 5.1 边缘节点掉线

**症状：** OTANode 状态显示 `Offline`

**排查步骤：**

```bash
# 1. 检查 Agent 服务状态
systemctl status edge-agent

# 2. 查看 Agent 日志
journalctl -u edge-agent -f

# 3. 检查网络连通性
ping nats.edge-platform.io
nc -zv nats.edge-platform.io 8883

# 4. 检查 MQTT 连接
mosquitto_sub -h nats.edge-platform.io -p 8883 \
  -t "edge/node/+/heartbeat" --cafile ca.crt

# 5. 检查证书有效期
openssl x509 -in /etc/edge-agent/certs/client.crt -noout -dates
```

**解决方案：**
- 网络问题：检查防火墙规则，确保 8883 端口开放
- 证书过期：重新签发证书并重启 Agent
- 服务崩溃：查看日志定位问题，必要时重启服务

### 5.2 断网自治状态检查

**边缘节点断网后仍可自主运行：**

```bash
# 在边缘节点执行
# 1. 检查本地 K3s/KubeEdge 状态
kubectl get pods -A

# 2. 检查应用状态
kubectl get pods -n workload

# 3. 查看离线缓存
ls /var/lib/edge-agent/cache/

# 4. 验证应用运行
curl http://localhost:8080/health
```

### 5.3 OTA 升级失败

```bash
# 1. 检查任务状态
kubectl get otatasks -n edge-system

# 2. 查看任务详情
kubectl describe otatask <task-name> -n edge-system

# 3. 检查 Agent 执行日志
kubectl logs -l app=ota-server -n edge-system

# 4. 边缘节点执行日志
cat /var/log/edge-agent/task-<id>.log
```

### 5.4 监控告警不触发

```bash
# 1. 检查 Prometheus targets
curl http://prometheus:9090/api/v1/targets

# 2. 验证 AlertManager 配置
kubectl get secret alertmanager-config -o yaml

# 3. 手动触发测试告警
curl -X POST http://alertmanager:9093/api/v1/alerts \
  -d '[{"labels":{"alertname":"TestAlert"}}]'
```

## 6. 日常运维

### 6.1 备份恢复

**ETCD 备份：**
```bash
# 备份
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d).db

# 恢复
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-20240101.db
```

**数据库备份：**
```bash
# 备份 PostgreSQL
pg_dump -h localhost -U edge edge_platform > backup.sql

# 恢复
psql -h localhost -U edge edge_platform < backup.sql
```

### 6.2 扩缩容

**水平扩容 APIServer：**
```bash
kubectl scale deployment edge-apiserver --replicas=3 -n edge-system
```

**添加边缘节点：**
```bash
# 批量加入节点
./scripts/batch-join-nodes.sh --nodes-file nodes.txt
```

### 6.3 版本升级

```bash
# 1. 备份当前版本
kubectl get all -n edge-system -o yaml > backup.yaml

# 2. 更新 Helm 仓库
helm repo update

# 3. 升级组件
helm upgrade edge-apiserver edge-platform/edge-apiserver \
  --namespace edge-system \
  --reuse-values \
  --set image.tag=v2.0.0

# 4. 验证升级
kubectl rollout status deployment/edge-apiserver -n edge-system
```

### 6.4 日志收集

```bash
# 收集诊断信息
./scripts/collect-diagnostics.sh --output /tmp/diagnostics.tar.gz

# 包含内容：
# - 所有组件日志
# - Kubernetes 事件
# - 系统配置
# - 资源使用情况
```

## 7. 性能调优

### 7.1 操作系统参数

```bash
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
```

### 7.2 Kubernetes 参数

```yaml
# kubelet 配置
maxPods: 250
evictionHard:
  memory.available: "500Mi"
  nodefs.available: "10%"
```

---

*最后更新：2026年2月*
