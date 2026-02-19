# 代码构建说明书

本文档提供边缘计算平台各组件的完整构建指南，确保开发人员能够自主编译出与交付包一致的程序。

## 1. 开发环境准备

### 1.1 必需工具

| 工具 | 版本要求 | 用途 |
|------|----------|------|
| Go | 1.21+ | 后端编译 |
| Node.js | 18.x / 20.x | 前端构建 |
| pnpm | 8.x+ | 包管理 |
| Docker | 20.10+ | 镜像构建 |
| kubectl | 1.28+ | K8s 操作 |
| Helm | 3.x | Chart 打包 |
| Make | 4.0+ | 构建工具 |

### 1.2 环境配置

```bash
# Go 环境
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
export GOPROXY=https://goproxy.cn,direct

# Node.js 环境 (推荐使用 nvm)
nvm install 20
nvm use 20

# pnpm
npm install -g pnpm
```

## 2. 项目结构

```
edge-platform/
├── edge-apiserver/      # 后端 API 服务
├── edge-console/        # 前端控制台
├── edge-ota/            # OTA 管理服务
├── monitoring-service/  # 监控服务
└── edge-website/        # 文档站点
```

## 3. Edge APIServer 构建

### 3.1 获取源码

```bash
git clone https://github.com/theriseunion/edge-apiserver.git
cd edge-apiserver
```

### 3.2 安装依赖

```bash
# 下载 Go 模块
go mod download

# 验证依赖
go mod verify
```

### 3.3 本地编译

```bash
# 编译所有组件
make build

# 或分别编译
make build-apiserver    # API 服务
make build-controller   # 控制器

# 编译产物
ls -la bin/
# bin/apiserver
# bin/controller
```

### 3.4 运行测试

```bash
# 单元测试
make test

# 集成测试
make test-integration

# 覆盖率报告
make test-coverage
```

### 3.5 构建 Docker 镜像

```bash
# 构建 APIServer 镜像
make docker-build-apiserver IMG=edge-apiserver:latest

# 构建 Controller 镜像
make docker-build-controller IMG=edge-controller:latest

# 推送到镜像仓库
make docker-push IMG=registry.example.com/edge/edge-apiserver:latest
```

### 3.6 Makefile 目标说明

```makefile
# 常用目标
make help               # 显示所有可用目标
make build              # 编译所有二进制
make test               # 运行测试
make lint               # 代码检查
make fmt                # 代码格式化
make generate           # 生成代码 (CRD, DeepCopy)
make manifests          # 生成 K8s manifests
make install            # 安装 CRDs 到集群
make docker-build       # 构建 Docker 镜像
make helm-package       # 打包 Helm Chart
```

## 4. Edge Console 构建

### 4.1 获取源码

```bash
git clone https://github.com/theriseunion/edge-console.git
cd edge-console
```

### 4.2 安装依赖

```bash
# 使用 pnpm 安装
pnpm install

# 如果网络问题，使用镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### 4.3 本地开发

```bash
# 配置环境变量
cp .env.local.example .env.local

# 编辑 .env.local
# NEXT_PUBLIC_API_SERVER=http://localhost:8080

# 启动开发服务器
pnpm dev
# 或
make dev
```

### 4.4 生产构建

```bash
# 构建生产版本
pnpm build

# 构建产物
ls -la .next/
# .next/standalone/   # 独立部署包
# .next/static/       # 静态资源

# 启动生产服务
pnpm start
```

### 4.5 构建 Docker 镜像

```bash
# 使用 Dockerfile 构建
docker build -t edge-console:latest -f build/console/Dockerfile .

# 多阶段构建说明
# Stage 1: 依赖安装
# Stage 2: 构建
# Stage 3: 运行时镜像 (基于 node:20-alpine)

# 推送镜像
docker push registry.example.com/edge/edge-console:latest
```

### 4.6 构建配置

```typescript
// next.config.mjs
const nextConfig = {
  output: 'standalone',  // 独立输出
  experimental: {
    serverComponentsExternalPackages: ['@tremor/react'],
  },
  env: {
    NEXT_PUBLIC_API_SERVER: process.env.NEXT_PUBLIC_API_SERVER,
  },
}
```

## 5. Edge OTA 构建

### 5.1 获取源码

```bash
git clone https://github.com/outpostos/edge-ota.git
cd edge-ota
```

### 5.2 编译服务端

```bash
# 编译 OTA Server
make build-server

# 编译产物
ls -la bin/
# bin/ota-server
```

### 5.3 编译 Agent

```bash
# 编译 Linux Agent (amd64)
make build-agent GOOS=linux GOARCH=amd64

# 编译 Linux Agent (arm64)
make build-agent GOOS=linux GOARCH=arm64

# 编译产物
ls -la bin/
# bin/ota-agent-linux-amd64
# bin/ota-agent-linux-arm64
```

### 5.4 交叉编译

```bash
# 支持的目标平台
PLATFORMS="linux/amd64 linux/arm64 linux/arm/v7 darwin/amd64 darwin/arm64"

# 构建所有平台
make build-all-platforms

# 产物目录
ls -la dist/
# dist/ota-agent-linux-amd64
# dist/ota-agent-linux-arm64
# dist/ota-agent-darwin-amd64
# ...
```

### 5.5 构建 Docker 镜像

```bash
# Server 镜像
docker build -t edge-ota-server:latest -f Dockerfile.server .

# Agent 镜像 (用于容器化部署场景)
docker build -t edge-ota-agent:latest -f Dockerfile.agent .
```

## 6. Monitoring Service 构建

### 6.1 获取源码

```bash
git clone https://github.com/theriseunion/monitoring-service.git
cd monitoring-service
```

### 6.2 编译

```bash
# 编译服务
make build

# 产物
ls -la bin/
# bin/monitoring-service
```

### 6.3 构建镜像

```bash
docker build -t monitoring-service:latest -f Dockerfile .
```

## 7. Helm Chart 打包

### 7.1 APIServer Chart

```bash
cd edge-apiserver/charts/

# 更新依赖
helm dependency update edge-apiserver/

# 打包
helm package edge-apiserver/

# 产物
ls -la *.tgz
# edge-apiserver-1.0.0.tgz
```

### 7.2 完整平台 Chart

```bash
# 打包所有组件 Chart
./scripts/package-charts.sh

# 产物目录
ls -la charts-dist/
# edge-apiserver-1.0.0.tgz
# edge-console-1.0.0.tgz
# edge-ota-1.0.0.tgz
# monitoring-service-1.0.0.tgz
```

## 8. 完整构建流程

### 8.1 一键构建脚本

```bash
#!/bin/bash
# build-all.sh - 完整构建脚本

set -e

VERSION=${1:-"latest"}
REGISTRY=${REGISTRY:-"registry.example.com/edge"}

echo "=== Building Edge Platform v${VERSION} ==="

# 1. 构建 APIServer
echo "Building edge-apiserver..."
cd edge-apiserver
make docker-build IMG=${REGISTRY}/edge-apiserver:${VERSION}
cd ..

# 2. 构建 Console
echo "Building edge-console..."
cd edge-console
docker build -t ${REGISTRY}/edge-console:${VERSION} -f build/console/Dockerfile .
cd ..

# 3. 构建 OTA
echo "Building edge-ota..."
cd edge-ota
docker build -t ${REGISTRY}/edge-ota-server:${VERSION} -f Dockerfile.server .
docker build -t ${REGISTRY}/edge-ota-agent:${VERSION} -f Dockerfile.agent .
cd ..

# 4. 构建 Monitoring
echo "Building monitoring-service..."
cd monitoring-service
docker build -t ${REGISTRY}/monitoring-service:${VERSION} -f Dockerfile .
cd ..

# 5. 打包 Helm Charts
echo "Packaging Helm charts..."
./scripts/package-charts.sh ${VERSION}

echo "=== Build Complete ==="
echo "Images:"
echo "  - ${REGISTRY}/edge-apiserver:${VERSION}"
echo "  - ${REGISTRY}/edge-console:${VERSION}"
echo "  - ${REGISTRY}/edge-ota-server:${VERSION}"
echo "  - ${REGISTRY}/edge-ota-agent:${VERSION}"
echo "  - ${REGISTRY}/monitoring-service:${VERSION}"
```

### 8.2 CI/CD 构建

```yaml
# .github/workflows/build.yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Build APIServer
        run: |
          cd edge-apiserver
          make build
          make docker-build
      
      - name: Build Console
        run: |
          cd edge-console
          pnpm install
          pnpm build
          docker build -t edge-console:${{ github.ref_name }} .
      
      - name: Push Images
        run: |
          docker push registry/edge-apiserver:${{ github.ref_name }}
          docker push registry/edge-console:${{ github.ref_name }}
```

## 9. 验证构建结果

### 9.1 镜像验证

```bash
# 检查镜像大小
docker images | grep edge

# 验证镜像可运行
docker run --rm edge-apiserver:latest --version
docker run --rm edge-ota-server:latest --version
```

### 9.2 二进制验证

```bash
# 检查二进制版本
./bin/apiserver version
./bin/ota-server version
./bin/ota-agent version
```

### 9.3 Helm Chart 验证

```bash
# Lint 检查
helm lint charts/edge-apiserver/

# 模板渲染测试
helm template edge-apiserver charts/edge-apiserver/ \
  --values charts/edge-apiserver/values.yaml
```

## 10. 常见问题

### Q: Go 编译报 timeout

```bash
# 使用国内代理
export GOPROXY=https://goproxy.cn,direct
go mod download
```

### Q: Node.js 依赖安装慢

```bash
# 使用 npmmirror
pnpm config set registry https://registry.npmmirror.com
```

### Q: Docker 构建失败

```bash
# 清理构建缓存
docker builder prune -f

# 无缓存构建
docker build --no-cache -t image:tag .
```

### Q: ARM64 交叉编译

```bash
# 安装交叉编译工具链
apt-get install gcc-aarch64-linux-gnu

# 设置环境变量
export CC=aarch64-linux-gnu-gcc
export CGO_ENABLED=1
export GOOS=linux
export GOARCH=arm64

go build -o bin/ota-agent-arm64 ./cmd/agent
```

---

*版本：1.0*
*最后更新：2026年2月*
