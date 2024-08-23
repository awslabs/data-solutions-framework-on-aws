// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    DataZoneClient,
    CreateFormTypeCommand,
    DeleteFormTypeCommand,
    GetFormTypeCommand
} from "@aws-sdk/client-datazone";


export const handler = async (event) => {
    const client = new DataZoneClient();
    const properties = event["ResourceProperties"];
    const domainId = properties["domainId"];
    const projectId = properties["projectId"];
    const roleArn = properties["roleArn"]; // ARN of the Lambda execution role
    const name = properties["name"];
    const modelName = properties["modelName"];
    const model = properties["model"];

    console.log('Environment Properties:', {
        domainId,
        projectId,
        roleArn,
        name,
        modelName,
        model
    });
    console.log('Invocation Event:', event);

    try {
        if (event["RequestType"] === "Create" || event["RequestType"] === "Update") {
            try {
                // Check if the FormType exists
                await client.send(new GetFormTypeCommand({
                    domainIdentifier: domainId,
                    formTypeIdentifier: name
                }));
                // FormType exists, proceed to update (create or re-create)
                console.log(`FormType ${name} already exists, updating.`);
            } catch (error) {
                if (error.name === 'ResourceNotFoundException') {
                    // FormType does not exist, proceed to create
                    console.log(`FormType ${name} does not exist, creating.`);
                } else {
                    // Re-throw any other errors
                    throw error;
                }
            }

            // Create or re-create the FormType
            const createResponse = await client.send(new CreateFormTypeCommand({
                domainIdentifier: domainId,
                name: name,
                model: {
                    smithy: model
                },
                owningProjectIdentifier: projectId,
                status: "ENABLED"
            }));

            return {
                "Data": createResponse
            };

        } else if (event["RequestType"] === "Delete") {
            // Delete the FormType
            await client.send(new DeleteFormTypeCommand({
                domainIdentifier: domainId,
                formTypeIdentifier: name
            }));

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `FormType ${name} deleted successfully.`
                })
            };
        }
    } catch (error) {
        console.error('Error handling DataZone request:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to handle DataZone request', error: error.message })
        };
    }
};
