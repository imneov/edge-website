import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 用户手册侧边栏配置
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
        // 集群管理
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
        // 工作空间管理
        {
          type: 'category',
          label: '工作空间管理',
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
        // 租户管理
        {
          type: 'category',
          label: '租户管理',
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
        // 应用管理
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
        // 身份访问管理
        {
          type: 'category',
          label: '身份访问管理',
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
        // OTA升级管理
        {
          type: 'category',
          label: 'OTA升级管理',
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
            'image/lifecycle-management',
            'image/security-authentication',
            'image/api-reference',
            'image/troubleshooting',
          ],
        },
        // 可观测性
        {
          type: 'category',
          label: '可观测性',
          items: [
            'o11y/README',
            'o11y/monitoring-dashboard',
            'o11y/cluster-metrics',
            'o11y/alert-management',
            'o11y/trend-analysis',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
