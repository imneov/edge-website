/**
 * Core Capabilities Section
 *
 * Displays 6 feature cards in a 3x2 grid, each representing
 * a core platform capability with icon, title, and description.
 */
import React from 'react';
import clsx from 'clsx';
import {
  Server,
  Globe,
  GitBranch,
  Users,
  BarChart3,
  Cpu,
} from 'lucide-react';
import styles from './styles.module.css';

/** Feature card data shape */
interface FeatureItem {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/** All 6 core capabilities */
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
    title: 'GitOps 工作流',
    Icon: GitBranch,
    description:
      '内置 GitOps 能力，支持基于 Git 仓库的声明式配置管理，实现应用变更的可追溯、可回滚、可审计。',
  },
  {
    title: '多租户管理',
    Icon: Users,
    description:
      '工作空间级别的多租户隔离，细粒度 RBAC 权限控制，支持团队协作与资源配额管理。',
  },
  {
    title: '可观测性',
    Icon: BarChart3,
    description:
      '集成 Prometheus 监控体系，提供集群、节点、应用多维度的指标采集、告警和可视化仪表盘。',
  },
  {
    title: '设备管理',
    Icon: Cpu,
    description:
      '边缘设备全生命周期管理，支持设备模型定义、OTA 升级、资源池化调度，释放边缘算力。',
  },
];

/** Renders a single feature card with hover animation */
function FeatureCard({ title, Icon, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={clsx('feature-card', styles.card)}>
        <div className={styles.iconWrapper}>
          <Icon className={styles.featureIcon} />
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDesc}>{description}</p>
      </div>
    </div>
  );
}

/** Core capabilities section with section header and 3x2 grid */
export default function HomepageFeatures(): React.ReactNode {
  return (
    <section className={clsx(styles.features, 'features-section')}>
      <div className="container">
        {/* Section header */}
        <div className="row">
          <div className="col col--8 col--offset-2">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>核心能力</h2>
              <p className={styles.sectionSubtitle}>
                边缘平台提供从基础设施管理到应用交付的全栈能力，
                助力企业构建云边协同的分布式计算架构。
              </p>
            </div>
          </div>
        </div>

        {/* 3x2 feature grid */}
        <div className="row">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
