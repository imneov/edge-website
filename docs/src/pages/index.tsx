/**
 * Edge Platform Homepage
 *
 * Structure:
 * 1. Hero Banner - animated gradient with stats and CTAs
 * 2. Architecture Overview - cloud-edge SVG diagram
 * 3. Core Capabilities - 6 feature cards (delegated to HomepageFeatures)
 * 4. Platform Highlights - numbered differentiators
 * 5. Technology Ecosystem - integration logo grid
 * 6. Quick Start Steps - 3-step onboarding
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import {
  Cloud,
  Network,
  Server,
  Smartphone,
  Shield,
  Zap,
  Settings,
  ArrowRight,
  Download,
  MonitorCheck,
  Rocket,
} from 'lucide-react';

import styles from './index.module.css';

/* ============================================
   Section 1: Hero Banner
   ============================================ */

/** Tech stack pill displayed in the hero section */
interface TechPillProps {
  name: string;
  icon: string;
}

/** Renders a single technology badge with icon and label */
function TechPill({ name, icon }: TechPillProps) {
  return (
    <div className={styles.techPill}>
      <img src={icon} alt={name} className={styles.techPillIcon} />
      <span className={styles.techPillLabel}>{name}</span>
    </div>
  );
}

/** Hero banner with animated background, stats, and CTAs */
function HeroSection() {
  const { siteConfig } = useDocusaurusContext();

  const techStack = [
    { name: 'Kubernetes', icon: '/img/kubernetes.svg' },
    { name: 'Helm', icon: '/img/helm.svg' },
    { name: 'Go', icon: '/img/go.svg' },
  ];

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      {/* Animated mesh background */}
      <div className={styles.heroMesh} aria-hidden="true" />

      <div className="container">
        {/* Badge */}
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeText}>
            面向云原生应用的智能边缘计算平台
          </span>
        </div>

        {/* Title */}
        <h1 className="hero__title">{siteConfig.title}</h1>

        {/* Subtitle - strengthened value proposition */}
        <p className="hero__subtitle">
          统一管理云端与边缘基础设施，实现应用从开发到边缘节点的全生命周期管理
        </p>

        {/* Stats counters */}
        <div className={styles.heroStats}>
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatValue}>1000+</span>
            <span className={styles.heroStatLabel}>边缘节点</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatValue}>50+</span>
            <span className={styles.heroStatLabel}>集群管理</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatValue}>99.9%</span>
            <span className={styles.heroStatLabel}>高可用</span>
          </div>
        </div>

        {/* Tech pills */}
        <div className={styles.techPills}>
          {techStack.map((tech) => (
            <TechPill key={tech.name} {...tech} />
          ))}
        </div>

        {/* CTAs */}
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            快速开始
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/whitepaper/README"
          >
            技术白皮书
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================================
   Section 2: Architecture Overview
   ============================================ */

/** Cloud-edge architecture SVG diagram */
function ArchitectureSection() {
  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>平台架构</h2>
          <p className={styles.sectionSubtitle}>
            云边协同的分布式计算架构，统一管理从云端到边缘节点的全链路
          </p>
        </div>

        <div className={styles.architectureDiagram}>
          <svg
            viewBox="0 0 960 420"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.architectureSvg}
            role="img"
            aria-label="边缘平台云边协同架构图"
          >
            {/* ---- Cloud Layer ---- */}
            <rect
              x="280"
              y="20"
              width="400"
              height="90"
              rx="12"
              className={styles.archCloudBox}
            />
            <Cloud
              x="370"
              y="36"
              width="24"
              height="24"
              className={styles.archIcon}
            />
            <text x="480" y="55" className={styles.archTitle} textAnchor="middle">
              云端管理面
            </text>
            <text x="480" y="80" className={styles.archSubtext} textAnchor="middle">
              API Server / Controller / Console
            </text>

            {/* ---- Connection lines Cloud → Gateway ---- */}
            <line
              x1="380"
              y1="110"
              x2="240"
              y2="180"
              className={styles.archLine}
            />
            <line
              x1="480"
              y1="110"
              x2="480"
              y2="180"
              className={styles.archLine}
            />
            <line
              x1="580"
              y1="110"
              x2="720"
              y2="180"
              className={styles.archLine}
            />

            {/* ---- Edge Gateway Layer ---- */}
            <rect
              x="120"
              y="180"
              width="240"
              height="80"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Network
              x="160"
              y="200"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="240" y="215" className={styles.archTitle} textAnchor="middle">
              边缘网关 A
            </text>
            <text x="240" y="240" className={styles.archSubtext} textAnchor="middle">
              KubeEdge / OpenYurt
            </text>

            <rect
              x="600"
              y="180"
              width="240"
              height="80"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Network
              x="640"
              y="200"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="720" y="215" className={styles.archTitle} textAnchor="middle">
              边缘网关 B
            </text>
            <text x="720" y="240" className={styles.archSubtext} textAnchor="middle">
              KubeEdge / OpenYurt
            </text>

            {/* Center gateway (vCluster) */}
            <rect
              x="370"
              y="180"
              width="220"
              height="80"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Server
              x="405"
              y="200"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="480" y="215" className={styles.archTitle} textAnchor="middle">
              虚拟集群
            </text>
            <text x="480" y="240" className={styles.archSubtext} textAnchor="middle">
              vCluster
            </text>

            {/* ---- Connection lines Gateway → Edge Nodes ---- */}
            <line
              x1="180"
              y1="260"
              x2="120"
              y2="320"
              className={styles.archLine}
            />
            <line
              x1="300"
              y1="260"
              x2="300"
              y2="320"
              className={styles.archLine}
            />
            <line
              x1="660"
              y1="260"
              x2="600"
              y2="320"
              className={styles.archLine}
            />
            <line
              x1="780"
              y1="260"
              x2="840"
              y2="320"
              className={styles.archLine}
            />
            <line
              x1="480"
              y1="260"
              x2="480"
              y2="320"
              className={styles.archLine}
            />

            {/* ---- Edge Nodes Layer ---- */}
            {[60, 240, 420, 540, 780].map((nodeX, idx) => (
              <g key={idx}>
                <rect
                  x={nodeX}
                  y="320"
                  width="140"
                  height="60"
                  rx="8"
                  className={styles.archNodeBox}
                />
                <Smartphone
                  x={nodeX + 12}
                  y="336"
                  width="16"
                  height="16"
                  className={styles.archIconSmall}
                />
                <text
                  x={nodeX + 70}
                  y="347"
                  className={styles.archNodeTitle}
                  textAnchor="middle"
                >
                  边缘节点 {idx + 1}
                </text>
                <text
                  x={nodeX + 70}
                  y="368"
                  className={styles.archNodeSubtext}
                  textAnchor="middle"
                >
                  终端设备
                </text>
              </g>
            ))}

            {/* ---- Layer labels (left side) ---- */}
            <text x="20" y="65" className={styles.archLayerLabel}>
              云端
            </text>
            <text x="20" y="220" className={styles.archLayerLabel}>
              边缘
            </text>
            <text x="20" y="355" className={styles.archLayerLabel}>
              设备
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Section 4: Platform Highlights
   ============================================ */

interface HighlightItem {
  number: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const HIGHLIGHTS: HighlightItem[] = [
  {
    number: '01',
    title: '云边协同',
    description:
      '统一管理云端和边缘资源，支持 KubeEdge、OpenYurt 等主流边缘框架，实现跨地域、跨网络的集群协同。',
    Icon: Cloud,
  },
  {
    number: '02',
    title: '开箱即用',
    description:
      '基于 Helm 一键部署，内置集群管理、应用分发、监控告警等开箱即用的核心能力，降低边缘计算落地门槛。',
    Icon: Zap,
  },
  {
    number: '03',
    title: '安全可靠',
    description:
      '多租户工作空间隔离，细粒度 RBAC 权限控制，完整的审计日志，保障边缘业务安全合规运行。',
    Icon: Shield,
  },
  {
    number: '04',
    title: '开放标准',
    description:
      '全面拥抱云原生生态，基于 Kubernetes 标准 API 构建，兼容主流 CI/CD 工具链和可观测性方案。',
    Icon: Settings,
  },
];

/** Platform highlight numbered list */
function HighlightsSection() {
  return (
    <section className={styles.highlightsSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>平台优势</h2>
          <p className={styles.sectionSubtitle}>
            面向企业级边缘场景，提供安全、高效、开放的全栈解决方案
          </p>
        </div>

        <div className={styles.highlightsList}>
          {HIGHLIGHTS.map((item) => (
            <div key={item.number} className={styles.highlightItem}>
              <div className={styles.highlightNumber}>{item.number}</div>
              <div className={styles.highlightContent}>
                <div className={styles.highlightTitleRow}>
                  <item.Icon className={styles.highlightIcon} />
                  <h3 className={styles.highlightTitle}>{item.title}</h3>
                </div>
                <p className={styles.highlightDesc}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Section 5: Technology Ecosystem
   ============================================ */

interface TechItem {
  name: string;
  icon?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

const ECOSYSTEM: TechItem[] = [
  { name: 'Kubernetes', icon: '/img/kubernetes.svg' },
  { name: 'Helm', icon: '/img/helm.svg' },
  { name: 'Go', icon: '/img/go.svg' },
  { name: 'KubeEdge', Icon: Network },
  { name: 'OpenYurt', Icon: Server },
  { name: 'Prometheus', Icon: MonitorCheck },
];

/** Technology ecosystem logo grid */
function EcosystemSection() {
  return (
    <section className={styles.ecosystemSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>技术生态</h2>
          <p className={styles.sectionSubtitle}>
            基于云原生开源技术栈构建，与主流工具链无缝集成
          </p>
        </div>

        <div className={styles.ecosystemGrid}>
          {ECOSYSTEM.map((tech) => (
            <div key={tech.name} className={styles.ecosystemItem}>
              {tech.icon ? (
                <img
                  src={tech.icon}
                  alt={tech.name}
                  className={styles.ecosystemLogo}
                />
              ) : (
                tech.Icon && <tech.Icon className={styles.ecosystemIcon} />
              )}
              <span className={styles.ecosystemLabel}>{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Section 6: Quick Start Steps
   ============================================ */

interface StepItem {
  step: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  {
    step: 1,
    title: '安装部署',
    description: '通过 Helm Chart 一键部署平台管理面，配置边缘框架组件。',
    Icon: Download,
  },
  {
    step: 2,
    title: '注册集群',
    description: '将边缘 Kubernetes 集群注册到平台，自动纳管边缘节点。',
    Icon: MonitorCheck,
  },
  {
    step: 3,
    title: '部署应用',
    description: '通过应用商店或 GitOps 工作流，将应用分发到目标边缘集群。',
    Icon: Rocket,
  },
];

/** Quick start onboarding steps */
function QuickStartSection() {
  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>快速上手</h2>
          <p className={styles.sectionSubtitle}>
            三步完成从部署到应用分发的完整流程
          </p>
        </div>

        <div className={styles.stepsRow}>
          {STEPS.map((item, idx) => (
            <React.Fragment key={item.step}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <item.Icon className={styles.stepIcon} />
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.description}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className={styles.stepArrow} aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className={styles.quickStartCta}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            查看完整文档
            <ArrowRight
              style={{ marginLeft: '0.5rem', width: 18, height: 18 }}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Page Root
   ============================================ */

/** Homepage root component */
export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - 智能边缘计算平台`}
      description="面向云原生应用的智能边缘计算平台，提供边缘集群管理、应用分发、GitOps 工作流等核心能力"
    >
      <HeroSection />
      <main>
        <ArchitectureSection />
        <div className="background-grid">
          <HomepageFeatures />
        </div>
        <HighlightsSection />
        <EcosystemSection />
        <QuickStartSection />
      </main>
    </Layout>
  );
}
