// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The base interface for the different data sharing lifecycle properties
 */
export interface BaseRedshiftDataSharingAccessProps {
  /**
   * The name of the database to connect to and run the lifecycle command on.
   */
  readonly databaseName: string;

  /**
   * The name of the data share
   */
  readonly dataShareName: string;

  /**
   * The ARN of the datashare. This is required for any action that is cross account
   */
  readonly dataShareArn?: string;

  /**
   * For Grants
   * This is the consumer namespace that are in the same account as the producer.
   * For cross-account grants, `namespaceId` is ignored.
   *
   * For Consumers
   * This pertains to the producer's namespace ID. This is required for both same or cross account scenarios.
   */
  readonly namespaceId?: string;

  /**
   * For Grants
   * This is the consumer account that you're granting cross account access.
   *
   * For Consumers
   * This pertains to the producer's account. This is only used if producer is a different account.
   */
  readonly accountId?: string;
}