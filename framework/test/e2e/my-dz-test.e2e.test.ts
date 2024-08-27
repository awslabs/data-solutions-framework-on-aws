/**
 * Testing my changes
 *
 * @group e2e/dztests
 */

import * as cdk from 'aws-cdk-lib';
// import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
// import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
// import { DefaultStackSynthesizer, Fn } from 'aws-cdk-lib';
import { aws_glue as glue } from 'aws-cdk-lib';
import { CfnProject, CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { TestStack } from './test-stack';
import { DataZoneCustomAssetTypeFactory } from '../../src/governance';
import { DataZoneCustomAsset } from '../../src/governance/lib/datazone/datazone-custom-asset';
import { DataZoneMSKCustomAsset } from '../../src/governance/lib/datazone/datazone-msk-custom-asset';
// import { DataZoneMskCentralAuthorizer } from '../../src/governance';
//
// import { KafkaClientLogLevel, MskServerless } from '../../src/streaming';
// import { DataVpc, Utils } from '../../src/utils';
// import {DefaultStackSynthesizer, Fn} from "aws-cdk-lib";

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

// new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
//   domainId: 'dzd_6ptm7de4q2m2lj',
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
// });
//
// let vpc = new DataVpc(stack, 'vpc', {
//   vpcCidr: '10.0.0.0/16',
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
// });
//
// let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);
//
// const msk = new MskServerless(stack, 'cluster', {
//   clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
//   vpc: vpc.vpc,
//   subnets: vpc.vpc.selectSubnets(),
//   securityGroups: [securityGroup],
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
//   kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
// });
//
// new Role(stack, 'consumerRole', {
//   assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
// });
//
// msk.addTopic('topicServerelss', {
//   topic: 'dummy',
//   numPartitions: 1,
// }, cdk.RemovalPolicy.DESTROY, false, 1500);
// const synthesizer = stack.synthesizer as DefaultStackSynthesizer;
// //
// const userProfile = new CfnUserProfile(stack, 'MyCfnUserProfile', {
//   domainIdentifier: 'dzd_6ptm7de4q2m2lj',
//   userType: 'IAM_ROLE',
//   userIdentifier: Fn.sub(synthesizer.cloudFormationExecutionRoleArn),
//   status: 'ACTIVATED',
// });

const cfnProject = new CfnProject(stack, 'MyCfnProject', {
  domainIdentifier: 'dzd_6ptm7de4q2m2lj',
  description: 'MSK Project',
  name: 'MSK',
});

new CfnProjectMembership(stack, 'ProjectMembership', {
  designation: 'PROJECT_CONTRIBUTOR',
  domainIdentifier: cfnProject.domainIdentifier,
  projectIdentifier: cfnProject.attrId,
  member: {
    userIdentifier: 'arn:aws:iam::891377161433:role/Admin',
  },
});


// cfnProject.node.addDependency(userProfile);

// const formType = new DataZoneFormType(stack, 'TestFormType', {
//   domainId: cfnProject.domainIdentifier,
//   projectId: 'bdqgy3h6re8i7b',
//   name: 'TestFormType',
//   fields: [
//     { name: 'field1', type: 'String', required: true },
//     { name: 'fiedl2', type: 'Integer', required: false },
//   ],
//   removalPolicy: cdk.RemovalPolicy.DESTROY,
// });

const dzFactory = new DataZoneCustomAssetTypeFactory(stack, 'DZCustomAssetTypeHandler', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

dzFactory.node.addDependency(cfnProject);


// Create a Custom Asset
new DataZoneCustomAsset(stack, 'TestCustomAsset', {
  domainId: cfnProject.domainIdentifier,
  projectId: 'bdqgy3h6re8i7b',
  name: 'TestCustomAsset',
  typeIdentifier: 'MskTopicAssetType',
  externalIdentifier: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-id',
  formsInput: [
    {
      formName: 'MskSourceReferenceForm',
      typeIdentifier: 'MskSourceReferenceForm',
      content: JSON.stringify({
        cluster_arn: 'arn:aws:kafka:region:account:cluster/cluster-name/cluster-id',
      }),
    }, {
      formName: 'KafkaSchemaForm',
      typeIdentifier: 'KafkaSchemaForm',
      content: JSON.stringify({
        kafka_topic: 'my-topic',
        schema_version: 5,
        schema_arn: 'arn:aws:schema:region:account:schema/schema-id',
        registry_arn: 'arn:aws:schema-registry:region:account:registry/registry-id',
      }),
    },
  ],

});

const cfnRegistry = new glue.CfnRegistry(stack, 'MyCfnRegistry', {
  name: 'registry',
});

new glue.CfnSchema(stack, 'MyCfnSchema', {
  compatibility: 'BACKWARD',
  dataFormat: 'AVRO',
  name: 'schema',
  schemaDefinition: JSON.stringify({
    type: 'record',
    name: 'MyRecord',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
    ],
  }),
  registry: {
    name: cfnRegistry.name,
  },
});

const cfnSchema2 = new glue.CfnSchema(stack, 'MyCfnSchema2', {
  compatibility: 'BACKWARD',
  dataFormat: 'AVRO',
  name: 'schema2',
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
    name: cfnRegistry.name,
  },
});

const mskasset = new DataZoneMSKCustomAsset(stack, 'MSKAsset', {
  topicName: 'topic1',
  clusterName: 'MyCluster2',
  latestVersion: true,
  projectId: cfnProject.attrId,
  domainId: cfnProject.domainIdentifier,
  // schemaVersion: 1,
  registryName: cfnRegistry.name,
  schemaName: cfnSchema2.name,
  // schemaDefinition: '{"type":"record","name":"MyRecord","fields":[{"name":"name","type":"string"},{"name":"topic","type":"string"}]}',
  includeSchema: true,
});


new cdk.CfnOutput(stack, 'CFnSchema', {
  value: cfnSchema2.name,
});

new cdk.CfnOutput(stack, 'asset', {
  value: mskasset.projectId,
});

let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.CFnSchema).toContain('schema2');
});
