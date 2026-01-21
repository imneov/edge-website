# 镜像仓库管理

## 概述

镜像仓库管理模块提供了容器镜像的同步、管理和监控功能。通过配置镜像仓库，可以将远程镜像仓库中的镜像同步到边缘集群，解决边缘场景下镜像拉取慢、网络不稳定等问题。

## 功能特性

### 核心功能

#### 1. 镜像同步
- **自动同步**：按配置的时间间隔自动同步镜像信息
- **手动触发**：支持手动触发镜像同步
- **增量同步**：只同步变化的镜像层，提高同步效率
- **并发同步**：支持多个镜像并发同步

#### 2. 镜像管理
- **镜像添加**：从镜像源添加需要同步的镜像
- **镜像搜索**：快速搜索和定位镜像
- **批量操作**：支持批量添加、删除镜像
- **镜像详情**：查看镜像的详细信息和标签

#### 3. 状态监控
- **同步状态**：实时显示镜像的同步状态
- **健康检查**：定期检查镜像的可用性
- **同步日志**：记录同步过程和结果
- **错误报告**：提供详细的错误信息

#### 4. 元数据管理
- **别名设置**：为镜像设置易识别的别名
- **描述信息**：添加镜像的详细描述和用途说明
- **标签管理**：管理镜像的多个标签版本

## 同步状态说明

### 状态类型

| 状态 | 图标 | 说明 |
|------|------|------|
| 已同步 | 🟢 | 镜像已成功同步到本地 |
| 同步中 | 🔄 | 正在同步镜像信息 |
| 同步失败 | 🔴 | 镜像同步失败，请检查配置 |
| 未同步 | ⚪ | 新添加的镜像，尚未开始同步 |

### 同步过程

1. **待同步**：新添加的镜像，等待首次同步
2. **同步中**：正在从远程仓库拉取镜像信息
3. **成功**：镜像信息已同步完成
4. **失败**：同步过程中出现错误

## 操作指南

### 添加镜像仓库

#### 步骤 1：导航到镜像管理页面

1. 登录边缘计算平台
2. 在左侧导航栏选择「镜像管理」→「镜像管理」
3. 进入镜像仓库列表页面

#### 步骤 2：点击添加按钮

点击页面右上角的「添加镜像」按钮，打开创建面板。

#### 步骤 3：填写镜像信息

在创建面板中填写以下信息：

| 字段 | 说明 | 示例 | 必填 |
|------|------|------|------|
| 名称 | 镜像的唯一标识 | `nginx-latest` | 是 |
| 显示名称 | 镜像的显示别名 | `Nginx 最新版本` | 否 |
| 命名空间 | 镜像所属命名空间 | `default` | 是 |
| 描述 | 镜像的详细描述 | `Nginx web 服务器` | 否 |
| 镜像源 | 选择已配置的镜像源 | `harbor-prod` | 是 |
| 镜像仓库 | 镜像的完整路径 | `library/nginx` | 是 |
| 镜像标签 | 镜像的标签版本 | `latest` | 是 |
| 同步间隔 | 自动同步的时间间隔 | `1h` | 否 |

#### 步骤 4：保存配置

确认信息无误后，点击「确定」保存镜像配置。系统会自动开始首次同步。

### 管理现有镜像

#### 查看镜像列表

镜像列表页面显示以下信息：

| 列名 | 说明 |
|------|------|
| 选择 | 多选框，用于批量操作 |
| 名称 | 镜像的名称和别名 |
| 命名空间 | 镜像所属的命名空间 |
| 镜像仓库 | 镜像源的域名 |
| 镜像路径 | 镜像的完整路径（包含标签） |
| 最后同步时间 | 上次同步的时间 |
| 同步状态 | 当前的同步状态 |
| 操作 | 可执行的操作菜单 |

#### 查看镜像详情

1. 点击镜像的名称或任意信息列
2. 进入镜像详情页面
3. 查看镜像的完整信息，包括：
   - 基本信息
   - 同步历史
   - 镜像清单（manifest）
   - 依赖关系

#### 同步镜像

##### 自动同步

系统会按照配置的同步间隔自动同步镜像。同步间隔推荐值：
- **开发环境**：`30m`（30分钟）
- **测试环境**：`1h`（1小时）
- **生产环境**：`2h`（2小时）或更长

##### 手动同步

在镜像详情页面，点击「立即同步」按钮可以手动触发同步。

#### 编辑镜像信息

1. 点击镜像右侧的「操作」菜单（⋯）
2. 选择「编辑信息」
3. 在弹出的对话框中修改显示名称和描述
4. 点击「保存」完成编辑

**注意**：不能修改镜像源、镜像路径、标签等核心配置。如需修改，请删除后重新创建。

#### 删除镜像

##### 单个删除

1. 点击镜像右侧的「操作」菜单（⋯）
2. 选择「删除」
3. 在确认对话框中输入镜像名称
4. 点击「确定」完成删除

##### 批量删除

1. 勾选要删除的镜像
2. 点击工具栏的「删除选中」按钮
3. 在确认对话框中输入删除数量
4. 点击「确定」完成批量删除

**注意**：删除镜像配置不会删除已拉取到节点的镜像，但会影响后续的镜像同步和更新。

### 按命名空间过滤

镜像仓库支持跨命名空间管理：

1. 在页面左上角的命名空间选择器中选择目标命名空间
2. 选择「全部项目」可以查看所有命名空间的镜像
3. 选择特定命名空间只查看该命名空间下的镜像

### 搜索镜像

在搜索框中输入关键词，可以搜索以下字段：
- 镜像名称
- 显示名称（别名）
- 镜像路径

### 分页加载

镜像列表采用无限滚动加载：
- 向下滚动自动加载下一页
- 显示已加载的数据总量
- 全部加载完成后显示提示信息

## 镜像配置

### 基本配置示例

#### 示例 1：同步 Nginx 最新版本

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: nginx-latest
  namespace: default
  annotations:
    theriseunion.io/display-name: "Nginx 最新版本"
    theriseunion.io/description: "Nginx web 服务器最新版本"
spec:
  repository: "library/nginx"
  tag: "latest"
  registryRef:
    name: harbor-prod
    namespace: "default"
  syncInterval: "1h"
```

#### 示例 2：同步特定版本的应用

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: myapp-v1.0.0
  namespace: production
  annotations:
    theriseunion.io/display-name: "MyApp v1.0.0"
    theriseunion.io/description: "生产环境 MyApp v1.0.0 版本"
spec:
  repository: "myapp/myapp"
  tag: "v1.0.0"
  registryRef:
    name: harbor-prod
    namespace: "production"
  syncInterval: "24h"
```

#### 示例 3：同步多架构镜像

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: redis-multiarch
  namespace: default
  annotations:
    theriseunion.io/display-name: "Redis 多架构版本"
    theriseunion.io/description: "支持 amd64 和 arm64 架构的 Redis"
spec:
  repository: "library/redis"
  tag: "7-alpine"
  registryRef:
    name: dockerhub-public
    namespace: "default"
  syncInterval: "12h"
```

### 高级配置

#### 同步策略配置

```yaml
spec:
  # 镜像路径（必需）
  repository: "library/nginx"

  # 镜像标签（必需）
  tag: "latest"

  # 引用的镜像源（必需）
  registryRef:
    name: harbor-prod
    namespace: "default"

  # 同步间隔（可选，默认 1h）
  syncInterval: "2h"

  # 同步超时时间（可选，默认 10m）
  syncTimeout: "15m"

  # 重试次数（可选，默认 3）
  retryCount: 5
```

## 最佳实践

### 1. 镜像版本管理

#### 使用固定标签

```yaml
# ❌ 不推荐：使用 latest 标签
tag: "latest"

# ✅ 推荐：使用固定版本标签
tag: "v1.0.0"
```

#### 版本命名规范

- **语义化版本**：`v1.0.0`、`v2.1.3`
- **日期版本**：`20240108`、`20240108-dev`
- **构建号**：`build-1234`、`release-456`

### 2. 同步策略

#### 生产环境

```yaml
# 生产环境使用较长的同步间隔
syncInterval: "24h"  # 每天同步一次
```

#### 开发环境

```yaml
# 开发环境使用较短的同步间隔
syncInterval: "30m"  # 每 30 分钟同步一次
```

#### 测试环境

```yaml
# 测试环境使用中等同步间隔
syncInterval: "2h"  # 每 2 小时同步一次
```

### 3. 镜像组织

#### 按应用分组

```
default namespace
├── nginx-latest
├── redis-cache
└── mysql-db

myapp namespace
├── myapp-frontend
├── myapp-backend
└── myapp-worker
```

#### 按环境分组

```
prod-nginx-v1.0.0  (生产环境)
test-nginx-v1.0.0  (测试环境)
dev-nginx-latest    (开发环境)
```

### 4. 资源优化

#### 定期清理无用镜像

1. 定期检查不再使用的镜像
2. 删除过时的镜像版本
3. 保留最近几个版本即可

#### 监控存储使用

1. 定期查看镜像存储占用
2. 设置存储使用告警
3. 及时清理释放空间

### 5. 安全建议

#### 镜像验证

1. 只同步来自可信镜像源的镜像
2. 使用镜像签名验证镜像完整性
3. 定期扫描镜像安全漏洞

#### 访问控制

1. 为不同环境配置不同的命名空间
2. 使用 RBAC 控制镜像管理权限
3. 审计镜像管理操作日志

## 常见问题

### Q1: 镜像同步失败怎么办？

**检查步骤**：
1. 检查镜像源连接状态
2. 确认镜像路径和标签是否正确
3. 查看同步错误日志
4. 检查网络连接和防火墙设置

**常见原因**：
- 镜像路径不存在
- 镜像源认证失败
- 网络连接问题
- 镜像过大导致超时

### Q2: 如何加快镜像同步速度？

**优化方法**：
1. 使用内网镜像源
2. 调整并发同步数量
3. 增加同步超时时间
4. 使用镜像代理或缓存

### Q3: 同步的镜像存储在哪里？

**答案**：
镜像同步只是同步镜像的元数据信息，实际的镜像数据仍然存储在各个节点的容器运行时中。当需要使用镜像时，容器运行时会从配置的镜像源拉取镜像。

### Q4: 如何批量添加镜像？

**方法**：
1. 使用 YAML 配置文件批量创建
2. 使用脚本调用 API 批量创建
3. 从其他环境导入镜像配置

### Q5: 删除镜像配置会影响运行中的应用吗？

**答案**：
不会直接影响。已运行的容器使用的是已拉取到本地的镜像。但会影响：
- 新的部署无法找到该镜像配置
- 自动同步会停止
- 需要手动管理镜像更新

## 技术实现

### 数据结构

镜像仓库使用 Kubernetes 自定义资源（CRD）存储：

```yaml
apiVersion: image.theriseunion.io/v1alpha1
kind: Repository
metadata:
  name: nginx-latest
  namespace: default
  annotations:
    theriseunion.io/display-name: "Nginx 最新版本"
    theriseunion.io/description: "Nginx web 服务器最新版本"
spec:
  repository: "library/nginx"
  tag: "latest"
  registryRef:
    name: harbor-prod
    namespace: "default"
  syncInterval: "1h"
status:
  domain: "harbor.example.com"
  syncStatus: "Success"
  lastSynced: "2024-01-08T10:30:00Z"
  manifest:
    architecture: "amd64"
    size: "142MB"
    created: "2024-01-08T08:00:00Z"
    layers:
    - digest: "sha256:abc123..."
      size: "12345678"
    - digest: "sha256:def456..."
      size: "87654321"
```

### API 端点

- **列表**：`GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories`
- **详情**：`GET /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}`
- **创建**：`POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories`
- **删除**：`DELETE /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}`
- **手动同步**：`POST /oapis/image.theriseunion.io/v1alpha1/namespaces/{namespace}/repositories/{name}/sync`

## 相关文档

- [镜像源管理](./registry-management.md)
- [镜像安全与认证](./security-authentication.md)
- [镜像生命周期管理](./lifecycle-management.md)
- [故障排查指南](./troubleshooting.md)