// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, CustomResource, Duration, Stack } from 'aws-cdk-lib';
import { BuildEnvironmentVariable, BuildSpec, Project, Source } from 'aws-cdk-lib/aws-codebuild';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { CICDStage } from './application-stage';
import { DsfProvider } from './dsf-provider';

/**
 * Stack that contains resources related to running the
 * integration test.
 */
export class IntegrationTestStack extends Stack {
  /**
   * The CodeBuild Project that's going to run the
   * integration test.
   */
  readonly integrationTestCodeBuildProject: Project;

  /**
   * Constructor for the IntegrationTestStack
   * @param scope the scope of the construct
   * @param id the id of the construct
   * @param stage the stage in the CI/CD pipeline
   * @param integScriptPath the path of the integration test script
   * @param integTestCommand the command to be used to run the integration test script
   * @param stackOutputsEnv the output from the application stack to use as input to the test script
   * @param integTestPermissions IAM permissions for the integration test script
   */
  constructor(scope: Construct, id: string
    , stage: CICDStage
    , integScriptPath: string
    , integTestCommand: string
    , stackOutputsEnv?: Record<string, CfnOutput>
    , integTestPermissions?: PolicyStatement[]) {
    super(scope, id);

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    const integTestAsset = new Asset(this, `${stage.stage}IntegrationTestAsset`, {
      path: integScriptPath,
    });

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    const codebuildProjectRole = new Role(this, `${stage.stage}CodebuildProjRole`, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
    });

    if (integTestPermissions !== undefined) {
      // eslint-disable-next-line local-rules/no-tokens-in-construct-id
      codebuildProjectRole.attachInlinePolicy(new Policy(this, `${stage.stage}IntegrationTestPermissionPolicy`, {
        statements: integTestPermissions,
      }));
    }

    const envVariables: Record<string, BuildEnvironmentVariable> = {};

    if (stackOutputsEnv !== null && stackOutputsEnv !== undefined) {
      for (let k in stackOutputsEnv) {
        const v = stackOutputsEnv[k];

        envVariables[k] = {
          value: v.value,
        };
      }
    }

    // eslint-disable-next-line local-rules/no-tokens-in-construct-id
    this.integrationTestCodeBuildProject = new Project(this, `${stage.stage}IntegrationTestCodebuildProject`, {
      role: codebuildProjectRole,
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [integTestCommand],
          },
        },
      }),
      source: Source.s3({
        bucket: integTestAsset.bucket,
        path: integTestAsset.s3ObjectKey,
      }),
      environmentVariables: envVariables,
    });

    const buildTriggerRole = new Role(this, 'BuildTriggerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        CodeBuildTriggerPermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'codebuild:StartBuild',
                'codebuild:BatchGetBuilds',
              ],
              resources: [
                this.integrationTestCodeBuildProject.projectArn,
              ],
            }),
          ],
        }),
      },
    });

    const provider = new DsfProvider(this, 'CrIntegrationTestBuildTriggerProvider', {
      providerName: 'IntegrationTestBuildTriggerProvider',
      onEventHandlerDefinition: {
        depsLockFilePath: __dirname+'/../../processing/lib/resources/codebuild-trigger/package-lock.json',
        entryFile: __dirname+'/../../processing/lib/resources/codebuild-trigger/index.mjs',
        handler: 'index.onEventHandler',
        iamRole: buildTriggerRole,
        timeout: Duration.seconds(10),
      },
      isCompleteHandlerDefinition: {
        iamRole: buildTriggerRole,
        handler: 'index.isCompleteHandler',
        depsLockFilePath: __dirname+'/../../processing/lib/resources/codebuild-trigger/package-lock.json',
        entryFile: __dirname+'/../../processing/lib/resources/codebuild-trigger/index.mjs',
        timeout: Duration.seconds(10),
      },
      queryInterval: Duration.seconds(5),
    });

    const crProperties: Record<string, any> = {
      projectName: this.integrationTestCodeBuildProject.projectName,
      entropy: (new Date()).getTime(),
    };

    new CustomResource(this, 'IntegrationTestBuildTriggerResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::IntegrationTestBuildTrigger',
      properties: crProperties,
    });
  }
}