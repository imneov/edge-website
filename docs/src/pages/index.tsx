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
  Cpu,
  HardDrive,
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
      <div className={styles.heroMesh} aria-hidden="true">
        <div className={styles.meshBlob1} />
        <div className={styles.meshBlob2} />
        <div className={styles.meshBlob3} />
      </div>

      <div className="container">
        {/* Badge */}
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeText}>
            企业级多租户边缘智能计算平台
          </span>
        </div>

        {/* Title */}
        <h1 className={clsx('hero__title', styles.heroTitle)}>{siteConfig.title}</h1>

        {/* Subtitle */}
        <p className="hero__subtitle">
          统一 IAM 权限体系与多集群调度，实现从云端到边缘的全栈资源编排与 AI 应用规模化部署
        </p>

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
            两层权限链（应用侧与资源侧）统一纳管，控制面与边缘运行时解耦
          </p>
        </div>

        <div className={styles.architectureDiagram}>
          <svg
            viewBox="0 0 960 430"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.architectureSvg}
            role="img"
            aria-label="边缘平台架构图：云端控制面 + 可选边缘运行时 + 边缘节点"
          >
            {/* ---- Cloud Control Plane ---- */}
            <rect
              x="160"
              y="20"
              width="640"
              height="105"
              rx="12"
              className={styles.archCloudBox}
            />
            <Cloud
              x="200"
              y="36"
              width="24"
              height="24"
              className={styles.archIcon}
            />
            <text x="480" y="52" className={styles.archTitle} textAnchor="middle">
              云端控制面
            </text>
            {/* Dividers inside cloud box */}
            <line x1="453" y1="60" x2="453" y2="115" className={styles.archDivider} />
            <line x1="667" y1="60" x2="667" y2="115" className={styles.archDivider} />
            {/* Component 1: edge-apiserver */}
            <Shield
              x="185"
              y="65"
              width="18"
              height="18"
              className={styles.archIconSmall}
            />
            <text x="306" y="79" className={styles.archComponentTitle} textAnchor="middle">
              edge-apiserver
            </text>
            <text x="306" y="98" className={styles.archSubtext} textAnchor="middle">
              7层请求过滤链
            </text>
            {/* Component 2: edge-controller */}
            <Settings
              x="470"
              y="65"
              width="18"
              height="18"
              className={styles.archIconSmall}
            />
            <text x="560" y="79" className={styles.archComponentTitle} textAnchor="middle">
              edge-controller
            </text>
            <text x="560" y="98" className={styles.archSubtext} textAnchor="middle">
              12+ K8s 控制器
            </text>
            {/* Component 3: edge-console */}
            <MonitorCheck
              x="683"
              y="65"
              width="18"
              height="18"
              className={styles.archIconSmall}
            />
            <text x="775" y="79" className={styles.archComponentTitle} textAnchor="middle">
              edge-console
            </text>
            <text x="775" y="98" className={styles.archSubtext} textAnchor="middle">
              管理控制台
            </text>

            {/* ---- Connection lines Cloud → Cluster Layer ---- */}
            <line
              x1="330"
              y1="125"
              x2="210"
              y2="185"
              className={styles.archLine}
            />
            <line
              x1="480"
              y1="125"
              x2="480"
              y2="185"
              className={styles.archLine}
            />
            <line
              x1="630"
              y1="125"
              x2="750"
              y2="185"
              className={styles.archLine}
            />
            {/* Connection mode labels */}
            <text x="248" y="162" className={styles.archConnLabel} textAnchor="middle">
              Direct
            </text>
            <text x="714" y="162" className={styles.archConnLabel} textAnchor="middle">
              Proxy
            </text>

            {/* ---- Edge Cluster Layer ---- */}
            {/* Cluster A - Direct mode */}
            <rect
              x="80"
              y="185"
              width="260"
              height="88"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Network
              x="105"
              y="202"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="210" y="218" className={styles.archTitle} textAnchor="middle">
              边缘集群 A
            </text>
            <text x="210" y="238" className={styles.archSubtext} textAnchor="middle">
              可选运行时:
            </text>
            <text x="210" y="258" className={styles.archSubtext} textAnchor="middle">
              OpenYurt / KubeEdge / K8s
            </text>

            {/* Center - vCluster (optional) */}
            <rect
              x="360"
              y="185"
              width="240"
              height="88"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Server
              x="385"
              y="202"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="480" y="218" className={styles.archTitle} textAnchor="middle">
              虚拟集群
            </text>
            <text x="480" y="242" className={styles.archSubtext} textAnchor="middle">
              vCluster (按需创建)
            </text>
            <text x="480" y="262" className={styles.archSubtext} textAnchor="middle">
              自动安装边缘运行时
            </text>

            {/* Cluster B - Proxy mode */}
            <rect
              x="620"
              y="185"
              width="260"
              height="88"
              rx="10"
              className={styles.archGatewayBox}
            />
            <Network
              x="645"
              y="202"
              width="20"
              height="20"
              className={styles.archIcon}
            />
            <text x="750" y="218" className={styles.archTitle} textAnchor="middle">
              边缘集群 B
            </text>
            <text x="750" y="238" className={styles.archSubtext} textAnchor="middle">
              可选运行时:
            </text>
            <text x="750" y="258" className={styles.archSubtext} textAnchor="middle">
              KubeEdge / OpenYurt / K8s
            </text>

            {/* ---- Connection lines Cluster → Edge Nodes ---- */}
            <line x1="150" y1="273" x2="110" y2="330" className={styles.archLine} />
            <line x1="270" y1="273" x2="270" y2="330" className={styles.archLine} />
            <line x1="660" y1="273" x2="630" y2="330" className={styles.archLine} />
            <line x1="840" y1="273" x2="870" y2="330" className={styles.archLine} />
            <line x1="480" y1="273" x2="480" y2="330" className={styles.archLine} />

            {/* ---- Edge Nodes Layer ---- */}
            {[50, 200, 410, 600, 800].map((nodeX, idx) => (
              <g key={idx}>
                <rect
                  x={nodeX}
                  y="330"
                  width="140"
                  height="60"
                  rx="8"
                  className={styles.archNodeBox}
                />
                <Smartphone
                  x={nodeX + 12}
                  y="346"
                  width="16"
                  height="16"
                  className={styles.archIconSmall}
                />
                <text
                  x={nodeX + 70}
                  y="357"
                  className={styles.archNodeTitle}
                  textAnchor="middle"
                >
                  边缘节点 {idx + 1}
                </text>
                <text
                  x={nodeX + 70}
                  y="378"
                  className={styles.archNodeSubtext}
                  textAnchor="middle"
                >
                  算力 / 设备
                </text>
              </g>
            ))}

            {/* ---- Layer labels (left side) ---- */}
            <text x="12" y="73" className={styles.archLayerLabel}>
              云端
            </text>
            <text x="12" y="232" className={styles.archLayerLabel}>
              边缘
            </text>
            <text x="12" y="365" className={styles.archLayerLabel}>
              节点
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
    title: '统一权限管理',
    description:
      'edge-apiserver 7 层请求过滤链实现统一认证与授权；单一 IAMRole/IAMRoleBinding 模型覆盖从 Platform 到 Namespace 的全层级权限，无需重复配置。',
    Icon: Shield,
  },
  {
    number: '02',
    title: '多集群调度',
    description:
      '支持 Direct（KubeConfig）和 Proxy（反向隧道）两种集群接入模式，edge-controller 内置 12+ 控制器处理跨集群资源调度与 RoleTemplate 聚合。',
    Icon: Cloud,
  },
  {
    number: '03',
    title: '边云协同',
    description:
      '三种边缘运行时（OpenYurt、KubeEdge、vanilla K8s）均为可选，平台核心与具体运行时解耦；vCluster 按需自动创建并安装边缘运行时。',
    Icon: Zap,
  },
  {
    number: '04',
    title: '开放标准',
    description:
      '基于 Kubernetes 标准 API 构建，兼容主流可观测性方案（Prometheus）；集成 VAST 存储虚拟化与 HAMi GPU 虚拟化，加速 AI 应用边缘部署。',
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
  { name: 'HAMi', Icon: Cpu },
  { name: 'VAST', Icon: HardDrive },
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
