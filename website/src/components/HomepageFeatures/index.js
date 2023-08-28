import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
      title: 'AWS Data solutions',
      Svg: require('@site/static/img/green-emr.svg').default,
      description: (
          <>
              Deploy pre-packaged data solutions to solve common challenges in database, analytics and AI/ML areas. 
              Use AWS Service Catalog to manage and share a catalog of solutions, ready to deploy by teams across your orgnization.<br/>
          </>
      ),
  },
  {
    title: 'Solutions framework',
    Svg: require('@site/static/img/green-stream.svg').default,
    description: (
      <div>
          Build your own solutions with the AWS Data Solutions Framework and AWS CDK. 
          Customize solutions so they match your organization rules for building on the cloud.
          Develop your own building blocks to reuse in different solutions.
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
