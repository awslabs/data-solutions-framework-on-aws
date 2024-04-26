// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomResource } from 'aws-cdk-lib';
import { AwsCustomResource } from 'aws-cdk-lib/custom-resources';

/**
 * Return interface after creating a new database from data share
 */
export interface RedshiftDataSharingCreateDbFromShareProps {
  /**
   * The resource associated with the create database command
   */
  readonly resource: CustomResource;

  /**
   * If auto-association is turned on, this is the resource associated with the action
   */
  readonly associateDataShareResource?: AwsCustomResource;
}