import { LernaProject } from 'lerna-projen';
import { awscdk, javascript, Task, TextFile } from 'projen';
import { DependabotScheduleInterval } from 'projen/lib/github';
import { Transform } from "projen/lib/javascript";
import { dirname } from 'path';
import { globSync } from 'glob';

const CDK_VERSION = '2.165.0';
const CDK_CONSTRUCTS_VERSION = '10.4.2';
const JSII_VERSION = '~5.5.0';
const KUBECTL_LAYER_VERSION='v30';

const repositoryUrl = 'https://github.com/awslabs/data-solutions-framework-on-aws.git';
const homepage = 'https://awslabs.github.io/data-solutions-framework-on-aws/';
const author = 'Amazon Web Services';
const authorAddress = 'https://aws.amazon.com';
const authorOrganization = true;
const license = 'Apache-2.0';
const copyrightOwner = 'Amazon.com, Inc. or its affiliates. All Rights Reserved.';
const copyrightPeriod = `2021-${new Date().getFullYear()}`;
const defaultReleaseBranch = 'main';
const release = true;
const name = 'data-solutions-framework-on-aws';
const keywords= [
  'awscdk',
  'aws',
  'cdk',
  'constructs',
  'analytics',
  'datalake',
  'data'
];

const rootProject = new LernaProject({
  name,
  devDeps: [
    'lerna-projen',
    'ts-node',
    'typescript',
    'glob@^10.3.6'
  ],
  peerDeps: [
    '@types/node@^16',
  ],

  defaultReleaseBranch,
  repository: repositoryUrl,
  authorName: author,
  authorUrl: authorAddress,
  authorOrganization,
  homepage,
  license,
  copyrightOwner,
  copyrightPeriod,
  release: false,

  pullRequestTemplate: false, // define it manually
  githubOptions: {
    workflows: false // define them manually (workflows generated by projen are not secured)
  },
  dependabot: true,
  dependabotOptions: {
    labels: ["npm", "dependencies"],
    scheduleInterval: DependabotScheduleInterval.DAILY,
  },
  packageName: name,

  gitignore: [
    '.idea',
    'dist',
    '__pycache__',
    '.devcontainer',
    '.venv',
    'cdk.out',
    '.DS_Store',
    'LICENSE.bak',
    'framework/test/e2e/mytest.e2e.test.ts',
  ],

  projenrcTs: true,

  jest: false,
  
});

rootProject.package.addField('resolutions', {
  'wide-align': '1.1.5',
});


const licenseEnv: {[key: string]: string} = {};
licenseEnv["PERIOD"] = copyrightPeriod;
licenseEnv["OWNER"] = copyrightOwner; 

const licenseRewrite = rootProject.addTask('license', {
  description: 'Overwrite LICENSE file with correct copyrightPeriod and cpyrightOwner',
  env: licenseEnv,
  steps: [
    { exec: 'sed -i.bak \'s/\\[yyyy\\]/\'\"$PERIOD\"\'/g\' LICENSE'},
    { exec: 'sed -i.bak \'s/\\[name of copyright owner\\]/\'\"$OWNER\"\'/g\' LICENSE'},
    { exec: 'sed -i.bak \'s/\\[yyyy\\]/\'\"$PERIOD\"\'/g\' framework/LICENSE'},
    { exec: 'sed -i.bak \'s/\\[name of copyright owner\\]/\'\"$OWNER\"\'/g\' framework/LICENSE'},
  ]
});

rootProject.compileTask.spawn(licenseRewrite);

const fwkProject = new awscdk.AwsCdkConstructLibrary({
  name: 'framework',
  description: 'L3 CDK Constructs used to build data solutions with AWS',
  parent: rootProject,
  outdir: 'framework',
  repositoryDirectory: 'framework',

  repositoryUrl,
  author,
  authorAddress,
  authorOrganization,
  homepage,
  license,
  copyrightOwner,
  copyrightPeriod,

  majorVersion: 1,
  defaultReleaseBranch,
  release,
  releaseToNpm: release,

  keywords,

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  packageName: '@cdklabs/aws-data-solutions-framework',

  publishToPypi: {
    distName: 'cdklabs.aws_data_solutions_framework',
    module: 'cdklabs.aws_data_solutions_framework'
  },

  deps: [
    `@aws-cdk/lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
  ],

  devDeps: [
    'cdk-nag@^2.0.0',
    '@types/jest',
    '@jest/globals',
    'ts-jest',
    'jest-runner-groups',
    `@aws-cdk/cli-lib-alpha@${CDK_VERSION}-alpha.0`,
    'rosetta',
    `@aws-cdk/lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    '@types/eslint',
    'eslint-plugin-local-rules',
    'esbuild',
    'sync-request-curl',
    'node-libcurl'
  ],

  bundledDeps: [
    'js-yaml',
    '@types/js-yaml',
    'simple-base',
    'semver',
    '@types/semver'
  ],

  jestOptions: {
    jestConfig: {
      runner: 'groups',
      transform: {
        '^.+\\.ts?$': new Transform('ts-jest', {
          tsconfig: 'tsconfig.dev.json',
        }),
      },
      globals: {
        'ts-jest': null // remove jest deprecation warning caused by projen-generated default config
      }
    }
  },

  tsconfig: {
    compilerOptions: {
      lib: [
        "ES2021"
      ],
      target: "ES2021", 
    },
  },

  excludeTypescript : [
    "src/**/resources/lambda/*",
  ],

  eslintOptions: {
    dirs: ['src'],
    ignorePatterns: [
      '*.lit.ts',
      '*.js',
      '*.d.ts',
      'node_modules/',
      '*.generated.ts',
      'coverage'
    ],
  },
});

const eslint = javascript.Eslint.of(fwkProject)!;
eslint.addPlugins('eslint-plugin-local-rules');
eslint.addRules({ 'local-rules/no-tokens-in-construct-id': ["error"] });

fwkProject.addPackageIgnore("!*.lit.ts");

fwkProject.testTask.reset('jest --passWithNoTests --updateSnapshot --group=-e2e', {receiveArgs: true});
fwkProject.testTask.spawn(new Task('eslint'));
fwkProject.tasks.tryFind('eslint')!.exec(`eslint --ext .ts,.tsx --rule 'local-rules/url-checker: error' src`, { condition: '[ -n "$CI" ]' });

fwkProject.addTask('test:e2e', {
  description: 'Run framework end-to-end tests',
  exec: 'jest --passWithNoTests --updateSnapshot --group=e2e'
});


/**
 * Task copy `resources` directories from `src` to `lib`
 * This is to package YAML files part of the dist
 */

const copyResourcesToLibTask = fwkProject.addTask('copy-resources', {
  description: 'Copy all resources directories from src to lib',
});

for (const from of globSync('src/**/resources', { cwd: './framework/', root: '.' })) {
  const to = dirname(from.replace('src', 'lib'));
  const cpCommand = `rsync -avr --exclude '*.ts' --exclude '*.js' ${from} ${to}`;
  copyResourcesToLibTask.exec(cpCommand);
};

fwkProject.compileTask.exec('npx projen copy-resources');

fwkProject.postCompileTask.prependExec('rm -f .jsii.tabl.json && jsii-rosetta extract .jsii && node generate_doc.mjs');

fwkProject.tasks.tryFind('release')!.prependSpawn(new Task('install:ci'));

const sparkDataLakeInfraExampleApp = new awscdk.AwsCdkPythonApp({
  name: 'spark-data-lake-infra-example',
  moduleName: 'stacks',
  packageName: 'spark-data-lake',
  version: '0.0.1',
  description: 'An example CDK app demonstrating the most common use cases for DSF on AWS',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'examples/spark-data-lake/infra',

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,

  pytest: true,
  devDeps: [
    "pytest",
    'cdk-nag~=2.25.0',
    "black",
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
  context: {
    '@data-solutions-framework-on-aws/removeDataOnDestroy': true,
  }
});

sparkDataLakeInfraExampleApp.removeTask('deploy');
sparkDataLakeInfraExampleApp.removeTask('destroy');
sparkDataLakeInfraExampleApp.removeTask('diff');
sparkDataLakeInfraExampleApp.removeTask('watch');
sparkDataLakeInfraExampleApp.removeTask('synth');
sparkDataLakeInfraExampleApp.testTask.reset();
sparkDataLakeInfraExampleApp.postCompileTask.reset();
sparkDataLakeInfraExampleApp.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e"'
});
sparkDataLakeInfraExampleApp.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});
const synthTask = sparkDataLakeInfraExampleApp.tasks.tryFind('synth:silent')!;
synthTask.reset();
synthTask.exec(`npx aws-cdk@${CDK_VERSION} synth -q -c prod=PLACEHOLDER -c staging=PLACEHOLDER`);
const buildExampleTask = sparkDataLakeInfraExampleApp.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-cache-dir --no-deps --no-index --find-links ../../../framework/dist/python cdklabs.aws_data_solutions_framework` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
sparkDataLakeInfraExampleApp.packageTask.spawn(buildExampleTask);

const adsfQuickstart = new awscdk.AwsCdkPythonApp({
  name: 'dsf-quickstart',
  moduleName: 'stacks',
  packageName: 'dsf-quickstart',
  version: '0.0.1',
  description: 'An example CDK app demonstrating the most common use cases for Data Solutions Framework on AWS',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'examples/dsf-quickstart',

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,

  pytest: true,
  devDeps: [
    "pytest",
    'cdk-nag~=2.25.0',
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black"
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
  context: {
    '@data-solutions-framework-on-aws/removeDataOnDestroy': true,
  }
});

adsfQuickstart.addGitIgnore('cdk.context.json');
adsfQuickstart.removeTask('deploy');
adsfQuickstart.removeTask('destroy');
adsfQuickstart.removeTask('diff');
adsfQuickstart.removeTask('watch');
adsfQuickstart.removeTask('synth');
adsfQuickstart.testTask.reset();
adsfQuickstart.postCompileTask.reset();
adsfQuickstart.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e"'
});
adsfQuickstart.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});
const adsfQuickstartSynthTask = adsfQuickstart.tasks.tryFind('synth:silent')!;
adsfQuickstartSynthTask.reset();
adsfQuickstartSynthTask.exec(`npx aws-cdk@${CDK_VERSION} synth -q`);
const buildAdsfQuickstartTask = adsfQuickstart.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-cache-dir --no-index --find-links ../../framework/dist/python cdklabs.aws_data_solutions_framework` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
adsfQuickstart.packageTask.spawn(buildAdsfQuickstartTask);


const opensearchQuickstart = new awscdk.AwsCdkPythonApp({
  name: 'opensearch-quickstart',
  moduleName: 'stacks',
  packageName: 'opensearch-quickstart',
  version: '0.0.1',
  description: 'An example CDK app demonstrating the most common use cases for Data Solutions Framework on AWS',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'examples/opensearch-quickstart',

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,

  pytest: true,
  devDeps: [
    "pytest",
    'cdk-nag~=2.25.0',
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black"
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
  context: {
    '@data-solutions-framework-on-aws/removeDataOnDestroy': true,
  }
});

opensearchQuickstart.addGitIgnore('cdk.context.json');
opensearchQuickstart.removeTask('deploy');
opensearchQuickstart.removeTask('destroy');
opensearchQuickstart.removeTask('diff');
opensearchQuickstart.removeTask('watch');
opensearchQuickstart.removeTask('synth');
opensearchQuickstart.testTask.reset();
opensearchQuickstart.postCompileTask.reset();
opensearchQuickstart.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e"'
});
opensearchQuickstart.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});

const opensearchQuickstartSynthTask = opensearchQuickstart.tasks.tryFind('synth:silent')!;
opensearchQuickstartSynthTask.reset();
opensearchQuickstartSynthTask.exec(`npx aws-cdk@${CDK_VERSION} synth -q`);
const buildOpensearchQuickstartTask = opensearchQuickstart.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-cache-dir --no-index --find-links ../../framework/dist/python cdklabs.aws_data_solutions_framework` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
opensearchQuickstart.packageTask.spawn(buildOpensearchQuickstartTask);

const redshiftDataWarehouseExample = new awscdk.AwsCdkPythonApp({
  name: 'redshift-data-warehouse-example',
  moduleName: 'stacks',
  packageName: 'redshift-data-warehouse',
  version: '0.0.1',
  description: 'An example CDK app demonstrating the most common use cases for Data Solutions Framework on AWS',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'examples/redshift-data-warehouse',

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,

  pytest: true,
  devDeps: [
    "pytest",
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black",
    'cdk-nag~=2.25.0',
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
  context: {
    '@data-solutions-framework-on-aws/removeDataOnDestroy': true,
  }
});

redshiftDataWarehouseExample.addGitIgnore('cdk.context.json');
redshiftDataWarehouseExample.removeTask('deploy');
redshiftDataWarehouseExample.removeTask('destroy');
redshiftDataWarehouseExample.removeTask('diff');
redshiftDataWarehouseExample.removeTask('watch');
redshiftDataWarehouseExample.removeTask('synth');
redshiftDataWarehouseExample.testTask.reset();
redshiftDataWarehouseExample.postCompileTask.reset();
redshiftDataWarehouseExample.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e"'
});
redshiftDataWarehouseExample.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});

const redshiftDataWarehouseExampleSynthTask = redshiftDataWarehouseExample.tasks.tryFind('synth:silent')!;
redshiftDataWarehouseExampleSynthTask.reset();
redshiftDataWarehouseExampleSynthTask.exec(`npx aws-cdk@${CDK_VERSION} synth -q`);
const buildredshiftDataWarehouseExampleTask = redshiftDataWarehouseExample.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-cache-dir --no-index --find-links ../../framework/dist/python cdklabs.aws_data_solutions_framework` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
redshiftDataWarehouseExample.packageTask.spawn(buildredshiftDataWarehouseExampleTask);

const datazoneMskGovernance = new awscdk.AwsCdkPythonApp({
  name: 'datazone-msk-governance',
  moduleName: 'stacks',
  packageName: 'datazone-msk-governance',
  version: '0.0.1',
  description: 'An example CDK app demonstrating MSK topics governance in DataZone',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'examples/datazone-msk-governance',

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,

  pytest: true,
  deps: [
    'aws-cdk.aws_lambda_python_alpha~=2.145.0a0'
  ],
  devDeps: [
    "pytest",
    'cdk-nag~=2.25.0',
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black"
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
  context: {
    '@data-solutions-framework-on-aws/removeDataOnDestroy': true,
  }
});

datazoneMskGovernance.addGitIgnore('cdk.context.json');
datazoneMskGovernance.addGitIgnore('resources/flink/?');
datazoneMskGovernance.addGitIgnore('resources/flink/dependency-reduced-pom.xml');
datazoneMskGovernance.removeTask('deploy');
datazoneMskGovernance.removeTask('destroy');
datazoneMskGovernance.removeTask('diff');
datazoneMskGovernance.removeTask('watch');
datazoneMskGovernance.removeTask('synth');
datazoneMskGovernance.testTask.reset();
datazoneMskGovernance.postCompileTask.reset();
datazoneMskGovernance.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e" --ignore=./cdk.out'
});
datazoneMskGovernance.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});
const datazoneMskGovernanceSynthTask = datazoneMskGovernance.tasks.tryFind('synth:silent')!;
datazoneMskGovernanceSynthTask.reset();
datazoneMskGovernanceSynthTask.exec(`DOMAIN_ID=2222 DATAZONE_PORTAL_ROLE_NAME=admin npx aws-cdk@${CDK_VERSION} synth -q`);
const buildDatazoneMskGovernanceTask = datazoneMskGovernance.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-index --find-links ../../framework/dist/python cdklabs.aws_data_solutions_framework` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
datazoneMskGovernance.packageTask.spawn(buildDatazoneMskGovernanceTask);

rootProject.addTask('test:e2e', {
  description: 'Run end-to-end tests'
});

rootProject.addTask('release',  {
  description: 'Release project',
})
rootProject.addGitIgnore(".jsii.tabl.json");
rootProject.synth();