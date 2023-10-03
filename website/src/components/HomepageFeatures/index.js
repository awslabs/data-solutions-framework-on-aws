import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';


const FeatureList = [
  {
      title: 'Focus on what matters',
      Svg: require('@site/static/img/write-code.svg').default,
      description: (
          <div>
            Use the framework to build your data solutions instead of building cloud infrastructure from scratch.
            AWS DSF simplifies implementation of the most common data needs. 
          </div>
      ),
  },
  {
    title: 'Building blocks via IaC',
    Svg: require('@site/static/img/build-tools.svg').default,
    description: (
      <div>
          Compose data solutions using integrated building blocks via Infrastructure as Code (IaC). 
          AWS DSF is packaged as a AWS CDK library, and is available in TypeScript (npm) and Python (PyPi). 
      </div>
    ),
  },
  {
    title: 'Smart defaults, easy to customize',
    Svg: require('@site/static/img/machine-learning.svg').default,
    description: (
      <div>
          Benefit from smart defaults and built-in AWS best practices, while being able to easily
          customize or extend according your requirements.
      </div>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} style={{width: '50%'}} role="img" />
      </div>
      <div className="text--left padding-horiz--md">
        <h2 style={{ fontWeight: 500}}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}


