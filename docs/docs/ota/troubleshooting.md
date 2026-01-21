# OTA 故障排除指南

## 概述

本指南提供 OTA 模块常见问题的诊断和解决方案，帮助管理员快速定位和解决问题，确保 OTA 系统稳定运行。

## 目录结构

- [节点接入问题](#节点接入问题)
- [任务执行问题](#任务执行问题)
- [网络连接问题](#网络连接问题)
- [性能问题](#性能问题)
- [安全问题](#安全问题)
- [数据一致性问题](#数据一致性问题)

## 节点接入问题

### 问题 1：节点注册失败

#### 症状
- 点击"确定"后提示注册失败
- 节点列表中没有显示新节点
- 错误提示连接超时或认证失败

#### 可能原因
1. 网络连接问题
2. SSH 认证信息错误
3. SSH 服务未运行
4. 防火墙阻止连接
5. 节点资源不足

#### 诊断步骤

```bash
# 1. 测试网络连通性
ping <节点IP>

# 2. 测试 SSH 连接
ssh -p <端口> <用户名>@<节点IP>

# 3. 检查 SSH 服务状态
systemctl status sshd

# 4. 检查防火墙规则
iptables -L -n
firewall-cmd --list-all

# 5. 检查磁盘空间
df -h
```

#### 解决方案

**方案 1：修复网络连接**
```bash
# 检查网络配置
ip addr show
ip route show

# 重启网络服务
systemctl restart network

# 检查 DNS 配置
cat /etc/resolv.conf
```

**方案 2：验证 SSH 配置**
```bash
# 确认 SSH 服务运行
systemctl start sshd
systemctl enable sshd

# 检查 SSH 配置
vi /etc/ssh/sshd_config

# 重启 SSH 服务
systemctl restart sshd
```

**方案 3：调整防火墙规则**
```bash
# 开放 SSH 端口
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --reload

# 或者使用 iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
service iptables save
```

### 问题 2：节点频繁掉线

#### 症状
- 节点状态在"在线"和"离线"之间频繁切换
- 心跳时间间隔不稳定
- 节点最后心跳时间异常

#### 可能原因
1. 网络不稳定
2. Edge Agent 异常
3. 节点负载过高
4. 心跳超时设置不合理

#### 诊断步骤

```bash
# 1. 检查网络稳定性
ping -i 1 <节点IP> -c 100

# 2. 检查 Edge Agent 状态
systemctl status edge-agent

# 3. 查看系统负载
top
htop

# 4. 检查内存使用
free -h

# 5. 查看 Edge Agent 日志
journalctl -u edge-agent -f
```

#### 解决方案

**方案 1：优化网络连接**
```bash
# 配置网络 QoS
tc qdisc add dev eth0 root tbf rate 1gbit burst 32kbit latency 400ms

# 优化 TCP 参数
echo "net.ipv4.tcp_keepalive_time = 600" >> /etc/sysctl.conf
sysctl -p
```

**方案 2：重启 Edge Agent**
```bash
# 重启 Edge Agent
systemctl restart edge-agent

# 查看 Agent 日志
journalctl -u edge-agent -n 100
```

**方案 3：调整心跳超时**
```bash
# 修改 Edge Agent 配置
vi /etc/edge-agent/config.yaml

# 增加心跳间隔
heartbeat_interval: 60s
heartbeat_timeout: 180s

# 重启 Agent
systemctl restart edge-agent
```

### 问题 3：节点信息显示不完整

#### 症状
- 节点属性显示 "--" 或空值
- 系统信息无法获取
- Agent 版本显示异常

#### 可能原因
1. Edge Agent 版本过旧
2. 权限不足
3. 系统命令不可用
4. 信息收集失败

#### 解决方案

```bash
# 1. 更新 Edge Agent
curl -fsSL https://get.edge-agent.com | sh

# 2. 检查 Agent 权限
chmod +x /usr/local/bin/edge-agent

# 3. 手动测试信息收集
uname -a
cat /etc/os-release
df -h

# 4. 查看 Agent 配置
cat /etc/edge-agent/config.yaml
```

## 任务执行问题

### 问题 1：任务执行超时

#### 症状
- 任务状态一直显示"运行中"
- 达到超时时间后标记为失败
- 部分节点成功，部分节点超时

#### 可能原因
1. 命令执行时间过长
2. 网络延迟过高
3. 节点负载过高
4. 超时设置不合理

#### 诊断步骤

```bash
# 1. 检查节点负载
ssh <节点IP> "top -b -n 1"

# 2. 测试网络延迟
ping -c 10 <节点IP>

# 3. 手动执行命令测试时间
time <命令>

# 4. 查看系统资源
ssh <节点IP> "free -h && df -h"
```

#### 解决方案

**方案 1：增加超时时间**
```yaml
# 创建任务时设置更长的超时时间
超时时间: 300  # 5 分钟
```

**方案 2：优化命令执行**
```bash
# 优化前
find / -name "*.log" -exec grep "error" {} \;

# 优化后
find /var/log -name "*.log" -type f | xargs grep "error"
```

**方案 3：分批执行**
```bash
# 将大批量任务分成小批次
# 每批处理 10 个节点
```

### 问题 2：任务执行失败

#### 症状
- 任务状态显示"失败"
- 执行结果显示错误信息
- 部分节点成功，部分节点失败

#### 可能原因
1. 命令语法错误
2. 权限不足
3. 依赖文件不存在
4. 资源不足

#### 诊断步骤

```bash
# 1. 查看详细错误信息
# 在任务详情页面查看具体错误

# 2. 手动在节点上测试
ssh <节点IP> "<命令>"

# 3. 检查文件权限
ls -la <文件路径>

# 4. 查看系统日志
journalctl -n 100
```

#### 解决方案

**方案 1：修复命令语法**
```bash
# 检查命令语法
bash -n <脚本文件>

# 使用 shellcheck 检查
shellcheck <脚本文件>
```

**方案 2：提升权限**
```bash
# 使用 sudo 执行
sudo <命令>

# 或者配置免密 sudo
visudo
# 添加：username ALL=(ALL) NOPASSWD: ALL
```

**方案 3：检查依赖**
```bash
# 检查命令是否存在
which <命令>

# 安装缺失的依赖
apt-get install -y <依赖包>
```

### 问题 3：批量任务部分失败

#### 症状
- 同一个任务在不同节点上结果不一致
- 部分节点成功，部分节点失败
- 失败节点集中在某个网络区域

#### 可能原因
1. 网络环境差异
2. 节点配置不同
3. 软件版本不一致
4. 资源分配不均

#### 解决方案

**方案 1：分组执行**
```bash
# 按网络区域分组
# 第一组：北京节点
# 第二组：上海节点
# 第三组：广州节点
```

**方案 2：环境检查**
```bash
# 预检查脚本
for node in $nodes; do
  ssh $node "uname -a && df -h"
done
```

**方案 3：容错处理**
```bash
# 在命令中添加错误处理
set +e  # 遇到错误继续执行
command1 || true
command2 || echo "Command2 failed"
```

## 网络连接问题

### 问题 1：SSH 连接超时

#### 症状
- 注册节点时连接超时
- 任务执行时无法连接到节点
- 间歇性连接失败

#### 解决方案

```bash
# 1. 检查网络连通性
ping -c 4 <节点IP>
traceroute <节点IP>

# 2. 测试 SSH 端口
telnet <节点IP> 22
nc -zv <节点IP> 22

# 3. 检查 SSH 配置
vi /etc/ssh/sshd_config

# 优化配置
MaxStartups 100:30:200
LoginGraceTime 60
ClientAliveInterval 60
ClientAliveCountMax 3

# 4. 重启 SSH 服务
systemctl restart sshd
```

### 问题 2：网络带宽不足

#### 症状
- 文件传输速度慢
- 大文件操作超时
- 并发任务时网络拥堵

#### 解决方案

```bash
# 1. 测试网络带宽
iperf3 -s  # 服务器端
iperf3 -c <服务器IP>  # 客户端

# 2. 限制并发数
# 在任务配置中限制同时执行的节点数

# 3. 使用压缩传输
# 在命令中使用压缩
tar czf - /path/to/dir | ssh user@host "tar xzf -"

# 4. 调整 TCP 参数
echo "net.core.rmem_max = 134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max = 134217728" >> /etc/sysctl.conf
sysctl -p
```

## 性能问题

### 问题 1：系统响应缓慢

#### 症状
- 页面加载时间长
- 操作响应延迟
- 大量节点时性能下降

#### 解决方案

```bash
# 1. 检查系统资源
top
htop
iostat -x 1

# 2. 优化数据库
# 添加索引
# 清理历史数据
# 调整缓存大小

# 3. 调整并发参数
vi /etc/ota/config.yaml

max_concurrent_tasks: 50
task_queue_size: 1000
```

### 问题 2：内存使用过高

#### 症状
- 服务内存占用持续增长
- 出现 OOM（内存溢出）
- 系统变慢或崩溃

#### 解决方案

```bash
# 1. 监控内存使用
free -h
ps aux --sort=-%mem | head -20

# 2. 清理缓存
sync; echo 3 > /proc/sys/vm/drop_caches

# 3. 优化 Java 应用（如果使用）
# 调整 JVM 参数
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC"

# 4. 定期重启服务
# 配置定时任务定期重启服务
```

### 问题 3：磁盘空间不足

#### 症状
- 磁盘使用率持续增长
- 日志文件过大
- 无法写入新数据

#### 解决方案

```bash
# 1. 检查磁盘使用
df -h
du -sh /var/log/*

# 2. 清理日志文件
# 配置日志轮转
vi /etc/logrotate.d/ota

# 3. 清理历史任务数据
# 删除 30 天前的任务记录
kubectl delete tasks --field-selector=metadata.creationTimestamp<$(date -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)

# 4. 清理临时文件
find /tmp -type f -mtime +7 -delete
```

## 安全问题

### 问题 1：SSH 认证失败

#### 症状
- 无法连接到节点
- 密码认证失败
- 密钥认证失败

#### 解决方案

```bash
# 1. 验证密码
ssh <用户名>@<节点IP>

# 2. 配置 SSH 密钥
ssh-keygen -t rsa -b 4096
ssh-copy-id <用户名>@<节点IP>

# 3. 检查 SSH 配置
vi /etc/ssh/sshd_config

# 允许密钥认证
PubkeyAuthentication yes
# 禁用密码认证（可选）
PasswordAuthentication no

# 4. 重启 SSH 服务
systemctl restart sshd
```

### 问题 2：权限不足

#### 症状
- 命令执行被拒绝
- 文件无法读写
- 操作提示权限不足

#### 解决方案

```bash
# 1. 检查当前用户
whoami
id

# 2. 使用 sudo
sudo <命令>

# 3. 配置 sudo 免密
visudo
# 添加：username ALL=(ALL) NOPASSWD: ALL

# 4. 修改文件权限
chmod 644 <文件>
chown <用户>:<组> <文件>
```

## 数据一致性问题

### 问题 1：任务状态不同步

#### 症状
- 任务状态与实际执行情况不符
- 节点状态显示延迟
- 数据库记录与实际不一致

#### 解决方案

```bash
# 1. 检查数据库连接
# 查看数据库日志
# 验证数据库连接池

# 2. 清理缓存
# 清理 Redis 缓存
redis-cli FLUSHDB

# 3. 重新同步状态
# 触发状态同步任务

# 4. 检查消息队列
# 查看消息队列状态
# 清理积压消息
```

### 问题 2：文件内容不一致

#### 症状
- 写入的文件内容与预期不符
- 文件编码问题
- 文件权限错误

#### 解决方案

```bash
# 1. 验证文件内容
cat <文件>
md5sum <文件>

# 2. 检查文件编码
file -i <文件>
iconv -f GBK -t UTF-8 <输入文件> -o <输出文件>

# 3. 修复文件权限
chmod 644 <文件>
chown <用户>:<组> <文件>

# 4. 验证文件写入
# 在写入后立即读取验证
```

## 监控和告警

### 推荐的监控指标

```yaml
# 系统指标
cpu_usage: < 80%
memory_usage: < 80%
disk_usage: < 80%
network_latency: < 100ms

# OTA 指标
node_online_rate: > 95%
task_success_rate: > 98%
task_execution_time: < 预期时间
heartbeat_timeout: < 3 次/小时

# 业务指标
daily_task_count: 监控趋势
failure_task_count: < 5%
error_rate: < 1%
```

### 告警配置

```yaml
# 告警规则
alerts:
  - name: 节点离线告警
    condition: node_status == "offline"
    duration: 5m

  - name: 任务失败告警
    condition: task_status == "failed"
    duration: 1m

  - name: 系统资源告警
    condition: cpu_usage > 90% || memory_usage > 90%
    duration: 10m
```

## 日志分析

### 关键日志位置

```bash
# OTA 服务日志
/var/log/ota/service.log
journalctl -u ota-service -f

# Edge Agent 日志
/var/log/edge-agent/agent.log
journalctl -u edge-agent -f

# 任务执行日志
/var/log/ota/tasks/<task_id>.log

# 错误日志
/var/log/ota/error.log
```

### 日志分析技巧

```bash
# 1. 查看最近的错误
grep -i error /var/log/ota/*.log | tail -20

# 2. 统计错误类型
grep -i error /var/log/ota/*.log | awk '{print $5}' | sort | uniq -c

# 3. 查看特定时间段的日志
grep "2024-01-01 10:" /var/log/ota/service.log

# 4. 实时监控日志
tail -f /var/log/ota/service.log | grep --color=auto "error\|warning"
```

## 获取帮助

### 技术支持

- 📧 邮件支持：support@edge-platform.com
- 💬 在线支持：工作日 9:00-18:00
- 🐛 问题反馈：GitHub Issues
- 📖 文档中心：https://docs.edge-platform.com

### 报告问题时请提供

1. **问题描述**：详细描述问题现象
2. **环境信息**：
   - 系统版本
   - 节点数量
   - 网络环境
3. **复现步骤**：问题的复现过程
4. **日志信息**：相关的错误日志
5. **截图信息**：问题截图或录屏

### 常用诊断命令

```bash
# 系统信息收集
curl -sSL https://diagnose.edge-platform.com/ota | bash

# 生成诊断报告
ota-diagnostic --output diagnostics.tar.gz

# 健康检查
ota-health-check
```

---

希望本故障排除指南能帮助您快速解决问题。如果问题仍未解决，请联系技术支持团队。