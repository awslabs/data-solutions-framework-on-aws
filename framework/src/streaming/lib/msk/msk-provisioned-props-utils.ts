// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ICertificateAuthority } from 'aws-cdk-lib/aws-acmpca';
import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IBucket } from 'aws-cdk-lib/aws-s3';

/**
 * Kafka cluster version
 */
export class KafkaVersion {
  /**
   * **Deprecated by Amazon MSK. You can't create a Kafka cluster with a deprecated version.**
   *
   * Kafka version 1.1.1
   *
   * @deprecated use the latest runtime instead
   */
  public static readonly V1_1_1 = KafkaVersion.of('1.1.1');

  /**
   * Kafka version 2.2.1
   */
  public static readonly V2_2_1 = KafkaVersion.of('2.2.1');

  /**
   * Kafka version 2.3.1
   */
  public static readonly V2_3_1 = KafkaVersion.of('2.3.1');

  /**
   * Kafka version 2.4.1
   */
  public static readonly V2_4_1_1 = KafkaVersion.of('2.4.1.1');

  /**
   * Kafka version 2.5.1
   */
  public static readonly V2_5_1 = KafkaVersion.of('2.5.1');

  /**
   * Kafka version 2.6.0
   */
  public static readonly V2_6_0 = KafkaVersion.of('2.6.0');

  /**
   * Kafka version 2.6.1
   */
  public static readonly V2_6_1 = KafkaVersion.of('2.6.1');

  /**
   * Kafka version 2.6.2
   */
  public static readonly V2_6_2 = KafkaVersion.of('2.6.2');

  /**
   * Kafka version 2.6.3
   */
  public static readonly V2_6_3 = KafkaVersion.of('2.6.3');

  /**
   * Kafka version 2.7.0
   */
  public static readonly V2_7_0 = KafkaVersion.of('2.7.0');

  /**
   * Kafka version 2.7.1
   */
  public static readonly V2_7_1 = KafkaVersion.of('2.7.1');

  /**
   * Kafka version 2.7.2
   */
  public static readonly V2_7_2 = KafkaVersion.of('2.7.2');

  /**
   * Kafka version 2.8.0
   */
  public static readonly V2_8_0 = KafkaVersion.of('2.8.0');

  /**
   * Kafka version 2.8.1
   */
  public static readonly V2_8_1 = KafkaVersion.of('2.8.1');

  /**
   * AWS MSK Kafka version 2.8.2.tiered
   */
  public static readonly V2_8_2_TIERED = KafkaVersion.of('2.8.2.tiered');

  /**
   * Kafka version 3.1.1
   */
  public static readonly V3_1_1 = KafkaVersion.of('3.1.1');

  /**
   * Kafka version 3.2.0
   */
  public static readonly V3_2_0 = KafkaVersion.of('3.2.0');

  /**
   * Kafka version 3.3.1
   */
  public static readonly V3_3_1 = KafkaVersion.of('3.3.1');

  /**
   * Kafka version 3.3.2
   */
  public static readonly V3_3_2 = KafkaVersion.of('3.3.2');

  /**
   * Kafka version 3.4.0
   */
  public static readonly V3_4_0 = KafkaVersion.of('3.4.0');

  /**
   * Kafka version 3.5.1
   */
  public static readonly V3_5_1 = KafkaVersion.of('3.5.1');

  /**
   * Custom cluster version
   * @param version custom version number
   */
  public static of(version: string) {
    return new KafkaVersion(version);
  }

  /**
   *
   * @param version cluster version number
   */
  private constructor(public readonly version: string) { }

}


/**
 * Kafka cluster version
 */
export class MskBrokerInstanceType {

  /**
   * Borker instance type kafka.t3.small
   */
  public static readonly KAFKA_T3_SMALL = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL));

  /**
   * Borker instance type kafka.m5.large
   */
  public static readonly KAFKA_M5_LARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.LARGE));

  /**
   * Borker instance type kafka.m5.xlarge
   */
  public static readonly KAFKA_M5_XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE));

  /**
   * Borker instance type kafka.m5.2xlarge
   */
  public static readonly KAFKA_M5_2XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE2));

  /**
   * Borker instance type kafka.m5.4xlarge
   */
  public static readonly KAFKA_M5_4XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE4));

  /**
   * Borker instance type kafka.m5.8xlarge
   */
  public static readonly KAFKA_M5_8XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE8));

  /**
   * Borker instance type kafka.m5.12xlarge
   */
  public static readonly KAFKA_M5_12XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE12));

  /**
   * Borker instance type kafka.m5.16xlarge
   */
  public static readonly KAFKA_M5_16XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE16));

  /**
   * Borker instance type kafka.m5.24xlarge
   */
  public static readonly KAFKA_M5_24XLARGE = MskBrokerInstanceType.of(InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE24));

  /**
   * Custom cluster version
   * @param version custom version number
   */
  private static of(instance: InstanceType) {
    return new MskBrokerInstanceType(instance);
  }

  /**
   *
   * @param version cluster version number
   */
  private constructor(public readonly instance: InstanceType) {

  }

}


/**
 * EBS volume information.
 */
export interface EbsStorageInfo {
  /**
   * The size in GiB of the EBS volume for the data drive on each broker node.
   *
   * @default 1000
   */
  readonly volumeSize?: number;

  /**
   * The AWS KMS key for encrypting data at rest.
   *
   * @default Uses AWS managed CMK (aws/kafka)
   */
  readonly encryptionKey?: IKey;
}

/**
 * The storage mode for the cluster brokers.
 */
export enum StorageMode {
  /**
   * Local storage mode utilizes network attached EBS storage.
   */
  LOCAL = 'LOCAL',

  /**
   * Tiered storage mode utilizes EBS storage and Tiered storage.
   */
  TIERED = 'TIERED',
}

/**
 * The Amazon MSK configuration to use for the cluster.
 * Note: There is currently no Cloudformation Resource to create a Configuration
 */
export interface ClusterConfigurationInfo {
  /**
   * The Amazon Resource Name (ARN) of the MSK configuration to use.
   * For example, arn:aws:kafka:us-east-1:123456789012:configuration/example-configuration-name/abcdabcd-1234-abcd-1234-abcd123e8e8e-1.
   */
  readonly arn: string;

  /**
   * The revision of the Amazon MSK configuration to use.
   */
  readonly revision: number;
}

/**
 * The level of monitoring for the MSK cluster
 *
 * @see https://docs.aws.amazon.com/msk/latest/developerguide/monitoring.html#metrics-details
 */
export enum ClusterMonitoringLevel {
  /**
   * Default metrics are the essential metrics to monitor.
   */
  DEFAULT = 'DEFAULT',

  /**
   * Per Broker metrics give you metrics at the broker level.
   */
  PER_BROKER = 'PER_BROKER',

  /**
   * Per Topic Per Broker metrics help you understand volume at the topic level.
   */
  PER_TOPIC_PER_BROKER = 'PER_TOPIC_PER_BROKER',

  /**
   * Per Topic Per Partition metrics help you understand consumer group lag at the topic partition level.
   */
  PER_TOPIC_PER_PARTITION = 'PER_TOPIC_PER_PARTITION',
}

/**
 * Monitoring Configuration
 */
export interface MonitoringConfiguration {
  /**
   * Specifies the level of monitoring for the MSK cluster.
   *
   * @default DEFAULT
   */
  readonly clusterMonitoringLevel?: ClusterMonitoringLevel;

  /**
   * Indicates whether you want to enable or disable the JMX Exporter.
   *
   * @default false
   */
  readonly enablePrometheusJmxExporter?: boolean;

  /**
   * Indicates whether you want to enable or disable the Prometheus Node Exporter.
   *
   * You can use the Prometheus Node Exporter to get CPU and disk metrics for the broker nodes.
   *
   * @default false
   */
  readonly enablePrometheusNodeExporter?: boolean;
}

/**
 * Configuration details related to broker logs.
 */
export interface BrokerLogging {
  /**
   * The Kinesis Data Firehose delivery stream that is the destination for broker logs.
   *
   * @default - disabled
   */
  readonly firehoseDeliveryStreamName?: string;

  /**
   * The CloudWatch Logs group that is the destination for broker logs.
   *
   * @default - disabled
   */
  readonly cloudwatchLogGroup?: ILogGroup;

  /**
   * Details of the Amazon S3 destination for broker logs.
   *
   * @default - disabled
   */
  readonly s3?: S3LoggingConfiguration;
}

/**
 * Details of the Amazon S3 destination for broker logs.
 */
export interface S3LoggingConfiguration {
  /**
   * The S3 bucket that is the destination for broker logs.
   */
  readonly bucket: IBucket;

  /**
   * The S3 prefix that is the destination for broker logs.
   *
   * @default - no prefix
   */
  readonly prefix?: string;
}

/**
 * SASL authentication properties
 */
export interface SaslAuthProps {

  /**
   * Enable IAM access control.
   *
   * @default true
   */
  readonly iam?: boolean;

}

/**
 * TLS authentication properties
 */
export interface TlsAuthProps {
  /**
   * List of ACM Certificate Authorities to enable TLS authentication.
   *
   * @default - none
   */
  readonly certificateAuthorities?: ICertificateAuthority[];
}

/**
 * SASL + TLS authentication properties
 */
export interface SaslTlsAuthProps extends SaslAuthProps, TlsAuthProps { }

/**
 * Configuration properties for client authentication.
 */
export class ClientAuthentication {
  /**
   * SASL authentication
   */
  public static sasl(props: SaslAuthProps): ClientAuthentication {
    return new ClientAuthentication(props, undefined);
  }

  /**
   * TLS authentication
   */
  public static tls(props: TlsAuthProps): ClientAuthentication {
    return new ClientAuthentication(undefined, props);
  }

  /**
   * SASL + TLS authentication
   */
  public static saslTls(saslTlsProps: SaslTlsAuthProps): ClientAuthentication {
    return new ClientAuthentication(saslTlsProps, saslTlsProps);
  }

  /**
   * @param saslProps - properties for SASL authentication
   * @param tlsProps - properties for TLS authentication
   */
  private constructor(
    public readonly saslProps?: SaslAuthProps,
    public readonly tlsProps?: TlsAuthProps,
  ) {}
}

export enum AclResourceTypes {
  ANY = 'Any',
  TOPIC = 'Topic',
  GROUP = 'Group',
  CLUSTER = 'Cluster',
  TRANSACTIONAL_ID = 'Transactional_id',
}

export enum AclPermissionTypes {
  ANY = 'Any',
  DENY = 'Deny',
  ALLOW = 'Allow',
}

export enum AclOperationTypes {
  ALL = 'All',
  READ = 'Read',
  WRITE = 'Write',
  CREATE = 'Create',
  DELETE = 'Delete',
  ALTER = 'Alter',
  DESCRIBE = 'Describe',
  CLUSTER_ACTION = 'ClusterAction',
  ALTER_CONFIGS = 'AlterConfigs',
  IDEMPOTENT_WRITE = 'IdempotentWrite',
}