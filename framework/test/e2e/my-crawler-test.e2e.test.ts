/**
 * Testing my changes
 *
 * @group e2e/crawlertest
 */

import * as cdk from 'aws-cdk-lib';
import { aws_glue as glue, Duration } from 'aws-cdk-lib';
import { CfnProject, CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Role } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import {
  createSubscriptionTarget, DataZoneCustomAssetTypeFactory,
  DataZoneMskAssetType,
  DataZoneMskCentralAuthorizer,
  DataZoneMskEnvironmentAuthorizer,
} from '../../src/governance';
import { DatazoneGsrKinesisDatasource } from '../../src/governance/lib/datazone/datazone-gsr-kinesis-datasource';
import { DatazoneGsrMskDatasource } from '../../src/governance/lib/datazone/datazone-gsr-msk-datasource';
import { DataZoneKinesisAssetType } from '../../src/governance/lib/datazone/datazone-kinesis-asset-type';
import { KafkaClientLogLevel, MskServerless } from '../../src/streaming';
import { DataVpc, Utils } from '../../src/utils';

//npx jest --group=e2e/crawlertest

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// const synthesizer = stack.synthesizer as DefaultStackSynthesizer;

const domainID = 'dzd_crma2x3flwp67b';
const projectID = '4tm7gqb3gn350n';
const clusterName = 'msk-flink-openlineage';
const CONSUMER_ENV_ID = '50lzwvsn0j4euf';
const CONSUMER_ROLE_ARN = 'arn:aws:iam::891377161433:role/AmazonDatazone-StreamingRole';

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

const msk = new MskServerless(stack, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

msk.addTopic('temperature-samples-topic', {
  topic: 'temperature-samples',
  numPartitions: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

msk.addTopic('room-temperatures-topic', {
  topic: 'room-temperatures-topic',
  numPartitions: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

msk.addTopic('room-temperatures', {
  topic: 'room-temperatures',
  numPartitions: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);


// const userProfile = new CfnUserProfile(stack, 'MyCfnUserProfile', {
//   domainIdentifier: 'dzd_crma2x3flwp67b',
//   userType: 'IAM_ROLE',
//   userIdentifier: Fn.sub(synthesizer.cloudFormationExecutionRoleArn),
//   status: 'ACTIVATED',
// });


const cfnMSKServerlessProject = new CfnProject(stack, 'ServerlessMSKProject', {
  domainIdentifier: domainID,
  description: 'MSK Project',
  name: 'ServerlessMSK',
});

// cfnCrawlerProject.node.addDependency(userProfile);

// new CfnProjectMembership(stack, 'ProjectCrawlerMembership', {
//   designation: 'PROJECT_CONTRIBUTOR',
//   domainIdentifier: domainID,
//   projectIdentifier: cfnMSKServerlessProject.attrId,
//   member: {
//     userIdentifier: 'arn:aws:iam::891377161433:role/Admin',
//   },
// });

new CfnProjectMembership(stack, 'ProjectServerlessMembership', {
  designation: 'PROJECT_CONTRIBUTOR',
  domainIdentifier: domainID,
  projectIdentifier: cfnMSKServerlessProject.attrId,
  member: {
    userIdentifier: 'arn:aws:iam::891377161433:role/Admin',
  },
});

const mskAssetType = new DataZoneMskAssetType(stack, 'MSKAssetType', {
  projectId: projectID,
  domainId: domainID,
});

const mskAssetTypeServerless = new DataZoneMskAssetType(stack, 'ServerlessMSKAssetType', {
  projectId: cfnMSKServerlessProject.attrId,
  domainId: domainID,
});

new DataZoneKinesisAssetType(stack, 'KinesisAssetType', {
  projectId: projectID,
  domainId: domainID,
});


const cfnCrawlerRegistry = new glue.CfnRegistry(stack, 'MyCfnRegistryCrawler', {
  name: 'crawler-registry',
});

const cfnServerlessRegistry = new glue.CfnRegistry(stack, 'MyCfnServerlessRegistryCrawler', {
  name: 'serverless-registry',
});

new glue.CfnSchema(stack, 'MyCfnSchema4', {
  compatibility: 'BACKWARD',
  dataFormat: 'AVRO',
  name: 'topic1',
  schemaDefinition: JSON.stringify({
    type: 'record',
    name: 'MyRecord',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
    ],
  }),
  registry: {
    name: cfnCrawlerRegistry.name,
  },
});

const schema = new glue.CfnSchema(stack, 'MyCfnSchema3', {
  compatibility: 'BACKWARD',
  dataFormat: 'AVRO',
  name: 'topic2',
  schemaDefinition: JSON.stringify({
    type: 'record',
    name: 'MyRecord',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
      { name: 'topic', type: 'string' },
    ],
  }),
  registry: {
    name: cfnCrawlerRegistry.name,
  },
});

new DatazoneGsrMskDatasource(stack, 'Crawler', {
  domainId: domainID,
  projectId: projectID,
  clusterName: clusterName,
  registryName: cfnCrawlerRegistry.name,
  eventBridgeSchedule: Schedule.rate(Duration.minutes(20)),
  enableSchemaRegistryEvent: true,
});

new DatazoneGsrMskDatasource(stack, 'Serverless-Crawler', {
  domainId: domainID,
  projectId: cfnMSKServerlessProject.attrId,
  clusterName: msk.clusterName,
  registryName: cfnServerlessRegistry.name,
  eventBridgeSchedule: Schedule.rate(Duration.minutes(20)),
  enableSchemaRegistryEvent: true,
});

const cfnKinesisRegistry = new glue.CfnRegistry(stack, 'MyKinesisRegistryCrawler', {
  name: 'kinesis-registry',
});

new glue.CfnSchema(stack, 'KinesisSchema', {
  compatibility: 'BACKWARD',
  dataFormat: 'AVRO',
  name: 'kinesis-source',
  schemaDefinition: JSON.stringify({
    type: 'record',
    name: 'MyRecord',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
    ],
  }),
  registry: {
    name: cfnKinesisRegistry.name,
  },
});

new DatazoneGsrKinesisDatasource(stack, 'KinesisCrawler', {
  domainId: domainID,
  projectId: projectID,
  registryName: cfnKinesisRegistry.name,
  eventBridgeSchedule: Schedule.rate(Duration.minutes(20)),
  enableSchemaRegistryEvent: true,
  enableKinesisEvent: true,
});

const consumerRole = Role.fromRoleArn(stack, 'consumerRole', CONSUMER_ROLE_ARN);

const serverlessconsumerRole = Role.fromRoleArn(stack, 'ServerlessConsumerRole', 'arn:aws:iam::891377161433:role/datazone-serverless-environment');

// const msfConsumerRole = Role.fromRoleArn(stack, 'MSFConsumerRole', 'arn:aws:iam::891377161433:role/datazone-msf-environment');

const mskCentralAuthorizer = new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
  domainId: domainID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: domainID,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

mskCentralAuthorizer.registerAccount('891377161433');

const assetFactory = new DataZoneCustomAssetTypeFactory(stack, 'AssetTypeFactory', { removalPolicy: cdk.RemovalPolicy.DESTROY });


createSubscriptionTarget(stack, 'Consumer',
  mskAssetType.mskCustomAssetType,
  'testSubscription',
  'dsf',
  CONSUMER_ENV_ID,
  [consumerRole],
  assetFactory.createRole,
);

createSubscriptionTarget(stack, 'MSKServerlessConsumerForMSF',
  mskAssetTypeServerless.mskCustomAssetType,
  'MSKServerlessSubscriptionTargetForMSF',
  'dsf',
  '6324yex146vt0n',
  [serverlessconsumerRole],
  assetFactory.createRole,
);


new cdk.CfnOutput(stack, 'CFnSchema', {
  value: schema.name,
});

new cdk.CfnOutput(stack, 'AssetType', {
  value: mskAssetTypeServerless.toString(),
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.CFnSchema).toContain('topic2');
});
