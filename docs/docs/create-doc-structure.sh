#!/bin/bash

# 创建文档目录结构脚本

# 产品介绍
mkdir -p introduction

# 快速入门
mkdir -p quick-start

# 部署指南
mkdir -p deployment

# 用户指南
mkdir -p user-guide/platform
mkdir -p user-guide/clusters
mkdir -p user-guide/workspaces
mkdir -p user-guide/applications
mkdir -p user-guide/observability
mkdir -p user-guide/marketplace

# 开发指南
mkdir -p developer-guide/concepts
mkdir -p developer-guide/permissions
mkdir -p developer-guide/api
mkdir -p developer-guide/frontend
mkdir -p developer-guide/best-practices

# API 参考
mkdir -p api-reference/rest
mkdir -p api-reference/crd

# 参考资料
mkdir -p reference

echo "✅ 目录结构创建完成"
