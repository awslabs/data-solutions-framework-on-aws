import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataZoneCustomAsset } from './datazone-custom-asset';
import { DataZoneMSKCustomAssetProps } from './datazone-msk-custom-asset-props';
// import { GlueSchemaRegistryVersion } from './glue-schema-registry-version';
import { TrackedConstruct, TrackedConstructProps } from '../../../utils';

interface Column {
  columnName: string;
  dataType: string;
}

interface FormInput {
  formName: string;
  typeIdentifier: string;
  content: string;
}

interface SchemaField {
  name: string;
  type: any; // 'type' can be a string or a nested object
}

interface SchemaDefinition {
  type: string;
  name: string;
  fields: SchemaField[];
}

export class DataZoneMSKCustomAsset extends TrackedConstruct {
  readonly MSKAsset: DataZoneCustomAsset;

  constructor(scope: Construct, id: string, props: DataZoneMSKCustomAssetProps) {
    const trackedConstructProps: TrackedConstructProps = {
      trackingTag: DataZoneMSKCustomAsset.name,
    };

    super(scope, id, trackedConstructProps);

    // Fetch region and account ID from scope
    const region = Stack.of(this).region;
    const accountId = Stack.of(this).account;

    // Initialize formsInput with MskSourceReferenceForm
    const formsInput: FormInput[] = [
      {
        formName: 'MskSourceReferenceForm',
        typeIdentifier: 'MskSourceReferenceForm',
        content: JSON.stringify({
          cluster_arn: buildMskKafkaArn(region, accountId, props.clusterName),
        }),
      },
    ];

    // If includeSchema is true, add additional schema-related forms
    if (props.includeSchema) {
      // const schema = new GlueSchemaRegistryVersion(this, 'Schema', {
      //   schemaArn: props.schemaArn,
      //   latestVersion: true,
      // });

      const relationalFormInput = buildRelationalTableFormInput(
        '{"type":"record","name":"MyRecord","fields":[{"name":"id","type":"int"},{"name":"name","type":"string"},{"name":"topic","type":"string"}]}'
        , //Fn.sub('${SchemaDefinitionOutput}', { SchemaDefinitionOutput: schema.schemaDefinition }),
        props.topicName,
      );

      // // Create CloudFormation outputs for dynamic properties
      // const schemaArnOutput = Fn.sub('${SchemaArnOutput}', { SchemaArnOutput: String(schema.schemaArn) });
      //
      // const schemaVersionOutput = Fn.sub('${SchemaVersionOutput}', { SchemaVersionOutput: String(schema.schemaVersionNumber) });


      if (relationalFormInput) { // Ensure relationalFormInput is not null
        formsInput.push({
          formName: relationalFormInput.formName,
          typeIdentifier: relationalFormInput.typeIdentifier,
          content: relationalFormInput.content,
        });
      }

      formsInput.push({
        formName: 'KafkaSchemaForm',
        typeIdentifier: 'KafkaSchemaForm',
        content: JSON.stringify({
          kafka_topic: props.topicName,
          schema_version: 1,
          schema_arn: 'arn',
          registry_arn: props.registryArn,
        }),
      });
    }

    this.MSKAsset = new DataZoneCustomAsset(this, 'MSKAsset', {
      domainId: props.domainId,
      projectId: props.projectId,
      name: props.topicName,
      typeIdentifier: 'MskTopicAssetType',
      externalIdentifier: buildMskTopicArn(region, accountId, props.clusterName, props.topicName),
      formsInput: formsInput,
    });
  }
}

/**
 * Generates an ARN for an Amazon MSK topic.
 *
 * @param region - The AWS region where the MSK cluster is located.
 * @param accountId - The AWS account ID.
 * @param clusterName - The name of the MSK cluster.
 * @param topicName - The name of the Kafka topic.
 * @returns The ARN string for the MSK topic.
 */
function buildMskTopicArn(region: string, accountId: string, clusterName: string, topicName: string): string {
  return `arn:aws:kafka:${region}:${accountId}:topic/${clusterName}/${topicName}`;
}

/**
 * Generates an ARN for an Amazon MSK cluster.
 *
 * @param region - The AWS region where the MSK cluster is located.
 * @param accountId - The AWS account ID.
 * @param clusterName - The name of the MSK cluster.
 * @returns The ARN string for the MSK cluster.
 */
function buildMskKafkaArn(region: string, accountId: string, clusterName: string): string {
  return `arn:aws:kafka:${region}:${accountId}:cluster/${clusterName}/*`;
}

/**
 * Build a relational table form input from schema definition string
 * @param schemaDefinition JSON schema definition as a string
 * @param topicName Name of the topic to be used as the table name
 * @returns Form input object or null if there's an error
 */
function buildRelationalTableFormInput(schemaDefinition: string, topicName: string): FormInput | null {
  try {
    // Parse schema definition JSON
    const schemaJson: SchemaDefinition = JSON.parse(schemaDefinition);

    // Initialize columns list
    const columns: Column[] = [];

    // Check if 'fields' is present in the schema definition
    if ('fields' in schemaJson) {
      for (const field of schemaJson.fields) {
        let columnType = field.type;

        // Adjust type if it's a nested structure
        if (typeof columnType === 'object' && columnType !== null && 'type' in columnType) {
          columnType = columnType.type;
        }

        columns.push({
          columnName: field.name,
          dataType: columnType,
        });
      }

      // Return the relational table form input
      return {
        formName: 'RelationalTableForm',
        typeIdentifier: 'amazon.datazone.RelationalTableFormType',
        content: JSON.stringify({
          tableName: topicName, // Use topic name as table name
          columns: columns, // Use parsed columns from schema definition
        }),
      };
    } else {
      console.error('Schema definition does not contain "fields".');
      return null;
    }
  } catch (error) {
    console.error('Error parsing schema definition:', error);
    return null;
  }
}
