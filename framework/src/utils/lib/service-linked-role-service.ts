// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class ServiceLinkedRoleService {
  public static readonly EKS = new ServiceLinkedRoleService('eks.amazonaws.com', 'AWSServiceRoleForAmazonEKS');
  public static readonly EMR_CONTAINERS = new ServiceLinkedRoleService('emr-containers.amazonaws.com', 'AWSServiceRoleForAmazonEMRContainers');
  public static readonly EMR_SERVERLESS = new ServiceLinkedRoleService('ops.emr-serverless.amazonaws.com', 'AWSServiceRoleForAmazonEMRServerless');
  public static readonly KAFKA = new ServiceLinkedRoleService('kafka.amazonaws.com', 'AWSServiceRoleForKafka');
  public static readonly REDSHIFT = new ServiceLinkedRoleService('redshift.amazonaws.com', 'AWSServiceRoleForRedshift');
  public static readonly OPENSEARCH = new ServiceLinkedRoleService('opensearchservice.amazonaws.com', 'AWSServiceRoleForAmazonOpenSearchService');

  public readonly serviceName: string;
  public readonly roleName: string;

  constructor(serviceName: string, roleName: string) {
    this.serviceName = serviceName;
    this.roleName = roleName;
  }

  public getRoleArn(account: string) {
    return `arn:aws:iam::${account}:role/aws-service-role/${this.serviceName}/${this.roleName}`;
  }

  public getCreateServiceLinkedRolePolicy(account: string) {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'iam:CreateServiceLinkedRole',
      ],
      resources: [
        this.getRoleArn(account),
      ],
      conditions: {
        StringLike: {
          'iam:AWSServiceName': this.serviceName,
        },
      },
    });
  }
}