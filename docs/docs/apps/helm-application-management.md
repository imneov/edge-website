# Helm应用管理

## 概述

Helm是Kubernetes的包管理器，EdgePlatform支持通过Helm Chart部署和管理复杂的应用。Helm应用特别适合部署微服务应用栈、多组件应用和第三方应用。

## Helm基础概念

### Chart

Chart是Helm的应用包格式，包含：

- **Chart.yaml**: Chart的元数据和描述
- **values.yaml**: 默认配置值
- **templates/**: Kubernetes资源模板文件
- **templates/notes.txt**: 使用说明

### Release

Release是Chart在Kubernetes集群中的一个实例化部署：

- 包含多个Kubernetes资源对象
- 有唯一的Release名称
- 可以升级、回滚和删除

### Repository

Repository是Chart的存储仓库：

- 公共仓库：如Helm Hub、Artifact Hub
- 私有仓库：企业内部的Chart仓库
- 支持HTTP/HTTPS和OCI仓库

## 部署Helm应用

### 从应用商店部署

#### 1. 选择Helm应用

1. **识别Helm应用**
   - 在应用商店中查看应用详情
   - Helm应用会在应用类型中标注
   - 查看应用的Chart信息

2. **查看Chart信息**
   - Chart版本号
   - Chart描述和功能说明
   - Chart依赖关系

#### 2. 配置部署参数

**基本信息配置**:
- **发布名称**: Helm Release的名称（必填）
- **命名空间**: 目标项目/命名空间
- **Chart版本**: 选择要部署的Chart版本

**Values配置**:
- **values.yaml**: 覆盖Chart的默认配置
- 支持YAML格式的配置编辑
- 可以查看Chart的默认Values作为参考

#### 3. 执行部署

1. **预览配置**
   - 查看生成的Kubernetes资源清单
   - 确认配置参数正确性
   - 检查资源依赖关系

2. **执行部署**
   - 点击"部署"按钮
   - 等待Helm Release创建完成
   - 查看部署状态和资源创建情况

### Values配置详解

#### 基本配置

**镜像配置**:
```yaml
image:
  repository: nginx
  tag: "1.19"
  pullPolicy: IfNotPresent
```

**服务配置**:
```yaml
service:
  type: ClusterIP
  port: 80
  targetPort: 80
```

**副本配置**:
```yaml
replicaCount: 3
```

#### 资源配置

**CPU和内存**:
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

**自动扩缩容**:
```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

#### 存储配置

**持久卷声明**:
```yaml
persistence:
  enabled: true
  size: 10Gi
  storageClass: "standard"
  accessMode: ReadWriteOnce
```

#### 环境变量配置

**直接配置**:
```yaml
env:
  - name: APP_ENV
    value: "production"
  - name: LOG_LEVEL
    value: "info"
```

**从Secret引用**:
```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-secret
        key: password
```

#### Ingress配置

**启用Ingress**:
```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com
```

## Helm应用管理

### 查看Helm Release

#### 1. Release列表

在应用实例页面可以看到：

- **Release名称**: Helm Release的名称
- **命名空间**: Release所在的命名空间
- **Chart**: Chart名称和版本
- **状态**: Release的部署状态
- **更新时间**: 最后一次更新时间

#### 2. Release详情

点击Release可以查看：

- **基本信息**: Chart信息、版本、状态
- **资源配置**: CPU、内存、存储配置
- **网络配置**: Service、Ingress配置
- **资源对象**: 包含的所有Kubernetes资源
- **更新历史**: 版本升级记录

### 升级Helm应用

#### 1. 升级Chart版本

1. **选择新版本**
   - 在应用详情页选择新版本
   - 查看版本更新日志
   - 评估升级影响

2. **更新Values配置**
   - 检查新版本的Values变化
   - 调整自定义配置
   - 保存配置变更

3. **执行升级**
   - 点击"升级"按钮
   - 确认升级操作
   - 等待升级完成

#### 2. 修改配置升级

1. **修改Values**
   - 编辑应用的Values配置
   - 调整参数值
   - 保存配置

2. **应用变更**
   - 执行升级操作
   - Helm会应用新的配置
   - 相关资源会被更新

### 回滚Helm应用

#### 1. 查看升级历史

在Release详情页可以查看：

- **版本号**: 每次升级的版本号
- **变更时间**: 升级执行时间
- **变更描述**: 配置变更说明
- **状态**: 升级是否成功

#### 2. 执行回滚

1. **选择回滚版本**
   - 在升级历史中选择目标版本
   - 查看该版本的配置
   - 确认回滚操作

2. **执行回滚**
   - 点击"回滚"按钮
   - 等待回滚完成
   - 验证应用功能正常

### 删除Helm Release

#### 1. 删除Release

1. **执行删除**
   - 在Release列表中点击"删除"
   - 确认删除操作
   - 等待删除完成

2. **删除影响**
   - Release包含的所有资源会被删除
   - 持久卷可能需要手动删除
   - 数据需要提前备份

#### 2. 保留数据删除

如果希望保留数据：

1. **备份重要数据**
   - 在删除前备份持久卷数据
   - 导出配置信息
   - 记录应用设置

2. **删除Release**
   - 执行删除操作
   - 手动保留PVC和Secret
   - 数据卷会保留

## 高级功能

### Chart依赖管理

#### 应用依赖

一个Chart可以依赖其他Chart：

```yaml
# Chart.yaml
dependencies:
  - name: mysql
    version: "1.6.0"
    repository: "https://charts.bitnami.com/bitnami"
  - name: redis
    version: "15.0.0"
    repository: "https://charts.bitnami.com/bitnami"
```

#### 依赖配置

在Values中配置依赖的Chart：

```yaml
# values.yaml
mysql:
  auth:
    rootPassword: "secretpassword"
  primary:
    persistence:
      enabled: true

redis:
  auth:
    enabled: true
    password: "redispassword"
```

### Hooks支持

Helm支持在Release生命周期中执行Hooks：

#### Pre-install Hook

在资源创建前执行：

```yaml
annotations:
  "helm.sh/hook": pre-install
```

#### Post-install Hook

在资源创建后执行：

```yaml
annotations:
  "helm.sh/hook": post-install
```

#### Pre-upgrade Hook

在升级前执行：

```yaml
annotations:
  "helm.sh/hook": pre-upgrade
```

### 自定义模板

#### 模板语法

Helm使用Go模板引擎：

```yaml
# 使用Values中的值
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"

# 条件判断
{{- if .Values.persistence.enabled }}
persistence:
  enabled: true
{{- end }}

# 循环
{{- range .Values.environments }}
env:
  - name: {{ .name }}
    value: {{ .value }}
{{- end }}
```

#### 内置对象

Helm提供了一些内置对象：

- `Release`: Release信息（名称、命名空间等）
- `Values`: Values配置内容
- `Chart`: Chart元数据
- `Capabilities`: 集群能力信息

## 故障排查

### 常见问题

#### 1. Chart拉取失败

**症状**: 无法下载Chart包

**可能原因**:
- 仓库地址错误
- 网络连接问题
- 认证信息错误

**解决方案**:
1. 检查仓库URL配置
2. 验证网络连接
3. 确认仓库认证信息

#### 2. Values配置错误

**症状**: 部署失败或应用异常

**可能原因**:
- YAML语法错误
- 配置值类型错误
- 缺少必需的配置项

**解决方案**:
1. 验证YAML语法
2. 查看Chart的values.schema.json
3. 参考Chart文档

#### 3. 资源冲突

**症状**: 资源创建失败

**可能原因**:
- 资源名称冲突
- 命名空间重复
- 资源配额不足

**解决方案**:
1. 使用唯一的Release名称
2. 检查命名空间资源使用情况
3. 调整资源配置

### 诊断命令

```bash
# 查看Release状态
helm status <release-name> -n <namespace>

# 查看Release历史
helm history <release-name> -n <namespace>

# 获取Release的Values
helm get values <release-name> -n <namespace>

# 获取Release的清单
helm get manifest <release-name> -n <namespace>

# 渲染模板（不安装）
helm template <release-name> <chart-path>

# 测试Chart
helm test <release-name> -n <namespace>
```

## 最佳实践

### 1. Chart版本管理

- **使用语义化版本**: 如1.2.3
- **记录变更日志**: 维护CHANGELOG.md
- **保持向后兼容**: 避免破坏性变更

### 2. Values配置

- **提供合理默认值**: Chart应该可以开箱即用
- **文档化配置**: 详细说明每个配置项
- **使用Schema验证**: 通过values.schema.json验证

### 3. 安全配置

- **使用Secret存储敏感信息**: 不要在Values中硬编码密码
- **限制资源使用**: 设置合理的资源限制
- **使用非root用户**: 容器尽量不以root用户运行

### 4. 可观测性

- **添加标签和注解**: 便于资源管理和查询
- **配置健康检查**: 确保应用可用性
- **输出Metrics: 暴露应用监控指标

## 应用示例

### 部署WordPress

```yaml
# Values配置
wordpress:
  image:
    repository: bitnami/wordpress
    tag: 6.0.0

  service:
    type: LoadBalancer

  persistence:
    enabled: true
    size: 20Gi

  ingress:
    enabled: true
    hostname: blog.example.com

mariadb:
  auth:
    rootPassword: "secretpassword"
    password: "wordpresspassword"
  primary:
    persistence:
      enabled: true
      size: 10Gi
```

### 部署微服务应用

```yaml
# Values配置
frontend:
  image:
    repository: myapp/frontend
    tag: v1.0.0
  service:
    type: ClusterIP
  replicas: 3

backend:
  image:
    repository: myapp/backend
    tag: v1.0.0
  service:
    type: ClusterIP
  replicas: 2

database:
  image:
    repository: postgresql
    tag: 14
  persistence:
    enabled: true
    size: 50Gi
```

## 相关资源

- **Helm官方文档**: https://helm.sh/docs/
- **Artifact Hub**: https://artifacthub.io/
- **Helm Charts仓库**: https://github.com/helm/charts

## 相关文档

- [应用部署管理](./application-deployment.md)
- [应用实例管理](./application-instance-management.md)
- [应用配置和网络管理](./application-configuration.md)