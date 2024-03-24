// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureFlags, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { CfnCluster } from 'aws-cdk-lib/aws-msk';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { S3_CREATE_DEFAULT_LOGGING_POLICY } from 'aws-cdk-lib/cx-api';

import { Construct } from 'constructs';
import { BrokerLogging, ClientAuthentication } from './msk-provisioned-props-utils';
import { Utils } from '../../../utils';

/**
 * @internal
 *
 * @param scope
 * @param brokerLoggingProps
 * @returns
 */
export function monitoringSetup(
  scope: Construct,
  id: string,
  removalPolicy: RemovalPolicy,
  brokerLoggingProps?: BrokerLogging): CfnCluster.LoggingInfoProperty {


  const loggingBucket = brokerLoggingProps?.s3?.bucket;
  if (loggingBucket && FeatureFlags.of(scope).isEnabled(S3_CREATE_DEFAULT_LOGGING_POLICY)) {
    const stack = Stack.of(scope);
    loggingBucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new ServicePrincipal('delivery.logs.amazonaws.com'),
      ],
      resources: [
        loggingBucket.arnForObjects(`AWSLogs/${stack.account}/*`),
      ],
      actions: ['s3:PutObject'],
      conditions: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control',
          'aws:SourceAccount': stack.account,
        },
        ArnLike: {
          'aws:SourceArn': stack.formatArn({
            service: 'logs',
            resource: '*',
          }),
        },
      },
    }));

    loggingBucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new ServicePrincipal('delivery.logs.amazonaws.com'),
      ],
      resources: [loggingBucket.bucketArn],
      actions: [
        's3:GetBucketAcl',
        's3:ListBucket',
      ],
      conditions: {
        StringEquals: {
          'aws:SourceAccount': stack.account,
        },
        ArnLike: {
          'aws:SourceArn': stack.formatArn({
            service: 'logs',
            resource: '*',
          }),
        },
      },
    }));
  }

  let brokerLogGroup: LogGroup;

  //If no logging is defined in brokerLoggingProps
  //Create a cloudwatchlog

  let createLogGroup: boolean = false;

  if (brokerLoggingProps?.cloudwatchLogGroup == undefined &&
    brokerLoggingProps?.firehoseDeliveryStreamName == undefined &&
    brokerLoggingProps?.s3 == undefined) {

    brokerLogGroup = new LogGroup(scope, 'BrokerLogGroup', {
      removalPolicy: removalPolicy,
      logGroupName: `/aws/vendedlogs/${Utils.generateUniqueHash(scope, id)}`,
    });

    createLogGroup = true;
  }

  const loggingInfo = {
    brokerLogs: {
      cloudWatchLogs: {
        enabled: createLogGroup ? createLogGroup : brokerLoggingProps?.cloudwatchLogGroup !== undefined,
        logGroup: createLogGroup ? brokerLogGroup!.logGroupName : brokerLoggingProps?.cloudwatchLogGroup?.logGroupName,
      },
      firehose: {
        enabled: brokerLoggingProps?.firehoseDeliveryStreamName !==
          undefined,
        deliveryStream: brokerLoggingProps?.firehoseDeliveryStreamName,
      },
      s3: {
        enabled: loggingBucket !== undefined,
        bucket: loggingBucket?.bucketName,
        prefix: brokerLoggingProps?.s3?.prefix,
      },
    },
  };

  return loggingInfo;

}

/**
 * @internal
 *
 * @param clientAuthenticationProps
 * @returns
 */

export function clientAuthenticationSetup(
  clientAuthenticationProps?: ClientAuthentication):
  [CfnCluster.ClientAuthenticationProperty, boolean, boolean] {

  let clientAuthentication;

  let inClusterAcl: boolean = false;
  let iamAcl: boolean = false;

  if (clientAuthenticationProps?.tlsProps && clientAuthenticationProps?.saslProps?.iam) {
    clientAuthentication = {
      sasl: { iam: { enabled: clientAuthenticationProps.saslProps.iam } },
      tls: {
        certificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities?.map(
          (ca) => ca.certificateAuthorityArn,
        ),
      },
    };
    inClusterAcl = true;
    iamAcl = true;
  } else if (
    clientAuthenticationProps?.tlsProps?.certificateAuthorities !== undefined
  ) {
    clientAuthentication = {
      tls: {
        certificateAuthorityArnList: clientAuthenticationProps?.tlsProps?.certificateAuthorities.map(
          (ca) => ca.certificateAuthorityArn,
        ),
      },
    };
    inClusterAcl = true;
  } else {
    clientAuthentication = {
      sasl: { iam: { enabled: true } },
    };
    iamAcl = true;
  }

  return [clientAuthentication, inClusterAcl, iamAcl];
}


/**
   * Get the ZooKeeper Connection string
   *
   * Uses a Custom Resource to make an API call to `describeCluster` using the Javascript SDK
   *
   * @param scope
   * @param clusterArn
   * @returns - The am object with the connection string to use to connect to the ZooKeeper both in plaintext and TLS.
   */
export function getZookeeperConnectionString(scope: Construct, cluster: CfnCluster): {
  ZookeeperConnectStringTls: string;
  ZookeeperConnectString: string;
} {

  let clusterDescription = new AwsCustomResource(scope, 'ZookeeperConnect', {
    onUpdate: {
      service: 'Kafka',
      action: 'describeCluster',
      parameters: {
        ClusterArn: cluster.attrArn,
      },
      physicalResourceId: PhysicalResourceId.of(
        'ZooKeeperConnectionString',
      ),
      // Limit the output of describeCluster that is otherwise too large
      outputPaths: [
        'ClusterInfo.ZookeeperConnectString',
        'ClusterInfo.ZookeeperConnectStringTls',
      ],
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: [cluster.attrArn],
    }),
    installLatestAwsSdk: false,
  });

  clusterDescription.node.addDependency(cluster);

  return {
    ZookeeperConnectString: clusterDescription.getResponseField('ClusterInfo.ZookeeperConnectString'),
    ZookeeperConnectStringTls: clusterDescription.getResponseField('ClusterInfo.ZookeeperConnectStringTls'),
  };
}

