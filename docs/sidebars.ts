import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 用户手册侧边栏配置
 *
 * 顺序按产品实际操作流程排列：
 * 1. 快速入门 — 新用户引导
 * 2. 用户手册 — 按产品导航顺序
 * 3. 参考 — FAQ 和技术支持
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',

    // ==================== 快速入门 ====================
    {
      type: 'category',
      label: '快速入门',
      collapsed: false,
      items: [
        'introduction/overview',
        'introduction/architecture',
        'introduction/use-cases',
        'quick-start/prerequisites',
        'quick-start/first-login',
        'quick-start/first-cluster',
        'quick-start/install-edge-node',
      ],
    },

    // ==================== 用户手册 ====================
    {
      type: 'category',
      label: '用户手册',
      collapsed: false,
      items: [
        // 工作台（原租户管理，对应产品导航 /tenant）
        {
          type: 'category',
          label: '工作台',
          items: [
            'tenant/README',
            'tenant/quick-start',
            'tenant/tenant-management',
            'tenant/resource-management',
            'tenant/permission-management',
            'tenant/tenant-configuration',
            'tenant/multi-tenant-architecture',
            'tenant/security-isolation',
          ],
        },
        // 监控平台（对应产品导航 /metrics）
        {
          type: 'category',
          label: '监控平台',
          items: [
            'o11y/README',
            'o11y/monitoring-dashboard',
            'o11y/cluster-metrics',
            'o11y/alert-management',
            'o11y/trend-analysis',
          ],
        },
        // 应用管理（含应用商店 + 应用商店管理）
        {
          type: 'category',
          label: '应用管理',
          items: [
            'apps/README',
            'apps/application-management-overview',
            'apps/application-store-guide',
            'apps/application-deployment',
            'apps/application-instance-management',
            'apps/application-configuration',
            'apps/helm-application-management',
            'apps/application-troubleshooting',
          ],
        },
        // 集群管理（对应产品导航 /boss/clusters）
        {
          type: 'category',
          label: '集群管理',
          items: [
            'clusters/README',
            'clusters/cluster-management',
            'clusters/node-groups',
            'clusters/projects',
            'clusters/cluster-settings',
          ],
        },
        // 租户空间管理（对应产品导航 /boss/workspaces）
        {
          type: 'category',
          label: '租户空间管理',
          items: [
            'workspaces/README',
            'workspaces/workspace-management',
            'workspaces/workspace-projects',
            'workspaces/workspace-overview',
            'workspaces/workspace-settings',
            'workspaces/workspace-quotas',
            'workspaces/workspace-members',
          ],
        },
        // 算力管理（GPU/vGPU 资源调度）
        {
          type: 'category',
          label: '算力管理',
          items: [
            'compute/README',
            'compute/compute-resources',
            'compute/compute-ratios',
            'compute/gpu-models',
            'compute/nodegroup-compute',
          ],
        },
        // IoT 设备管理（工作台 → 边缘资源）
        {
          type: 'category',
          label: 'IoT 设备管理',
          items: [
            'iot/README',
            'iot/device-management',
            'iot/device-profile',
          ],
        },
        // OTA 升级管理
        {
          type: 'category',
          label: 'OTA 升级管理',
          items: [
            'ota/README',
            'ota/overview',
            'ota/quick-start',
            'ota/node-access',
            'ota/task-management',
            'ota/troubleshooting',
          ],
        },
        // 镜像管理
        {
          type: 'category',
          label: '镜像管理',
          items: [
            'image/README',
            'image/overview',
            'image/quick-start',
            'image/registry-management',
            'image/repository-management',
            'image/troubleshooting',
          ],
        },
        // 权限管理（含权限矩阵）
        {
          type: 'category',
          label: '权限管理',
          items: [
            'iam/README',
            'iam/quick-start',
            'iam/iam-overview',
            'iam/user-management',
            'iam/role-management',
            'iam/permission-management',
            'iam/access-control-best-practices',
            'iam/troubleshooting',
          ],
        },
      ],
    },

    // ==================== 部署与运维 ====================
    {
      type: 'category',
      label: '部署与运维',
      items: [
        'deployment-operations/README',
      ],
    },

    // ==================== 附录 ====================
    {
      type: 'category',
      label: '附录',
      items: [
        'appendix/crd-reference',
        'appendix/api-reference',
        'appendix/glossary',
      ],
    },

    // ==================== 参考 ====================
    {
      type: 'category',
      label: '参考',
      items: [
        'faq',
        'support',
      ],
    },
  ],
};

export default sidebars;
