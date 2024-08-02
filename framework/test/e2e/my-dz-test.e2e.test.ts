/**
 * Testing my changes
 *
 * @group e2e/dztests
 */

import * as cdk from 'aws-cdk-lib';
// import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
// import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
// import { DefaultStackSynthesizer, Fn } from 'aws-cdk-lib';
import { CfnProject, CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { TestStack } from './test-stack';
import { DataZoneCustomAssetTypeFactory } from '../../src/governance';
import { DataZoneCustomAsset } from '../../src/governance/lib/datazone/datazone-custom-asset';
import { DataZoneFormType } from '../../src/governance/lib/datazone/datazone-form-type';
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
  domainIdentifier: '',
  description: 'MSK Project',
  name: 'MSK',
});

new CfnProjectMembership(stack, 'ProjectMembership', {
  designation: 'PROJECT_CONTRIBUTOR',
  domainIdentifier: '',
  projectIdentifier: cfnProject.attrId,
  member: {
    userIdentifier: '',
  },
});


// cfnProject.node.addDependency(userProfile);

const formType = new DataZoneFormType(stack, 'TestFormType', {
  domainId: cfnProject.domainIdentifier,
  projectId: cfnProject.attrId,
  name: 'TestFormType',
  fields: [
    { name: 'field1', type: 'String', required: true },
    { name: 'fiedl2', type: 'Integer', required: false },
  ],
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const dzFactory = new DataZoneCustomAssetTypeFactory(stack, 'DZCustomAssetTypeHandler', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

dzFactory.node.addDependency(cfnProject);

dzFactory.createCustomAssetType('MSKCustomAssetType', {
  assetTypeName: 'MskTopicAssetType',
  assetTypeDescription: 'Custom asset type to support MSK topic asset',
  domainId: '',
  projectId: '',
  formTypes: [
    {
      name: 'MskSourceReferenceForm',
      model: `
                    structure MskSourceReferenceForm {
                        @required
                        cluster_arn: String
                    }
                `,
      required: true,
    },
    {
      name: 'KafkaSchemaForm',
      model: `
                        structure KafkaSchemaForm {
                            @required
                            kafka_topic: String

                            @required
                            schema_version: Integer

                            @required
                            schema_arn: String

                            @required
                            registry_arn: String
                        }
                    `,
      required: true,
    },
  ],
});

// Create a Custom Asset
new DataZoneCustomAsset(stack, 'TestCustomAsset', {
  domainId: cfnProject.domainIdentifier,
  projectId: cfnProject.attrId,
  name: 'TestCustomAsset',
  typeIdentifier: 'MskTopicAssetType',
  clusterName: 'mskCluster',
  topicName: 'testCustomAsset',
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

new cdk.CfnOutput(stack, 'MyOutput', {
  value: formType.name,
});

let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.MyOutput).toContain('TestFormType');
});
