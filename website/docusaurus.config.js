// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

const projectName = 'data-solutions-framework-on-aws'
const niceProjectName = 'Data solutions framework on AWS'
const organization = 'awslabs'

const config = {
  title: niceProjectName,
  tagline: 'Accelerate building your data analytics solutions with Data solutions framework on AWS',
  url: 'https://' + organization + '.github.io',
  // baseUrl: '/', //uncomment for local dev
  baseUrl: '/data-solutions-framework-on-aws/',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/header-icon.png',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: organization, // Usually your GitHub org/user name.
  projectName: projectName, // Usually your repo name.
  // deploymentBranch: 'main',
  githubHost: 'github.com',
  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/' + organization + '/' + projectName + '/blob/main/website/',
        },
        blog: {
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          readingTime: ({ content, frontMatter, defaultReadingTime }) =>
            defaultReadingTime({ content, options: { wordsPerMinute: 300 } }),
          editUrl:
            'https://github.com/' + organization + '/' + projectName + '/blob/main/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
  {
    navbar: {
      title: 'DSF on AWS',
      logo: {
        alt: niceProjectName + 'Logo',
        src: 'img/header-icon.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Quick start',
        },
        {
          type: 'doc',
          docId: 'constructs/index',
          position: 'left',
          label: 'Framework',
        },
        {
          type: 'doc',
          docId: 'examples/index',
          position: 'left',
          label: 'Examples solutions'
        },
        {
          href: 'https://github.com/' + organization + '/' + projectName,
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://constructs.dev/packages/@cdklabs/aws-data-solutions-framework/',
          label: 'API Reference',
          position: 'right',
        }
      ],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      }
    },
    footer: {
      style: 'light',
      copyright: `Amazon.com, Inc. or its affiliates. All Rights Reserved`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['bash', 'diff', 'json', 'python', 'typescript'],
    },
    mermaid: {
      theme: { light: 'forest', dark: 'dark' },
    },
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  plugins: [require.resolve('docusaurus-lunr-search')],
};

module.exports = config;
