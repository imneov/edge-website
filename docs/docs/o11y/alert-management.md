# 告警管理

## 概述

告警管理系统是边缘计算平台可观测性的核心组件，通过智能化的告警规则、多渠道通知和完善的告警处理流程，确保运维团队能够及时发现、响应和处理系统异常，保障业务连续性和服务质量。

![告警管理界面](images/monitoring-alerts-view.png)

## 告警架构

### 告警系统组件

#### AlertManager
- **功能**：告警聚合、分组和路由
- **去重**：合并重复的告警
- **静默**：配置告警静默时间窗口
- **路由**：根据标签分发告警

#### Prometheus Alerting
- **规则引擎**：基于PromQL的告警规则
- **评估周期**：默认15秒评估一次
- **状态管理**：Pending → Firing状态转换
- **数据源**：Prometheus时序数据库

#### Notification Controller
- **通知集成**：邮件、短信、Webhook
- **模板引擎**：自定义告警通知模板
- **重试机制**：通知失败自动重试
- **限流控制**：防止通知风暴

## 告警类型

### 1. 资源告警

#### CPU告警

**高CPU使用率告警**：
```yaml
name: HighCPUUsage
severity: Warning
expression: |
  sum(rate(container_cpu_usage_seconds_total{namespace!="", pod!=""}[5m])) by (cluster)
  /
  sum(kube_node_status_capacity{resource="cpu"}) by (cluster)
  > 0.8
for: 5m
labels:
  category: resource
  resource: cpu
annotations:
  summary: "集群CPU使用率过高"
  description: "集群 {{ $labels.cluster }} CPU使用率为 {{ $value }}%，超过80%阈值"
```

**CPU持续过载告警**：
```yaml
name: CPUCriticalOverload
severity: Critical
expression: |
  sum(rate(container_cpu_usage_seconds_total{namespace!="", pod!=""}[5m])) by (cluster)
  /
  sum(kube_node_status_capacity{resource="cpu"}) by (cluster)
  > 0.9
for: 10m
labels:
  category: resource
  resource: cpu
annotations:
  summary: "集群CPU严重过载"
  description: "集群 {{ $labels.cluster }} CPU使用率为 {{ $value }}%，持续10分钟超过90%"
```

#### 内存告警

**高内存使用率告警**：
```yaml
name: HighMemoryUsage
severity: Warning
expression: |
  sum(container_memory_working_set_bytes{namespace!="", pod!=""}) by (cluster)
  /
  sum(kube_node_status_capacity{resource="memory"}) by (cluster)
  > 0.8
for: 5m
labels:
  category: resource
  resource: memory
annotations:
  summary: "集群内存使用率过高"
  description: "集群 {{ $labels.cluster }} 内存使用率为 {{ $value }}%，超过80%阈值"
```

**内存不足告警**：
```yaml
name: MemoryCriticalShortage
severity: Critical
expression: |
  sum(container_memory_working_set_bytes{namespace!="", pod!=""}) by (cluster)
  /
  sum(kube_node_status_capacity{resource="memory"}) by (cluster)
  > 0.9
for: 10m
labels:
  category: resource
  resource: memory
annotations:
  summary: "集群内存严重不足"
  description: "集群 {{ $labels.cluster }} 内存使用率为 {{ $value }}%，存在OOM风险"
```

#### 磁盘告警

**磁盘空间不足告警**：
```yaml
name: DiskSpaceLow
severity: Warning
expression: |
  avg(node_filesystem_size_bytes{fstype!="tmpfs"} - node_filesystem_avail_bytes{fstype!="tmpfs"})
  /
  node_filesystem_size_bytes{fstype!="tmpfs"}
  > 0.8
for: 10m
labels:
  category: resource
  resource: disk
annotations:
  summary: "磁盘空间不足"
  description: "节点 {{ $labels.instance }} 磁盘 {{ $labels.mountpoint }} 使用率为 {{ $value }}%"
```

**磁盘严重不足告警**：
```yaml
name: DiskSpaceCritical
severity: Critical
expression: |
  avg(node_filesystem_size_bytes{fstype!="tmpfs"} - node_filesystem_avail_bytes{fstype!="tmpfs"})
  /
  node_filesystem_size_bytes{fstype!="tmpfs"}
  > 0.9
for: 5m
labels:
  category: resource
  resource: disk
annotations:
  summary: "磁盘空间严重不足"
  description: "节点 {{ $labels.instance }} 磁盘 {{ $labels.mountpoint }} 使用率为 {{ $value }}%，仅剩10%"
```

### 2. 应用告警

#### Pod状态告警

**Pod重启频繁告警**：
```yaml
name: PodRestartingTooFrequently
severity: Warning
expression: |
  increase(kube_pod_container_status_restarts_total[1h]) > 5
labels:
  category: application
  resource: pod
annotations:
  summary: "Pod重启频繁"
  description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 在1小时内重启了 {{ $value }} 次"
```

**Pod无法启动告警**：
```yaml
name: PodNotReady
severity: Critical
expression: |
  kube_pod_status_phase{phase!="Running"} == 1
for: 10m
labels:
  category: application
  resource: pod
annotations:
  summary: "Pod无法就绪"
  description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 状态为 {{ $labels.phase }}，持续10分钟未就绪"
```

#### 服务可用性告警

**服务不可用告警**：
```yaml
name: ServiceDown
severity: Critical
expression: |
  up{job="kubernetes-pods"} == 0
for: 2m
labels:
  category: application
  resource: service
annotations:
  summary: "服务不可用"
  description: "服务 {{ $labels.job }} 实例 {{ $labels.instance }} 已经无法访问2分钟"
```

**高错误率告警**：
```yaml
name: HighErrorRate
severity: Warning
expression: |
  sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
  /
  sum(rate(http_requests_total[5m])) by (service)
  > 0.05
for: 5m
labels:
  category: application
  resource: service
annotations:
  summary: "服务错误率过高"
  description: "服务 {{ $labels.service }} 错误率为 {{ $value }}%，超过5%阈值"
```

### 3. 网络告警

#### 网络性能告警

**高网络延迟告警**：
```yaml
name: HighNetworkLatency
severity: Warning
expression: |
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 5m
labels:
  category: network
  resource: latency
annotations:
  summary: "网络延迟过高"
  description: "服务 {{ $labels.service }} P95延迟为 {{ $value }}s，超过1秒阈值"
```

**网络连接数告警**：
```yaml
name: HighNetworkConnections
severity: Warning
expression: |
  node_netstat_Tcp_CurrEstab > 50000
for: 5m
labels:
  category: network
  resource: connections
annotations:
  summary: "网络连接数过高"
  description: "节点 {{ $labels.instance }} TCP连接数为 {{ $value }}，超过50000"
```

### 4. 业务告警

#### 自定义业务指标

**订单处理延迟告警**：
```yaml
name: OrderProcessingDelay
severity: Warning
expression: |
  histogram_quantile(0.95, rate(order_processing_duration_seconds_bucket[10m])) > 30
for: 5m
labels:
  category: business
  domain: orders
annotations:
  summary: "订单处理延迟过高"
  description: "订单处理P95延迟为 {{ $value }}s，超过30秒阈值"
```

**支付失败率告警**：
```yaml
name: HighPaymentFailureRate
severity: Critical
expression: |
  sum(rate(payment_requests_total{status="failed"}[5m]))
  /
  sum(rate(payment_requests_total[5m]))
  > 0.01
for: 3m
labels:
  category: business
  domain: payment
annotations:
  summary: "支付失败率过高"
  description: "支付失败率为 {{ $value }}%，超过1%阈值"
```

## 告警级别

### Critical（严重）

**定义**：严重影响业务连续性，需要立即处理

**响应时间**：
- 15分钟内响应
- 1小时内开始处理
- 4小时内解决或提供临时方案

**适用场景**：
- 服务完全不可用
- 数据丢失风险
- 安全漏洞被利用
- 核心业务功能中断

**通知方式**：
- 电话 + 短信 + 邮件
- 实时推送所有值班人员
- 自动升级到管理层

**处理流程**：
1. 立即确认告警
2. 评估影响范围
3. 启动应急响应
4. 实施修复方案
5. 验证问题解决
6. 编写事故报告

### Warning（警告）

**定义**：影响服务质量或性能，需要及时处理

**响应时间**：
- 1小时内响应
- 当天内完成处理
- 第二天进行复盘

**适用场景**：
- 服务性能下降
- 资源使用率过高
- 功能部分异常
- 潜在风险因素

**通知方式**：
- 短信 + 邮件
- 推送相关团队负责人
- 记录告警详情

**处理流程**：
1. 确认告警详情
2. 分析影响程度
3. 制定处理计划
4. 按计划执行修复
5. 监控修复效果
6. 更新文档记录

### Info（信息）

**定义**：提供参考信息，建议计划处理

**响应时间**：
- 1个工作日内响应
- 1周内完成处理
- 下一次迭代优化

**适用场景**：
- 资源使用趋势变化
- 配置更新建议
- 性能优化机会
- 系统状态变更

**通知方式**：
- 仅邮件通知
- 汇总到日报/周报
- 定期回顾处理

**处理流程**：
1. 收集告警信息
2. 分析根本原因
3. 制定优化计划
4. 在合适的时机处理
5. 评估优化效果

## 告警配置

### 创建告警规则

#### 1. 通过界面创建

**步骤**：
1. 访问：`集群管理` → 选择集群 → `监控告警` → `告警` 标签
2. 点击右上角"创建告警规则"按钮
3. 填写告警规则配置：
   - 告警名称：唯一标识告警规则
   - 告警级别：Critical / Warning / Info
   - 监控指标：选择要监控的指标
   - 触发条件：设置阈值和持续时间
   - 告警描述：详细说明告警内容
4. 配置通知方式：
   - 选择通知渠道
   - 配置接收人员
   - 设置通知时间
5. 测试告警规则：
   - 验证表达式正确性
   - 检查告警触发条件
   - 测试通知渠道
6. 保存并启用告警规则

#### 2. 通过YAML创建

**规则文件示例**：
```yaml
groups:
  - name: cluster_alerts
    interval: 15s
    rules:
      - alert: HighCPUUsage
        expr: |
          sum(rate(container_cpu_usage_seconds_total{namespace!="", pod!=""}[5m])) by (cluster)
          /
          sum(kube_node_status_capacity{resource="cpu"}) by (cluster)
          > 0.8
        for: 5m
        labels:
          severity: "warning"
          category: "resource"
        annotations:
          summary: "集群CPU使用率过高"
          description: "集群 {{ $labels.cluster }} CPU使用率为 {{ $value }}%"
```

**部署规则**：
```bash
# 应用告警规则
kubectl apply -f alert-rules.yaml

# 重新加载配置
curl -X POST http://alertmanager:9093/-/reload
```

### 高级配置

#### 告警聚合

**按标签聚合**：
```yaml
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
```

**聚合策略**：
- **group_by**：按标签分组告警
- **group_wait**：等待同组告警聚合
- **group_interval**：同组告警发送间隔
- **repeat_interval**：重复告警发送间隔

#### 告警抑制

**依赖关系抑制**：
```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['cluster', 'service']
```

**抑制规则**：
- **source_match**：匹配源头告警
- **target_match**：匹配被抑制的告警
- **equal**：相同标签的告警才抑制

#### 告警路由

**基于标签路由**：
```yaml
routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'
  - match:
      team: frontend
    receiver: 'frontend-team'
```

**路由策略**：
- 按严重级别路由
- 按团队职责路由
- 按业务域路由

## 通知集成

### 邮件通知

#### 配置SMTP

```yaml
receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'ops@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager@example.com'
        auth_password: 'password'
        headers:
          Subject: '[告警] {{ .GroupLabels.alertname }}'
```

#### 邮件模板

**HTML模板**：
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .alert-critical { color: red; }
        .alert-warning { color: orange; }
        .alert-info { color: blue; }
    </style>
</head>
<body>
    <h2>{{ .GroupLabels.alertname }}</h2>
    <p>集群: {{ .GroupLabels.cluster }}</p>
    <p>级别: <span class="alert-{{ .GroupLabels.severity }}">{{ .GroupLabels.severity }}</span></p>
    <ul>
    {{ range .Alerts }}
        <li>{{ .Annotations.description }}</li>
    {{ end }}
    </ul>
</body>
</html>
```

### 短信通知

#### 集成短信网关

```yaml
receivers:
  - name: 'sms-alerts'
    webhook_configs:
      - url: 'http://sms-gateway/api/send'
        send_resolved: true
        http_config:
          bearer_token: 'your-sms-token'
```

#### 短信内容

**格式要求**：
- 控制在70字符以内
- 包含关键信息：告警名称、级别、集群
- 包含处理链接或联系方式

**示例**：
```
【告警】集群CPU使用率过高
级别：Warning
集群：production-host
CPU使用率：85%
时间：2026-01-08 10:30
```

### 企业微信通知

#### 配置Webhook

```yaml
receivers:
  - name: 'wechat-alerts'
    webhook_configs:
      - url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY'
        send_resolved: true
```

#### 消息格式

```json
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## 告警通知\n> **告警名称**: {{ .GroupLabels.alertname }}\n> **告警级别**: {{ .GroupLabels.severity }}\n> **集群**: {{ .GroupLabels.cluster }}\n> **时间**: {{ .StartsAt }}\n---\n{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}"
  }
}
```

### 钉钉通知

#### 配置机器人

```yaml
receivers:
  - name: 'dingtalk-alerts'
    webhook_configs:
      - url: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN'
        send_resolved: true
```

#### 消息卡片

```json
{
  "msgtype": "link",
  "link": {
    "text": "{{ .GroupLabels.alertname }}",
    "title": "告警通知",
    "picUrl": "",
    "messageUrl": "https://monitoring.example.com/alerts"
  }
}
```

## 告警处理

### 告警生命周期

#### 1. Pending（待触发）
- 条件：告警规则表达式为真
- 持续时间：未达到"for"条件要求
- 状态：不发送通知，仅记录

#### 2. Firing（触发中）
- 条件：持续满足告警条件
- 持续时间：达到"for"条件要求
- 状态：发送告警通知

#### 3. Resolved（已解决）
- 条件：告警条件不再满足
- 持续时间：恢复到正常状态
- 状态：发送恢复通知

### 标准处理流程

#### 1. 告警接收与确认

**接收阶段**：
- 收到告警通知
- 确认告警级别
- 评估影响范围

**确认阶段**：
- 在监控平台确认告警
- 查看相关指标和日志
- 初步判断问题严重性

**记录阶段**：
- 记录告警接收时间
- 分配处理负责人
- 设置处理优先级

#### 2. 问题诊断与分析

**信息收集**：
- 查看监控指标趋势
- 分析相关系统日志
- 检查配置变更记录
- 了解用户影响情况

**问题定位**：
- 确定问题根本原因
- 分析问题影响范围
- 评估问题严重程度
- 制定临时解决方案

**分析工具**：
- PromQL查询分析
- 日志检索查询
- 链路追踪分析
- 性能分析工具

#### 3. 故障处理与恢复

**紧急处理**：
- 实施临时解决方案
- 恢复业务功能
- 减少用户影响
- 稳定系统状态

**根因修复**：
- 修复代码问题
- 调整配置参数
- 优化资源分配
- 更新文档记录

**验证效果**：
- 监控系统指标
- 检查业务功能
- 确认用户影响消除
- 验证告警恢复

#### 4. 事后复盘与改进

**事故报告**：
- 记录事故时间线
- 分析根本原因
- 评估影响程度
- 总结经验教训

**改进措施**：
- 优化告警规则
- 完善监控覆盖
- 更新操作文档
- 加强预防措施

**知识更新**：
- 更新故障处理手册
- 分享经验教训
- 培训相关人员
- 改进系统架构

### 告警最佳实践

#### 1. 告警规则优化

**避免告警风暴**：
- 设置合理的持续时间阈值
- 使用告警聚合减少重复
- 配置告警抑制规则
- 设置合理的时间窗口

**提高告警质量**：
- 告警描述要清晰明确
- 提供有价值的上下文信息
- 包含处理建议或文档链接
- 定期回顾和优化规则

#### 2. 通知策略优化

**分级通知**：
- Critical级别：全员通知
- Warning级别：相关团队
- Info级别：定时汇总

**避免疲劳**：
- 设置通知频率限制
- 配置免打扰时间段
- 使用聚合通知减少打扰
- 允许个人自定义偏好

#### 3. 处理效率优化

**自动化处理**：
- 自动重启失败的服务
- 自动扩展资源
- 自动清理磁盘空间
- 自动执行诊断脚本

**快速响应**：
- 建立on-call机制
- 准备应急手册
- 定期演练故障处理
- 优化协作流程

#### 4. 持续改进

**定期回顾**：
- 周度告警统计分析
- 月度告警效果评估
- 季度规则优化调整
- 年度系统架构升级

**量化指标**：
- 告警准确率：真正告警 / 总告警数
- 响应及时率：按时响应 / 总告警数
- 解决有效率：一次性解决 / 总处理数
- 重复告警率：重复告警 / 总告警数

## 故障排查

### 常见问题

#### 1. 告警未触发

**可能原因**：
- PromQL表达式错误
- 评估频率设置过低
- 阈值设置不合理
- 标签匹配不正确

**排查步骤**：
1. 检查告警规则语法
2. 在Prometheus中验证查询
3. 检查指标数据是否正常
4. 验证标签匹配逻辑

#### 2. 告误报过多

**可能原因**：
- 阈值设置过敏感
- 持续时间设置过短
- 业务高峰期影响
- 监控数据异常

**优化方法**：
1. 调整告警阈值
2. 增加持续时间要求
3. 配置告警抑制规则
4. 优化PromQL查询

#### 3. 通知未送达

**可能原因**：
- 通知渠道配置错误
- 网络连接问题
- 频率限制触发
- 认证信息失效

**排查步骤**：
1. 检查通知配置
2. 测试网络连通性
3. 验证认证信息
4. 查看错误日志

---

**最后更新**：2026-01-08
**适用版本**：v1.0+
**维护团队**：Edge Platform Team