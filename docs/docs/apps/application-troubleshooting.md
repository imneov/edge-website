# 应用故障排查指南

## 概述

本指南提供了EdgePlatform应用管理中常见问题的故障排查方法和解决方案。涵盖了应用部署、运行、网络、性能等各个方面的问题诊断和处理。

## 故障排查方法论

### 排查流程

采用系统化的排查方法可以快速定位问题：

```
1. 问题现象收集
   ↓
2. 状态检查和日志分析
   ↓
3. 假设制定和验证
   ↓
4. 问题解决和验证
   ↓
5. 预防措施制定
```

### 信息收集

#### 基础信息

- **应用状态**: 当前运行状态（运行中、待定、失败等）
- **资源使用**: CPU、内存、存储使用情况
- **事件记录**: 相关的Kubernetes事件
- **日志输出**: 应用和容器日志

#### 环境信息

- **集群版本**: Kubernetes和EdgePlatform版本
- **节点状态**: 节点资源使用和健康状况
- **网络配置**: 服务、Ingress、网络策略等
- **资源配额**: 项目和工作空间的资源限制

## 部署相关问题

### 问题1: 应用部署失败

#### 症状

- 应用实例状态显示"失败"
- Pod状态为CrashLoopBackOff或Error
- 部署操作超时

#### 可能原因

1. **镜像相关**
   - 镜像地址错误
   - 镜像不存在
   - 镜像拉取认证失败

2. **资源配置**
   - 资源请求超过节点能力
   - 项目配额不足
   - 存储类不存在

3. **配置错误**
   - 环境变量配置错误
   - 健康检查配置不当
   - 依赖服务不可用

#### 排查步骤

```bash
# 1. 查看Pod状态和事件
kubectl describe pod <pod-name> -n <namespace>

# 2. 查看Pod日志
kubectl logs <pod-name> -n <namespace> --previous

# 3. 检查镜像
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.containers[*].image}'

# 4. 检查资源使用
kubectl describe node <node-name>
kubectl top node
```

#### 解决方案

**镜像问题**:
1. 验证镜像地址正确性
2. 配置imagePullSecret
3. 检查网络和DNS

**资源问题**:
1. 调整资源请求和限制
2. 增加项目资源配额
3. 清理不必要的资源

**配置问题**:
1. 检查应用配置参数
2. 验证依赖服务状态
3. 调整健康检查参数

### 问题2: Helm Chart部署失败

#### 症状

- Helm Release创建失败
- 部署过程中断
- 资源创建冲突

#### 排查步骤

```bash
# 1. 查看Helm Release状态
helm status <release-name> -n <namespace>

# 2. 查看Helm历史
helm history <release-name> -n <namespace>

# 3. 渲染Chart模板检查
helm template <release-name> <chart-path> --debug

# 4. 检查Kubernetes资源
kubectl get all -n <namespace>
```

#### 解决方案

**Chart配置错误**:
1. 验证Values YAML语法
2. 检查必需参数是否配置
3. 查看Chart文档和示例

**依赖问题**:
1. 检查Chart依赖关系
2. 确保依赖Chart可用
3. 调整依赖版本

## 运行相关问题

### 问题3: 应用频繁重启

#### 症状

- Pod状态为CrashLoopBackOff
- Restart Count不断增加
- 应用无法稳定运行

#### 可能原因

1. **应用崩溃**
   - 应用代码异常
   - 内存溢出（OOM）
   - 未捕获的异常

2. **健康检查失败**
   - 探测端点不存在
   - 探测超时时间过短
   - 健康检查逻辑错误

3. **资源不足**
   - 内存限制过低
   - CPU请求不足
   - 临时磁盘空间不足

#### 排查步骤

```bash
# 1. 查看Pod退出码
kubectl get pod <pod-name> -n <namespace>

# 2. 查看详细事件
kubectl describe pod <pod-name> -n <namespace>

# 3. 查看应用日志
kubectl logs <pod-name> -n <namespace> --previous

# 4. 查看资源使用
kubectl top pod <pod-name> -n <namespace>
```

#### 解决方案

**应用崩溃**:
1. 分析应用日志和堆栈信息
2. 修复应用代码bug
3. 添加异常处理逻辑

**OOM问题**:
1. 增加内存限制
2. 优化内存使用
3. 检查内存泄漏

**健康检查问题**:
1. 调整探测参数
2. 修复健康检查端点
3. 增加初始延迟时间

### 问题4: 应用响应缓慢

#### 症状

- API请求响应时间长
- 页面加载缓慢
- 用户体验差

#### 可能原因

1. **性能瓶颈**
   - CPU使用率高
   - 内存不足
   - 磁盘I/O高

2. **网络问题**
   - 网络延迟高
   - 带宽不足
   - DNS解析慢

3. **应用问题**
   - 数据库查询慢
   - 代码性能差
   - 缓存未命中

#### 排查步骤

```bash
# 1. 检查资源使用率
kubectl top pod <pod-name> -n <namespace>

# 2. 查看应用日志
kubectl logs <pod-name> -n <namespace> | grep -i "slow\|timeout\|error"

# 3. 测试网络连接
kubectl exec -it <pod-name> -n <namespace> -- curl -w @curl-format.txt http://service-name

# 4. 分析数据库查询
kubectl exec -it <pod-name> -n <namespace> -- mysql -h db-host -e "SHOW PROCESSLIST;"
```

#### 解决方案

**资源优化**:
1. 增加CPU和内存配额
2. 启用水平自动扩缩容
3. 优化应用代码性能

**网络优化**:
1. 使用服务网格优化通信
2. 启用HTTP/2和gRPC
3. 优化DNS配置

**应用优化**:
1. 添加缓存层
2. 优化数据库查询
3. 使用连接池

## 网络相关问题

### 问题5: 服务无法访问

#### 症状

- 无法访问应用服务
- 连接超时
- DNS解析失败

#### 可能原因

1. **服务配置错误**
   - Service配置错误
   - 端口配置不匹配
   - 选择器配置错误

2. **网络策略限制**
   - NetworkPolicy阻止访问
   - 防火墙规则限制
   - 安全组配置不当

3. **DNS问题**
   - DNS服务不可用
   - DNS记录不存在
   - DNS缓存问题

#### 排查步骤

```bash
# 1. 检查Service状态
kubectl get svc <service-name> -n <namespace>
kubectl describe svc <service-name> -n <namespace>

# 2. 检查Endpoints
kubectl get endpoints <service-name> -n <namespace>

# 3. 测试DNS解析
kubectl exec -it <pod-name> -n <namespace> -- nslookup <service-name>

# 4. 检查网络策略
kubectl get networkpolicy -n <namespace>

# 5. 测试网络连通性
kubectl exec -it <pod-name> -n <namespace> -- curl -v http://<service-name>:<port>
```

#### 解决方案

**服务配置**:
1. 验证Service选择器
2. 检查端口映射配置
3. 确认Pod标签正确

**网络策略**:
1. 添加允许访问的策略
2. 调整网络优先级
3. 验证策略语法

**DNS问题**:
1. 重启CoreDNS
2. 清理DNS缓存
3. 检查DNS配置

### 问题6: Ingress访问失败

#### 症状

- 无法通过域名访问应用
- 证书错误
- 路由规则不生效

#### 可能原因

1. **Ingress配置错误**
   - 域名配置错误
   - 路径规则不匹配
   - 后端服务配置错误

2. **证书问题**
   - 证书不存在
   - 证书过期
   - 域名不匹配

3. **Ingress控制器问题**
   - 控制器未正常运行
   - 配置重载失败
   - 资源不足

#### 排查步骤

```bash
# 1. 检查Ingress状态
kubectl get ingress <ingress-name> -n <namespace>
kubectl describe ingress <ingress-name> -n <namespace>

# 2. 检查Ingress控制器
kubectl get pods -n <ingress-namespace>

# 3. 查看控制器日志
kubectl logs -n <ingress-namespace> <controller-pod>

# 4. 验证DNS解析
nslookup <domain>
dig <domain>
```

#### 解决方案

**配置修复**:
1. 修正域名和路径配置
2. 验证后端服务可用
3. 检查注解配置

**证书处理**:
1. 重新签发证书
2. 更新证书Secret
3. 配置自动续期

**控制器修复**:
1. 重启控制器Pod
2. 增加控制器资源
3. 检查控制器配置

## 存储相关问题

### 问题7: 持久卷挂载失败

#### 症状

- Pod一直处于Pending状态
- 存储卷挂载失败
- 应用无法启动

#### 可能原因

1. **存储配置错误**
   - PVC配置错误
   - 存储类不存在
   - 访问模式不匹配

2. **存储资源不足**
   - 存储容量不足
   - 节点存储空间不足
   - 存储配额限制

3. **存储系统问题**
   - 存储系统不可用
   - 网络存储网络问题
   - 权限配置错误

#### 排查步骤

```bash
# 1. 检查PVC状态
kubectl get pvc -n <namespace>
kubectl describe pvc <pvc-name> -n <namespace>

# 2. 检查PV状态
kubectl get pv
kubectl describe pv <pv-name>

# 3. 检查存储类
kubectl get storageclass

# 4. 查看节点存储使用
kubectl get nodes -o custom-columns=NAME:.metadata.name,CAPACITY:.status.capacity.storage
```

#### 解决方案

**配置修复**:
1. 修正PVC配置
2. 使用正确的存储类
3. 匹配访问模式

**资源扩容**:
1. 扩展PV容量
2. 清理无用数据
3. 增加存储配额

**存储系统**:
1. 修复存储系统连接
2. 检查网络配置
3. 验证权限设置

## 性能问题

### 问题8: 资源使用异常

#### 症状

- CPU使用率持续100%
- 内存使用率过高
- 磁盘I/O过高

#### 排查步骤

```bash
# 1. 查看资源使用
kubectl top pod <pod-name> -n <namespace>
kubectl top node

# 2. 查看容器资源限制
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.containers[*].resources}'

# 3. 进入容器分析
kubectl exec -it <pod-name> -n <namespace> -- top
kubectl exec -it <pod-name> -n <namespace> -- ps aux

# 4. 分析应用日志
kubectl logs <pod-name> -n <namespace> --tail=100 | grep -i "error\|warning"
```

#### 解决方案

**CPU优化**:
1. 优化算法和代码
2. 增加CPU配额
3. 扩展副本数量

**内存优化**:
1. 修复内存泄漏
2. 优化数据结构
3. 增加内存限制

**I/O优化**:
1. 使用SSD存储
2. 优化文件访问
3. 增加缓存

## 监控和诊断

### 监控工具

#### 1. 资源监控

```bash
# 实时监控资源使用
kubectl top pod -n <namespace> --containers
kubectl top node

# 监控特定资源
kubectl get --raw /metrics | grep pod_name
```

#### 2. 日志监控

```bash
# 实时查看日志
kubectl logs -f <pod-name> -n <namespace>

# 查看多个Pod日志
kubectl logs -l app=<app-name> -n <namespace> --tail=10

# 查看所有容器日志
kubectl logs <pod-name> -n <namespace> --all-containers=true
```

#### 3. 事件监控

```bash
# 查看最近事件
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# 监控事件
kubectl get events -n <namespace> --watch
```

### 诊断技巧

#### 1. 进入容器调试

```bash
# 进入容器Shell
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# 查看进程
kubectl exec -it <pod-name> -n <namespace> -- ps aux

# 查看环境变量
kubectl exec -it <pod-name> -n <namespace> -- env

# 测试网络
kubectl exec -it <pod-name> -n <namespace> -- curl -v http://service-name
```

#### 2. 端口转发调试

```bash
# 转发本地端口到Pod
kubectl port-forward <pod-name> 8080:80 -n <namespace>

# 转发本地端口到Service
kubectl port-forward svc/<service-name> 8080:80 -n <namespace>
```

#### 3. 复制文件调试

```bash
# 从容器复制文件
kubectl cp <pod-name>:/path/to/file ./local-file -n <namespace>

# 复制文件到容器
kubectl cp ./local-file <pod-name>:/path/to/file -n <namespace>
```

## 预防措施

### 1. 健康检查配置

- **存活探针**: 确保应用异常时能被重启
- **就绪探针**: 确保应用就绪后才接收流量
- **启动探针**: 给慢启动应用足够的时间

### 2. 资源限制

- **合理设置Request**: 保证应用基本运行需求
- **合理设置Limit**: 防止应用占用过多资源
- **监控资源使用**: 及时调整资源配置

### 3. 备份策略

- **定期备份数据**: 防止数据丢失
- **备份配置信息**: 便于快速恢复
- **测试备份恢复**: 确保备份可用

### 4. 监控告警

- **配置监控指标**: 及时发现问题
- **设置告警规则**: 主动响应问题
- **定期巡检**: 预防潜在问题

## 常用命令参考

### Pod操作

```bash
# 查看Pod列表
kubectl get pods -n <namespace>

# 查看Pod详情
kubectl describe pod <pod-name> -n <namespace>

# 查看Pod日志
kubectl logs <pod-name> -n <namespace>

# 进入Pod
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# 删除Pod
kubectl delete pod <pod-name> -n <namespace>
```

### Service操作

```bash
# 查看Service列表
kubectl get svc -n <namespace>

# 查看Service详情
kubectl describe svc <service-name> -n <namespace>

# 查看Endpoints
kubectl get endpoints <service-name> -n <namespace>
```

### 存储操作

```bash
# 查看PVC列表
kubectl get pvc -n <namespace>

# 查看PVC详情
kubectl describe pvc <pvc-name> -n <namespace>

# 查看PV列表
kubectl get pv
```

## 相关文档

- [应用部署管理](./application-deployment.md)
- [应用实例管理](./application-instance-management.md)
- [应用配置和网络管理](./application-configuration.md)
- [Helm应用管理](./helm-application-management.md)