// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    DataZoneClient,
    CreateAssetCommand,
    DeleteAssetCommand,
    GetAssetCommand
} from "@aws-sdk/client-datazone";


export const handler = async (event) => {
    const client = new DataZoneClient();
    const properties = event["ResourceProperties"];
    const domainId = properties["domainId"];
    const projectId = properties["projectId"];
    const roleArn = properties["roleArn"];
    const name = properties["name"];
    const typeIdentifier = properties["typeIdentifier"];
    const formsInput = properties["formsInput"];
    // const description = properties["description"];
    const externalIdentifier = properties["externalIdentifier"];
    // const glossaryTerms = properties["glossaryTerms"];
    // const predictionConfiguration = properties["predictionConfiguration"];
    // const typeRevision = properties["typeRevision"];

    console.log('Environment Properties:', {
        domainId,
        projectId,
        roleArn,
        name,
        typeIdentifier,
        formsInput,
        // description,
        externalIdentifier,
        // glossaryTerms,
        // predictionConfiguration,
        // typeRevision
    });
    console.log('Invocation Event:', event);

    try {
        if (event["RequestType"] === "Create" || event["RequestType"] === "Update") {

            // Create or re-create the Asset
            const createResponse = await client.send(new CreateAssetCommand({
                domainIdentifier: domainId,
                owningProjectIdentifier: projectId, // Ensure this is included
                name: name,
                typeIdentifier: typeIdentifier,
                formsInput: formsInput,
                // description: description,
                externalIdentifier: externalIdentifier,
                // glossaryTerms: glossaryTerms,
                // predictionConfiguration: predictionConfiguration,
                // typeRevision: typeRevision,
            }));
            console.log('Response Event:', createResponse);

            return {
                "Data": createResponse
            };

        } else if (event["RequestType"] === "Delete") {
            // Delete the Asset
            await client.send(new DeleteAssetCommand({
                domainIdentifier: domainId,
                name: name,
                typeIdentifier: typeIdentifier,
            }));

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Asset ${name} deleted successfully.`
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
