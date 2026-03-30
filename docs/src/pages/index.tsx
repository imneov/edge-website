/**
 * Edge Platform Homepage
 *
 * Structure:
 * 1. Hero Banner - animated gradient with stats and CTAs
 * 2. Wave Divider
 * 3. Architecture Overview - cloud-edge SVG diagram
 * 4. Core Capabilities - 6 feature cards (delegated to HomepageFeatures)
 * 5. Platform Highlights - numbered differentiators with count-up
 * 6. Technology Ecosystem - integration logo grid
 * 7. Quick Start Steps - 3-step onboarding with staggered entry
 */
import React, { useState, useRef, useEffect } from 'react';
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
   Scroll Animation Hook
   ============================================ */

/** One-shot IntersectionObserver — fires once, then disconnects. */
function useScrollAnimation(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ============================================
   Count-up Hook (requestAnimationFrame, no libs)
   ============================================ */

/**
 * Counts from 0 to `target` over `duration` ms using ease-out cubic.
 * Starts only when `isVisible` becomes true.
 */
function useCountUp(target: number, isVisible: boolean, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let rafId: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, target, duration]);

  return count;
}

/* ============================================
   Wave Divider
   ============================================ */

/** SVG wave separator placed between Hero and Architecture. */
function WaveDivider() {
  return (
    <div className={styles.waveDivider} aria-hidden="true">
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none">
        <path
          d="M0,28 C360,56 720,0 1080,28 C1260,42 1380,14 1440,28 L1440,56 L0,56 Z"
          className={styles.wavePath}
        />
      </svg>
    </div>
  );
}

/* ============================================
   Section 1: Hero Banner
   ============================================ */

interface TechPillProps {
  name: string;
  icon: string;
}

function TechPill({ name, icon }: TechPillProps) {
  return (
    <div className={styles.techPill}>
      <img src={icon} alt={name} className={styles.techPillIcon} />
      <span className={styles.techPillLabel}>{name}</span>
    </div>
  );
}

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();

  const techStack = [
    { name: 'Kubernetes', icon: '/img/kubernetes.svg' },
    { name: 'Helm', icon: '/img/helm.svg' },
    { name: 'Go', icon: '/img/go.svg' },
  ];

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroMesh} aria-hidden="true">
        <div className={styles.meshBlob1} />
        <div className={styles.meshBlob2} />
        <div className={styles.meshBlob3} />
      </div>
      {/* Geometric network grid — evokes edge computing topology */}
      <div className={styles.heroGeoGrid} aria-hidden="true">
        <svg className={styles.heroGeoSvg} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice">
          {/* Grid lines */}
          <line x1="0" y1="150" x2="1440" y2="150" className={styles.geoLine} />
          <line x1="0" y1="300" x2="1440" y2="300" className={styles.geoLine} />
          <line x1="0" y1="450" x2="1440" y2="450" className={styles.geoLine} />
          <line x1="360" y1="0" x2="360" y2="600" className={styles.geoLine} />
          <line x1="720" y1="0" x2="720" y2="600" className={styles.geoLine} />
          <line x1="1080" y1="0" x2="1080" y2="600" className={styles.geoLine} />
          {/* Connection lines between nodes */}
          <line x1="360" y1="150" x2="720" y2="300" className={styles.geoConnection} />
          <line x1="720" y1="300" x2="1080" y2="150" className={styles.geoConnection} />
          <line x1="360" y1="450" x2="720" y2="300" className={styles.geoConnection} />
          <line x1="720" y1="300" x2="1080" y2="450" className={styles.geoConnection} />
          <line x1="180" y1="300" x2="360" y2="150" className={styles.geoConnection} />
          <line x1="1080" y1="150" x2="1260" y2="300" className={styles.geoConnection} />
          {/* Node points at intersections */}
          {[[360,150],[720,150],[1080,150],[180,300],[360,300],[720,300],[1080,300],[1260,300],[360,450],[720,450],[1080,450]].map(([cx,cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3" className={styles.geoNode} />
              <circle cx={cx} cy={cy} r="8" className={styles.geoNodePulse} style={{ animationDelay: `${i * 0.6}s` }} />
            </g>
          ))}
        </svg>
        {/* Ripple pulse — simulates computing power dispatch */}
        <div className={styles.heroRipple} />
        <div className={styles.heroRipple2} />
      </div>
      {/* Stats strip with computing icons */}
      <div className={styles.heroStatsStrip} aria-hidden="true">
        <div className={styles.heroStatChip}>
          <Server size={16} style={{ opacity: 0.7 }} />
          <span>3+ 边缘运行时</span>
        </div>
        <div className={styles.heroStatChip}>
          <Shield size={16} style={{ opacity: 0.7 }} />
          <span>5 层权限体系</span>
        </div>
        <div className={styles.heroStatChip}>
          <Network size={16} style={{ opacity: 0.7 }} />
          <span>2 种集群接入</span>
        </div>
      </div>

      <div className="container">
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeText}>
            企业级多租户边缘智能计算平台
          </span>
        </div>

        <h1 className={clsx('hero__title', styles.heroTitle)}>{siteConfig.title}</h1>

        <p className="hero__subtitle">
          统一 IAM 权限体系与多集群调度，实现从云端到边缘的全栈资源编排与 AI 应用规模化部署
        </p>

        <div className={styles.techPills}>
          {techStack.map((tech) => (
            <TechPill key={tech.name} {...tech} />
          ))}
        </div>

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

const COMPONENT_TOOLTIPS: Record<string, string> = {
  apiserver: '统一 API 网关，7 层请求过滤链',
  controller: '12+ K8s 控制器，IAM/RBAC 转换',
  console: '管理控制台，多视图前端',
  clusterA: '直连模式，KubeConfig 接入',
  vcluster: '虚拟集群，自动安装边缘运行时',
  clusterB: '代理模式，反向隧道接入',
};

type LayerKey = 'cloud' | 'cluster' | 'node';

interface TooltipState {
  key: string;
  x: number;
  y: number;
}

function ArchitectureSection() {
  const [hoverLayer, setHoverLayer] = useState<LayerKey | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation(0.05);

  function layerOpacity(layer: LayerKey): number {
    if (!hoverLayer) return 1;
    return hoverLayer === layer ? 1 : 0.35;
  }

  function layerScale(layer: LayerKey): string {
    return hoverLayer === layer ? 'scale(1.015)' : 'scale(1)';
  }

  function onComponentEnter(key: string, e: React.MouseEvent<SVGElement>) {
    const cnt = containerRef.current;
    if (!cnt) return;
    const r = cnt.getBoundingClientRect();
    setTooltip({ key, x: e.clientX - r.left, y: e.clientY - r.top });
  }

  function onComponentTap(key: string, e: React.TouchEvent<SVGElement>) {
    e.stopPropagation();
    const cnt = containerRef.current;
    if (!cnt) return;
    const t = e.changedTouches[0];
    const r = cnt.getBoundingClientRect();
    setTooltip({ key, x: t.clientX - r.left, y: t.clientY - r.top });
  }

  const onComponentLeave = () => setTooltip(null);

  const c2clPaths = [
    'M330,125 L210,185',
    'M480,125 L480,185',
    'M630,125 L750,185',
  ];
  const cl2nPaths = [
    'M150,273 L110,330',
    'M270,273 L270,330',
    'M480,273 L480,330',
  ];

  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <div
          ref={sectionRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, sectionVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>平台架构</h2>
          <p className={styles.sectionSubtitle}>
            两层权限链（应用侧与资源侧）统一纳管，控制面与边缘运行时解耦
          </p>
        </div>

        <div
          className={styles.architectureDiagram}
          ref={containerRef}
          style={{ position: 'relative' }}
          onTouchStart={() => { setHoverLayer(null); setTooltip(null); }}
        >
          {tooltip && (
            <div
              className={styles.archTooltip}
              style={{ left: tooltip.x, top: tooltip.y + 14 }}
              aria-hidden="true"
            >
              <span className={styles.archTooltipArrow} />
              {COMPONENT_TOOLTIPS[tooltip.key]}
            </div>
          )}

          <svg
            viewBox="0 0 960 430"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.architectureSvg}
            role="img"
            aria-label="边缘平台架构图：云端控制面 + 可选边缘运行时 + 边缘节点"
            onMouseLeave={() => { setHoverLayer(null); setTooltip(null); }}
            onTouchStart={(e) => { setHoverLayer(null); setTooltip(null); }}
          >
            {c2clPaths.map((path, i) => (
              <circle key={`p-c2cl-${i}`} cx="0" cy="0" r="3" className={styles.archPulseDown}>
                <animateMotion
                  dur={`${2.5 + i * 0.5}s`}
                  begin={`${i * 0.8}s`}
                  repeatCount="indefinite"
                  path={path}
                />
              </circle>
            ))}

            {cl2nPaths.map((path, i) => (
              <circle key={`p-cl2n-${i}`} cx="0" cy="0" r="2.5" className={styles.archPulseDown}>
                <animateMotion
                  dur={`${2 + i * 0.4}s`}
                  begin={`${i * 0.6 + 0.3}s`}
                  repeatCount="indefinite"
                  path={path}
                />
              </circle>
            ))}

            {c2clPaths.map((path, i) => (
              <circle key={`p-up-${i}`} cx="0" cy="0" r="2" className={styles.archPulseUp}>
                <animateMotion
                  dur={`${3 + i * 0.6}s`}
                  begin={`${i * 1.1 + 1.5}s`}
                  repeatCount="indefinite"
                  keyPoints="1;0"
                  keyTimes="0;1"
                  calcMode="linear"
                  path={path}
                />
              </circle>
            ))}

            <line x1="330" y1="125" x2="210" y2="185" className={styles.archLine} />
            <line x1="480" y1="125" x2="480" y2="185" className={styles.archLine} />
            <line x1="630" y1="125" x2="750" y2="185" className={styles.archLine} />
            <text x="248" y="162" className={styles.archConnLabel} textAnchor="middle">Direct</text>
            <text x="714" y="162" className={styles.archConnLabel} textAnchor="middle">Proxy</text>
            <line x1="150" y1="273" x2="110" y2="330" className={styles.archLine} />
            <line x1="270" y1="273" x2="270" y2="330" className={styles.archLine} />
            <line x1="660" y1="273" x2="630" y2="330" className={styles.archLine} />
            <line x1="840" y1="273" x2="870" y2="330" className={styles.archLine} />
            <line x1="480" y1="273" x2="480" y2="330" className={styles.archLine} />

            <g
              style={{
                opacity: layerOpacity('cloud'),
                transform: layerScale('cloud'),
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
              }}
              onMouseEnter={() => setHoverLayer('cloud')}
            >
              <rect x="160" y="20" width="640" height="105" rx="12" className={styles.archCloudBox} />
              <Cloud x="200" y="36" width="24" height="24" className={styles.archIcon} />
              <text x="480" y="52" className={styles.archTitle} textAnchor="middle">云端控制面</text>
              <line x1="453" y1="60" x2="453" y2="115" className={styles.archDivider} />
              <line x1="667" y1="60" x2="667" y2="115" className={styles.archDivider} />
              <Shield x="185" y="65" width="18" height="18" className={styles.archIconSmall} />
              <text x="306" y="79" className={styles.archComponentTitle} textAnchor="middle">edge-apiserver</text>
              <text x="306" y="98" className={styles.archSubtext} textAnchor="middle">7层请求过滤链</text>
              <Settings x="470" y="65" width="18" height="18" className={styles.archIconSmall} />
              <text x="560" y="79" className={styles.archComponentTitle} textAnchor="middle">edge-controller</text>
              <text x="560" y="98" className={styles.archSubtext} textAnchor="middle">12+ K8s 控制器</text>
              <MonitorCheck x="683" y="65" width="18" height="18" className={styles.archIconSmall} />
              <text x="775" y="79" className={styles.archComponentTitle} textAnchor="middle">edge-console</text>
              <text x="775" y="98" className={styles.archSubtext} textAnchor="middle">管理控制台</text>
              <rect x="166" y="58" width="282" height="62" rx="6" className={styles.archComponentHitbox}
                    onMouseEnter={(e) => onComponentEnter('apiserver', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('apiserver', e)} />
              <rect x="453" y="58" width="209" height="62" rx="6" className={styles.archComponentHitbox}
                    onMouseEnter={(e) => onComponentEnter('controller', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('controller', e)} />
              <rect x="667" y="58" width="128" height="62" rx="6" className={styles.archComponentHitbox}
                    onMouseEnter={(e) => onComponentEnter('console', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('console', e)} />
            </g>

            <g
              style={{
                opacity: layerOpacity('cluster'),
                transform: layerScale('cluster'),
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
              }}
              onMouseEnter={() => setHoverLayer('cluster')}
            >
              <rect x="80" y="185" width="260" height="88" rx="10" className={styles.archGatewayBox}
                    onMouseEnter={(e) => onComponentEnter('clusterA', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('clusterA', e)} />
              <Network x="105" y="202" width="20" height="20" className={styles.archIcon} />
              <text x="210" y="218" className={styles.archTitle} textAnchor="middle">边缘集群 A</text>
              <text x="210" y="238" className={styles.archSubtext} textAnchor="middle">可选运行时:</text>
              <text x="210" y="258" className={styles.archSubtext} textAnchor="middle">OpenYurt / KubeEdge / K8s</text>

              <rect x="360" y="185" width="240" height="88" rx="10" className={styles.archGatewayBox}
                    onMouseEnter={(e) => onComponentEnter('vcluster', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('vcluster', e)} />
              <Server x="385" y="202" width="20" height="20" className={styles.archIcon} />
              <text x="480" y="218" className={styles.archTitle} textAnchor="middle">虚拟集群</text>
              <text x="480" y="242" className={styles.archSubtext} textAnchor="middle">vCluster (按需创建)</text>
              <text x="480" y="262" className={styles.archSubtext} textAnchor="middle">自动安装边缘运行时</text>

              <rect x="620" y="185" width="260" height="88" rx="10" className={styles.archGatewayBox}
                    onMouseEnter={(e) => onComponentEnter('clusterB', e)} onMouseLeave={onComponentLeave}
                    onTouchStart={(e) => onComponentTap('clusterB', e)} />
              <Network x="645" y="202" width="20" height="20" className={styles.archIcon} />
              <text x="750" y="218" className={styles.archTitle} textAnchor="middle">边缘集群 B</text>
              <text x="750" y="238" className={styles.archSubtext} textAnchor="middle">可选运行时:</text>
              <text x="750" y="258" className={styles.archSubtext} textAnchor="middle">KubeEdge / OpenYurt / K8s</text>
            </g>

            <g
              style={{
                opacity: layerOpacity('node'),
                transform: layerScale('node'),
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
              }}
              onMouseEnter={() => setHoverLayer('node')}
            >
              {[50, 200, 410, 600, 800].map((nodeX, idx) => (
                <g key={idx}>
                  <rect x={nodeX} y="330" width="140" height="60" rx="8" className={styles.archNodeBox} />
                  <Smartphone x={nodeX + 12} y="346" width="16" height="16" className={styles.archIconSmall} />
                  <text x={nodeX + 70} y="357" className={styles.archNodeTitle} textAnchor="middle">
                    边缘节点 {idx + 1}
                  </text>
                  <text x={nodeX + 70} y="378" className={styles.archNodeSubtext} textAnchor="middle">
                    算力 / 设备
                  </text>
                </g>
              ))}
            </g>

            <text x="12" y="73" className={styles.archLayerLabel}>云端</text>
            <text x="12" y="232" className={styles.archLayerLabel}>边缘</text>
            <text x="12" y="365" className={styles.archLayerLabel}>节点</text>
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

/** Single highlight item with count-up on the ordinal and scroll entry. */
function AnimatedHighlightItem({ item, delay }: { item: HighlightItem; delay: number }) {
  const { ref, isVisible } = useScrollAnimation();
  const targetNum = parseInt(item.number, 10);
  const count = useCountUp(targetNum, isVisible);
  const displayNum = String(count).padStart(2, '0');

  return (
    <div
      ref={ref}
      className={clsx(styles.highlightItem, styles.scrollAnimate, isVisible && styles.visible)}
      style={{ '--delay': `${delay}s` } as React.CSSProperties}
    >
      <div className={styles.highlightNumber}>{displayNum}</div>
      <div className={styles.highlightContent}>
        <div className={styles.highlightTitleRow}>
          <item.Icon className={styles.highlightIcon} />
          <h3 className={styles.highlightTitle}>{item.title}</h3>
        </div>
        <p className={styles.highlightDesc}>{item.description}</p>
      </div>
    </div>
  );
}

function HighlightsSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className={styles.highlightsSection}>
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>平台优势</h2>
          <p className={styles.sectionSubtitle}>
            面向企业级边缘场景，提供安全、高效、开放的全栈解决方案
          </p>
        </div>

        <div className={styles.highlightsList}>
          {HIGHLIGHTS.map((item, idx) => (
            <AnimatedHighlightItem key={item.number} item={item} delay={idx * 0.15} />
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

function EcosystemSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

  return (
    <section className={styles.ecosystemSection}>
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>技术生态</h2>
          <p className={styles.sectionSubtitle}>
            基于云原生开源技术栈构建，与主流工具链无缝集成
          </p>
        </div>

        <div
          ref={gridRef}
          className={clsx(styles.ecosystemGrid, styles.scrollAnimate, gridVisible && styles.visible)}
        >
          {ECOSYSTEM.map((tech, idx) => (
            <div
              key={tech.name}
              className={styles.ecosystemItem}
              style={{ '--delay': `${idx * 0.07}s` } as React.CSSProperties}
            >
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

/** Single step card with staggered scroll entry. */
function AnimatedStepCard({ item, delay }: { item: StepItem; delay: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={clsx(styles.stepCard, styles.scrollAnimate, isVisible && styles.visible)}
      style={{ '--delay': `${delay}s` } as React.CSSProperties}
    >
      <div className={styles.stepNumber}>{item.step}</div>
      <item.Icon className={styles.stepIcon} />
      <h3 className={styles.stepTitle}>{item.title}</h3>
      <p className={styles.stepDesc}>{item.description}</p>
    </div>
  );
}

function QuickStartSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>快速上手</h2>
          <p className={styles.sectionSubtitle}>
            三步完成从部署到应用分发的完整流程
          </p>
        </div>

        <div className={styles.stepsRow}>
          {STEPS.map((item, idx) => (
            <React.Fragment key={item.step}>
              <AnimatedStepCard item={item} delay={idx * 0.18} />
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

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - 智能边缘计算平台`}
      description="面向云原生应用的智能边缘计算平台，提供边缘集群管理、应用分发、GitOps 工作流等核心能力"
    >
      <HeroSection />
      <WaveDivider />
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
