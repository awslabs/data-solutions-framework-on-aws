// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataZoneClient, GetAssetCommand, CreateAssetCommand, CreateAssetRevisionCommand, DeleteAssetCommand } from "@aws-sdk/client-datazone";
import { GlueClient, ListSchemasCommand, GetSchemaVersionCommand } from "@aws-sdk/client-glue";
import { KafkaClient, ListClustersV2Command, DescribeClusterV2Command } from "@aws-sdk/client-kafka";
import { SSMClient, GetParametersByPathCommand, DeleteParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";


// Initialize AWS SDK clients
const ssmClient = new SSMClient();
const dataZoneClient = new DataZoneClient();
const glueClient = new GlueClient();
const kafkaClient = new KafkaClient();

export const handler = async () => {
  const clusterName = process.env.CLUSTER_NAME;
  const region = process.env.REGION;
  const registryName = process.env.REGISTRY_NAME;
  const domainId = process.env.DOMAIN_ID;
  const accountId = process.env.ACCOUNT_ID;
  const projectId = process.env.PROJECT_ID;
  const partition = process.env.PARTITION;
  const parameterKey = process.env.PARAMETER_KEY
  const parameterPrefix = process.env.PARAMETER_PREFIX
  
  if (!clusterName || !region || !registryName || !domainId || !accountId || !projectId) {
    throw new Error('Missing required environment variables.');
  }
  
  const registryArn = `arn:${partition}:glue:${region}:${accountId}:registry/${registryName}`;
  
  
  let clusterArn;
  let clusterType;
  
  try {
    // Step 1: Retrieve existing parameters
    const existingParametersResponse = await ssmClient.send(new GetParametersByPathCommand({
      Path: parameterPrefix,
      Recursive: true,
      WithDecryption: true
    }));
    const existingParameters = existingParametersResponse.Parameters || [];
    const assetMap = new Map(); // Map to hold assetName and assetId
    
    for (const param of existingParameters) {
      const assetName = param.Name.split('/').pop();
      if (assetName && param.Value) {
        assetMap.set(assetName, param.Value);
      }
    }
    console.log(assetMap);
    
    // Step 2: List all Kafka clusters and find the ARN for the specified cluster
    try {
      const listClustersCommand = new ListClustersV2Command({});
      const listClustersResponse = await kafkaClient.send(listClustersCommand);
      const cluster = listClustersResponse.ClusterInfoList.find(c => c.ClusterName === clusterName);
      
      if (!cluster) {
        throw new Error(`Cluster with name "${clusterName}" not found.`);
      }
      
      clusterArn = cluster.ClusterArn;
      clusterUuid = cluster.ClusterArn.split('/').pop();
      console.log(`Cluster ARN for ${clusterName} found: ${clusterArn}`);
      
      // Describe the Kafka cluster to determine its type
      const describeClusterCommand = new DescribeClusterV2Command({ ClusterArn: clusterArn });
      const describeClusterResponse = await kafkaClient.send(describeClusterCommand);
      clusterType = describeClusterResponse.ClusterInfo?.ClusterType;
      
      if (!clusterType) {
        throw new Error(`Failed to determine the cluster type for cluster: ${clusterName}`);
      }
      
      console.log(`Cluster type for ${clusterName} is ${clusterType}`);
      
    } catch (err) {
      console.error('Error handling Kafka cluster:', err);
      throw new Error('Failed to handle Kafka cluster.');
    }
    
    // Step 3: List all schemas in the registry
    const listSchemasCommand = new ListSchemasCommand({
      RegistryId: { RegistryName: registryName }
    });
    const schemaListResponse = await glueClient.send(listSchemasCommand);
    const schemas = schemaListResponse.Schemas || [];
    
    console.log(`Found ${schemas.length} schemas in the registry.`);
    
    // Step 4: Process each schema
    for (const schema of schemas) {
      const schemaArn = schema.SchemaArn;
      const schemaName = schema.SchemaName;
      const parameterName = `/datazone/${domainId}/${registryName}/asset/${schemaName}`;
      let schemaDefinition = '';
      let versionNumber = 1;
      
      // Retrieve schema definition
      try {
        const getSchemaVersionCommand = new GetSchemaVersionCommand({
          SchemaId: { SchemaArn: schemaArn },
          SchemaVersionNumber: { LatestVersion: true }
        });
        const schemaVersionResponse = await glueClient.send(getSchemaVersionCommand);
        schemaDefinition = schemaVersionResponse.SchemaDefinition;
        versionNumber = schemaVersionResponse.VersionNumber;
        console.log('Retrieved schema definition.');
      } catch (err) {
        console.error('Error retrieving schema definition:', err);
        continue; // Skip to the next schema if there is an issue
      }
      
      // Build the source identifier
      const sourceIdentifier = `kafka://${clusterName}/${schemaName}`;
      const formsInput = [
        {
          formName: 'MskSourceReferenceFormType',
          typeIdentifier: 'MskSourceReferenceFormType',
          content: JSON.stringify({
            cluster_arn: clusterArn,
            cluster_type: clusterType  // Ensure clusterType is correctly included
          }),
        },
        {
          formName: 'AssetCommonDetailsForm',
          typeIdentifier: 'default',
          content: JSON.stringify({
            sourceIdentifier: sourceIdentifier,
            schemaDefinition: schemaDefinition || ''
          }),
        },
        {
          formName: 'KafkaSchemaFormType',
          typeIdentifier: 'KafkaSchemaFormType',
          content: JSON.stringify({
            kafka_topic: schemaName,
            schema_version: versionNumber,
            schema_arn: schemaArn,
            registry_arn: registryArn,
          }),
        },
        {
          formName: 'RelationalTableFormType',
          typeIdentifier: 'amazon.datazone.RelationalTableFormType',
          content: JSON.stringify({
            tableName: schemaName,
            columns: parseSchemaDefinition(schemaDefinition),
          }),
        }
      ];
      
      console.log(formsInput);
      
      // Check if the asset already exists
      const assetId = assetMap.get(schemaName);
      if (assetId) {
        console.log(`Asset ${schemaName} already exists. Creating or updating revision.`);
        
        try {
          // Check if asset exists in DataZone
          await dataZoneClient.send(new GetAssetCommand({
            domainIdentifier: domainId,
            identifier: assetId
          }));
          
          // Create Asset Revision
          await dataZoneClient.send(new CreateAssetRevisionCommand({
            name: schemaName,
            domainIdentifier: domainId,
            identifier: assetId,
            description: 'Updating asset with new schema or forms',
            formsInput,
            externalIdentifier: buildMskTopicArn(region, accountId, clusterName, clusterUuid, schemaName, partition),
          }));
          
          console.log(`Asset revision for ${schemaName} updated.`);
        } catch (error) {
          if (error.$metadata?.httpStatusCode === 404) {
            // If asset does not exist, it may have been deleted, so remove its parameter
            console.log(`Asset ${schemaName} not found in DataZone, removing parameter.`);
            await ssmClient.send(new DeleteParameterCommand({ Name: parameterName }));
            assetMap.delete(schemaName);
          } else {
            console.error('Error creating asset revision:', error);
          }
        }
      } else {
        // Create new asset and store its ID
        console.log(`Creating new asset ${schemaName}.`);
        try {
          const createResponse = await dataZoneClient.send(new CreateAssetCommand({
            domainIdentifier: domainId,
            owningProjectIdentifier: projectId,
            name: schemaName,
            typeIdentifier: 'MskTopicAssetType',
            formsInput,
            externalIdentifier: buildMskTopicArn(region, accountId, clusterName, schemaName, partition),
          }));
          
          const newAssetId = createResponse.id;
          
          // Store the new asset ID in SSM Parameter Store
          const putParameterCommand = new PutParameterCommand({
            Name: parameterName,
            Value: newAssetId,
            KeyId: parameterKey,
            Type: 'String',
            Overwrite: true
          });
          
          await ssmClient.send(putParameterCommand);
          console.log(`Stored asset ID ${newAssetId} in SSM Parameter Store under ${parameterName}`);
        } catch (error) {
          console.error('Error creating MSK asset:', error);
        }
      }
    }
    
    // Step 5: Clean up old assets if necessary
    for (const [assetName, assetId] of assetMap) {
      if (!schemas.some(schema => schema.SchemaName === assetName)) {
        // If the schema is not in the current list, delete the asset and its parameter
        console.log(`Deleting stale asset ${assetName}.`);
        try {
          await dataZoneClient.send(new DeleteAssetCommand({
            domainIdentifier: domainId,
            identifier: assetId
          }));
          
          await ssmClient.send(new DeleteParameterCommand({ Name: `/datazone/${domainId}/${registryName}/asset/${assetName}` }));
          console.log(`Deleted asset ${assetName} and its parameter.`);
        } catch (error) {
          console.error('Error deleting asset or parameter:', error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process request',
        error: error.message
      }),
    };
  }
};

// Utility functions
function buildMskTopicArn(region, accountId, clusterName, clusterUuid, topicName, partition) {
  return `arn:${partition}:kafka:${region}:${accountId}:topic/${clusterName}/${clusterUuid}/${topicName}`;
}

function parseSchemaDefinition(schemaDefinition) {
  try {
    const schemaJson = JSON.parse(schemaDefinition);
    const columns = [];
    
    if (schemaJson.fields) {
      for (const field of schemaJson.fields) {
        let columnType = field.type;
        
        if (typeof columnType === 'object' && columnType.type) {
          columnType = columnType.type;
        }
        
        columns.push({
          columnName: field.name,
          dataType: columnType
        });
      }
    }
    
    return columns;
  } catch (err) {
    console.error('Error parsing schema definition:', err);
    return [];
  }
}
