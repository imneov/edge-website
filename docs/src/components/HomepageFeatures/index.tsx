/**
 * Core Capabilities Section
 *
 * Layout: CSS Grid — first 2 features as large cards (6/12 columns),
 * remaining 4 as standard cards (3/12 columns each).
 * Section header has a rotating gradient keyword (KSE kse_feature style).
 * Each card fades + slides up on scroll entry with staggered delay.
 */
import React, { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  Server,
  Globe,
  Lock,
  Users,
  BarChart3,
  Layers,
} from 'lucide-react';
import styles from './styles.module.css';

interface FeatureItem {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface RotatingKeyword {
  word: string;
  gradient: string;
}

const ROTATING_KEYWORDS: RotatingKeyword[] = [
  { word: '统一的', gradient: 'linear-gradient(90deg, #3983F7, #6BDDE0)' },
  { word: '轻量的', gradient: 'linear-gradient(90deg, #7B26CF, #E61F86)' },
  { word: '开放的', gradient: 'linear-gradient(135deg, #E64EFF, #8FFFF8)' },
  { word: '可靠的', gradient: 'linear-gradient(154deg, rgba(43,189,182,1), rgba(150,222,218,1))' },
  { word: '全能的', gradient: 'linear-gradient(154deg, #FFBB56, #FF834E)' },
];

const FEATURES: FeatureItem[] = [
  {
    title: '边缘集群管理',
    Icon: Server,
    description:
      '统一管理多个边缘 Kubernetes 集群，支持集群注册、健康监控、资源调度等核心能力，简化边缘基础设施运维。',
  },
  {
    title: '应用分发引擎',
    Icon: Globe,
    description:
      '基于 Helm 的应用模板系统，支持多集群应用分发、版本管理、配置覆盖，实现应用的标准化交付。',
  },
  {
    title: '统一 IAM 权限模型',
    Icon: Lock,
    description:
      '单一 IAMRole / IAMRoleBinding 类型覆盖 Platform → Cluster → Workspace → Namespace 全层级，权限级联查找，无需为每层单独配置 RBAC。',
  },
  {
    title: '多租户管理',
    Icon: Users,
    description:
      '工作空间级别的多租户隔离，支持团队协作与资源配额管理，工作空间内权限与集群级别权限独立管控。',
  },
  {
    title: '可观测性',
    Icon: BarChart3,
    description:
      '集成 Prometheus 监控体系，提供集群、节点、应用多维度的指标采集、告警和可视化仪表盘。',
  },
  {
    title: 'GPU 虚拟化 (VAST / HAMi)',
    Icon: Layers,
    description:
      '集成 VAST 存储虚拟化与 HAMi GPU 虚拟化技术，支持边缘 AI 推理场景下的异构算力池化调度与多租户共享。',
  },
];

/** Triggers when element enters viewport (one-shot, then disconnects). */
function useScrollAnimation(threshold = 0.1) {
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

function FeatureCard({
  title,
  Icon,
  description,
  isLarge,
  delay,
}: FeatureItem & { isLarge?: boolean; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={clsx(
        isLarge ? styles.featureColLarge : styles.featureCol,
        styles.scrollAnimate,
        isVisible && styles.visible
      )}
      style={{ '--delay': delay != null ? `${delay}s` : '0s' } as React.CSSProperties}
    >
      <div className={clsx(styles.card, isLarge && styles.cardLarge)}>
        <div className={clsx(styles.iconWrapper, isLarge && styles.iconWrapperLarge)}>
          <Icon className={clsx(styles.featureIcon, isLarge && styles.featureIconLarge)} />
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDesc}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.ReactNode {
  const [kwIdx, setKwIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setKwIdx((i) => (i + 1) % ROTATING_KEYWORDS.length);
        setFading(false);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const kw = ROTATING_KEYWORDS[kwIdx];

  return (
    <section className={clsx(styles.features, 'features-section')}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span
              className={clsx(styles.rotatingKeyword, fading && styles.rotatingKeywordFade)}
              style={{ background: kw.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' } as React.CSSProperties}
            >
              {kw.word}
            </span>
            {' '}边缘算力管理平台
          </h2>
          <p className={styles.sectionSubtitle}>
            边缘平台提供从基础设施管理到应用交付的全栈能力，
            助力企业构建云边协同的分布式计算架构。
          </p>
        </div>

        {/* First 2: large cards; remaining 4: standard cards */}
        <div className={styles.featureGrid}>
          {FEATURES.map((feature, idx) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              isLarge={idx < 2}
              delay={idx * 0.12}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
