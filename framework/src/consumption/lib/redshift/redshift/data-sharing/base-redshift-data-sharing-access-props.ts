// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The base interface for the different data sharing lifecycle properties
 */
export interface BaseRedshiftDataSharingAccessProps {
  /**
   * The name of the Redshift database used in the data sharing.
   */
  readonly databaseName: string;

  /**
   * The name of the data share
   */
  readonly dataShareName: string;

  /**
   * The ARN of the datashare. This is required for any action that is cross account.
   * @default - No data share ARN is used.
   */
  readonly dataShareArn?: string;

  /**
   * For single account grants, this is the consumer namespace ID.
   * For cross-account grants, `namespaceId` is ignored.
   *
   * For consumers, this is the producer namespace ID. It is required for both single and cross account data sharing.
   * @default - No namespace ID is used.
   */
  readonly namespaceId?: string;

  /**
   * For cross-account grants, this is the consumer account ID.
   *
   * For cross-account consumers, this is the producer account ID.
   * @default - No account ID is used.
   */
  readonly accountId?: string;
}