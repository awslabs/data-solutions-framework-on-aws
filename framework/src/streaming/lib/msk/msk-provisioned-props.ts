// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AclOperationTypes,
  AclPermissionTypes,
  AclResourceTypes,
  ResourcePatternTypes,
} from './msk-provisioned-props-utils';


/**
 * The CDK Custom resources uses KafkaJs
 * This enum allow you to set the log level
 */
export enum KafkaClientLogLevel {
  WARN = 'WARN',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
}

/**
 * Kakfa ACL
 * This is similar to the object used by `kafkajs`, for more information see this [link](https://kafka.js.org/docs/admin#create-acl)
 */
export interface Acl {
  readonly principal: string;
  readonly host: string;
  readonly operation: AclOperationTypes;
  readonly permissionType: AclPermissionTypes;
  readonly resourceType: AclResourceTypes;
  readonly resourceName: string;
  readonly resourcePatternType: ResourcePatternTypes;
}

