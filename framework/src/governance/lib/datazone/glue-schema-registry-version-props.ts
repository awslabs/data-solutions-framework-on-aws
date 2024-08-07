import { RemovalPolicy } from 'aws-cdk-lib';

// Define the interface for the properties of the GlueSchemaRegistry construct
export interface GlueSchemaRegistryVersionProps {
  /**
   * The ARN of the schema registry.
   * Either this or `registryName` must be provided, but not both.
   */
  readonly schemaArn?: string;

  /**
   * The name of the schema registry.
   * Either this or `schemaRegistryArn` must be provided, but not both.
   */
  readonly registryName?: string;

  /**
   * The name of the schema.
   * This must be provided and is required regardless of whether `schemaRegistryArn` or `registryName` is provided.
   */
  readonly schemaName?: string;

  /**
   * The version number of the schema.
   * Optional. If not provided, `latestVersion` must be provided.
   */
  readonly schemaVersionNumber?: number;

  /**
   * A boolean indicating if the latest version of the schema should be retrieved.
   * Optional. If not provided, `schemaVersionNumber` must be provided.
   */
  readonly latestVersion?: boolean;

  /**
   * The removal policy for the custom resource.
   * Optional. Defaults to `RemovalPolicy.RETAIN`.
   */
  readonly removalPolicy?: RemovalPolicy;
}
