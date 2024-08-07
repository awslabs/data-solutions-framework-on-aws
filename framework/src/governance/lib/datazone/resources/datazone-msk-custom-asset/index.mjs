import { DataZoneClient, CreateAssetCommand, CreateAssetTypeCommand, CreateFormTypeCommand, GetAssetTypeCommand, GetFormTypeCommand } from "@aws-sdk/client-datazone";
import { GlueClient, GetSchemaVersionCommand } from "@aws-sdk/client-glue";

// Retrieve region and account ID from environment variables
const region = process.env.AWS_REGION;
const accountId = process.env.AWS_ACCOUNT_ID;

export const handler = async (event) => {
    const dataZoneClient = new DataZoneClient();
    const glueClient = new GlueClient();
    const properties = event["ResourceProperties"];

    const domainId = properties["domainId"];
    const projectId = properties["projectId"];
    const assetTypeName = 'MskTopicAssetType';
    const includeSchema = properties["includeSchema"];
    const topicName = properties["topicName"];
    const registryArn = properties["registryArn"];
    const clusterName = properties["clusterName"];
    const schemaArn = properties["schemaArn"];
    const schemaVersionNumber = properties["schemaVersionNumber"];
    const latestVersion = properties["latestVersion"];

    try {
        // Check if MskTopicAssetType exists
        let assetTypeExists = false;
        try {
            const getAssetTypeCommand = new GetAssetTypeCommand({
                domainIdentifier: domainId,
                identifier: assetTypeName
            });
            const response = await dataZoneClient.send(getAssetTypeCommand);
            assetTypeExists = !!response; // If response is received, asset type exists
        } catch (err) {
            // Handle specific errors if necessary (e.g., AssetTypeNotFound)
            console.error('Error checking asset type existence:', err);
            assetTypeExists = false; // Assume it doesn't exist if error occurs
        }

        if (!assetTypeExists) {
            // Form types to check and create
            const formTypes = [
                {
                    name: 'MskSourceReferenceForm',
                    model: `
                        structure MskSourceReferenceForm {
                            @required
                            cluster_arn: String
                        }
                    `,
                    required: true,
                },
                {
                    name: 'KafkaSchemaForm',
                    model: `
                        structure KafkaSchemaForm {
                            @required
                            kafka_topic: String
                            @required
                            schema_version: Integer
                            @required
                            schema_arn: String
                            @required
                            registry_arn: String
                        }
                    `,
                    required: false,
                }
            ];

            // Check if Form Types exist and create them if they do not
            for (const formType of formTypes) {
                try {
                    const getFormTypeCommand = new GetFormTypeCommand({
                        domainIdentifier: domainId,
                        formTypeIdentifier: formType.name
                    });
                    await dataZoneClient.send(getFormTypeCommand);
                    console.log(`Form type ${formType.name} already exists.`);
                } catch (err) {
                    // If form type doesn't exist, create it
                    console.log(`Creating form type ${formType.name}.`);
                    await dataZoneClient.send(new CreateFormTypeCommand({
                        domainIdentifier: domainId,
                        name: formType.name,
                        model: { smithy: formType.model },
                        owningProjectIdentifier: projectId,
                        status: "ENABLED",
                    }));
                }
            }

            // Create Asset Type
            await dataZoneClient.send(new CreateAssetTypeCommand({
                domainIdentifier: domainId,
                name: assetTypeName,
                description: 'Custom asset type to support MSK topic asset',
                formsInput: formTypes.reduce((acc, formType) => {
                    acc[formType.name] = {
                        typeIdentifier: formType.name,
                        required: formType.required
                    };
                    return acc;
                }, {}),
                owningProjectIdentifier: projectId,
            }));
        }

        // Retrieve schema definition if includeSchema is true
        let schemaDefinition = null;
        if (includeSchema) {
            const schemaId = schemaArn
                ? { SchemaArn: schemaArn }
                : { RegistryName: properties["registryName"], SchemaName: properties["schemaName"] };

            const schemaVersionNumberParam = latestVersion !== undefined
                ? { LatestVersion: latestVersion }
                : { VersionNumber: schemaVersionNumber };

            const getSchemaVersionCommand = new GetSchemaVersionCommand({
                SchemaId: schemaId,
                SchemaVersionNumber: schemaVersionNumberParam,
            });

            const schemaResponse = await glueClient.send(getSchemaVersionCommand);
            schemaDefinition = schemaResponse.SchemaDefinition;
        }

        // Create MSK Asset
        const formsInput = [
            {
                formName: 'MskSourceReferenceForm',
                typeIdentifier: 'MskSourceReferenceForm',
                content: JSON.stringify({
                    cluster_arn: buildMskKafkaArn(region, accountId, clusterName),
                }),
            },
            ...(includeSchema ? [
                {
                    formName: 'KafkaSchemaForm',
                    typeIdentifier: 'KafkaSchemaForm',
                    content: JSON.stringify({
                        kafka_topic: topicName,
                        schema_version: 1,
                        schema_arn: schemaArn,
                        registry_arn: registryArn,
                    }),
                }
            ] : [])
        ];

        await dataZoneClient.send(new CreateAssetCommand({
            domainIdentifier: domainId,
            owningProjectIdentifier: projectId,
            name: topicName,
            typeIdentifier: assetTypeName,
            formsInput,
            externalIdentifier: buildMskTopicArn(region, accountId, clusterName, topicName),
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'MSK asset created successfully.' }),
        };

    } catch (error) {
        console.error('Error handling request:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to handle request', error: error.message }),
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
