/**
 * Testing my changes
 *
 * @group e2e/crawlertest
 */

import * as cdk from 'aws-cdk-lib';
import { aws_glue as glue, Duration } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { TestStack } from './test-stack';
import { DatazoneGsrMskAssetCrawler } from '../../src/governance/lib/datazone/datazone-gsr-msk-asset-crawler';
import { CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { DataZoneMskAssetType } from '../../src/governance';


jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// const synthesizer = stack.synthesizer as DefaultStackSynthesizer;

const domainID = '';
const projectID = '';
const clusterName = '';

// const userProfile = new CfnUserProfile(stack, 'MyCfnUserProfile', {
//   domainIdentifier: 'dzd_crma2x3flwp67b',
//   userType: 'IAM_ROLE',
//   userIdentifier: Fn.sub(synthesizer.cloudFormationExecutionRoleArn),
//   status: 'ACTIVATED',
// });


// const cfnCrawlerProject = new CfnProject(stack, 'CrawlerProject', {
//   domainIdentifier: 'dzd_crma2x3flwp67b',
//   description: 'MSK Project',
//   name: 'MSK',
// });

// cfnCrawlerProject.node.addDependency(userProfile);

new CfnProjectMembership(stack, 'ProjectCrawlerMembership', {
  designation: 'PROJECT_CONTRIBUTOR',
  domainIdentifier: domainID,
  projectIdentifier: projectID,
  member: {
    userIdentifier: 'arn:aws:iam::891377161433:role/Admin',
  },
});

new DataZoneMskAssetType(stack, 'MSKAssetType', {
  projectId: projectID,
  domainId: domainID,
});


const cfnCrawlerRegistry = new glue.CfnRegistry(stack, 'MyCfnRegistryCrawler', {
  name: 'crawler-registry',
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

new DatazoneGsrMskAssetCrawler(stack, 'Crawler', {
  domainId: domainID,
  projectId: projectID,
  clusterName: clusterName,
  registryName: cfnCrawlerRegistry.name,
  eventBridgeSchedule: Schedule.rate(Duration.minutes(20)),
});

new cdk.CfnOutput(stack, 'CFnSchema', {
  value: schema.name,
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
