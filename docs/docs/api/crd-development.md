---
sidebar_position: 2
title: CRD 开发指南
---

# CRD 开发指南

本文档详细介绍如何使用 kubebuilder 开发高质量的 Custom Resource Definition (CRD),包括设计原则、字段验证、Webhook 配置和版本管理。

## CRD 设计原则

### 1. 声明式 API 设计

CRD 应该描述**期望状态**而非操作步骤:

```go
// ✅ 好的设计 - 声明式
type DeploymentSpec struct {
    Replicas int32  `json:"replicas"`
    Image    string `json:"image"`
}

// ❌ 不好的设计 - 命令式
type DeploymentSpec struct {
    Action string `json:"action"` // "scale-up", "scale-down"
    Delta  int32  `json:"delta"`
}
```

### 2. Spec 和 Status 分离

- **Spec**: 用户期望的状态(用户修改)
- **Status**: 实际观测到的状态(Controller 修改)

```go
type RoleTemplate struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    // Spec 是用户定义的期望状态
    Spec   RoleTemplateSpec   `json:"spec,omitempty"`

    // Status 是 Controller 观测到的实际状态
    Status RoleTemplateStatus `json:"status,omitempty"`
}
```

### 3. 使用嵌套结构组织复杂字段

```go
type ReverseProxySpec struct {
    // 使用嵌套结构而非平铺
    Matcher    ReverseProxyMatcher    `json:"matcher"`
    Upstream   ReverseProxyUpstream   `json:"upstream"`
    Directives ReverseProxyDirectives `json:"directives,omitempty"`
}

type ReverseProxyMatcher struct {
    Method string `json:"method,omitempty"`
    Path   string `json:"path"`
}
```

### 4. 提供合理的默认值

使用 kubebuilder 标记提供默认值:

```go
type HelloWorldSpec struct {
    // +kubebuilder:default=1
    // +kubebuilder:validation:Minimum=0
    Replicas int32 `json:"replicas,omitempty"`
}
```

## 使用 kubebuilder 创建 CRD

### 完整流程

#### 1. 初始化项目

```bash
mkdir my-operator
cd my-operator

kubebuilder init \
  --domain theriseunion.io \
  --repo github.com/theriseunion/my-operator
```

#### 2. 创建 API

```bash
kubebuilder create api \
  --group apps \
  --version v1alpha1 \
  --kind Application
```

#### 3. 编辑 API 类型

编辑 `api/apps/v1alpha1/application_types.go`:

```go
package v1alpha1

import (
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ApplicationSpec 定义应用的期望状态
type ApplicationSpec struct {
    // Image 容器镜像
    // +kubebuilder:validation:Required
    Image string `json:"image"`

    // Replicas 副本数量
    // +kubebuilder:default=1
    // +kubebuilder:validation:Minimum=0
    // +kubebuilder:validation:Maximum=100
    Replicas *int32 `json:"replicas,omitempty"`

    // Port 服务端口
    // +kubebuilder:validation:Minimum=1
    // +kubebuilder:validation:Maximum=65535
    Port int32 `json:"port"`

    // Env 环境变量
    // +optional
    Env []corev1.EnvVar `json:"env,omitempty"`

    // Resources 资源配置
    // +optional
    Resources *corev1.ResourceRequirements `json:"resources,omitempty"`
}

// ApplicationPhase 应用阶段
// +kubebuilder:validation:Enum=Pending;Running;Failed
type ApplicationPhase string

const (
    ApplicationPhasePending ApplicationPhase = "Pending"
    ApplicationPhaseRunning ApplicationPhase = "Running"
    ApplicationPhaseFailed  ApplicationPhase = "Failed"
)

// ApplicationStatus 定义应用的观测状态
type ApplicationStatus struct {
    // Phase 当前阶段
    Phase ApplicationPhase `json:"phase,omitempty"`

    // ReadyReplicas 就绪的副本数
    ReadyReplicas int32 `json:"readyReplicas,omitempty"`

    // Conditions 状态条件
    Conditions []metav1.Condition `json:"conditions,omitempty"`

    // ObservedGeneration 观测到的资源代数
    ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:subresource:scale:specpath=.spec.replicas,statuspath=.status.readyReplicas
//+kubebuilder:resource:shortName=app
//+kubebuilder:printcolumn:name="Image",type="string",JSONPath=".spec.image"
//+kubebuilder:printcolumn:name="Replicas",type="integer",JSONPath=".spec.replicas"
//+kubebuilder:printcolumn:name="Ready",type="integer",JSONPath=".status.readyReplicas"
//+kubebuilder:printcolumn:name="Phase",type="string",JSONPath=".status.phase"
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// Application is the Schema for the applications API
type Application struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   ApplicationSpec   `json:"spec,omitempty"`
    Status ApplicationStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// ApplicationList contains a list of Application
type ApplicationList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Application `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Application{}, &ApplicationList{})
}
```

#### 4. 生成代码和 CRD

```bash
make manifests generate
```

## 字段验证和 Webhook

### 内置验证标记

kubebuilder 提供了丰富的验证标记:

```go
type ExampleSpec struct {
    // 必填字段
    // +kubebuilder:validation:Required
    RequiredField string `json:"requiredField"`

    // 字符串长度验证
    // +kubebuilder:validation:MinLength=1
    // +kubebuilder:validation:MaxLength=100
    Name string `json:"name"`

    // 数值范围验证
    // +kubebuilder:validation:Minimum=0
    // +kubebuilder:validation:Maximum=100
    Percentage int32 `json:"percentage"`

    // 枚举验证
    // +kubebuilder:validation:Enum=Low;Medium;High
    Priority string `json:"priority"`

    // 正则验证
    // +kubebuilder:validation:Pattern=`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`
    ResourceName string `json:"resourceName"`

    // 格式验证
    // +kubebuilder:validation:Format=email
    Email string `json:"email,omitempty"`

    // 默认值
    // +kubebuilder:default="default-value"
    DefaultField string `json:"defaultField,omitempty"`

    // 不可变字段(仅创建时设置)
    // +kubebuilder:validation:XValidation:rule="self == oldSelf",message="field is immutable"
    ImmutableField string `json:"immutableField"`
}
```

### Validation Webhook

当内置验证不够用时,创建 Validation Webhook:

```bash
kubebuilder create webhook \
  --group apps \
  --version v1alpha1 \
  --kind Application \
  --defaulting \
  --programmatic-validation
```

实现验证逻辑:

```go
// api/apps/v1alpha1/application_webhook.go
package v1alpha1

import (
    "fmt"

    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/webhook"
    "sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

func (r *Application) SetupWebhookWithManager(mgr ctrl.Manager) error {
    return ctrl.NewWebhookManagedBy(mgr).
        For(r).
        Complete()
}

//+kubebuilder:webhook:path=/mutate-apps-theriseunion-io-v1alpha1-application,mutating=true,failurePolicy=fail,sideEffects=None,groups=apps.theriseunion.io,resources=applications,verbs=create;update,versions=v1alpha1,name=mapplication.kb.io,admissionReviewVersions=v1

var _ webhook.Defaulter = &Application{}

// Default 实现默认值逻辑
func (r *Application) Default() {
    if r.Spec.Replicas == nil {
        defaultReplicas := int32(1)
        r.Spec.Replicas = &defaultReplicas
    }
}

//+kubebuilder:webhook:path=/validate-apps-theriseunion-io-v1alpha1-application,mutating=false,failurePolicy=fail,sideEffects=None,groups=apps.theriseunion.io,resources=applications,verbs=create;update,versions=v1alpha1,name=vapplication.kb.io,admissionReviewVersions=v1

var _ webhook.Validator = &Application{}

// ValidateCreate 验证创建
func (r *Application) ValidateCreate() (admission.Warnings, error) {
    if err := r.validateImage(); err != nil {
        return nil, err
    }
    return nil, nil
}

// ValidateUpdate 验证更新
func (r *Application) ValidateUpdate(old runtime.Object) (admission.Warnings, error) {
    oldApp := old.(*Application)

    // 检查不可变字段
    if r.Spec.Image != oldApp.Spec.Image {
        return admission.Warnings{"Changing image may cause service disruption"}, nil
    }

    if err := r.validateImage(); err != nil {
        return nil, err
    }
    return nil, nil
}

// ValidateDelete 验证删除
func (r *Application) ValidateDelete() (admission.Warnings, error) {
    return nil, nil
}

// validateImage 自定义验证逻辑
func (r *Application) validateImage() error {
    // 示例:检查镜像格式
    if r.Spec.Image == "" {
        return fmt.Errorf("image cannot be empty")
    }
    return nil
}
```

### Conversion Webhook (版本转换)

当需要支持多个 API 版本时:

```bash
kubebuilder create webhook \
  --group apps \
  --version v1alpha1 \
  --kind Application \
  --conversion
```

## CRD 版本管理策略

### 版本命名约定

- **v1alpha1**: 早期实验版本,API 可能不稳定
- **v1beta1**: API 基本稳定,可能有小的变化
- **v1**: 稳定版本,保证向后兼容

### 添加新版本

```bash
# 创建 v1beta1 版本
kubebuilder create api \
  --group apps \
  --version v1beta1 \
  --kind Application
```

### 版本转换策略

#### 1. Hub-Spoke 模式

选择一个版本作为 Hub(通常是最稳定的版本):

```go
// v1beta1 是 Hub 版本
// api/apps/v1beta1/application_types.go
package v1beta1

func (*Application) Hub() {}
```

其他版本实现转换接口:

```go
// v1alpha1 转换到 Hub
// api/apps/v1alpha1/application_conversion.go
package v1alpha1

import (
    "sigs.k8s.io/controller-runtime/pkg/conversion"
    v1beta1 "github.com/theriseunion/my-operator/api/apps/v1beta1"
)

func (src *Application) ConvertTo(dstRaw conversion.Hub) error {
    dst := dstRaw.(*v1beta1.Application)

    // 转换逻辑
    dst.ObjectMeta = src.ObjectMeta
    dst.Spec.Image = src.Spec.Image
    // ... 其他字段转换

    return nil
}

func (dst *Application) ConvertFrom(srcRaw conversion.Hub) error {
    src := srcRaw.(*v1beta1.Application)

    // 转换逻辑
    dst.ObjectMeta = src.ObjectMeta
    dst.Spec.Image = src.Spec.Image
    // ... 其他字段转换

    return nil
}
```

### 存储版本管理

在 CRD 中指定存储版本:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: applications.apps.theriseunion.io
spec:
  group: apps.theriseunion.io
  names:
    kind: Application
    plural: applications
  scope: Namespaced
  versions:
  - name: v1beta1
    served: true
    storage: true  # 存储版本
    schema:
      # ...
  - name: v1alpha1
    served: true
    storage: false  # 非存储版本
    schema:
      # ...
```

## 实战示例: IAMRole CRD

参考项目中的 IAMRole CRD 实现:

```go
// api/iam/v1alpha1/iamrole_types.go
package v1alpha1

import (
    rbacv1 "k8s.io/api/rbac/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// AggregationRoleTemplates 定义角色模板聚合规则
type AggregationRoleTemplates struct {
    // TemplateNames 通过名称聚合模板
    TemplateNames []string `json:"templateNames,omitempty"`

    // RoleSelector 通过标签选择器聚合模板
    RoleSelector *metav1.LabelSelector `json:"roleSelector,omitempty"`
}

// IAMRoleSpec 定义 IAMRole 的期望状态
type IAMRoleSpec struct {
    // DisplayName 显示名称(支持本地化)
    DisplayName map[string]string `json:"displayName,omitempty"`

    // Description 描述(支持本地化)
    Description map[string]string `json:"description,omitempty"`

    // Rules RBAC 策略规则
    Rules []rbacv1.PolicyRule `json:"rules,omitempty"`

    // AggregationRoleTemplates 聚合规则
    AggregationRoleTemplates *AggregationRoleTemplates `json:"aggregationRoleTemplates,omitempty"`

    // UIPermissions UI 权限标识
    UIPermissions []string `json:"uiPermissions,omitempty"`
}

// IAMRoleStatus 定义 IAMRole 的观测状态
type IAMRoleStatus struct {
    // LastUpdateTime 上次更新时间
    LastUpdateTime *metav1.Time `json:"lastUpdateTime,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:categories=iam,scope=Cluster
//+kubebuilder:printcolumn:name="Scope",type="string",JSONPath=".metadata.labels['iam\\.theriseunion\\.io/scope']"
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"

// IAMRole is the Schema for the iamroles API
type IAMRole struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   IAMRoleSpec   `json:"spec,omitempty"`
    Status IAMRoleStatus `json:"status,omitempty"`
}
```

## 最佳实践总结

### 1. API 设计

- ✅ 使用声明式而非命令式 API
- ✅ Spec 和 Status 严格分离
- ✅ 提供合理的默认值
- ✅ 使用嵌套结构组织复杂字段

### 2. 字段验证

- ✅ 优先使用内置验证标记
- ✅ 复杂验证使用 Webhook
- ✅ 提供清晰的错误消息
- ✅ 验证创建和更新场景

### 3. 版本管理

- ✅ 遵循版本命名约定
- ✅ 使用 Hub-Spoke 转换模式
- ✅ 明确指定存储版本
- ✅ 保证向后兼容性

### 4. 可观测性

- ✅ 添加有用的 printcolumn
- ✅ 提供 shortName 简化命令
- ✅ 设置合理的 categories
- ✅ 实现 status subresource

## 相关文档

- [API 开发入门](./getting-started.md)
- [Controller 开发](./controller.md)
- [Webhook 开发](./webhook.md)
- [版本管理策略](./versioning.md)
