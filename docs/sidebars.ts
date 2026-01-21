import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 边缘平台使用文档结构
 *
 * 注意：当前仅包含已存在的文档文件
 * 随着文档编写进度，逐步添加更多章节
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',

    // ==================== 技术白皮书 ====================
    {
      type: 'category',
      label: '技术白皮书',
      collapsed: false,
      items: [
        'whitepaper/README',
        'whitepaper/executive-summary',
        'whitepaper/introduction',
        'whitepaper/advantages',
        'whitepaper/features',
        'whitepaper/architecture',
        'whitepaper/deployment',
      ],
    },

    // ==================== 产品介绍 ====================
    {
      type: 'category',
      label: '产品介绍',
      collapsed: false,
      items: [
        'introduction/overview',
        'introduction/architecture',
        'introduction/use-cases',
      ],
    },

    // ==================== 快速入门 ====================
    {
      type: 'category',
      label: '快速入门',
      collapsed: false,
      items: [
        'quick-start/prerequisites',
        'quick-start/first-login',
        'quick-start/first-cluster',
        'quick-start/install-edge-node',
      ],
    },

    // ==================== 用户指南 ====================
    {
      type: 'category',
      label: '用户指南',
      collapsed: false,
      items: [
        // 平台管理
        {
          type: 'category',
          label: '平台管理',
          items: [
            'user-guide/platform/users',
            'user-guide/platform/roles',
            'user-guide/platform/settings',
          ],
        },
      ],
    },

    // ==================== 其他文档 ====================
    'installation',
    'configuration',
    'deployment',
    'writing-content',
  ],
};

export default sidebars;
