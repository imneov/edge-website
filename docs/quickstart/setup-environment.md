---
sidebar_position: 1
title: 环境搭建
---

# 开发环境搭建

本章将指导您搭建 EDGE APIServer 的开发环境，让您能够快速开始扩展开发。

## 📋 环境要求

### 基础环境

- **Go**: 1.21+
- **Kubernetes**: 1.27+
- **Docker**: 20.10+

### 开发工具

```bash
# 必需工具
kubectl
git

# 推荐工具
make
curl
```

## 🚀 快速启动

### 1. 获取源码

```bash
# 克隆项目
git clone <repository-url>
cd edge-apiserver
```

### 2. 安装 CRDs

```bash
# 安装自定义资源定义
make install
```

这将安装以下 CRDs：
- `IAMRole` - 权限角色定义
- `IAMRoleBinding` - 权限绑定
- `RoleTemplate` - 角色模板

### 3. 构建组件

```bash
# 构建 APIServer 和 Controller
make apiserver controller
```

构建成功后，您将在 `bin/` 目录看到：
- `apiserver` - HTTP API 服务
- `controller` - CRD 管理服务

### 4. 启动服务

**启动 APIServer**（终端 1）:
```bash
./bin/apiserver --kubeconfig ~/.kube/config
```

**启动 Controller**（终端 2）:
```bash
./bin/controller --kubeconfig ~/.kube/config
```

### 5. 验证安装

```bash
# 检查 APIServer 健康状态
curl http://localhost:8080/healthz

# 检查 API 是否可用
curl http://localhost:8080/oapis/iam/v1alpha1/iamroles
```

## 🔧 开发工作流

### 代码修改后重新构建

```bash
# 格式化和检查代码
make fmt vet

# 重新构建
make apiserver controller

# 重启服务
# 停止现有进程，重新运行上述启动命令
```

### 运行测试

```bash
# 运行单元测试
make test

# 运行 OAuth 集成测试
make test-oauth
```

## 📁 项目结构

了解项目结构有助于开发：

```
edge-apiserver/
├── cmd/
│   ├── apiserver/main.go        # APIServer 入口
│   └── controller/main.go       # Controller 入口
├── api/
│   ├── iam/v1alpha1/            # IAM CRD 定义
│   └── scope/v1alpha1/         # Scope CRD 定义
├── pkg/
│   ├── apiserver/              # APIServer 核心逻辑
│   └── oapis/                  # OAPI 模块
├── internal/
│   ├── authorizer/             # 权限检查引擎
│   └── controller/             # 控制器实现
└── Makefile                    # 构建脚本
```

## 🔍 调试配置

### 启用详细日志

```bash
# APIServer 详细日志
./bin/apiserver --kubeconfig ~/.kube/config -v=4

# Controller 详细日志
./bin/controller --kubeconfig ~/.kube/config -v=4
```

### 调试权限检查

EDGE 提供专门的调试 API：

```bash
# 检查权限链
curl "http://localhost:8080/debug/permission-chain?user=alice&path=/api/v1/pods"

# 测试 Scope 提取
curl "http://localhost:8080/debug/scope-extract?path=/oapis/tenant/v1/workspaces/team-a"
```

## 🐳 Docker 开发环境

如果您喜欢使用容器化开发：

```bash
# 构建 Docker 镜像
make docker-build-all

# 在 Kind 集群中运行
kind load docker-image edge-apiserver:latest
kind load docker-image edge-controller:latest

# 使用 Helm 部署
helm install edge-dev ./charts/edge-apiserver \
  --set apiserver.image.pullPolicy=Never \
  --set controller.image.pullPolicy=Never
```

## ⚡ 性能优化

### 开发环境性能配置

```bash
# 禁用 Controller 的 Leader 选举（单实例开发）
./bin/controller --kubeconfig ~/.kube/config --enable-leader-election=false

# 调整 APIServer 缓存配置
export CACHE_TTL=60  # 缓存 60 秒，便于开发测试
```

## 🔗 下一步

环境搭建完成后，您可以：

1. 🎯 跟随 [Hello World API](./hello-world.md) 创建第一个扩展
2. 📖 深入了解 [权限模型](../overview/permission-model.md)
3. 💻 查看 [实践案例](../examples/user-management.md)

## 🆘 常见问题

### Q: APIServer 启动失败，提示 CRD 不存在？

```bash
# 重新安装 CRDs
make install

# 检查 CRDs 是否安装成功
kubectl get crd | grep theriseunion.io
```

### Q: 权限检查不生效？

```bash
# 检查 Controller 是否正常运行
kubectl logs -f deployment/edge-controller

# 检查 IAMRole 是否转换为 ClusterRole
kubectl get clusterroles | grep rs:iam
```

### Q: 无法访问 OAPI 接口？

```bash
# 检查 APIServer 状态
curl http://localhost:8080/healthz

# 检查路由注册
curl http://localhost:8080/oapis/
```

---

环境搭建完成！现在开始您的第一个扩展开发：[Hello World API](./hello-world.md)