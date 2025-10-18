import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 边缘平台开发指南
 *
 * 注意：当前仅包含已存在的文档文件
 * 随着文档编写进度，逐步添加更多章节
 */
const sidebars: SidebarsConfig = {
  developerSidebar: [
    'intro',

    // ==================== 核心概念 ====================
    {
      type: 'category',
      label: '核心概念',
      collapsed: false,
      items: [
        'concepts/architecture',
        'concepts/permission-model',
        'concepts/scope-system',
        'concepts/roletemplate',
        'concepts/oauth',
      ],
    },

    // ==================== 权限体系 ====================
    {
      type: 'category',
      label: '权限体系',
      collapsed: false,
      items: [
        'permissions/overview',
        'permissions/rbac',
        'permissions/scope-aware',
        'permissions/role-binding',
        'permissions/cascading',
        'permissions/api-extension',
      ],
    },

    // ==================== API 开发 ====================
    {
      type: 'category',
      label: 'API 开发',
      collapsed: false,
      items: [
        'api/getting-started',
        'api/crd-development',
        'api/controller',
        'api/api-service',
        'api/reverse-proxy',
        'api/metrics',
      ],
    },

    // ==================== 前端开发 ====================
    {
      type: 'category',
      label: '前端开发',
      collapsed: false,
      items: [
        'frontend/overview',
        'frontend/console-arch',
        'frontend/api-client',
        'frontend/permissions',
        'frontend/components',
      ],
    },

    // ==================== 最佳实践 ====================
    {
      type: 'category',
      label: '最佳实践',
      collapsed: false,
      items: [
        'best-practices/security',
        'best-practices/performance',
        'best-practices/testing',
        'best-practices/deployment',
      ],
    },
  ],
};

export default sidebars;
