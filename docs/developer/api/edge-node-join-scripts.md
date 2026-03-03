---
sidebar_position: 7
title: "边缘节点加入脚本开发"
description: "边缘节点 join 脚本的实现原理、离线安装流程与二进制文件管理"
---

# 边缘节点加入脚本开发

本文档说明边缘节点加入脚本的完整实现机制，包括脚本如何嵌入 apiserver、如何通过 bin-downloader 实现纯离线安装、以及如何修改脚本模板和更新依赖的二进制文件。

---

## 整体架构

边缘节点加入的核心设计是**纯离线安装**：边缘节点上没有公网访问，所有依赖的二进制文件和安装脚本全部从内网的 bin-downloader 服务下载。

```
用户（平台界面）
    │
    │ POST /apis/infra.theriseunion.io/v1alpha1/clusters/{name}/jointokens
    ▼
edge-apiserver (join_token.go)
    │  1. 校验节点名称
    │  2. 生成 Bootstrap Token（OpenYurt）或读取 tokensecret（KubeEdge）
    │  3. 渲染 Shell 脚本模板（Go text/template）
    │  4. 返回 Base64 编码的安装命令
    ▼
JoinTokenResponse
    │  spec.command = "echo '<base64>' | base64 -d | bash"
    ▼
边缘节点执行安装脚本
    │
    ├── /etc/hosts 追加 DNS 解析（bin-downloader.rise.io, host.rise.io 等）
    │
    ├── curl http://bin-downloader.rise.io:30080/scripts/install_{docker|containerd}.sh
    │   └── 下载并安装容器运行时
    │
    ├── curl http://bin-downloader.rise.io:30080/scripts/install_kubelet_for_edge.sh (OpenYurt)
    │   └── 下载并安装 kubelet / yurtadm
    │
    └── yurtadm join / keadm join
        └── 节点加入集群，yurthub / edgecore 以 Static Pod 方式运行
```

---

## 脚本模板嵌入机制

### go:embed 编译嵌入

两个脚本模板通过 Go 的 `//go:embed` 指令在**编译时**嵌入 apiserver 二进制：

```
edge-apiserver/pkg/oapis/infra/v1alpha1/
├── join_token.go          ← 核心逻辑，嵌入并渲染脚本
└── scripts/
    ├── openyurt_join.sh   ← OpenYurt join 脚本模板
    └── kubeedge_join.sh   ← KubeEdge join 脚本模板
```

`join_token.go` 中的嵌入声明：

```go
//go:embed scripts/openyurt_join.sh
var openyurtJoinScriptTemplate string

//go:embed scripts/kubeedge_join.sh
var kubeedgeJoinScriptTemplate string
```

脚本文件使用 Go `text/template` 语法，在请求时动态替换变量：

```go
tmpl, _ := template.New("openyurt_join").Parse(openyurtJoinScriptTemplate)
tmpl.Execute(&buf, templateParams)
```

### 模板变量

**OpenYurt 脚本（`openyurt_join.sh`）**的模板参数（`OpenYurtJoinParams`）：

| 变量 | 说明 |
|------|------|
| `{{.GatewayIp}}` | 平台网关 IP，用于写入 `/etc/hosts` |
| `{{.BinDownloaderIp}}` | bin-downloader 的域名，默认 `bin-downloader.rise.io` |
| `{{.ServerName}}` | API Server 域名（vCluster 为 `{clusterName}.rise.io`，主集群为 `host.rise.io`） |
| `{{.ServerAddr}}` | API Server 地址（含端口，如 `192.168.1.1:6443`） |
| `{{.Token}}` | Kubernetes Bootstrap Token（`<token-id>.<token-secret>`，24 小时有效） |
| `{{.NodeName}}` | 节点名称 |
| `{{.YurthubImage}}` | YurtHub 容器镜像（如 `registry.example.com/openyurt/yurthub:v1.6.0`） |
| `{{.PauseImage}}` | pause 镜像（如 `registry.example.com/openyurt/pause:3.9`） |
| `{{.CRISocket}}` | 容器运行时 socket 路径 |
| `{{.K8sVersion}}` | Kubernetes 版本（如 `v1.24.17`） |
| `{{.EdgeRuntime}}` | 容器运行时类型（`docker` / `containerd`） |
| `{{.NodeGroupLabel}}` | 节点标签字符串（包含 nodegroup、type 等标签） |

**KubeEdge 脚本（`kubeedge_join.sh`）**的模板参数（`KubeedgeJoinParams`）：

| 变量 | 说明 |
|------|------|
| `{{.GatewayIp}}` | 平台网关 IP |
| `{{.BinDownloaderIp}}` | bin-downloader 域名 |
| `{{.ServerName}}` | CloudCore 域名 |
| `{{.ServerAddr}}` | CloudCore 地址（含端口） |
| `{{.Token}}` | KubeEdge Token（从 `kubeedge/tokensecret` Secret 读取） |
| `{{.NodeName}}` | 节点名称 |
| `{{.Version}}` | KubeEdge 版本（如 `v1.20.0`） |
| `{{.CRISocket}}` | CRI socket 路径 |
| `{{.K8sVersion}}` | K8s 版本 |
| `{{.EdgeRuntime}}` | 容器运行时类型 |
| `{{.ImageRepository}}` | 镜像仓库前缀 |
| `{{.NodeGroupLabel}}` | 节点标签字符串 |

---

## 离线安装流程详解

### 第一步：DNS 配置（/etc/hosts）

两个脚本都会在边缘节点的 `/etc/hosts` 中追加解析记录：

```bash
# 写入 bin-downloader 解析（所有后续下载走内网）
echo "{GatewayIp} bin-downloader.rise.io" >> /etc/hosts

# 写入 API Server 域名解析
# vCluster 集群：{clusterName}.rise.io → 主集群网关
# 主集群：host.rise.io → 主集群网关
echo "{GatewayIp} {ServerName}" >> /etc/hosts

echo "{GatewayIp} host.rise.io" >> /etc/hosts
```

### 第二步：安装容器运行时

脚本动态选择 `install_docker.sh` 或 `install_containerd.sh`：

```bash
curl -sS http://bin-downloader.rise.io:30080/scripts/install_{docker|containerd}.sh \
  | K8S_VERSION={K8sVersion} bash -
```

**`install_docker.sh` 下载的文件**（来自 `http://bin-downloader.rise.io:30080/{ARCH}/`）：

| 文件 | 版本 |
|------|------|
| `docker-{ARCH}-24.0.9.tgz` | Docker 24.0.9 |
| `containerd-1.7.13-linux-{ARCH}.tar.gz` | Containerd 1.7.13 |
| `runc.{ARCH}` | runc v1.1.12 |
| `cni-plugins-linux-{ARCH}-v1.2.0.tgz` | CNI Plugins v1.2.0 |
| `crictl-v1.29.0-linux-{ARCH}.tar.gz` | crictl v1.29.0 |
| `cri-dockerd-0.3.10.{ARCH}.tgz` | cri-dockerd 0.3.10（K8s ≥ 1.24 时安装） |

**`install_containerd.sh` 下载的文件**：

| 文件 | 版本 |
|------|------|
| `containerd-1.7.13-linux-{ARCH}.tar.gz` | Containerd 1.7.13 |
| `runc.{ARCH}` | runc v1.1.12 |
| `cni-plugins-linux-{ARCH}-v1.2.0.tgz` | CNI Plugins v1.2.0 |
| `crictl-v1.29.0-linux-{ARCH}.tar.gz` | crictl v1.29.0 |

`ARCH` 由脚本自动检测（`amd64` 或 `arm64`）。

### 第三步：安装 kubelet（OpenYurt）

```bash
curl -sS http://bin-downloader.rise.io:30080/scripts/install_kubelet_for_edge.sh \
  | K8S_VERSION={K8sVersion} bash -
```

**下载的文件**：

| 文件 | 说明 |
|------|------|
| `k8s-depends_ubuntu2204_{ARCH}.tgz` | K8s 依赖包（deb 格式，含 socat/conntrack 等） |
| `kubeadm-{K8S_VERSION}-linux-{ARCH}` | kubeadm |
| `kubelet-{K8S_VERSION}-linux-{ARCH}` | kubelet |
| `kubectl-{K8S_VERSION}-linux-{ARCH}` | kubectl |
| `yurtadm-v1.6.0-linux-{ARCH}.tar.gz` | yurtadm（OpenYurt 节点加入工具） |

### 第四步：安装 KubeEdge 环境（KubeEdge）

```bash
curl -sS http://bin-downloader.rise.io:30080/scripts/install_kubeedge_env.sh \
  | KUBEEDGE_VERSION={Version} RUNTIME_TYPE={EdgeRuntime} K8S_VERSION={K8sVersion} bash -
```

下载 `keadm-{KUBEEDGE_VERSION}-linux-{ARCH}.tar.gz`，并重启容器运行时服务。

### 第五步：节点加入集群

**OpenYurt**：

```bash
yurtadm reset --force --cri-socket={CRISocket}
yurtadm join {ServerAddr} \
  --token={Token} \
  --node-name={NodeName} \
  --cri-socket={CRISocket} \
  --yurthub-image={YurthubImage} \
  --pause-image={PauseImage} \
  --node-labels='{NodeGroupLabel}' \
  --node-type=edge \
  --discovery-token-unsafe-skip-ca-verification \
  --reuse-cni-bin
```

**KubeEdge**：

```bash
keadm reset edge --force --remote-runtime-endpoint={CRISocket}
keadm join --cloudcore-ipport={ServerAddr} \
  --kubeedge-version={Version} \
  --certport=30002 \
  --cgroupdriver=systemd \
  --image-repository={ImageRepository} \
  --remote-runtime-endpoint={CRISocket} \
  --edgenode-name={NodeName} \
  --labels='{NodeGroupLabel}' \
  --token={Token}
```

> `--certport=30002` 对应 Traefik 的 `cc-https` EntryPoint（NodePort），用于 KubeEdge CloudCore TLS 证书下载。

---

## bin-downloader 文件服务

### 目录结构

```
bin-downloader/
├── content/                    ← 所有二进制和脚本（打包进 Docker 镜像）
│   ├── amd64/                  ← x86_64 架构二进制
│   │   ├── docker-amd64-24.0.9.tgz
│   │   ├── containerd-1.7.13-linux-amd64.tar.gz
│   │   ├── runc.amd64
│   │   ├── cni-plugins-linux-amd64-v1.2.0.tgz
│   │   ├── crictl-v1.29.0-linux-amd64.tar.gz
│   │   ├── cri-dockerd-0.3.10.amd64.tgz
│   │   ├── kubeadm-v1.24.17-linux-amd64
│   │   ├── kubelet-v1.24.17-linux-amd64
│   │   ├── kubectl-v1.24.17-linux-amd64
│   │   ├── yurtadm-v1.6.0-linux-amd64.tar.gz
│   │   ├── keadm-v1.20.0-linux-amd64.tar.gz
│   │   └── k8s-depends_ubuntu2204_amd64.tgz
│   ├── arm64/                  ← ARM 架构二进制（同上）
│   ├── scripts/                ← 安装脚本（供 curl 下载执行）
│   │   ├── install_docker.sh
│   │   ├── install_containerd.sh
│   │   ├── install_kubelet_for_edge.sh
│   │   └── install_kubeedge_env.sh
│   └── downloaded.txt          ← 文件来源记录
├── Dockerfile.base-image       ← 基础镜像（Nginx + 配置，几乎不变）
├── Dockerfile.repo-image       ← 内容镜像（COPY content/ → /usr/share/nginx/html/）
├── nginx.conf                  ← Nginx 配置（autoindex on）
└── Makefile
```

### 两层镜像设计

bin-downloader 采用两层 Docker 镜像构建，分离变化频率不同的内容：

| 镜像 | 内容 | 变更频率 | 构建命令 |
|------|------|---------|---------|
| **base-image** (`bin-downloader:v0.1`) | Nginx + nginx.conf | 极少变动 | `make build-base && make push-base` |
| **repo-image** (`bin-downloader:latest`) | 所有 `content/` 内容 | 随二进制更新 | `make build && make push` |

`Dockerfile.repo-image` FROM base-image，再 COPY content/ 目录：

```dockerfile
FROM registry.example.com/base/bin-downloader:v0.1
COPY content/ /usr/share/nginx/html/
```

> **注意**：构建必须在 x86_64 机器上执行（Makefile 中有架构检查），否则会报错退出。

---

## 如何修改安装脚本

### 修改 join 脚本模板（openyurt_join.sh / kubeedge_join.sh）

这两个文件在 apiserver 编译时被嵌入二进制，修改后需要重新构建 apiserver 镜像。

1. **编辑模板文件**：
   ```
   edge-apiserver/pkg/oapis/infra/v1alpha1/scripts/openyurt_join.sh
   edge-apiserver/pkg/oapis/infra/v1alpha1/scripts/kubeedge_join.sh
   ```

2. **添加新模板变量（可选）**：
   - 在 `join_token.go` 中的 `OpenYurtJoinParams` 或 `KubeedgeJoinParams` struct 添加字段
   - 在 `generateOpenYurtJoinCommand()` 或 `generateKubeedgeJoinCommand()` 函数中填充该字段

3. **重新构建 apiserver**：
   ```bash
   cd edge-apiserver
   make docker-build-apiserver
   ```

### 修改 bin-downloader 安装脚本（install_*.sh）

这些脚本通过 Nginx 直接提供 HTTP 下载，修改后打包进 Docker 镜像即可，**无需重建 apiserver**。

1. **编辑脚本文件**：
   ```
   bin-downloader/content/scripts/install_docker.sh
   bin-downloader/content/scripts/install_containerd.sh
   bin-downloader/content/scripts/install_kubelet_for_edge.sh
   bin-downloader/content/scripts/install_kubeedge_env.sh
   ```

2. **重新构建并推送 repo-image（在 x86_64 机器上执行）**：
   ```bash
   cd bin-downloader
   make build
   make push
   ```

3. **重启集群中的 bin-downloader Pod**（滚动更新）：
   ```bash
   kubectl rollout restart deployment/bin-downloader -n edge-system
   ```

---

## 如何更新依赖的二进制文件

需要升级某个组件版本时（如升级 containerd 版本），流程如下：

### 第一步：下载新版本二进制

将新版本文件放入对应架构目录：

```bash
# 以升级 containerd 为例（同时更新两个架构）
cd bin-downloader/content/amd64/
wget https://github.com/containerd/containerd/releases/download/v1.7.14/containerd-1.7.14-linux-amd64.tar.gz

cd bin-downloader/content/arm64/
wget https://github.com/containerd/containerd/releases/download/v1.7.14/containerd-1.7.14-linux-arm64.tar.gz
```

### 第二步：更新安装脚本中的版本号

修改 `content/scripts/install_containerd.sh`（或 `install_docker.sh`）中的版本变量：

```bash
# 修改前
CONTAINERD_VERSION="1.7.13"

# 修改后
CONTAINERD_VERSION="1.7.14"
```

### 第三步：重新构建并推送镜像

```bash
cd bin-downloader
make build    # 构建包含新二进制的 repo-image
make push     # 推送到镜像仓库
```

### 第四步：更新集群中的 bin-downloader

```bash
kubectl rollout restart deployment/bin-downloader -n edge-system
```

---

## bin-downloader 默认域名

bin-downloader 的域名常量定义在：

```
edge-apiserver/internal/component/types.go
```

```go
const BIN_DOWNLOADER_DEFAULT = "bin-downloader.rise.io"
```

该域名会被填入 join 脚本的 `{{.BinDownloaderIp}}` 变量。边缘节点通过 `/etc/hosts` 将该域名解析到平台网关 IP（`GatewayIp`），再由 Traefik 路由到集群内的 bin-downloader Service（NodePort `30080`）。

如需修改域名，修改该常量后重新构建 apiserver 即可。

---

## 关键文件索引

| 功能 | 文件路径 |
|------|---------|
| join 脚本嵌入与渲染 | `edge-apiserver/pkg/oapis/infra/v1alpha1/join_token.go` |
| OpenYurt join 脚本模板 | `edge-apiserver/pkg/oapis/infra/v1alpha1/scripts/openyurt_join.sh` |
| KubeEdge join 脚本模板 | `edge-apiserver/pkg/oapis/infra/v1alpha1/scripts/kubeedge_join.sh` |
| bin-downloader 域名常量 | `edge-apiserver/internal/component/types.go` |
| Docker 安装脚本 | `bin-downloader/content/scripts/install_docker.sh` |
| Containerd 安装脚本 | `bin-downloader/content/scripts/install_containerd.sh` |
| Kubelet 安装脚本（OpenYurt） | `bin-downloader/content/scripts/install_kubelet_for_edge.sh` |
| KubeEdge 环境安装脚本 | `bin-downloader/content/scripts/install_kubeedge_env.sh` |
| bin-downloader 构建文件 | `bin-downloader/Makefile` |
| bin-downloader 二进制（amd64） | `bin-downloader/content/amd64/` |
| bin-downloader 二进制（arm64） | `bin-downloader/content/arm64/` |
