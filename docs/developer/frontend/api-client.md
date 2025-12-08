---
sidebar_position: 3
title: API 客户端
---

# API 客户端

edge-console 使用自动生成的 TypeScript SDK 与后端 API 通信,实现类型安全、自动补全和一致的错误处理。本文档详细介绍 API 客户端的配置、代码生成流程、使用方法和最佳实践。

## TypeScript SDK 自动生成

### 代码生成工具链

edge-console 使用 Kubb 框架从 OpenAPI 规范自动生成 TypeScript 客户端代码:

```mermaid
graph LR
    A[edge-apiserver] --> B[OpenAPI v2 规范]
    B --> C[/openapi/v2 端点]
    C --> D[openapi.json]
    D --> E[Kubb 代码生成器]
    E --> F[TypeScript 类型]
    E --> G[API 客户端函数]
    E --> H[React Query Hooks]

    style A fill:#e3f2fd
    style E fill:#fff3e0
    style F fill:#e8f5e9
    style G fill:#e8f5e9
    style H fill:#e8f5e9
```

### 生成流程

```bash
# 完整的代码生成命令
pnpm codegen

# 生成过程包含3个步骤:
# 1. 预处理: 从运行中的 apiserver 获取 OpenAPI 规范
# 2. 代码生成: Kubb 生成 TypeScript 代码
# 3. 后处理: 修复生成代码的类型和操作 ID
```

**详细步骤**:

```javascript
// process-api-codegen.mjs - 预处理脚本
async function preProcess() {
  // 1. 从 apiserver 获取 OpenAPI 规范
  const response = await fetch('http://localhost:8080/openapi/v2')
  const spec = await response.json()

  // 2. 保存为 openapi.json
  fs.writeFileSync('openapi.json', JSON.stringify(spec, null, 2))
  console.log('✅ OpenAPI 规范已保存到 openapi.json')
}

// kubb.config.ts - Kubb 配置
export default defineConfig({
  input: {
    path: './openapi.json',  // 输入: OpenAPI 规范
  },
  output: {
    path: './src/gen',       // 输出: 生成的代码目录
    clean: true,             // 清理旧文件
  },
  plugins: [
    // 生成 TypeScript 类型定义
    pluginTs({
      output: { path: './types' }
    }),

    // 生成 API 客户端函数
    pluginClient({
      output: { path: './client' },
      client: { importPath: '@/lib/api-client' }
    }),

    // 生成 React Query Hooks
    pluginTanstackQuery({
      output: { path: './hooks' },
      framework: 'react'
    })
  ]
})
```

### 生成的代码结构

```
src/gen/
├── types/                    # TypeScript 类型定义
│   ├── ClusterType.ts        # 集群类型
│   ├── NodeType.ts           # 节点类型
│   ├── PodType.ts            # Pod 类型
│   └── ...                   # 所有 API 实体类型
│
├── client/                   # 原生 API 客户端函数
│   ├── listClusters.ts       # 列出集群
│   ├── getCluster.ts         # 获取集群详情
│   ├── createCluster.ts      # 创建集群
│   ├── updateCluster.ts      # 更新集群
│   ├── deleteCluster.ts      # 删除集群
│   └── index.ts              # 统一导出
│
└── hooks/                    # React Query Hooks
    ├── useListClusters.ts    # 查询集群列表
    ├── useGetCluster.ts      # 查询集群详情
    ├── useCreateCluster.ts   # 创建集群 Mutation
    ├── useUpdateCluster.ts   # 更新集群 Mutation
    ├── useDeleteCluster.ts   # 删除集群 Mutation
    └── index.ts              # 统一导出
```

**重要**: `src/gen/` 目录下的所有文件都是自动生成的,**永远不要手动修改**。任何更改都应该通过修改后端 API 并重新生成代码来完成。

## API 客户端配置

### Axios 实例创建

```typescript
// src/lib/api-client.ts
import axios from 'axios'

// 创建 Axios 实例
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,           // 30秒超时
  withCredentials: true,    // 发送 cookies
})
```

### 请求拦截器

请求拦截器自动添加认证 Token 和其他必要的请求头:

```typescript
// 请求拦截器
axiosInstance.interceptors.request.use((config) => {
  if (config.headers) {
    // 1. 设置 Content-Type
    config.headers['Content-Type'] = 'application/json'

    // 2. 添加时区信息
    config.headers['Timezone-Val'] = Intl.DateTimeFormat().resolvedOptions().timeZone

    // 3. 添加认证 Token
    const token = getAuthToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      config.withCredentials = true
    }
  }

  return config
})

// 获取认证 Token (支持多种存储方式)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // 优先从 Cookie 获取 (与中间件配合)
  const tokenCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1]

  if (tokenCookie) return tokenCookie

  // 回退到 localStorage 或 sessionStorage
  return localStorage.getItem('access_token') ||
         sessionStorage.getItem('access_token')
}
```

### 响应拦截器

响应拦截器统一处理错误和认证失效:

```typescript
// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,  // 成功响应直接返回
  (error: AxiosError) => {
    // 401 未授权: 清除认证信息并跳转到登录页
    if (error.response?.status === 401) {
      // 清除所有认证数据
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'

      // 重定向到登录页,保存当前路径用于登录后返回
      const currentPath = window.location.pathname + window.location.search
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    }

    // 403 禁止访问: 权限不足
    if (error.response?.status === 403) {
      const currentPath = window.location.pathname + window.location.search
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&reason=forbidden`
    }

    return Promise.reject(error)
  }
)
```

### 错误类型定义

```typescript
// API 错误类型
export type ApiError = {
  status: number      // HTTP 状态码
  name: string        // 错误名称
  type: string        // 错误类型
  message: string     // 错误消息
}

// 创建标准化的错误响应
function createApiError(error: AxiosError): ApiError {
  if (!error.response) {
    // 网络错误
    return {
      status: 0,
      name: 'ApiError',
      type: 'NetworkError',
      message: '网络连接失败,请检查网络设置!'
    }
  }

  // HTTP 错误
  const status = error.response.status
  let message = '请求失败'

  switch (status) {
    case 400: message = '请求参数错误'; break
    case 401: message = '未授权,请重新登录'; break
    case 403: message = '拒绝访问,权限不足'; break
    case 404: message = '请求的资源不存在'; break
    case 409: message = '资源冲突'; break
    case 422: message = '数据验证失败'; break
    case 500: message = '服务器内部错误'; break
    case 502: message = '网关错误'; break
    case 503: message = '服务不可用'; break
    default:
      // 尝试从响应中提取错误消息
      if (error.response.data && typeof error.response.data === 'object') {
        const data = error.response.data as any
        message = data.message || data.error || message
      }
  }

  return {
    status,
    name: 'ApiError',
    type: 'RequestError',
    message
  }
}
```

## React Query Hooks 使用

### 查询数据 (useQuery)

生成的 React Query hooks 自动处理数据获取、缓存、加载状态和错误处理:

```typescript
import { useListClusters } from '@/gen/hooks/useListClusters'

function ClusterList() {
  // 使用生成的 hook 查询集群列表
  const {
    data,           // 响应数据
    isLoading,      // 首次加载状态
    isFetching,     // 后台刷新状态
    isError,        // 错误状态
    error,          // 错误对象
    refetch,        // 手动刷新函数
    isRefetching    // 手动刷新状态
  } = useListClusters({
    params: {
      limit: -1,             // 查询参数
      sortBy: 'createTime',
      ascending: 'false'
    }
  })

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 错误处理
  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-600">
        错误: {error.message}
        <button onClick={() => refetch()}>重试</button>
      </div>
    )
  }

  // 渲染数据
  return (
    <div>
      <button
        onClick={() => refetch()}
        disabled={isRefetching}
      >
        {isRefetching ? '刷新中...' : '刷新'}
      </button>

      <ul>
        {data?.items.map(cluster => (
          <li key={cluster.id}>{cluster.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 变更数据 (useMutation)

使用 Mutation hooks 处理创建、更新、删除操作:

```typescript
import { useCreateCluster, useListClusters } from '@/gen/hooks'
import { useQueryClient } from '@tanstack/react-query'

function CreateClusterForm() {
  const queryClient = useQueryClient()

  // 创建集群 Mutation
  const createMutation = useCreateCluster({
    mutation: {
      // 成功回调
      onSuccess: (data) => {
        // 1. 显示成功消息
        toast.success(`集群 ${data.name} 创建成功!`)

        // 2. 使列表查询缓存失效,触发重新获取
        queryClient.invalidateQueries({
          queryKey: ['listClusters']
        })

        // 3. 导航到新创建的集群
        router.push(`/boss/clusters/${data.id}`)
      },

      // 错误回调
      onError: (error) => {
        toast.error(`创建失败: ${error.message}`)
      }
    }
  })

  const handleSubmit = (formData: ClusterFormData) => {
    // 调用 mutation
    createMutation.mutate({
      data: {
        name: formData.name,
        description: formData.description,
        // ...其他字段
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段... */}

      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? '创建中...' : '创建集群'}
      </button>

      {createMutation.isError && (
        <div className="text-red-600">
          {createMutation.error.message}
        </div>
      )}
    </form>
  )
}
```

### 乐观更新

乐观更新可以在服务器响应之前立即更新 UI,提供更流畅的用户体验:

```typescript
import { useUpdateCluster } from '@/gen/hooks'
import { useQueryClient } from '@tanstack/react-query'

function ClusterUpdateForm({ cluster }) {
  const queryClient = useQueryClient()

  const updateMutation = useUpdateCluster({
    mutation: {
      // 乐观更新: 在请求发送前立即更新 UI
      onMutate: async (variables) => {
        // 1. 取消正在进行的查询,避免覆盖乐观更新
        await queryClient.cancelQueries({
          queryKey: ['getCluster', cluster.id]
        })

        // 2. 保存当前数据作为回滚点
        const previousCluster = queryClient.getQueryData(
          ['getCluster', cluster.id]
        )

        // 3. 乐观更新缓存
        queryClient.setQueryData(
          ['getCluster', cluster.id],
          (old) => ({
            ...old,
            ...variables.data
          })
        )

        // 4. 返回回滚上下文
        return { previousCluster }
      },

      // 错误时回滚
      onError: (error, variables, context) => {
        queryClient.setQueryData(
          ['getCluster', cluster.id],
          context.previousCluster
        )
        toast.error(`更新失败: ${error.message}`)
      },

      // 成功或失败后都重新获取数据
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ['getCluster', cluster.id]
        })
      }
    }
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      updateMutation.mutate({
        clusterId: cluster.id,
        data: { description: e.target.description.value }
      })
    }}>
      <textarea name="description" defaultValue={cluster.description} />
      <button type="submit">保存</button>
    </form>
  )
}
```

## 类型安全的 API 调用

### 请求参数类型

所有 API 函数都有完整的 TypeScript 类型定义:

```typescript
import { createCluster } from '@/gen/client'
import type { ClusterType } from '@/gen/types'

async function example() {
  // TypeScript 会自动提示和检查参数类型
  const cluster = await createCluster({
    data: {
      name: 'prod-cluster',           // ✅ 必需字段
      description: 'Production',      // ✅ 可选字段
      region: 'us-west-1',            // ✅ 有效值
      // invalid: 'test'               // ❌ TypeScript 错误: 未知字段
    }
  })

  return cluster
}
```

### 响应数据类型

响应数据也有完整的类型定义:

```typescript
import { useListClusters } from '@/gen/hooks'
import type { ClusterType } from '@/gen/types'

function ClusterList() {
  const { data } = useListClusters()

  // TypeScript 知道 data 的确切类型
  data?.items.forEach((cluster: ClusterType) => {
    console.log(cluster.name)        // ✅ 有效属性
    console.log(cluster.id)          // ✅ 有效属性
    // console.log(cluster.unknown)   // ❌ TypeScript 错误: 属性不存在
  })

  return <div>...</div>
}
```

### 自动补全和类型检查

IDE (VSCode) 会提供完整的自动补全和类型检查:

```typescript
// 输入 "cluster." 后,IDE 自动显示所有可用属性:
cluster.name          // ✅
cluster.description   // ✅
cluster.region        // ✅
cluster.status        // ✅
cluster.createTime    // ✅

// 尝试访问不存在的属性时,TypeScript 立即报错:
cluster.unknownField  // ❌ Property 'unknownField' does not exist
```

## 命名空间级别资源 API

### API 函数命名规范

edge-console 遵循严格的命名规范来区分命名空间级别和集群级别的资源:

```typescript
// ✅ 正确: 命名空间级别资源 (如 Deployments, Pods, Services)
import { listNamespacedResources } from '@/gen/client'

// 参数顺序: (namespace, resource)
listNamespacedResources(namespace, 'deployments')
listNamespacedResources(namespace, 'statefulsets')
listNamespacedResources(namespace, 'pods')

// ✅ 正确: 集群级别资源 (如 Nodes, PersistentVolumes)
import { listClusterResources } from '@/gen/client'

// 参数: (resource)
listClusterResources('nodes')
listClusterResources('persistentvolumes')
```

### 查询所有命名空间

```typescript
import { listNamespacedResources } from '@/gen/client'

// 查询所有命名空间的资源: 传递 '_all_'
const allDeployments = await listNamespacedResources('_all_', 'deployments')

// 查询指定命名空间的资源
const defaultDeployments = await listNamespacedResources('default', 'deployments')
const kubeSystemDeployments = await listNamespacedResources('kube-system', 'deployments')
```

### 常见错误和修复

```typescript
// ❌ 错误: 参数顺序颠倒
listNamespacedResources('deployments', namespace)  // 错误!

// ✅ 正确: namespace 在前,resource 在后
listNamespacedResources(namespace, 'deployments')  // 正确

// ❌ 错误: 使用 cluster API 查询命名空间资源
listClusterResources('deployments')  // 错误! deployments 是命名空间级别资源

// ✅ 正确: 使用 namespaced API
listNamespacedResources(namespace, 'deployments')  // 正确

// ❌ 错误: 'all' 命名空间处理不当
const ns = namespace === 'all' ? '' : namespace
listNamespacedResources(ns, 'deployments')  // 错误! 空字符串会查询所有命名空间

// ✅ 正确: 使用 '_all_' 字符串
const ns = namespace === 'all' ? '_all_' : namespace
listNamespacedResources(ns, 'deployments')  // 正确
```

## 实战示例

### 示例 1: 集群列表页面

```typescript
'use client'
import { useListClusters, useDeleteCluster } from '@/gen/hooks'
import { useQueryClient } from '@tanstack/react-query'

export default function ClustersPage() {
  const queryClient = useQueryClient()

  // 查询集群列表
  const { data, isLoading, error, refetch } = useListClusters({
    params: {
      limit: -1,
      sortBy: 'createTime',
      ascending: 'false'
    }
  })

  // 删除集群 Mutation
  const deleteMutation = useDeleteCluster({
    mutation: {
      onSuccess: () => {
        toast.success('集群删除成功')
        queryClient.invalidateQueries({ queryKey: ['listClusters'] })
      },
      onError: (error) => {
        toast.error(`删除失败: ${error.message}`)
      }
    }
  })

  // 处理删除
  const handleDelete = (clusterId: string) => {
    if (confirm('确定要删除此集群吗?')) {
      deleteMutation.mutate({ clusterId })
    }
  }

  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} retry={refetch} />

  return (
    <div>
      <button onClick={() => refetch()}>刷新</button>

      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map(cluster => (
            <tr key={cluster.id}>
              <td>{cluster.name}</td>
              <td>{cluster.description}</td>
              <td>
                <button
                  onClick={() => handleDelete(cluster.id)}
                  disabled={deleteMutation.isPending}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 示例 2: 工作负载统计

```typescript
'use client'
import { listNamespacedResources } from '@/gen/client'
import { useQuery } from '@tanstack/react-query'

export default function WorkloadsStats({ namespace }: { namespace: string }) {
  // 并行查询多种工作负载
  const namespaceParam = namespace === 'all' ? '_all_' : namespace

  const { data: deploymentsData } = useQuery({
    queryKey: ['deployments', namespaceParam],
    queryFn: () => listNamespacedResources(namespaceParam, 'deployments')
  })

  const { data: statefulSetsData } = useQuery({
    queryKey: ['statefulsets', namespaceParam],
    queryFn: () => listNamespacedResources(namespaceParam, 'statefulsets')
  })

  const { data: daemonSetsData } = useQuery({
    queryKey: ['daemonsets', namespaceParam],
    queryFn: () => listNamespacedResources(namespaceParam, 'daemonsets')
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatsCard
        title="Deployments"
        count={deploymentsData?.items.length || 0}
      />
      <StatsCard
        title="StatefulSets"
        count={statefulSetsData?.items.length || 0}
      />
      <StatsCard
        title="DaemonSets"
        count={daemonSetsData?.items.length || 0}
      />
    </div>
  )
}
```

### 示例 3: 表单提交和验证

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { useCreateWorkspace } from '@/gen/hooks'
import type { WorkspaceType } from '@/gen/types'

type WorkspaceFormData = Pick<WorkspaceType, 'name' | 'description'>

export default function CreateWorkspaceForm() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<WorkspaceFormData>()

  const createMutation = useCreateWorkspace({
    mutation: {
      onSuccess: (data) => {
        toast.success('工作空间创建成功')
        router.push(`/boss/workspaces/${data.name}`)
      },
      onError: (error) => {
        toast.error(error.message)
      }
    }
  })

  const onSubmit = (data: WorkspaceFormData) => {
    createMutation.mutate({ data })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>名称</label>
        <input
          {...register('name', {
            required: '名称不能为空',
            pattern: {
              value: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
              message: '名称格式不正确'
            }
          })}
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <label>描述</label>
        <textarea {...register('description')} />
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? '创建中...' : '创建'}
      </button>
    </form>
  )
}
```

## 最佳实践

### 1. 始终处理加载和错误状态

```typescript
function ClusterList() {
  const { data, isLoading, error, refetch } = useListClusters()

  // ✅ 正确: 处理所有状态
  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} retry={refetch} />
  if (!data?.items.length) return <Empty />

  return <List items={data.items} />
}

// ❌ 错误: 未处理加载状态
function BadClusterList() {
  const { data } = useListClusters()
  // 如果 data 为 undefined,会导致错误
  return <div>{data.items.length}</div>  // 💥 运行时错误
}
```

### 2. 使用 Query Keys 管理缓存

```typescript
// ✅ 正确: 使用统一的 queryKey 约定
const { data } = useQuery({
  queryKey: ['clusters', filters],  // 包含过滤条件
  queryFn: () => fetchClusters(filters)
})

// 使缓存失效时使用相同的 key
queryClient.invalidateQueries({ queryKey: ['clusters'] })  // 失效所有集群查询
```

### 3. 避免过度请求

```typescript
// ✅ 正确: 使用 enabled 选项延迟查询
function ClusterDetail({ clusterId }: { clusterId?: string }) {
  const { data } = useGetCluster(
    { clusterId: clusterId! },
    {
      query: {
        enabled: !!clusterId  // 只有当 clusterId 存在时才查询
      }
    }
  )

  return <div>{data?.name}</div>
}

// ❌ 错误: clusterId 为 undefined 时仍会发送请求
function BadClusterDetail({ clusterId }: { clusterId?: string }) {
  const { data } = useGetCluster({ clusterId: clusterId! })
  // 如果 clusterId 为 undefined,会发送无效请求
}
```

### 4. 合理使用缓存时间

```typescript
// ✅ 正确: 根据数据更新频率调整缓存时间
const { data } = useListClusters(
  {},
  {
    query: {
      staleTime: 1000 * 60 * 5,  // 5分钟内数据视为新鲜
      cacheTime: 1000 * 60 * 10, // 缓存保留10分钟
      refetchInterval: 1000 * 30  // 每30秒后台刷新
    }
  }
)
```

### 5. 错误处理和重试

```typescript
// ✅ 正确: 自定义错误处理和重试逻辑
const { data } = useListClusters(
  {},
  {
    query: {
      retry: (failureCount, error) => {
        // 网络错误最多重试3次
        if (error.status === 0) return failureCount < 3

        // 5xx 错误重试1次
        if (error.status >= 500) return failureCount < 1

        // 其他错误不重试
        return false
      },
      onError: (error) => {
        // 统一错误处理
        console.error('查询失败:', error)
        toast.error(error.message)
      }
    }
  }
)
```

## 故障排查

### 问题 1: 代码生成失败

**症状**: 运行 `pnpm codegen` 时出错

**排查步骤**:
```bash
# 1. 确认 apiserver 正在运行
curl http://localhost:8080/healthz
# 预期: {"status": "ok"}

# 2. 检查 OpenAPI 规范是否可访问
curl http://localhost:8080/openapi/v2 | jq .
# 预期: 返回完整的 OpenAPI JSON

# 3. 检查 Kubb 配置
cat kubb.config.ts
# 确认 input.path 指向 ./openapi.json

# 4. 清理并重新生成
rm -rf src/gen
pnpm codegen
```

### 问题 2: TypeScript 类型错误

**症状**: 使用生成的 hook 时 TypeScript 报错

**解决方案**:
```bash
# 1. 重新生成代码
pnpm codegen

# 2. 重启 TypeScript 服务器 (VSCode)
# 命令面板 (Cmd+Shift+P) -> "TypeScript: Restart TS Server"

# 3. 检查是否手动修改了生成的代码
git diff src/gen/
# 如果有修改,恢复后重新生成
```

### 问题 3: API 请求 401 错误

**症状**: 所有 API 请求返回 401 Unauthorized

**排查步骤**:
```typescript
// 1. 检查 Token 是否存在
console.log('Token:', localStorage.getItem('access_token'))

// 2. 检查请求头
axiosInstance.interceptors.request.use((config) => {
  console.log('Request headers:', config.headers)
  return config
})

// 3. 检查 Token 是否已过期
// 在浏览器控制台运行:
const token = localStorage.getItem('access_token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token exp:', new Date(payload.exp * 1000))
}
```

## 下一步阅读

- [前端权限控制](./permissions.md) - 实现基于角色的 UI 权限管理
- [组件开发](./components.md) - 学习如何开发可复用组件
- [性能优化](../best-practices/performance.md) - API 调用性能优化技巧
- [测试实践](../best-practices/testing.md) - 如何测试 API 调用

## 参考资源

- [Kubb 文档](https://kubb.dev/) - 代码生成器官方文档
- [TanStack Query 文档](https://tanstack.com/query/latest) - React Query 完整指南
- [Axios 文档](https://axios-http.com/docs/intro) - HTTP 客户端文档
- [OpenAPI 规范](https://swagger.io/specification/) - API 规范标准
