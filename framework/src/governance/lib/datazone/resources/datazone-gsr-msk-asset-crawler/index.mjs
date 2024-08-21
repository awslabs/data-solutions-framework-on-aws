import { DataZoneClient, CreateAssetCommand, CreateAssetRevisionCommand, GetAssetTypeCommand } from "@aws-sdk/client-datazone";
import { GlueClient, ListSchemasCommand, GetSchemaVersionCommand } from "@aws-sdk/client-glue";

export const handler = async () => {
    const dataZoneClient = new DataZoneClient();
    const glueClient = new GlueClient();

    const clusterName = process.env.CLUSTER_NAME;
    const region = process.env.REGION;
    const registryName = process.env.REGISTRY_NAME;

    if (!clusterName || !region || !registryName) {
        throw new Error('Missing required environment variables: CLUSTER_NAME, REGION, and REGISTRY_NAME.');
    }

    try {
        // Check if the MskTopicAssetType exists
        let assetTypeExists = false;
        try {
            const getAssetTypeCommand = new GetAssetTypeCommand({
                domainIdentifier: process.env.DOMAIN_ID,
                identifier: 'MskTopicAssetType'
            });
            await dataZoneClient.send(getAssetTypeCommand);
            assetTypeExists = true;
            console.log('Asset type MskTopicAssetType exists.');
        } catch (err) {
            console.error('Error checking asset type existence:', err);
            throw new Error('MskTopicAssetType is not created for this project.');
        }

        if (!assetTypeExists) {
            throw new Error('MskTopicAssetType does not exist.');
        }

        // List all schemas in the registry using ListSchemasCommand
        const listSchemasCommand = new ListSchemasCommand({
            RegistryId: { RegistryName: registryName }
        });

        const schemaListResponse = await glueClient.send(listSchemasCommand);
        const schemas = schemaListResponse.Schemas || [];

        console.log(`Found ${schemas.length} schemas in the registry.`);

        // Loop through each schema and create an MSK asset
        for (const schema of schemas) {
            const schemaArn = schema.SchemaArn;
            const schemaName = schema.SchemaName;

            console.log(`Processing schema: ${schemaName}`);

            // Retrieve the schema definition
            let schemaDefinition = '';
            let versionNumber = 1;
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

            // Build the source identifier using the provided cluster name
            const sourceIdentifier = `kafka://${clusterName}/${schemaName}`;

            // Prepare forms input
            const formsInput = [
                {
                    formName: 'MskSourceReferenceFormType',
                    typeIdentifier: 'MskSourceReferenceFormType',
                    content: JSON.stringify({
                        cluster_arn: buildMskKafkaArn(region, process.env.ACCOUNT_ID, clusterName),
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
                        registry_arn: registryName,
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

            console.log('Forms input prepared:', JSON.stringify(formsInput, null, 2));

            // Create MSK Asset
            try {
                const createResponse = await dataZoneClient.send(new CreateAssetCommand({
                    domainIdentifier: process.env.DOMAIN_ID,
                    owningProjectIdentifier: process.env.PROJECT_ID,
                    name: schemaName,
                    typeIdentifier: 'MskTopicAssetType',
                    formsInput,
                    externalIdentifier: buildMskTopicArn(region, process.env.ACCOUNT_ID, clusterName, schemaName),
                }));

                console.log('MSK Asset creation response:', createResponse);

            } catch (error) {
                if (error.$metadata?.httpStatusCode === 409) {
                    // Handle asset conflict by creating a revision
                    const assetIdMatch = error.message.match(/Conflict with asset (\w+)/);
                    const assetId = assetIdMatch ? assetIdMatch[1] : 'unknown';

                    console.log(`Asset conflict detected. Asset ID: ${assetId}`);

                    const createAssetRevisionResponse = await dataZoneClient.send(new CreateAssetRevisionCommand({
                        name: schemaName,
                        domainIdentifier: process.env.DOMAIN_ID,
                        identifier: assetId,
                        description: 'Updating asset with new schema or forms',
                        formsInput,
                        externalIdentifier: buildMskTopicArn(region, process.env.ACCOUNT_ID, clusterName, schemaName),
                        clientToken: assetId, // Ensuring idempotency
                    }));

                    console.log('Asset revision creation response:', createAssetRevisionResponse);
                } else {
                    console.error('Error creating MSK asset:', error);
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

// Utility functions (same as before, reused)
function buildMskTopicArn(region, accountId, clusterName, topicName) {
    return `arn:aws:kafka:${region}:${accountId}:topic/${clusterName}/${topicName}`;
}

function buildMskKafkaArn(region, accountId, clusterName) {
    return `arn:aws:kafka:${region}:${accountId}:cluster/${clusterName}/*`;
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
