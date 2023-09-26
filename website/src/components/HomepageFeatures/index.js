import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
      title: 'AWS Data Solutions Framework (AWS DSF)',
      Svg: require('@site/static/img/adsf-fwk.svg').default,
      description: (
          <div >
              <h4>Open-source framework that simplifies implementation of the most common data requirements. </h4>
              <li>Compose integrated building blocks via infrastructure as code.</li> 
              <li>Benefit from smart defaults and best practices</li>
              <li>Customize them if it doesn't fit your requirements. </li>
              <li>Implement your own data platform extending ADSF building blocks.</li>
          </div>
      ),
  },
  {
    title: 'Analytics solutions',
    Svg: require('@site/static/img/adsf-solutions.svg').default,
    description: (
      <div>
          <h4>Pre-packaged data solutions built on top of AWS DSF</h4>
          With AWS DSF, you can deploy data solutions with built-in AWS best practices and implement your data platform requirements in hours rather than in months. Solutions are built with the AWS DSF framework which offers high re-usability, composability, and customization.
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


