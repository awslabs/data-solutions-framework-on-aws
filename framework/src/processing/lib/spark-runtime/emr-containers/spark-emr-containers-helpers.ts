import { Aws, RemovalPolicy } from "aws-cdk-lib";
import { ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { DsfProvider } from "../../../../utils/lib/dsf-provider";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import path = require("path");
import { SecurityGroup, SubnetType, IVpc } from "aws-cdk-lib/aws-ec2";



export function interactiveSessionsProviderSetup(
    scope: Construct,
    removalPolicy: RemovalPolicy,
    vpc: IVpc,
    assetBucket?: IBucket) : string {

    let lambdaProviderSecurityGroup: SecurityGroup = new SecurityGroup(scope, '', {
        vpc: vpc
    });

    //The policy allowing the managed endpoint custom resource to create call the APIs for managed endpoint
    const lambdaPolicy = [
        new PolicyStatement({
          resources: ['*'],
          actions: ['emr-containers:DescribeManagedEndpoint'],
        }),
        new PolicyStatement({
          resources: ['*'],
          actions: [
            'emr-containers:DeleteManagedEndpoint'],
          // conditions: { StringEquals: { 'aws:ResourceTag/for-use-with': 'cdk-analytics-reference-architecture' } },
        }),
        new PolicyStatement({
          resources: [`arn:${Aws.PARTITION}:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/*`],
          actions: ['emr-containers:CreateManagedEndpoint'],
          conditions: { StringEquals: { 'aws:ResourceTag/for-use-with': 'cdk-analytics-reference-architecture' } },
        }),
        new PolicyStatement({
          resources: [`arn:${Aws.PARTITION}:emr-containers:${Aws.REGION}:${Aws.ACCOUNT_ID}:/virtualclusters/*`],
          actions: ['emr-containers:TagResource'],
          conditions: { StringEquals: { 'aws:ResourceTag/for-use-with': 'cdk-analytics-reference-architecture' } },
        }),
        new PolicyStatement({
          resources: ['*'],
          actions: [
            'ec2:CreateSecurityGroup',
            'ec2:DeleteSecurityGroup',
            'ec2:DescribeNetworkInterfaces',
            'ec2:AuthorizeSecurityGroupEgress',
            'ec2:AuthorizeSecurityGroupIngress',
            'ec2:RevokeSecurityGroupEgress',
            'ec2:RevokeSecurityGroupIngress',
          ],
        }),
      ];

    if(assetBucket) {
        lambdaPolicy.push(
            new PolicyStatement({
                resources: [assetBucket.bucketArn],
                actions: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
              })
        )
    }

      //Policy to allow lambda access to cloudwatch logs
    const lambdaExecutionRolePolicy = new ManagedPolicy(scope, 'LambdaExecutionRolePolicy', {
        statements: lambdaPolicy,
        description: 'Policy similar to lambda execution role but scoped down',
      });

      const provider = new DsfProvider(scope, 'Provider', {
        providerName: 'emr-containers-interactive-endpoint-provider',
        onEventHandlerDefinition: {
          handler: 'index.handler',
          depsLockFilePath: path.join(__dirname, './resources/lambdas/managed-endpoint/package-lock.json'),
          entryFile: path.join(__dirname, './resources/lambdas/managed-endpoint/index.js'),
          managedPolicy: lambdaExecutionRolePolicy,
        },
        isCompleteHandlerDefinition: {
            handler: 'index.handler',
            depsLockFilePath: path.join(__dirname, './resources/lambdas/managed-endpoint/package-lock.json'),
            entryFile: path.join(__dirname, './resources/lambdas/managed-endpoint/index.js'),
            managedPolicy: lambdaExecutionRolePolicy,
          },
        vpc: vpc ? vpc: undefined,
        subnets: vpc ? { subnetType : SubnetType.PRIVATE_WITH_EGRESS } : undefined,
        securityGroups: lambdaProviderSecurityGroup ? [lambdaProviderSecurityGroup] : undefined,
        removalPolicy,
      });

    return provider.serviceToken;
    
}