---
sidebar_position: 1
title: API 开发入门
---

# API 开发入门

本文档介绍如何开始开发边缘平台的 API 扩展,包括环境搭建、项目结构说明和快速开始示例。

## 开发环境要求

### 必需工具

- **Go 1.21+**: 主要开发语言
- **kubebuilder 3.12+**: CRD 和 Controller 脚手架工具
- **kubectl 1.27+**: Kubernetes 命令行工具
- **Docker 24+**: 容器运行时
- **Git**: 版本控制

### 推荐工具

- **GoLand / VS Code**: IDE
- **k9s**: Kubernetes 集群管理 TUI
- **kubectx/kubens**: 快速切换集群和命名空间
- **kind / minikube**: 本地 Kubernetes 集群

## 环境搭建

### 1. 安装 Go

```bash
# macOS
brew install go

# Linux
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# 配置环境变量
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

### 2. 安装 kubebuilder

```bash
# macOS
brew install kubebuilder

# Linux
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && sudo mv kubebuilder /usr/local/bin/
```

### 3. 安装 kubectl

```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/
```

### 4. 设置本地 Kubernetes 集群

```bash
# 使用 kind 创建集群
kind create cluster --name edge-dev

# 验证集群
kubectl cluster-info
kubectl get nodes
```

## 项目结构说明

edge-apiserver 项目采用标准的 Kubernetes 项目布局:

```
edge-apiserver/
├── api/                        # API 定义
│   ├── iam/v1alpha1/          # IAM API Group
│   │   ├── roletemplate_types.go
│   │   ├── iamrole_types.go
│   │   └── reverseproxy_types.go
│   └── scope/v1alpha1/        # Scope API Group
│       ├── cluster_types.go
│       └── workspace_types.go
├── cmd/                        # 入口点
│   ├── apiserver/             # APIServer 主程序
│   └── controller/            # Controller Manager
├── config/                     # Kubernetes 配置
│   ├── crd/                   # CRD YAML
│   ├── rbac/                  # RBAC 配置
│   └── samples/               # 示例资源
├── internal/                   # 内部包
│   ├── controller/            # Controller 实现
│   ├── authorizer/            # 权限授权器
│   └── webhook/               # Admission Webhooks
├── pkg/                        # 公共包
│   ├── apiserver/             # APIServer 核心
│   ├── client/                # 客户端
│   └── constants/             # 常量定义
├── Makefile                    # 构建脚本
└── PROJECT                     # Kubebuilder 项目文件
```

### 关键目录说明

#### api/

存放所有 CRD 的 Go 类型定义。每个 API Group 一个子目录:

```go
// api/iam/v1alpha1/roletemplate_types.go
type RoleTemplate struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   RoleTemplateSpec   `json:"spec,omitempty"`
    Status RoleTemplateStatus `json:"status,omitempty"`
}
```

#### internal/controller/

Controller 的 Reconcile 逻辑实现:

```go
// internal/controller/roletemplate_controller.go
func (r *RoleTemplateReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Controller 逻辑
}
```

#### pkg/

可以被外部项目导入的公共包:

- `pkg/apiserver`: APIServer 核心逻辑
- `pkg/client`: 生成的客户端代码
- `pkg/constants`: 全局常量

## Hello World CRD 快速开始

### 步骤 1: 创建 API

使用 kubebuilder 创建新的 API:

```bash
cd edge-apiserver

# 创建新的 API Group 和 Kind
kubebuilder create api \
  --group tutorial \
  --version v1alpha1 \
  --kind HelloWorld
```

回答提示:

```
Create Resource [y/n] y
Create Controller [y/n] y
```

### 步骤 2: 定义 API 类型

编辑 `api/tutorial/v1alpha1/helloworld_types.go`:

```go
package v1alpha1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// HelloWorldSpec 定义 HelloWorld 的期望状态
type HelloWorldSpec struct {
    // Message 是要显示的消息
    // +kubebuilder:validation:Required
    // +kubebuilder:validation:MinLength=1
    Message string `json:"message"`

    // Replicas 是副本数量
    // +kubebuilder:default=1
    // +kubebuilder:validation:Minimum=0
    // +kubebuilder:validation:Maximum=10
    Replicas int32 `json:"replicas,omitempty"`
}

// HelloWorldStatus 定义 HelloWorld 的观测状态
type HelloWorldStatus struct {
    // LastUpdateTime 上次更新时间
    LastUpdateTime *metav1.Time `json:"lastUpdateTime,omitempty"`

    // ObservedGeneration 观测到的资源代数
    ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:printcolumn:name="Message",type="string",JSONPath=".spec.message"
//+kubebuilder:printcolumn:name="Replicas",type="integer",JSONPath=".spec.replicas"
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// HelloWorld is the Schema for the helloworlds API
type HelloWorld struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   HelloWorldSpec   `json:"spec,omitempty"`
    Status HelloWorldStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// HelloWorldList contains a list of HelloWorld
type HelloWorldList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []HelloWorld `json:"items"`
}

func init() {
    SchemeBuilder.Register(&HelloWorld{}, &HelloWorldList{})
}
```

### 步骤 3: 实现 Controller

编辑 `internal/controller/helloworld_controller.go`:

```go
package controller

import (
    "context"

    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    tutorialv1alpha1 "github.com/theriseunion/apiserver/api/tutorial/v1alpha1"
)

// HelloWorldReconciler reconciles a HelloWorld object
type HelloWorldReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=tutorial.theriseunion.io,resources=helloworlds,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=tutorial.theriseunion.io,resources=helloworlds/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=tutorial.theriseunion.io,resources=helloworlds/finalizers,verbs=update

// Reconcile 实现 HelloWorld 的 reconcile 逻辑
func (r *HelloWorldReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // 获取 HelloWorld 资源
    var helloWorld tutorialv1alpha1.HelloWorld
    if err := r.Get(ctx, req.NamespacedName, &helloWorld); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    logger.Info("Reconciling HelloWorld",
        "name", helloWorld.Name,
        "message", helloWorld.Spec.Message,
        "replicas", helloWorld.Spec.Replicas)

    // 更新状态
    now := metav1.Now()
    helloWorld.Status.LastUpdateTime = &now
    helloWorld.Status.ObservedGeneration = helloWorld.Generation

    if err := r.Status().Update(ctx, &helloWorld); err != nil {
        logger.Error(err, "Failed to update HelloWorld status")
        return ctrl.Result{}, err
    }

    logger.Info("Successfully reconciled HelloWorld")
    return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *HelloWorldReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&tutorialv1alpha1.HelloWorld{}).
        Complete(r)
}
```

### 步骤 4: 生成代码和 CRD

```bash
# 生成 CRD YAML 和 DeepCopy 代码
make manifests

# 生成客户端代码
make generate
```

### 步骤 5: 安装 CRD

```bash
# 安装 CRD 到集群
make install

# 验证 CRD
kubectl get crd helloworlds.tutorial.theriseunion.io
```

### 步骤 6: 运行 Controller

```bash
# 本地运行 Controller
make run

# 或者构建并部署到集群
make docker-build docker-push IMG=<registry>/edge-controller:latest
make deploy IMG=<registry>/edge-controller:latest
```

### 步骤 7: 创建示例资源

创建 `config/samples/tutorial_v1alpha1_helloworld.yaml`:

```yaml
apiVersion: tutorial.theriseunion.io/v1alpha1
kind: HelloWorld
metadata:
  name: helloworld-sample
spec:
  message: "Hello from Edge Platform!"
  replicas: 3
```

应用资源:

```bash
kubectl apply -f config/samples/tutorial_v1alpha1_helloworld.yaml

# 查看资源
kubectl get helloworld
kubectl describe helloworld helloworld-sample
```

## 开发工具链

### Makefile 常用命令

```bash
# 代码生成
make generate          # 生成 DeepCopy 代码
make manifests         # 生成 CRD 和 RBAC YAML

# 测试
make test              # 运行单元测试
make test-integration  # 运行集成测试

# 构建
make build             # 构建二进制文件
make docker-build      # 构建 Docker 镜像

# 部署
make install           # 安装 CRD 到集群
make deploy            # 部署 Controller
make uninstall         # 卸载 CRD
make undeploy          # 卸载 Controller

# 开发
make run               # 本地运行 Controller
make fmt               # 格式化代码
make vet               # 代码检查
make lint              # 运行 golangci-lint
```

### 调试技巧

#### 1. 启用详细日志

```bash
make run ARGS="--v=4"
```

#### 2. 使用 delve 调试

```bash
# 安装 delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 调试 Controller
dlv debug ./cmd/controller/main.go
```

#### 3. 查看 Controller 日志

```bash
# 如果部署在集群中
kubectl logs -n edge-system deployment/edge-controller-manager -f
```

## 下一步

现在你已经成功创建了第一个 CRD 和 Controller,接下来可以:

- [学习 CRD 开发最佳实践](./crd-development.md)
- [深入了解 Controller 模式](./controller.md)
- [了解 API 扩展机制](./api-service.md)
- [集成 ReverseProxy 功能](./reverse-proxy.md)

## 相关文档

- [CRD 开发指南](./crd-development.md)
- [Controller 开发](./controller.md)
- [APIService 扩展](./api-service.md)
- [Metrics 集成](./metrics.md)
