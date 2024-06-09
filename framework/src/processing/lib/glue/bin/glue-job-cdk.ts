#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_iam as iam, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { GlueDependencyStack } from '../lib/glue-dependency-stack';
import { GlueJobConstruct } from '../lib/glue-job-construct';
import * as dsf from '@cdklabs/aws-data-solutions-framework';
import { Key } from 'aws-cdk-lib/aws-kms';

export class GlueJobCDKStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for Glue job scripts and temporary data
    const dependencyBucket = new dsf.storage.AnalyticsBucket(this, 'AnalyticsBucket', {
      encryptionKey: new Key(this, 'DataKey', {
          enableKeyRotation: true,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
    });

    // Deploy the Glue job script to the S3 bucket
    const glueDependencyStack = new GlueDependencyStack(this, 'GlueDependencyStack', {
      bucket: dependencyBucket,
    });
    
    // Create the Glue job
    new GlueJobConstruct(this, 'GlueJobConstruct', {
      role: new iam.Role(this, 'GlueJobRole', {
        assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
        ],
      }),
      dependencyBucket: dependencyBucket,
      pythonDependenciesPath: 'extra_python/my_python_package.zip',
      jarsPath: 'jars/my_jars.jar',
      scriptPath: 'scripts/glue_script.py'
    });

    // Output the S3 bucket name and Glue job role ARN
    new CfnOutput(this, 'GlueJobBucketName', {
      value: dependencyBucket.bucketName,
    });
  }
}