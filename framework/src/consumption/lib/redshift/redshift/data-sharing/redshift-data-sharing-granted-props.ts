// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CustomResource } from 'aws-cdk-lib';
import { AwsCustomResource } from 'aws-cdk-lib/custom-resources';

/**
 * Return interface after granting access to consumer
 */
export interface RedshiftDataSharingGrantedProps {
  /**
   * The resource associated with the grant command
   */
  readonly resource: CustomResource;

  /**
   * If auto-authorization is turned on, this is the resource associated with the action
   */
  readonly shareAuthorizationResource?: AwsCustomResource;
}