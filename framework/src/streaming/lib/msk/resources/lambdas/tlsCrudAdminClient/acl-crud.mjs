// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export async function aclCrudOnEvent (event, admin) {
    switch (event.RequestType) {
        case 'Create':

            try {

                const acl = [
                    {
                        resourceType: parseInt(event.ResourceProperties.resourceType),
                        resourcePatternType: parseInt(event.ResourceProperties.resourcePatternType),
                        resourceName: event.ResourceProperties.resourceName,
                        principal: event.ResourceProperties.principal,
                        host: event.ResourceProperties.host,
                        operation: parseInt(event.ResourceProperties.operation),
                        permissionType: parseInt(event.ResourceProperties.permissionType),
                    }
                ];

                let kafkaResponse = await admin.createAcls({ acl });

                console.log(kafkaResponse);

                await admin.disconnect();

                return {
                    "Data": {
                        "kafkaResponse": kafkaResponse
                    }
                };

            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error applying ACL: ${event.ResourceProperties}. Error ${error}`);
            }

        case 'Update':

            try {

                const acl = [
                    {
                        resourceType: parseInt(event.ResourceProperties.resourceType),
                        resourcePatternType: parseInt(event.ResourceProperties.resourcePatternType),
                        resourceName: event.ResourceProperties.resourceName,
                        principal: event.ResourceProperties.principal,
                        host: event.ResourceProperties.host,
                        operation: parseInt(event.ResourceProperties.operation),
                        permissionType: parseInt(event.ResourceProperties.permissionType),
                    }
                ];

                console.log(acl);

                let kafkaResponse = await admin.createAcls({ acl });

                console.log(kafkaResponse);

                await admin.disconnect();
                return {
                    "Data": {
                        "kafkaResponse": true
                    }
                };
            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error updating ACL: ${event.ResourceProperties}. Error ${error}`);
            }

        case 'Delete':

            try {

                const acl = [
                    {
                        resourceType: parseInt(event.ResourceProperties.resourceType),
                        resourcePatternType: parseInt(event.ResourceProperties.resourcePatternType),
                        resourceName: event.ResourceProperties.resourceName,
                        principal: event.ResourceProperties.principal,
                        host: event.ResourceProperties.host,
                        operation: parseInt(event.ResourceProperties.operation),
                        permissionType: parseInt(event.ResourceProperties.permissionType),
                    }
                ];

                console.log(acl);

                let kafkaResponse = await admin.deleteAcls({ filters: acl })

                console.log(kafkaResponse);

                let errorCode = kafkaResponse.filterResponses[0].errorCode;

                await admin.disconnect();
                return {
                    "Data": {
                        "kafkaResponse": errorCode == 0 ? true : false, 
                    }
                };
            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error deleting ACL: ${event.ResourceProperties}. Error ${error}`);
            }

        default:
            throw new Error(`invalid request type: ${event.RequestType}`);
    }
}