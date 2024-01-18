// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Duration } from 'aws-cdk-lib';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { StorageClass } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { AccessLogsBucket } from './access-logs-bucket';
import { AnalyticsBucket } from './analytics-bucket';
import { DataLakeStorageProps } from './data-lake-storage-props';
import { BucketUtils, Context, TrackedConstruct, TrackedConstructProps } from '../../utils';


/**
 * Creates the storage layer for a data lake, composed of 3 {@link AnalyticsBucket} for Bronze, Silver, and Gold data.
 * @see https://awslabs.github.io/data-solutions-framework-on-aws/docs/constructs/library/Storage/data-lake-storage
 *
 * @example
 * // Set the context value for global data removal policy
 * this.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);
 *
 * new dsf.storage.DataLakeStorage(this, 'MyDataLakeStorage', {
 *  bronzeBucketName: 'my-bronze',
 *  bronzeBucketInfrequentAccessDelay: 90,
 *  bronzeBucketArchiveDelay: 180,
 *  silverBucketName: 'my-silver',
 *  silverBucketInfrequentAccessDelay: 180,
 *  silverBucketArchiveDelay: 360,
 *  goldBucketName: 'my-gold',
 *  goldBucketInfrequentAccessDelay: 180,
 *  goldBucketArchiveDelay: 360,
 *  removalPolicy: cdk.RemovalPolicy.DESTROY,
 * });
 */
export class DataLakeStorage extends TrackedConstruct {

  /**
   * The S3 Bucket for Bronze layer.
   */
  public readonly bronzeBucket: AnalyticsBucket;
  /**
   * The S3 Bucket for Silver layer.
   */
  public readonly silverBucket: AnalyticsBucket;
  /**
   * The S3 Bucket for Gold layer.
   */
  public readonly goldBucket: AnalyticsBucket;
  /**
   * The KMS Key used to encrypt all DataLakeStorage S3 buckets.
   */
  public readonly dataLakeKey: IKey;
  /**
   * The S3 Bucket for access logs.
   */
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

    this.accessLogsBucket = new AccessLogsBucket(this, 'AccessLogsBucket', {
      removalPolicy: props?.removalPolicy,
    });
    const removalPolicy = Context.revertRemovalPolicy(this, props?.removalPolicy);

    // Create the key if it not provided in the parameters
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
        transitionAfter: Duration.days(props?.bronzeBucketArchiveDelay || 180),
      },
    ];

    // Create the bronze data bucket with the bronze transitions
    this.bronzeBucket = new AnalyticsBucket(this, 'BronzeBucket', {
      encryptionKey: this.dataLakeKey,
      bucketName: props?.bronzeBucketName || BucketUtils.generateUniqueBucketName(this, 'BronzeBucket', 'bronze'),
      lifecycleRules: [
        {
          transitions: bronzeTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
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
      bucketName: props?.silverBucketName || BucketUtils.generateUniqueBucketName(this, 'SilverBucket', 'silver'),
      lifecycleRules: [
        {
          transitions: silverTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
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
      bucketName: props?.goldBucketName || BucketUtils.generateUniqueBucketName(this, 'GoldBucket', 'gold'),
      lifecycleRules: [
        {
          transitions: goldTransitions,
        },
      ],
      removalPolicy,
      serverAccessLogsBucket: this.accessLogsBucket,
    });
  }
}
