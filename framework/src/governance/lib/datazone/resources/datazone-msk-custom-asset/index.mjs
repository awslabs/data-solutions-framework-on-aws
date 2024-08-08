import { DataZoneClient, CreateAssetCommand, CreateAssetRevisionCommand, GetAssetTypeCommand } from "@aws-sdk/client-datazone";
import { GlueClient, GetSchemaVersionCommand } from "@aws-sdk/client-glue";

export const handler = async (event) => {
    const dataZoneClient = new DataZoneClient();
    const glueClient = new GlueClient();
    const properties = event["ResourceProperties"];

    const domainId = properties["domainId"];
    const accountId = properties["accountId"];
    const region = properties["region"];
    const projectId = properties["projectId"];
    const assetTypeName = 'MskTopicAssetType';
    const includeSchema = properties["includeSchema"] === 'true'; // Convert to boolean
    const topicName = properties["topicName"];
    const registryName = properties["registryName"];
    const schemaName = properties["schemaName"];
    const clusterName = properties["clusterName"];
    const schemaArn = properties["schemaArn"];
    const schemaVersionNumber = properties["schemaVersionNumber"];
    const latestVersion = properties["latestVersion"] === 'true'; // Convert to boolean
    const sourceIdentifier = properties["sourceIdentifier"] || clusterName;
    const providedSchemaDefinition = properties["schemaDefinition"];

    // Determine registryArn based on schemaArn or registryName
    const registryArn = schemaArn
        ? deriveRegistryArnFromSchemaArn(schemaArn)
        : registryName
            ? buildRegistryArn(region, accountId, registryName)
            : undefined;

    console.log('Event properties:', properties);

    try {
        // Check if MskTopicAssetType exists
        let assetTypeExists = false;
        try {
            const getAssetTypeCommand = new GetAssetTypeCommand({
                domainIdentifier: domainId,
                identifier: assetTypeName
            });
            await dataZoneClient.send(getAssetTypeCommand);
            assetTypeExists = true;
            console.log(`Asset type ${assetTypeName} exists.`);
        } catch (err) {
            console.error('Error checking asset type existence:', err);
            assetTypeExists = false; // Assume it doesn't exist if error occurs
        }

        if (!assetTypeExists) {
            throw new Error(`MskTopicAssetType is not created for this project. Please create using DSF.`);
        }

        // Validate schema-related properties
        if (includeSchema) {
            if (!schemaArn && (!registryName || !schemaName)) {
                throw new Error('Either schemaArn or both registryName and schemaName must be provided.');
            }
            if (latestVersion === undefined && schemaVersionNumber === undefined) {
                throw new Error('One of latestVersion or schemaVersionNumber must be provided.');
            }
            if (schemaArn && (registryName || schemaName)) {
                throw new Error('If schemaArn is provided, neither registryName nor schemaName can be provided.');
            }
            if (registryName && !schemaName) {
                throw new Error('If registryName is provided, schemaName must also be provided.');
            }
        }

        // Retrieve schema definition if includeSchema is true and schema definition is not provided
        let schemaDefinition = providedSchemaDefinition || '';
        let versionNumber; // Define versionNumber here

        if (includeSchema && !providedSchemaDefinition) {
            const schemaId = schemaArn
                ? { SchemaArn: schemaArn }
                : { RegistryName: registryName, SchemaName: schemaName };

            const schemaVersionNumberParam = latestVersion
                ? { LatestVersion: true } // Specify latestVersion
                : { VersionNumber: Number(schemaVersionNumber) }; // Use schemaVersionNumber

            const getSchemaVersionCommand = new GetSchemaVersionCommand({
                SchemaId: schemaId,
                SchemaVersionNumber: schemaVersionNumberParam // Only one of VersionNumber or LatestVersion should be set
            });

            console.log('GetSchemaVersionCommand parameters:', getSchemaVersionCommand);

            try {
                const schemaResponse = await glueClient.send(getSchemaVersionCommand);
                console.log('Schema definition response:', schemaResponse);
                schemaDefinition = schemaResponse.SchemaDefinition;
                versionNumber = schemaResponse.SchemaVersionNumber; // Correctly assign versionNumber
                console.log('Schema definition retrieved.');
            } catch (err) {
                console.error('Error retrieving schema definition:', err);
                throw err;
            }
        }

        // Prepare forms input
        const formsInput = [
            {
                formName: 'MskSourceReferenceForm',
                typeIdentifier: 'MskSourceReferenceForm',
                content: JSON.stringify({
                    cluster_arn: buildMskKafkaArn(region, accountId, clusterName),
                }),
            },
            {
                formName: 'AssetCommonDetailsForm',
                typeIdentifier: 'default',
                content: JSON.stringify({
                    sourceIdentifier: 'kafka://'+sourceIdentifier+'/'+topicName,
                    schemaDefinition: schemaDefinition || ''
                }),
            },
            ...(includeSchema && schemaDefinition ? [
                {
                    formName: 'RelationalTableForm',
                    typeIdentifier: 'amazon.datazone.RelationalTableFormType',
                    content: JSON.stringify({
                        tableName: topicName,
                        columns: parseSchemaDefinition(schemaDefinition),
                    }),
                }
            ] : []),
            ...(includeSchema ? [
                {
                    formName: 'KafkaSchemaForm',
                    typeIdentifier: 'KafkaSchemaForm',
                    content: JSON.stringify({
                        kafka_topic: topicName,
                        schema_version: versionNumber || 1,
                        schema_arn: schemaArn || buildSchemaArn(region, accountId, registryName, schemaName),
                        registry_arn: registryArn || (schemaArn ? deriveRegistryArnFromSchemaArn(schemaArn) : buildRegistryArn(region, accountId, registryName)),
                    }),
                }
            ] : [])
        ];

        console.log('Forms input prepared:', JSON.stringify(formsInput, null, 2));

        // Create MSK Asset
        try {
            const createResponse = await dataZoneClient.send(new CreateAssetCommand({
                domainIdentifier: domainId,
                owningProjectIdentifier: projectId,
                name: topicName,
                typeIdentifier: assetTypeName,
                formsInput,
                externalIdentifier: buildMskTopicArn(region, accountId, clusterName, topicName),
            }));

            console.log('MSK Asset creation response:', createResponse);

            return {
                "Data": createResponse
            };

        } catch (error) {
            if (error.$metadata?.httpStatusCode === 409) {
                // Extract the asset ID from the error message
                const assetIdMatch = error.message.match(/Conflict with asset (\w+)/);
                const assetId = assetIdMatch ? assetIdMatch[1] : 'unknown';

                console.log(`Asset conflict detected. Asset ID: ${assetId}`);

                // Create Asset Revision
                const createAssetRevisionResponse = await dataZoneClient.send(new CreateAssetRevisionCommand({
                    name: topicName,
                    domainIdentifier: domainId,
                    identifier: assetId,
                    description: 'Updating asset with new schema or forms',
                    formsInput,
                    externalIdentifier: buildMskTopicArn(region, accountId, clusterName, topicName),
                    clientToken: assetId, // Using assetId as a clientToken to ensure idempotency
                }));

                console.log('Asset revision creation response:', createAssetRevisionResponse);

                return {
                    "Data": createAssetRevisionResponse
                };
            } else {
                // Handle other errors
                console.error('Error handling request:', error);
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: 'Failed to handle request',
                        error: error.message
                    }),
                };
            }
        }
    } catch (error) {
        console.error('Error handling request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to handle request',
                error: error.message
            }),
        };
    }
};

// Utility functions
function buildMskTopicArn(region, accountId, clusterName, topicName) {
    return `arn:aws:kafka:${region}:${accountId}:topic/${clusterName}/${topicName}`;
}

function buildMskKafkaArn(region, accountId, clusterName) {
    return `arn:aws:kafka:${region}:${accountId}:cluster/${clusterName}/*`;
}

function buildRegistryArn(region, accountId, registryName) {
    return `arn:aws:glue:${region}:${accountId}:registry/${registryName}`;
}

function deriveRegistryArnFromSchemaArn(schemaArn) {
    const parts = schemaArn.split('/');
    if (parts.length >= 3) {
        const registryName = parts[1];
        return buildRegistryArn(parts[2], parts[3], registryName);
    }
    throw new Error('Invalid schemaArn format to derive registryArn.');
}

function buildSchemaArn(region, accountId, registryName, schemaName) {
    return `arn:aws:glue:${region}:${accountId}:schema/${registryName}/${schemaName}`;
}

function parseSchemaDefinition(schemaDefinition) {
    // Assuming schemaDefinition is a JSON string representing the schema
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
