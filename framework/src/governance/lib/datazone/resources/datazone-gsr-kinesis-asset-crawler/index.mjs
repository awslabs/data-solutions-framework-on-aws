import {
    DataZoneClient,
    GetAssetCommand,
    CreateAssetCommand,
    CreateAssetRevisionCommand,
    DeleteAssetCommand,
} from "@aws-sdk/client-datazone";
import {
    GlueClient,
    ListSchemasCommand,
    GetSchemaVersionCommand,
} from "@aws-sdk/client-glue";
import {
    SSMClient,
    GetParametersByPathCommand,
    DeleteParameterCommand,
    PutParameterCommand,
} from "@aws-sdk/client-ssm";
import {
    KinesisClient,
    ListStreamsCommand,
    DescribeStreamCommand,
} from "@aws-sdk/client-kinesis";

// Initialize AWS SDK clients
const ssmClient = new SSMClient();
const dataZoneClient = new DataZoneClient();
const glueClient = new GlueClient();
const kinesisClient = new KinesisClient();

export const handler = async () => {
    const region = process.env.REGION;
    const registryName = process.env.REGISTRY_NAME;
    const domainId = process.env.DOMAIN_ID;
    const accountId = process.env.ACCOUNT_ID;
    const projectId = process.env.PROJECT_ID;

    if (!region || !registryName || !domainId || !accountId || !projectId) {
        throw new Error('Missing required environment variables.');
    }

    try {
        // Step 1: Retrieve existing parameters
        const existingParametersResponse = await ssmClient.send(new GetParametersByPathCommand({
            Path: `/datazone/${domainId}/${registryName}/asset/`,
            Recursive: true,
            WithDecryption: false,
        }));
        const existingParameters = existingParametersResponse.Parameters || [];
        const assetMap = new Map<string, string>(); // Map to hold assetName and assetId

        for (const param of existingParameters) {
            const assetName = param.Name.split('/').pop();
            if (assetName && param.Value) {
                assetMap.set(assetName, param.Value);
            }
        }
        console.log('Existing assets:', assetMap);

        // Step 2: List all Kinesis streams
        const listStreamsCommand = new ListStreamsCommand({});
        const listStreamsResponse = await kinesisClient.send(listStreamsCommand);
        const streams = listStreamsResponse.StreamNames || [];
        console.log('Kinesis streams:', streams);

        // Step 3: List all schemas in the registry
        const listSchemasCommand = new ListSchemasCommand({
            RegistryId: { RegistryName: registryName },
        });
        const schemaListResponse = await glueClient.send(listSchemasCommand);
        const schemas = schemaListResponse.Schemas || [];
        console.log('Schemas in registry:', schemas);

        // Step 4: Process each schema
        for (const schema of schemas) {
            const schemaName = schema.SchemaName;
            if (!streams.includes(schemaName)) {
                console.log(`No matching Kinesis stream for schema ${schemaName}. Skipping.`);
                continue; // Skip schemas that do not have a corresponding Kinesis stream
            }

            const streamName = schemaName; // Assume stream name matches schema name
            const describeStreamCommand = new DescribeStreamCommand({
                StreamName: streamName,
            });
            const describeStreamResponse = await kinesisClient.send(describeStreamCommand);
            const streamDetails = describeStreamResponse.StreamDescription;
            const streamArn = streamDetails.StreamARN;
            const capacityMode = streamDetails.StreamModeDetails.StreamMode;
            const provisionedShards = capacityMode === 'PROVISIONED' ? streamDetails.Shards.length : undefined;

            console.log(`Stream ARN for ${streamName}: ${streamArn}`);
            console.log(`Stream capacity mode for ${streamName}: ${capacityMode}`);
            console.log(`Number of provisioned shards for ${streamName}: ${provisionedShards}`);

            // Retrieve schema definition
            let schemaDefinition = '';
            let versionNumber = 1;
            try {
                const getSchemaVersionCommand = new GetSchemaVersionCommand({
                    SchemaId: { SchemaArn: schema.SchemaArn },
                    SchemaVersionNumber: { LatestVersion: true },
                });
                const schemaVersionResponse = await glueClient.send(getSchemaVersionCommand);
                schemaDefinition = schemaVersionResponse.SchemaDefinition;
                versionNumber = schemaVersionResponse.VersionNumber;
                console.log('Retrieved schema definition for schema:', schemaName);
            } catch (err) {
                console.error('Error retrieving schema definition:', err);
                continue; // Skip to the next schema if there is an issue
            }

            // Build the source identifier
            const sourceIdentifier = `kinesis://${streamName}/${schemaName}`;
            const formsInput = [
                {
                    formName: 'KinesisSourceReferenceFormType',
                    typeIdentifier: 'KinesisSourceReferenceFormType',
                    content: JSON.stringify({
                        stream_arn: streamArn,
                        stream_capacity_mode: capacityMode,
                        stream_provisioned_shards: provisionedShards,
                    }),
                },
                {
                    formName: 'AssetCommonDetailsForm',
                    typeIdentifier: 'default',
                    content: JSON.stringify({
                        sourceIdentifier: sourceIdentifier,
                        schemaDefinition: schemaDefinition || '',
                    }),
                },
                {
                    formName: 'KinesisSchemaFormType',
                    typeIdentifier: 'KinesisSchemaFormType',
                    content: JSON.stringify({
                        stream_name: streamName,
                        schema_version: versionNumber,
                        schema_arn: schema.SchemaArn,
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
                },
            ];

            // Check if the asset already exists
            const assetId = assetMap.get(schemaName);
            if (assetId) {
                console.log(`Asset ${schemaName} already exists. Creating or updating revision.`);
                try {
                    // Check if asset exists in DataZone
                    await dataZoneClient.send(new GetAssetCommand({
                        domainIdentifier: domainId,
                        identifier: assetId,
                    }));

                    // Create Asset Revision
                    await dataZoneClient.send(new CreateAssetRevisionCommand({
                        name: schemaName,
                        domainIdentifier: domainId,
                        identifier: assetId,
                        description: 'Updating asset with new schema or forms',
                        formsInput,
                        externalIdentifier: buildKinesisStreamArn(region, accountId, streamName, schemaName),
                        clientToken: schemaName, // Ensuring idempotency
                    }));

                    console.log(`Asset revision for ${schemaName} updated.`);
                } catch (error) {
                    if (error.$metadata?.httpStatusCode === 404) {
                        // If asset does not exist, it may have been deleted, so remove its parameter
                        console.log(`Asset ${schemaName} not found in DataZone, removing parameter.`);
                        await ssmClient.send(new DeleteParameterCommand({ Name: `/datazone/${domainId}/${registryName}/asset/${schemaName}` }));
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
                        typeIdentifier: 'KinesisStreamAssetType',
                        formsInput,
                        externalIdentifier: buildKinesisStreamArn(region, accountId, streamName, schemaName),
                    }));

                    const newAssetId = createResponse.id;

                    // Store the new asset ID in SSM Parameter Store
                    await ssmClient.send(new PutParameterCommand({
                        Name: `/datazone/${domainId}/${registryName}/asset/${schemaName}`,
                        Value: newAssetId,
                        Type: 'String',
                        Overwrite: true,
                    }));
                    console.log(`Stored asset ID ${newAssetId} in SSM Parameter Store under /datazone/${domainId}/${registryName}/asset/${schemaName}`);
                } catch (error) {
                    console.error('Error creating Kinesis asset:', error);
                }
            }
        }

        // Step 5: Clean up old assets if necessary
        for (const [assetName, assetId] of assetMap) {
            if (!streams.includes(assetName)) {
                // If the stream is not in the current list, delete the asset and its parameter
                console.log(`Deleting stale asset ${assetName}.`);
                try {
                    await dataZoneClient.send(new DeleteAssetCommand({
                        domainIdentifier: domainId,
                        identifier: assetId,
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
                error: error.message,
            }),
        };
    }
};

// Utility functions
function buildKinesisStreamArn(region: string, accountId: string, streamName: string, topicName: string) {
    return `arn:aws:kinesis:${region}:${accountId}:stream/${streamName}`;
}

function parseSchemaDefinition(schemaDefinition: string) {
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
                    dataType: columnType,
                });
            }
        }

        return columns;
    } catch (err) {
        console.error('Error parsing schema definition:', err);
        return [];
    }
}
