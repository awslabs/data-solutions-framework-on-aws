// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { StorageClass } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AccessLogsBucket } from './access-logs-bucket';
import { AnalyticsBucket } from './analytics-bucket';
import { TrackedConstruct, TrackedConstructProps } from '../utils';


/**
 * Properties for the DataLakeStorage Construct
 */
export interface DataLakeStorageProps {
  /**
   * The KMS Key used to encrypt all DataLakeStorage S3 buckets.
   * @default - A single KMS customer key is created.
   */
  readonly dataLakeKey?: Key;

  /**
   * Name of the Bronze bucket. Will be appended by the unique ID.
   * @default - `bronze` will be used.
   */
  readonly bronzeBucketName?: string;

  /**
   * Name of the Silver bucket. Will be appended by the unique ID.
   * @default - `silver` will be used.
   */
  readonly silverBucketName?: string;

  /**
   * Name of the Gold bucket. Will be appended by the unique ID.
   * @default - `gold` will be used.
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
   * The removal policy when deleting the CDK resource. If DESTROY is selected, data will be automatically deleted.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * CDK Construct that creates the storage layer for data lake, composed of 3 {@link AnalyticsBucket} for Bronze, Silver, and Gold data.
 * See documentation TODO insert link.
 * 
 * **Usage example:**
 *
 * ```typescript
 * import { DataLakeStorage } from 'aws-data-solutions-framework';
 *
 * // Set context value for global data removal policy (or set in cdk.json).
 * this.node.setContext('adsf', {'remove_data_on_destroy': 'true'})
 *
 * new DataLakeStorage(this, 'MyDataLakeStorage', {
 *  bronzeName: 'my-bronze',
 *  bronzeInfrequentAccessDelay: 90,
 *  bronzeArchiveDelay: 180,
 *  silverName: 'my-silver',
 *  silverInfrequentAccessDelay: 180,
 *  silverArchiveDelay: 360,
 *  goldName: 'my-gold',
 *  goldInfrequentAccessDelay: 180,
 *  goldArchiveDelay: 360,
 *  removalPolicy: cdk.RemovalPolicy.DESTROY,
 *  dataLakeKey: new Key(stack, 'MyDataLakeKey')
 * });
 * ```
 */
export class DataLakeStorage extends TrackedConstruct {

  public readonly bronzeBucket: AnalyticsBucket;
  public readonly silverBucket: AnalyticsBucket;
  public readonly goldBucket: AnalyticsBucket;
  public readonly dataLakeKey: Key;
  public readonly accessLogsBucket: AccessLogsBucket;

  /**
   * Construct a new instance of DataLakeStorage
   * @param {Construct} scope the Scope of the CDK Construct
   * @param {string} id the ID of the CDK Construct
   * @param {DataLakeStorageProps} props the DataLakeStorageProps properties
   */
  constructor(scope: Construct, id: string, props?: DataLakeStorageProps) {

    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataLakeStorage.name,
    };

    super(scope, id, trackedConstructProps);

    this.accessLogsBucket = new AccessLogsBucket(this, 'AccessLogsBucket');
    const removalPolicy = props?.removalPolicy || RemovalPolicy.RETAIN;

    // create the key if it's not provided in the parameters
    this.dataLakeKey = props?.dataLakeKey || new Key(this, 'DataKey', {
      removalPolicy,
      enableKeyRotation: true,
    });

    // Prepare Amazon S3 Lifecycle Rules for bronze data
    const bronzeTransitions = [
      {
        storageClass: StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(props?.bronzeBucketInfrequentAccessDelay || 90),
      },
      {
        storageClass: StorageClass.GLACIER,
        transitionAfter: Duration.days(props?.bronzeBucketArchiveDelay || 180),
      },
    ];

    // Create the bronze data bucket with the bronze transitions
    this.bronzeBucket = new AnalyticsBucket(this, 'BronzeBucket', {
      encryptionKey: this.dataLakeKey,
      bucketName: props?.bronzeBucketName || 'bronze',
      lifecycleRules: [
        {
          transitions: bronzeTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: (props?.bronzeBucketName || 'bronze') + '-bucket',
    });

    // Prepare Amazon S3 Lifecycle Rules for silver data
    const silverTransitions = [
      {
        storageClass: StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(props?.silverBucketInfrequentAccessDelay || 180),
      },
    ];
    if (props?.silverBucketArchiveDelay) {
      silverTransitions.push(
        {
          storageClass: StorageClass.GLACIER,
          transitionAfter: Duration.days(props?.silverBucketArchiveDelay),
        },
      );
    }

    // Create the silver data bucket
    this.silverBucket = new AnalyticsBucket(this, 'SilverBucket', {
      encryptionKey: this.dataLakeKey,
      bucketName: props?.silverBucketName || 'silver',
      lifecycleRules: [
        {
          transitions: silverTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: (props?.silverBucketName || 'silver') + '-bucket',
    });

    // Prepare Amazon S3 Lifecycle Rules for silver data
    const goldTransitions = [
      {
        storageClass: StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(props?.goldBucketInfrequentAccessDelay || 180),
      },
    ];
    if (props?.goldBucketArchiveDelay) {
      goldTransitions.push(
        {
          storageClass: StorageClass.GLACIER,
          transitionAfter: Duration.days(props?.goldBucketArchiveDelay),
        },
      );
    }

    // Create the gold data bucket
    this.goldBucket = new AnalyticsBucket(this, 'GoldBucket', {
      encryptionKey: this.dataLakeKey,
      bucketName: props?.goldBucketName || 'gold',
      lifecycleRules: [
        {
          transitions: goldTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
      serverAccessLogsPrefix: (props?.goldBucketName || 'gold') + '-bucket',
    });
  }
}
