# OTA 快速开始指南

## 简介

本指南将帮助您快速上手边缘智能管理平台的 OTA 模块，在 10 分钟内完成边缘节点的注册和第一个任务的执行。

## 前置条件

- ✅ 已安装边缘智能管理平台
- ✅ 具有管理员权限
- ✅ 边缘节点可通过 SSH 访问
- ✅ 边缘节点已安装 Edge Agent

## 快速开始步骤

### 第一步：注册边缘节点（3 分钟）

#### 1.1 导航到节点接入

1. 登录边缘智能管理平台
2. 点击左侧导航菜单中的"OTA"
3. 选择"节点接入"

![节点接入界面](./images/ota-node-access-main.png)

#### 1.2 添加单个节点

1. 点击"添加节点"按钮
2. 选择"单个注册"标签
3. 填写节点信息：

```yaml
节点名称: edge-node-01
节点 IP: 192.168.1.100
SSH 端口: 22
用户名: root
密码: your_password
文件服务器地址: docker.io
```

4. 点击"确定"完成注册

![单个节点注册](./images/ota-add-node-single.png)

#### 1.3 验证节点状态

1. 在节点列表中找到新注册的节点
2. 确认状态显示为"在线"
3. 查看节点的基本信息

### 第二步：查看节点详情（2 分钟）

#### 2.1 进入节点详情

1. 点击节点名称"edge-node-01"
2. 查看节点的详细属性信息

![节点详情页面](./images/ota-node-details.png)

#### 2.2 测试命令执行

1. 点击"执行命令"标签
2. 点击"查看系统信息"快捷按钮
3. 按 `Ctrl+Enter` 执行命令
4. 查看命令执行结果

![命令执行界面](./images/ota-node-exec-command.png)

### 第三步：创建批量任务（3 分钟）

#### 3.1 导航到任务管理

1. 点击左侧导航菜单中的"任务管理"
2. 查看任务列表界面

![任务管理界面](./images/ota-task-management-main.png)

#### 3.2 创建执行命令任务

1. 点击"创建任务"按钮
2. 填写任务信息：

```yaml
任务名称: check-disk-usage
任务类型: 执行命令
目标设备: 选择 edge-node-01
命令: df -h
超时时间: 30 秒
```

3. 点击"创建任务"提交

![创建任务对话框](./images/ota-create-task-dialog.png)

#### 3.3 监控任务执行

1. 在任务列表中找到新创建的任务
2. 观察任务状态变化（等待中 → 运行中 → 已完成）
3. 点击任务名称查看执行详情

### 第四步：查看任务结果（2 分钟）

#### 4.1 查看任务概览

1. 在任务详情页面查看执行进度
2. 确认任务状态为"已完成"
3. 查看执行结果汇总

![任务详情页面](./images/ota-task-details.png)

#### 4.2 查看设备详情

1. 点击"任务详情"标签
2. 查看每个目标节点的执行情况
3. 确认任务在所有节点上都成功执行

![任务设备详情](./images/ota-task-device-details.png)

## 常用任务示例

### 系统信息收集

```bash
# 任务配置
任务名称: collect-system-info
任务类型: 执行命令
命令: uname -a && df -h && free -h
```

### 配置文件备份

```bash
# 任务配置
任务名称: backup-nginx-config
任务类型: 读取文件
文件路径: /etc/nginx/nginx.conf
最大文件大小: 1MB
```

### 批量文件分发

```bash
# 任务配置
任务名称: deploy-app-config
任务类型: 写入文件
文件路径: /etc/myapp/config.ini
文件内容:
[database]
host = localhost
port = 3306

[logging]
level = INFO
file权限: 0644
```

### 软件安装

```bash
# 任务配置
任务名称: install-docker
任务类型: 执行命令
命令: curl -fsSL https://get.docker.com | sh
超时时间: 300 秒
```

## 最佳实践建议

### 1. 节点命名规范

```bash
# 好的命名示例
edge-beijing-web-01
edge-shanghai-db-01
edge-guangzhou-cache-01

# 避免使用
node1
test
temp
```

### 2. 任务命名规范

```bash
# 好的命名示例
update-nginx-config-v1.2
backup-database-daily
install-docker-24.0.7

# 避免使用
task1
test-job
temp-task
```

### 3. 测试流程

```bash
# 建议的测试流程
1. 在单个节点上测试任务
2. 在少量节点上验证
3. 逐步扩大到生产环境
4. 监控执行结果
```

## 故障排除

### 问题 1：节点显示离线

**症状**：节点注册后状态显示"离线"

**解决方案**：
1. 检查节点网络连接
2. 验证 SSH 连接参数
3. 确认 Edge Agent 运行状态
4. 检查防火墙设置

### 问题 2：命令执行失败

**症状**：任务创建后执行失败

**解决方案**：
1. 验证命令语法正确性
2. 检查用户权限
3. 增加超时时间
4. 查看详细错误信息

### 问题 3：任务卡住不动

**症状**：任务状态一直显示"运行中"

**解决方案**：
1. 检查目标节点状态
2. 验证网络连接
3. 增加超时时间
4. 取消任务后重新执行

## 下一步

恭喜您已完成 OTA 快速入门！接下来可以：

1. 📖 **深入学习**：阅读详细的[节点接入管理指南](./node-access.md)和[任务管理指南](./task-management.md)

2. 🔧 **高级功能**：探索批量操作、Playbook、任务调度等高级功能

3. 🎯 **实战应用**：在实际场景中应用 OTA 功能，如批量更新、配置管理等

4. 🚀 **性能优化**：学习如何优化任务执行效率和管理大规模节点

5. 📊 **监控运维**：建立完善的监控和运维流程

## 获取帮助

如有任何问题，请：

- 📚 查看[故障排除指南](./troubleshooting.md)
- 💬 联系技术支持团队
- 🐛 提交 Issue 和反馈
- 📖 阅读完整的[OTA 模块概述](./overview.md)

## 常用命令速查

### 系统信息

```bash
# 查看系统信息
uname -a

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看CPU信息
cat /proc/cpuinfo

# 查看运行时间
uptime
```

### 网络诊断

```bash
# 查看网络连接
netstat -tuln

# 测试网络连通性
ping -c 4 google.com

# 查看路由表
route -n

# 查看网络接口
ifconfig -a
```

### 服务管理

```bash
# 查看服务状态
systemctl status docker

# 启动服务
systemctl start docker

# 停止服务
systemctl stop docker

# 重启服务
systemctl restart docker

# 查看所有服务
systemctl list-units --type=service
```

### 进程管理

```bash
# 查看进程列表
ps aux

# 查看特定进程
ps aux | grep nginx

# 终止进程
kill -9 <PID>

# 查看系统资源
top
```

祝您使用愉快！🎉