import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';


function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  // const currentTheme = document.documentElement.getAttribute('data-theme');  

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container" style={{textAlign: 'center'}}>
        <div className="row">
        <div className="col col--6">
            <img id="logo" className="navLogo" src="img/adsf-logo-light.png" alt="Header image"/>
          </div>
          <div className="col col--6">
              <img id="codeSample" className='navCodeExample' src="img/code-light.png" alt="Header image"/>
          </div>
        </div>
        <p className='hero__subtitle'>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--lg button-3d"
            style={{padding: '0.8rem 1.8rem', fontSize: '1.3rem'}}
            to="/docs/intro">
            GET STARTED
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Accelerate and simplify data solutions implementation with ADSF">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
