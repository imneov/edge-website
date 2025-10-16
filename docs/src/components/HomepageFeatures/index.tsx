import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: React.ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Ready to Use',
    Svg: require('@site/static/img/terminal.svg').default,
    description: (
      <>
        Pre-configured Docusaurus setup with modern design and best practices.
        Start writing documentation immediately without setup hassle.
      </>
    ),
  },
  {
    title: 'Multi-language Support',
    Svg: require('@site/static/img/monitor.svg').default,
    description: (
      <>
        Built-in internationalization with English and Chinese support.
        Easy to extend with additional languages as needed.
      </>
    ),
  },
  {
    title: 'Blog Integration',
    Svg: require('@site/static/img/interaction.svg').default,
    description: (
      <>
        Complete blog platform with author profiles, tags, and RSS feeds.
        Share updates and engage with your community seamlessly.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="feature-card">
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
        <div className="text--center">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 600, 
                marginBottom: '1rem',
                color: '#202124'
              }}>
                Why Use This Template?
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#5f6368', 
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Skip the setup and focus on your content. This template provides everything you need for professional documentation sites.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
