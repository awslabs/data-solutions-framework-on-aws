import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
      title: 'AWS Data Solutions Framework (AWS DSF)',
      Svg: require('@site/static/img/adsf-fwk.svg').default,
      description: (
          <div>
              AWS DSF is an open-source framework that simplifies implementation and delivery of integrated, customizable, and ready-to-deploy solutions that address the most common data analytics requirements.
              AWS DSF is an abstraction atop AWS services based on AWS CDK L3 constructs.
          </div>
      ),
  },
  {
    title: 'Analytics solutions',
    Svg: require('@site/static/img/adsf-solutions.svg').default,
    description: (
      <div>
          With AWS DSF, you can deploy solutions with built-in AWS best practices to implement your data platform requirements in hours rather than in months when building using AWS services. Solutions are built with AWS DSF framework to allow for the high level of re-usability, composability, and customization.
      </div>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} style={{width: '40%'}} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h2><b>{title}</b></h2>
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


