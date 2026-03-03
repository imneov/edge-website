---
sidebar_position: 4
title: "快速入门：添加边缘节点"
description: "五分钟内将一台 Linux 机器接入平台，全程无需公网，纯离线安装"
---

# 快速入门：添加边缘节点

本指南带你用最短路径将一台 Linux 机器接入平台，完成后你的边缘节点将出现在集群节点列表中并处于「运行中」状态。

> **全程离线**：节点所需的所有二进制文件（containerd、kubelet、yurtadm/keadm 等）均由平台内网的 bin-downloader 服务提供，边缘节点无需访问公网。

---

## 前提条件

| 条件 | 说明 |
|------|------|
| 已有集群 | 目标集群已创建，且已配置边缘运行时（KubeEdge 或 OpenYurt） |
| 网络可达 | 边缘节点可访问平台网关（Traefik NodePort `30080`、`30443`、`6443` 等） |
| 操作系统 | Linux（Ubuntu 22.04 推荐），具有 root 权限 |
| 机器配置 | 2 核 CPU、4 GB 内存以上 |

如果集群尚未配置边缘运行时，请先参考 [配置集群边缘运行时](../edge-nodes/cluster-runtime-setup)。

---

## 第一步：进入添加节点对话框

平台提供三种入口，任选其一：

| 入口 | 操作路径 | 适用场景 |
|------|---------|---------|
| **集群入口** | 目标集群 → 节点 → 边缘节点 → **+ 添加节点** | 按集群维度管理所有边缘节点 |
| **节点组入口** | 目标集群 → 节点组 → 选择节点组 → 节点管理 → **+ 加入节点** | 节点上线后自动归入指定节点组 |
| **租户空间入口** | 租户空间 → 边缘资源 → 节点资源 → **+ 加入节点** | 在租户视角下管理本租户边缘节点 |

三种入口的对话框和后续步骤完全相同。

---

## 第二步：填写节点信息

在弹出的「加入节点」对话框中完成配置：

| 字段 | 说明 |
|------|------|
| **容器运行时** | 选择 `Containerd`（推荐，K8s v1.24+）或 `Docker` |
| **名称** | 节点名称：小写字母、数字、连字符（`-`），最长 63 个字符 |
| **自动安装容器运行时** | 勾选后脚本将自动安装所选运行时，无需预先安装 |

填写完成后点击「**验证**」，系统校验节点名称未被占用，并自动生成「**边缘节点配置命令**」。

---

## 第三步：在边缘节点执行命令

点击命令区域右上角的复制图标，将完整命令复制到剪贴板。

登录边缘节点，以 **root** 身份粘贴并执行命令：

```bash
# 示例（实际命令由平台生成，包含加密 Token 和集群地址）
echo '<base64编码的安装脚本>' | base64 -d | bash
```

脚本将自动依次执行以下操作：

1. **配置 `/etc/hosts`** — 写入平台域名解析（`bin-downloader.rise.io`、`host.rise.io` 等），所有后续下载走内网
2. **安装容器运行时** — 从内网 bin-downloader 下载 Containerd / Docker 及依赖（runc、CNI、crictl 等）
3. **安装 kubelet** — 下载与目标集群 K8s 版本完全一致的 kubelet（OpenYurt）
4. **安装 KubeEdge 环境** — 下载 keadm（KubeEdge）
5. **执行 join** — `yurtadm join`（OpenYurt）或 `keadm join`（KubeEdge），节点注册到集群

出现以下输出表示安装成功：

```
# OpenYurt
[edge] This node has joined the cluster: ...

# KubeEdge
Install Complete!
```

---

## 第四步：验证节点上线

返回平台节点列表页刷新，节点状态变为「**运行中**」即表示接入成功。

节点上线后，可在节点上执行 `crictl ps` 查看运行中的容器：

**OpenYurt** 会自动运行以下系统容器：

| 容器 | 说明 |
|------|------|
| `yurt-hub` | 边缘自治核心，断网后缓存数据保障节点自治 |
| `kube-proxy` | 服务代理 |
| `coredns` | 边缘 DNS |
| `calico-node` | 网络插件 |
| `prometheus` / `node-exporter` | 监控采集 |

**KubeEdge** 设计更轻量，节点加入后仅运行业务容器，`edgecore` 以系统服务形式运行，不占用容器位。

---

## 常见问题

**节点长时间未上线？**

检查节点到平台网关的网络联通性：
```bash
# 检查 bin-downloader 是否可访问（30080 为 Traefik web EntryPoint）
curl -I http://<平台网关IP>:30080

# 检查 API Server 端口是否可达
# OpenYurt vCluster：30443（websecure）→ 6443
# KubeEdge CloudCore：30002（cc-https）、30003（cc-stream）
```

确认 `/etc/hosts` 中域名解析是否正确：
```bash
grep "rise.io" /etc/hosts
```

查看 agent 日志：
```bash
journalctl -u yurthub -f     # OpenYurt
journalctl -u edgecore -f    # KubeEdge
```

**节点加入失败，提示版本不兼容？**

OpenYurt 要求边缘节点 kubelet 版本与目标集群 K8s API Server 版本**完全一致**：
- vCluster 子集群（K8s v1.24.17）→ kubelet 必须是 **v1.24.17**
- 托管 K8s 集群（K8s v1.30.12）→ kubelet 必须是 **v1.30.12**

平台生成的安装命令中已自动注入正确的 `K8S_VERSION`，若仍失败，在平台上重新点击「验证」生成新命令后再执行。

**容器运行时安装失败？**

若自动安装失败，可手动安装后再执行 join 命令，或排查 bin-downloader 是否正常运行：
```bash
kubectl get pod -n edge-system | grep bin-downloader
```

---

## 下一步

- [节点组管理](../clusters/node-groups) — 将节点归入节点组，按地域批量管理
- [配置集群边缘运行时](../edge-nodes/cluster-runtime-setup) — 了解 OpenYurt / KubeEdge 两种运行时的配置方式
- [添加边缘节点（完整文档）](../edge-nodes/add-edge-node) — 包含三种入口的完整截图操作说明
- [KubeEdge 参考](../appendix/kubeedge) — KubeEdge 架构与版本说明
- [OpenYurt 参考](../appendix/openyurt) — OpenYurt 架构与版本说明
