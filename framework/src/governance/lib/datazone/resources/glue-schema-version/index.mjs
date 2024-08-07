import { GlueClient, GetSchemaVersionCommand } from "@aws-sdk/client-glue";

export const handler = async (event) => {
    const client = new GlueClient();
    const properties = event["ResourceProperties"];

    console.log("Event", event)

    // Log the received properties
    console.log("Received properties:", JSON.stringify(properties));

    const schemaArn = properties["schemaArn"];
    const registryName = properties["registryName"];
    const schemaName = properties["schemaName"];
    const schemaVersionNumber = properties["schemaVersionNumber"];
    const latestVersion = properties["latestVersion"];

    // Validate and determine the SchemaId
    const schemaId = {};
    if (schemaArn) {
        // If schemaArn is provided, ensure no other fields are set
        schemaId.SchemaArn = schemaArn;
        if (registryName || schemaName) {
            throw new Error("If schemaArn is provided, registryName and schemaName must not be provided.");
        }
    } else if (registryName && schemaName) {
        // If registryName and schemaName are provided, ensure schemaArn is not set
        schemaId.RegistryName = registryName;
        schemaId.SchemaName = schemaName;
    } else {
        throw new Error("Either schemaArn or both registryName and schemaName must be provided.");
    }

    // Log the determined SchemaId
    console.log("Determined SchemaId:", JSON.stringify(schemaId));

    // Validate and determine the SchemaVersionNumber
    const schemaVersionNumberParam = {};
    if (latestVersion !== undefined) {
        schemaVersionNumberParam.LatestVersion = latestVersion;
    } else if (schemaVersionNumber !== undefined) {
        schemaVersionNumberParam.VersionNumber = schemaVersionNumber;
    } else {
        throw new Error("Either schemaVersionNumber or latestVersion must be provided.");
    }

    // Log the determined SchemaVersionNumber
    console.log("Determined SchemaVersionNumber:", JSON.stringify(schemaVersionNumberParam));

    const input = {
        SchemaId: schemaId,
        SchemaVersionNumber: schemaVersionNumberParam
    };

    // Log the input to be sent to AWS Glue
    console.log("Input to GetSchemaVersionCommand:", JSON.stringify(input));

    try {
        const command = new GetSchemaVersionCommand(input);
        const response = await client.send(command);

        // Log the successful response
        console.log("Successful response:", JSON.stringify(response));

        return {
            "Data": response
        };

    } catch (error) {
        // Log the error
        console.error('Error retrieving schema version:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to retrieve schema version',
                error: error.message
            })
        };
    }
};
