// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseRedshiftDataSharingAccessProps } from './base-redshift-data-sharing-access-props';

/**
 * Properties for data sharing consumer
 */
export interface RedshiftDataSharingCreateDbProps extends BaseRedshiftDataSharingAccessProps {
  /**
   * The namespace of the consumer, necessary for cross-account data shares
   */
  readonly consumerNamespaceArn?: string;

  /**
   * For consumers, the data share would be located in this database that would be created
   */
  readonly newDatabaseName: string;
}