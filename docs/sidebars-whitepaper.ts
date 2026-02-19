import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 技术白皮书侧边栏配置
 *
 * 章节按应用生命周期顺序排列：
 * 执行摘要 → 价值主张 → 基础设施 → 算力 → 组织安全
 * → 供应链 → 部署 → 运行 → 可观测 → 架构 → 竞品 → 行业
 */
const sidebars: SidebarsConfig = {
  whitepaperSidebar: [
    'README',
    'ch01-executive-summary',
    'ch02-from-hardware-to-application-value',
    'ch03-infrastructure-readiness',
    'ch04-compute-readiness',
    'ch05-organization-security',
    'ch06-application-supply-chain',
    'ch07-application-deployment',
    'ch08-application-runtime',
    'ch09-application-observability',
    'ch10-platform-architecture',
    'ch11-competitive-analysis',
    'ch12-industry-scenarios',
  ],
};

export default sidebars;
