import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  title: '边缘平台',
  tagline: '面向云原生应用的智能边缘计算平台',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.theriseunion.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'theriseunion', // Usually your GitHub org/user name.
  projectName: 'edge-platform', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文',
        direction: 'ltr',
        htmlLang: 'zh-CN',
        calendar: 'gregory',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          id: 'default',
          path: 'docs',
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/theriseunion/edge-website/tree/main/',
        },
        blog: false, // 禁用博客功能
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // Webpack 别名配置
    ['./src/plugins/webpack-alias.js', {}],
    // Tailwind CSS 配置
    ['./src/plugins/tailwind-config.js', {}],
    // 技术白皮书
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'whitepaper',
        path: 'whitepaper',
        routeBasePath: 'whitepaper',
        sidebarPath: require.resolve('./sidebars-whitepaper.ts'),
      },
    ],
    // 开发指南
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developer',
        path: 'developer',
        routeBasePath: 'developer',
        sidebarPath: require.resolve('./sidebars-developer.ts'),
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    announcementBar: {
      id: 'release_v1',
      content:
        '🎉 边缘平台 v1.0 正式发布 — <a href="/whitepaper/README" style="color:inherit;text-decoration:underline;">查看技术白皮书</a>，了解统一 IAM 架构与多集群管理能力',
      backgroundColor: '#0f172a',
      textColor: '#94a3b8',
      isCloseable: true,
    },
    navbar: {
      title: '边缘平台',
      logo: {
        alt: '边缘平台 Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '使用文档',
        },
        {
          to: '/whitepaper',
          position: 'left',
          label: '技术白皮书',
        },
        {
          to: '/developer/intro',
          position: 'left',
          label: '开发指南',
        },
        {
          href: 'https://github.com/theriseunion/edge-website',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '快速入门',
              to: '/docs/intro',
            },
            {
              label: '集群管理',
              to: '/docs/clusters/README',
            },
            {
              label: '应用管理',
              to: '/docs/apps/README',
            },
          ],
        },
        {
          title: '社区',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/theriseunion/edge-website',
            },
            {
              label: '问题反馈',
              href: 'https://github.com/theriseunion/edge-website/issues',
            },
          ],
        },
        {
          title: '更多',
          items: [
            {
              label: '技术白皮书',
              to: '/whitepaper',
            },
            {
              label: '开发指南',
              to: '/developer/intro',
            },
            {
              label: 'Edge API Server',
              href: 'https://github.com/theriseunion/edge-platform',
            },
            {
              label: 'Edge Console',
              href: 'https://github.com/theriseunion/edge-platform',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TheriseUnion. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'diff', 'json'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
  stylesheets: [
    {
      // Google Fonts via loli.net CN mirror: Noto Sans SC (Chinese) + Inter (English)
      href: 'https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Inter:wght@400;500;600;700;800;900&display=swap',
      type: 'text/css',
    },
  ],
};

export default config;
