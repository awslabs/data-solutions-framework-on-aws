import { LernaProject } from 'lerna-projen';
import { awscdk, Task } from 'projen';
import { DependabotScheduleInterval } from 'projen/lib/github';
import { Transform } from "projen/lib/javascript";
import { dirname } from 'path';
import { globSync } from 'glob';

const CDK_VERSION = '2.109.0';
const CDK_CONSTRUCTS_VERSION = '10.3.0';
const JSII_VERSION = '~5.0.0';
const KUBECTL_LAYER_VERSION='v27';

const repositoryUrl = 'https://github.com/awslabs/data-solutions-framework-on-aws.git';
const homepage = 'https://awslabs.github.io/data-solutions-framework-on-aws/';
const author = 'Amazon Web Services';
const authorAddress = 'https://aws.amazon.com';
const authorOrganization = true;
const license = 'MIT-0';
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
    '.DS_Store'
  ],

  projenrcTs: true,

  jest: false
});

rootProject.package.addField('resolutions', {
  'wide-align': '1.1.5',
});

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
  prerelease: 'rc', /* TODO remove after RC */

  keywords,

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  packageName: 'aws-dsf',

  publishToPypi: {
    distName: 'aws_dsf',
    module: 'aws_dsf'
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
    `@aws-cdk/lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`
  ],

  bundledDeps: [
    'js-yaml',
    '@types/js-yaml',
    'simple-base',
    'semver',
    'esbuild',
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
      target: "ES2021"
    }
  },

  eslintOptions: {
    dirs: ['src'],
    ignorePatterns: [
      '*.lit.ts',
      '*.js',
      '*.d.ts',
      'node_modules/',
      '*.generated.ts',
      'coverage'
    ]
  },
});

fwkProject.addPackageIgnore("!*.lit.ts");

fwkProject.testTask.reset('jest --passWithNoTests --updateSnapshot --group=-e2e', {receiveArgs: true});
fwkProject.testTask.spawn(new Task('eslint'));

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
  packageName: 'spark_data_lake',
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
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black"
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
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
const synthTask = sparkDataLakeInfraExampleApp.tasks.tryFind('synth:silent');
synthTask?.reset();
synthTask?.prependExec(`cdk --version || npm install -g cdk@${CDK_VERSION}`);
synthTask?.exec('cdk synth -q -c prod=PLACEHOLDER -c staging=PLACEHOLDER');
const buildExampleTask = sparkDataLakeInfraExampleApp.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-index --find-links ../../../framework/dist/python aws_dsf` },
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
    `aws-cdk.lambda-layer-kubectl-${KUBECTL_LAYER_VERSION}`,
    "black"
  ],
  pythonExec: 'python3',
  venvOptions: {
    envdir: '.venv'
  },
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
const adsfQuickstartSynthTask = adsfQuickstart.tasks.tryFind('synth:silent');
adsfQuickstartSynthTask?.reset();
adsfQuickstartSynthTask?.prependExec(`cdk --version || npm install -g cdk@${CDK_VERSION}`);
adsfQuickstartSynthTask?.exec('cdk synth -q');
const buildAdsfQuickstartTask = adsfQuickstart.addTask('build-example', {
  steps: [
    { exec: `pip install --ignore-installed --no-deps --no-index --find-links ../../framework/dist/python aws_dsf` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
adsfQuickstart.packageTask.spawn(buildAdsfQuickstartTask);

rootProject.addTask('test:e2e', {
  description: 'Run end-to-end tests'
});

rootProject.addTask('release',  {
  description: 'Release project',
})
rootProject.addGitIgnore(".jsii.tabl.json");
rootProject.synth();