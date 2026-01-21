# 应用配置和网络管理

## 概述

应用配置和网络管理是应用部署和运行的核心部分。正确的配置可以确保应用稳定运行，而合理的网络配置可以实现服务间的通信和外部访问。

## 应用配置管理

### 环境变量配置

环境变量是应用配置的重要组成部分，用于传递应用运行时所需的参数。

#### 普通环境变量

**使用场景**:
- 应用配置参数
- 服务端点和端口
- 运行时选项

**配置方式**:
```yaml
env:
  - name: APP_ENV
    value: "production"
  - name: LOG_LEVEL
    value: "info"
  - name: API_PORT
    value: "8080"
```

**最佳实践**:
- 使用大写字母和下划线命名
- 为环境变量提供合理的默认值
- 在文档中说明重要环境变量的用途

#### 从保密字典引用

**使用场景**:
- 数据库密码
- API密钥
- 证书和私钥

**配置方式**:
```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: mysql-secret
        key: password
  - name: API_KEY
    valueFrom:
      secretKeyRef:
        name: api-secret
        key: key
```

**优势**:
- 敏感信息加密存储
- 集中管理密钥
- 支持密钥轮换

#### 从配置字典引用

**使用场景**:
- 应用配置文件
- 环境相关配置
- 共享配置项

**配置方式**:
```yaml
env:
  - name: APP_CONFIG
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: config.yaml
  - name: DB_HOST
    valueFrom:
      configMapKeyRef:
        name: db-config
        key: host
```

### 资源配置

合理的资源配置可以确保应用稳定运行并避免资源浪费。

#### CPU配置

**CPU请求（Request）**:
- 保证应用可用的最小CPU数量
- 用于调度决策
- 格式：CPU核数（如：0.5）或毫核（如：500m）

**CPU限制（Limit）**:
- 限制应用可用的最大CPU数量
- 防止应用占用过多CPU
- 当超过限制时会被限流

**配置示例**:
```yaml
resources:
  requests:
    cpu: "500m"      # 0.5个CPU核
  limits:
    cpu: "2000m"     # 2个CPU核
```

**选择建议**:
- 测试应用在不同负载下的CPU使用情况
- Request设置为正常负载的CPU使用量
- Limit设置为高峰负载的CPU使用量

#### 内存配置

**内存请求（Request）**:
- 保证应用可用的最小内存数量
- 用于调度决策
- 格式：字节数（如：512Mi）或GB（如：1Gi）

**内存限制（Limit）**:
- 限制应用可用的最大内存数量
- 超过限制时容器会被OOM Kill
- 应该大于实际内存使用量

**配置示例**:
```yaml
resources:
  requests:
    memory: "512Mi"   # 512MB内存
  limits:
    memory: "2Gi"     # 2GB内存
```

**选择建议**:
- 监控应用的实际内存使用情况
- Request设置为正常负载的内存使用量
- Limit设置为高峰负载的内存使用量 + 缓冲

### 存储配置

应用可能需要持久化存储来保存数据。

#### 持久卷声明（PVC）

**使用场景**:
- 数据库数据存储
- 应用文件存储
- 日志持久化

**配置示例**:
```yaml
volumeMounts:
  - name: data-volume
    mountPath: /data
volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: app-data-pvc
```

**存储类型选择**:
- **块存储**: 高性能，适合数据库
- **文件存储**: 共享访问，适合文件服务
- **对象存储**: 海量存储，适合备份和归档

**容量规划**:
- 评估应用的数据增长速度
- 预留足够的存储空间
- 考虑数据备份空间需求

### 健康检查配置

健康检查确保应用正常运行，不健康的容器会被自动重启或替换。

#### 存活探针（Liveness Probe）

**作用**: 检测容器是否还在运行，如果不健康则重启容器

**配置示例**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**参数说明**:
- `initialDelaySeconds`: 容器启动后等待多久开始检查
- `periodSeconds`: 检查间隔时间
- `timeoutSeconds`: 检查超时时间
- `failureThreshold`: 连续失败多少次才认为不健康

#### 就绪探针（Readiness Probe）

**作用**: 检测容器是否准备好接收流量，如果不就绪则从服务中移除

**配置示例**:
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**最佳实践**:
- 就绪探针应该检查应用的关键依赖
- 存活探针应该检查应用的核心功能
- 设置合理的初始延迟时间，给应用足够的启动时间

## 网络配置管理

### 服务发现

服务（Service）为应用提供稳定的网络访问端点。

#### ClusterIP服务

**特点**:
- 集群内部可访问
- 分配集群内部IP地址
- 适用于集群内部服务通信

**配置示例**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

**使用场景**:
- 微服务之间的通信
- 前端应用访问后端API
- 数据库访问

#### NodePort服务

**特点**:
- 通过节点IP和端口访问
- 端口范围：30000-32767
- 适用于开发测试环境

**配置示例**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080
  type: NodePort
```

**访问方式**:
- `http://<节点IP>:30080`
- 适用于开发测试环境
- 生产环境建议使用LoadBalancer或Ingress

#### LoadBalancer服务

**特点**:
- 分配外部负载均衡器
- 自动配置云服务商LB
- 适用于生产环境

**配置示例**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
  type: LoadBalancer
```

**访问方式**:
- `http://<外部LB_IP>`
- 需要云平台支持
- 成本较高

### 网络策略

网络策略控制Pod之间的网络通信。

#### 默认拒绝所有流量

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

#### 允许特定Pod访问

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-frontend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
```

**使用场景**:
- 多租户隔离
- 安全策略实施
- 微服务访问控制

### Ingress配置

Ingress提供HTTP/HTTPS路由到服务的规则。

#### 基本Ingress配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
```

#### TLS配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: my-app-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
```

**优势**:
- 统一入口管理多个服务
- 支持基于域名的路由
- 支持TLS/SSL终结
- 集中管理证书

### DNS配置

Kubernetes提供集群内部的DNS服务。

#### 服务发现

**服务访问**:
- `http://<service-name>.<namespace>.svc.cluster.local`
- 简化形式：`http://<service-name>` (同命名空间)

**Pod访问**:
- `http://<pod-ip>.<namespace>.pod.cluster.local`

#### 外部DNS

如果需要从集群外部访问服务：

1. **配置外部DNS**
   - 在DNS服务器中添加A记录
   - 指向Ingress或LoadBalancer的IP

2. **使用服务发现**
   - 服务名自动注册到DNS
   - 支持动态IP变化

## 配置最佳实践

### 1. 配置分离

- **环境相关配置**: 使用环境变量或ConfigMap
- **敏感信息**: 使用Secret
- **应用代码**: 不包含配置信息

### 2. 配置版本控制

- 使用Git管理配置文件
- 配置变更进行代码审查
- 记录配置变更历史

### 3. 配置验证

- 在测试环境验证配置
- 使用配置校验工具
- 检查配置语法和逻辑

### 4. 安全配置

- 最小权限原则
- 限制网络访问范围
- 定期更新密钥和证书

## 配置故障排查

### 常见配置问题

#### 1. 环境变量错误

**症状**: 应用无法启动或运行异常

**排查**:
- 检查环境变量名称拼写
- 验证环境变量值格式
- 确认引用的ConfigMap和Secret存在

#### 2. 资源配置不当

**症状**: 应用性能差或被OOM Kill

**排查**:
- 监控资源使用情况
- 调整资源请求和限制
- 检查节点资源充足性

#### 3. 存储挂载失败

**症状**: Pod无法启动，存储卷挂载失败

**排查**:
- 检查PVC状态
- 验证存储类可用性
- 确认存储容量充足

#### 4. 网络访问问题

**症状**: 服务无法访问或网络不通

**排查**:
- 检查Service配置
- 验证网络策略规则
- 测试Pod间网络连接

### 诊断工具

```bash
# 查看Pod环境变量
kubectl exec <pod-name> -- env

# 查看Pod资源使用
kubectl top pod <pod-name>

# 查看服务端点
kubectl get endpoints <service-name>

# 测试服务连通性
kubectl exec <pod-name> -- curl http://service-name

# 查看网络策略
kubectl get networkpolicy
```

## 相关文档

- [应用部署管理](./application-deployment.md)
- [应用实例管理](./application-instance-management.md)
- [应用管理概述](./application-management-overview.md)