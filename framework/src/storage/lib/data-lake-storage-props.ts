// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IKey } from 'aws-cdk-lib/aws-kms';

/**
 * Properties for the DataLakeStorage Construct
 */
export interface DataLakeStorageProps {
  /**
   * The KMS Key used to encrypt all DataLakeStorage S3 buckets.
   * @default - A single KMS customer key is created.
   */
  readonly dataLakeKey?: IKey;

  /**
   * Name of the Bronze bucket. Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).
   * @default - `bronze-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.
   */
  readonly bronzeBucketName?: string;

  /**
   * Name of the Silver bucket. Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).
   * @default - `silver-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.
   */
  readonly silverBucketName?: string;

  /**
   * Name of the Gold bucket. Use `BucketUtils.generateUniqueBucketName()` to generate a unique name (recommended).
   * @default - `gold-<ACCOUNT_ID>-<REGION>-<UNIQUE_ID>` will be used.
   */
  readonly goldBucketName?: string;

  /**
   * Delay (in days) before moving BRONZE data to cold storage (Infrequent Access storage class).
   * @default -  Move objects to Infrequent Access after 30 days.
   */
  readonly bronzeBucketInfrequentAccessDelay?: number;

  /**
   * Delay (in days) before archiving BRONZE data to frozen storage (Glacier storage class).
   * @default -  Move objects to Glacier after 90 days.
   */
  readonly bronzeBucketArchiveDelay?: number;

  /**
   * Delay (in days) before moving SILVER data to cold storage (Infrequent Access storage class).
   * @default -  Move objects to Infrequent Access after 90 days.
   */
  readonly silverBucketInfrequentAccessDelay?: number;

  /**
   *
   * Delay (in days) before archiving SILVER data to frozen storage (Glacier storage class).
   * @default -  Objects are not archived to Glacier.
   */
  readonly silverBucketArchiveDelay?: number;

  /**
   * Delay (in days) before moving GOLD data to cold storage (Infrequent Access storage class).
   * @default -  Move objects to Infrequent Access after 90 days.
   */
  readonly goldBucketInfrequentAccessDelay?: number;

  /**
   * Delay (in days) before archiving GOLD data to frozen storage (Glacier storage class).
   * @default -  Objects are not archived to Glacier.
   */
  readonly goldBucketArchiveDelay?: number;

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@aws-data-solutions-framework/removeDataOnDestroy` needs to be set to true.
   * Otherwise, the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}