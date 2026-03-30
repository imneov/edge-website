/**
 * Edge Platform Homepage — Commercial Enterprise (KSE-style)
 *
 * Structure:
 * 1. Hero         — dark solid bg, product name gradient, stats strip
 * 2. Platform     — split layout: left text + right architecture diagram
 * 3. Capabilities — rotating gradient headline + icon grid cards
 * 4. Value Props  — icon-left + text-right horizontal list
 * 5. Delivery     — 3-column cards with feature checklists
 * 6. Resources    — icon-left + text-right link list
 * 7. Final CTA    — dark bg, centered, contact info
 */
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HeroBackground from '@site/src/components/HeroBackground';
import {
  Cloud,
  Network,
  Server,
  Smartphone,
  Shield,
  Zap,
  Settings,
  ArrowRight,
  MonitorCheck,
  Cpu,
  HardDrive,
  CheckCircle2,
  BookOpen,
  FileText,
  Code2,
  Github,
} from 'lucide-react';

import styles from './index.module.css';

/* ============================================
   Scroll Animation Hook
   ============================================ */

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

/* Count-up hook — animates 0 → target over ~900ms when triggered */
function useCountUp(target: number, active: boolean, duration = 900): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;

    function step(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 2;
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return count;
}

/* ============================================
   Section 1: Hero Banner
   ============================================ */

const HERO_STATS = [
  { label: '边缘运行时', num: 3, suffix: '+', note: 'OpenYurt / KubeEdge / K8s', Icon: Server },
  { label: '权限层级', num: 5, suffix: ' 层', note: 'Platform → Namespace 全覆盖', Icon: Shield },
  { label: '集群接入模式', num: 2, suffix: ' 种', note: 'Direct & Proxy 双模式', Icon: Network },
];

function StatItem({ stat, active }: { stat: typeof HERO_STATS[number]; active: boolean }) {
  const count = useCountUp(stat.num, active);
  const { Icon } = stat;
  return (
    <div className={styles.heroStatItem}>
      <span className={styles.heroStatIcon}>
        <Icon width={20} height={20} />
      </span>
      <span className={styles.heroStatValue}>{count}{stat.suffix}</span>
      <span className={styles.heroStatLabel}>{stat.label}</span>
      <span className={styles.heroStatNote}>{stat.note}</span>
    </div>
  );
}

function useHeroMode(): 'particle-river' | 'aurora-wave' | 'circuit-pulse' {
  const [mode, setMode] = useState<'particle-river' | 'aurora-wave' | 'circuit-pulse'>('particle-river');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hero = params.get('hero');
    if (hero === 'aurora-wave' || hero === 'circuit-pulse' || hero === 'particle-river') {
      setMode(hero);
    }
  }, []);
  return mode;
}

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.1);
  const heroMode = useHeroMode();

  return (
    <header className={styles.heroBanner}>
      {/* Dynamic canvas background — "computing power flowing" */}
      <HeroBackground mode={heroMode} />

      {/* Grid glow dots layer — edge computing node visual */}
      <div className={styles.heroBannerGrid} aria-hidden="true" />

      {/* Geometric network topology — edge computing nodes & connections */}
      <div className={styles.heroGeoGrid} aria-hidden="true">
        <svg className={styles.heroGeoSvg} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice">
          {/* Grid structure lines */}
          <line x1="0" y1="150" x2="1440" y2="150" className={styles.geoLine} />
          <line x1="0" y1="300" x2="1440" y2="300" className={styles.geoLine} />
          <line x1="0" y1="450" x2="1440" y2="450" className={styles.geoLine} />
          <line x1="360" y1="0" x2="360" y2="600" className={styles.geoLine} />
          <line x1="720" y1="0" x2="720" y2="600" className={styles.geoLine} />
          <line x1="1080" y1="0" x2="1080" y2="600" className={styles.geoLine} />
          {/* Data flow connections between edge nodes */}
          <line x1="360" y1="150" x2="720" y2="300" className={styles.geoConnection} />
          <line x1="720" y1="300" x2="1080" y2="150" className={styles.geoConnection} />
          <line x1="360" y1="450" x2="720" y2="300" className={styles.geoConnection} />
          <line x1="720" y1="300" x2="1080" y2="450" className={styles.geoConnection} />
          <line x1="180" y1="300" x2="360" y2="150" className={styles.geoConnection} />
          <line x1="1080" y1="150" x2="1260" y2="300" className={styles.geoConnection} />
          {/* Edge computing node points with pulse animation */}
          {[[360,150],[720,150],[1080,150],[180,300],[360,300],[720,300],[1080,300],[1260,300],[360,450],[720,450],[1080,450]].map(([cx,cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3" className={styles.geoNode} />
              <circle cx={cx} cy={cy} r="8" className={styles.geoNodePulse} style={{ animationDelay: `${i * 0.55}s` }} />
            </g>
          ))}
        </svg>
        {/* Computing power ripple pulses */}
        <div className={styles.heroRipple} />
        <div className={styles.heroRipple2} />
      </div>

      <div className="container">
        <h1 className={styles.heroTitle}>
          下一代边缘智能算力平台
          <br />
          <span className={styles.heroProductName}>{siteConfig.title}</span>
        </h1>
        <p className={styles.heroTagline}>
          云边协同 &middot; 统一 IAM &middot; AI 规模化部署
        </p>
        <p className={styles.heroDesc}>
          Rise Edge 是一款面向多行业自治场景的云原生智能算力管理平台。
          融合应用全生命周期管理、资源分层调度、多租户隔离、VAST/HAMi 虚拟化等核心能力，
          构建从中心到边缘的一体化算力底座，统一管理分布式异构算力，
          加速 AI 应用规模化部署。
        </p>
        <Link className={styles.heroCta} to="#delivery">
          了解交付方式
          <ArrowRight style={{ marginLeft: '0.5rem', width: 18, height: 18 }} />
        </Link>

        {/* Stats strip with count-up animation */}
        <div className={styles.heroStats} ref={statsRef}>
          {HERO_STATS.map((s) => (
            <StatItem key={s.label} stat={s} active={statsVisible} />
          ))}
        </div>
      </div>
    </header>
  );
}

/* ============================================
   Section 2: Platform Architecture (Split Layout)
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

function PlatformSection() {
  const [hoverLayer, setHoverLayer] = useState<LayerKey | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation(0.05);
  const { ref: textRef, isVisible: textVisible } = useScrollAnimation(0.1);

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
    <section className={styles.platformSection} id="platform">
      <div className="container">
        <div className={styles.platformSplitContainer}>
          {/* Left: Text */}
          <div
            ref={textRef}
            className={clsx(styles.platformTextSide, styles.scrollAnimate, textVisible && styles.visible)}
          >
            <h2 className={styles.platformTitle}>统一管理，云边协同</h2>
            <p className={styles.platformDesc}>
              两条并行权限链（应用侧与资源侧）统一纳管，控制面与边缘运行时解耦。
              单一 IAMRole/IAMRoleBinding 模型覆盖从 Platform 到 Namespace
              的全层级，权限级联查找，无需为每层单独配置 RBAC。
            </p>
            <p className={styles.platformDesc}>
              支持 Direct（KubeConfig 直连）与 Proxy（反向隧道代理）两种集群接入模式，
              vCluster 按需自动创建并安装边缘运行时，兼容 OpenYurt、KubeEdge 和 vanilla K8s。
            </p>
            <div className={styles.platformButtons}>
              <Link className={styles.btnSecondary} to="/docs/intro">
                了解架构
              </Link>
              <Link className={styles.btnSecondary} to="/developer/intro">
                查看开发文档
              </Link>
            </div>
          </div>

          {/* Right: Architecture Diagram */}
          <div
            ref={sectionRef}
            className={clsx(styles.platformDiagramSide, styles.scrollAnimate, sectionVisible && styles.visible)}
          >
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
                onTouchStart={() => { setHoverLayer(null); setTooltip(null); }}
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
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Section 4: Value Propositions (Highlights)
   icon-left + text-right layout
   ============================================ */

interface ValueItem {
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const VALUES: ValueItem[] = [
  {
    title: '统一权限管理',
    description:
      'edge-apiserver 7 层请求过滤链实现统一认证与授权；单一 IAMRole/IAMRoleBinding 模型覆盖从 Platform 到 Namespace 的全层级权限，无需重复配置。权限级联查找机制确保层级间访问控制一致性，支持角色模板（RoleTemplate）聚合，大幅降低多集群权限管理复杂度。',
    Icon: Shield,
  },
  {
    title: '多集群弹性调度',
    description:
      '支持 Direct（KubeConfig）和 Proxy（反向隧道）两种集群接入模式，edge-controller 内置 12+ 控制器处理跨集群资源调度与 RoleTemplate 聚合。vCluster 按需自动创建并安装边缘运行时，实现集群生命周期全托管，降低基础设施运维负担。',
    Icon: Cloud,
  },
  {
    title: '边云一体协同',
    description:
      '三种边缘运行时（OpenYurt、KubeEdge、vanilla K8s）均为可选，平台核心与具体运行时解耦；统一的应用分发引擎支持将工作负载精准调度到目标边缘集群和节点组，实现真正的云边一体化运营。',
    Icon: Zap,
  },
  {
    title: '开放标准 · AI 就绪',
    description:
      '基于 Kubernetes 标准 API 构建，兼容主流可观测性方案（Prometheus）；深度集成 VAST 存储虚拟化与 HAMi GPU 虚拟化，支持多租户 GPU 资源共享与隔离，加速 AI 推理应用在边缘的规模化部署。',
    Icon: Cpu,
  },
];

function AnimatedValueItem({ item, delay }: { item: ValueItem; delay: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={clsx(styles.valueItem, styles.scrollAnimate, isVisible && styles.visible)}
      style={{ '--delay': `${delay}s` } as React.CSSProperties}
    >
      <div className={styles.valueIconWrapper}>
        <item.Icon className={styles.valueIcon} />
      </div>
      <div className={styles.valueContent}>
        <h3 className={styles.valueTitle}>{item.title}</h3>
        <p className={styles.valueDesc}>{item.description}</p>
      </div>
    </div>
  );
}

function ValuePropsSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className={styles.valuePropsSection}>
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>
            全面赋能{' '}
            <span className={styles.gradientAccent}>企业边缘计算</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            面向企业级边缘场景，提供安全、高效、开放的全栈解决方案
          </p>
        </div>

        <div className={styles.valueList}>
          {VALUES.map((item, idx) => (
            <AnimatedValueItem key={item.title} item={item} delay={idx * 0.12} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================
   Section 5: Delivery / Pricing (3-column cards)
   KSE kse_delivery style
   ============================================ */

interface DeliveryFeature {
  title: string;
  desc: string;
}

interface DeliveryTier {
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  subtitle: string;
  desc: string;
  contact: string;
  features: DeliveryFeature[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
}

const DELIVERY_TIERS: DeliveryTier[] = [
  {
    Icon: Cloud,
    name: 'SaaS 云服务',
    subtitle: '按需订阅',
    desc: '托管在 Rise Union 基础设施上，开箱即用，无需运维基础平台。按使用量付费，快速验证边缘场景价值。',
    contact: '联系销售获取报价',
    features: [
      { title: '统一 IAM 权限体系', desc: '平台级到命名空间级多层权限' },
      { title: '多集群统一管理', desc: '直连 / 代理双模式接入' },
      { title: '应用分发引擎', desc: 'Helm 模板 + 多集群分发' },
      { title: '可观测性集成', desc: 'Prometheus + 告警体系' },
      { title: '标准技术支持', desc: '工单支持，5×8 响应' },
    ],
    cta: '申请试用',
    ctaHref: '/docs/intro',
  },
  {
    Icon: Server,
    name: '私有化部署',
    subtitle: '自主可控',
    desc: '完整部署在企业自有数据中心或私有云，数据不出域，满足等保合规与行业监管要求，支持离线运行。',
    contact: '联系销售',
    featured: true,
    features: [
      { title: '完整平台能力', desc: '包含所有 SaaS 版功能' },
      { title: '私有环境隔离', desc: '数据主权，合规保障' },
      { title: '定制化能力', desc: '品牌、接口、流程深度定制' },
      { title: '专属 SLA 保障', desc: '99.9% 可用性承诺' },
      { title: '驻场技术支持', desc: '7×24 专属支持团队' },
    ],
    cta: '联系销售',
    ctaHref: '/docs/intro',
  },
  {
    Icon: HardDrive,
    name: '边缘一体机',
    subtitle: '场景化交付',
    desc: '软硬件一体化交付，针对工业、零售、交通、能源等垂直场景预集成边缘运行时与行业应用，现场快速上线。',
    contact: '联系销售',
    features: [
      { title: '软硬件一体', desc: '硬件 + 平台预装交付' },
      { title: '行业解决方案', desc: '工业 / 零售 / 交通 / 能源' },
      { title: '离线运行', desc: '无需持续云端连接' },
      { title: 'x86 / ARM64 兼容', desc: '主流边缘硬件平台支持' },
      { title: '现场实施', desc: '专业团队现场交付运维' },
    ],
    cta: '了解方案',
    ctaHref: '/docs/intro',
  },
];

function DeliverySection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className={styles.deliverySection} id="delivery">
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>
            灵活<span className={styles.gradientAccent}>交付方式</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            三种灵活的交付模式，覆盖从快速验证到生产级私有化部署的全场景需求
          </p>
        </div>

        <div className={styles.deliveryGrid}>
          {DELIVERY_TIERS.map((tier, idx) => (
            <DeliveryCard key={tier.name} tier={tier} delay={idx * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliveryCard({ tier, delay }: { tier: DeliveryTier; delay: number }) {
  const { ref, isVisible } = useScrollAnimation(0.08);

  return (
    <div
      ref={ref}
      className={clsx(styles.deliveryCard, tier.featured && styles.deliveryCardFeatured, styles.scrollAnimate, isVisible && styles.visible)}
      style={{ '--delay': `${delay}s` } as React.CSSProperties}
    >
      <tier.Icon className={styles.deliveryCardIcon} />
      <h3 className={styles.deliveryCardName}>{tier.name}</h3>
      <p className={styles.deliveryCardSubtitle}>{tier.subtitle}</p>
      <p className={styles.deliveryCardDesc}>{tier.desc}</p>

      <div className={styles.deliveryCardContact}>{tier.contact}</div>

      <ul className={styles.deliveryFeatureList}>
        {tier.features.map((f) => (
          <li key={f.title} className={styles.deliveryFeatureItem}>
            <div className={styles.deliveryFeatureTitleRow}>
              <CheckCircle2 className={styles.deliveryCheckIcon} />
              <span className={styles.deliveryFeatureTitle}>{f.title}</span>
            </div>
            <p className={styles.deliveryFeatureDesc}>{f.desc}</p>
          </li>
        ))}
      </ul>

      <div className={styles.deliveryCardBtn}>
        <Link className={styles.heroCta} to={tier.ctaHref}>
          {tier.cta}
        </Link>
      </div>
    </div>
  );
}

/* ============================================
   Section 6: Resources
   icon-left + text-right link rows (KSE kse_resources)
   ============================================ */

interface ResourceItem {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
}

const RESOURCES: ResourceItem[] = [
  {
    Icon: BookOpen,
    title: '快速入门文档',
    desc: '从安装部署到第一个应用分发，15 分钟完成边缘平台核心流程体验，涵盖集群注册与 IAM 配置。',
    href: '/docs/intro',
  },
  {
    Icon: FileText,
    title: '技术白皮书',
    desc: '深入解析统一 IAM 架构、多集群调度模型、边缘运行时抽象层设计，以及 VAST/HAMi GPU 虚拟化集成方案。',
    href: '/whitepaper/README',
  },
  {
    Icon: Code2,
    title: '开发者指南',
    desc: '面向平台扩展开发者，涵盖 API 参考、CRD 设计规范、Controller 开发模式与集成测试方法。',
    href: '/developer/intro',
  },
  {
    Icon: Github,
    title: '开源社区',
    desc: '关注项目进展，提交问题反馈，参与设计讨论。欢迎贡献代码、文档改进与用例分享。',
    href: 'https://github.com/theriseunion/edge-website',
    external: true,
  },
];

function ResourcesSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <section className={styles.resourcesSection}>
      <div className="container">
        <div
          ref={headerRef}
          className={clsx(styles.sectionHeader, styles.scrollAnimate, headerVisible && styles.visible)}
        >
          <h2 className={styles.sectionTitle}>相关资源</h2>
          <p className={styles.sectionSubtitle}>文档、白皮书与开发者社区，助力快速评估与落地</p>
        </div>

        <div className={styles.resourcesList}>
          {RESOURCES.map((item, idx) => (
            <ResourceRow key={item.title} item={item} delay={idx * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourceRow({ item, delay }: { item: ResourceItem; delay: number }) {
  const { ref, isVisible } = useScrollAnimation(0.08);

  return (
    <div
      ref={ref}
      className={clsx(styles.resourceItem, styles.scrollAnimate, isVisible && styles.visible)}
      style={{ '--delay': `${delay}s` } as React.CSSProperties}
    >
      <div className={styles.resourceIconWrapper}>
        <item.Icon className={styles.resourceIcon} />
      </div>
      <div className={styles.resourceContent}>
        <h3 className={styles.resourceTitle}>{item.title}</h3>
        <p className={styles.resourceDesc}>{item.desc}</p>
      </div>
      <Link
        className={styles.resourceMore}
        to={item.href}
        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        了解更多 <ArrowRight style={{ width: 14, height: 14, marginLeft: 4 }} />
      </Link>
    </div>
  );
}

/* ============================================
   Section 7: Final CTA
   ============================================ */

function FinalCtaSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section className={styles.finalCtaSection}>
      <div className="container">
        <div
          ref={ref}
          className={clsx(styles.finalCtaContent, styles.scrollAnimate, isVisible && styles.visible)}
        >
          <h2 className={styles.finalCtaTitle}>立即构建您的边缘智能底座</h2>
          <p className={styles.finalCtaDesc}>
            从中心到边缘，统一管理分布式异构算力
          </p>
          <div className={styles.finalCtaButtons}>
            <Link className={styles.heroCta} to="/docs/intro">
              快速开始
              <ArrowRight style={{ marginLeft: '0.5rem', width: 18, height: 18 }} />
            </Link>
            <Link className={styles.btnSecondaryLight} to="/whitepaper/README">
              技术白皮书
            </Link>
          </div>
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
      <main>
        <PlatformSection />
        <div id="capabilities">
          <HomepageFeatures />
        </div>
        <ValuePropsSection />
        <DeliverySection />
        <ResourcesSection />
        <FinalCtaSection />
      </main>
    </Layout>
  );
}
