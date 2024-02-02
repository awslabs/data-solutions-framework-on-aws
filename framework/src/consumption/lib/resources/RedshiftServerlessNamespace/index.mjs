// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {RedshiftServerlessClient, CreateNamespaceCommand, UpdateNamespaceCommand, DeleteNamespaceCommand, GetNamespaceCommand} from "@aws-sdk/client-redshift-serverless"
import { SSMClient, GetParameterCommand, PutParameterCommand, DeleteParameterCommand } from "@aws-sdk/client-ssm"

const handleUpdate = async(event) => {
    if (event["RequestType"] === "Update") {
        const client = new RedshiftServerlessClient()
        const ssmClient = new SSMClient()
        const resourceProperties = event["ResourceProperties"]
        const indexParameterName = resourceProperties["indexParameterName"]
        const describeResp = await client.send(new GetNamespaceCommand({namespaceName: resourceProperties["namespaceName"]}))
        const status = describeResp["namespace"]["status"]

        if (status === "AVAILABLE") {
            const parametersToUpdate = [["defaultIamRoleArn", "iamRoles"], ["logExports"]]
            let index

            try {
                const idxParamResp = await ssmClient.send(new GetParameterCommand({"Name": indexParameterName}))
                index = parseInt(idxParamResp.Parameter.Value)
            } catch (e) {
                index = 0
            }

            console.log(`Current Index: ${index}`)
            
            let updateNamespace
    
            const properties = parametersToUpdate[index]
            const forUpdate = {"namespaceName": resourceProperties["namespaceName"]}
            properties.forEach((prop) => {
                forUpdate[prop] = resourceProperties[prop]
            })

            const updateResp = await client.send(new UpdateNamespaceCommand(forUpdate))
            updateNamespace = updateResp["namespace"]
            index++
            const data = {
                "namespaceId": updateNamespace["namespaceId"],
                "namespaceArn": updateNamespace["namespaceArn"],
                "adminPasswordSecretArn": updateNamespace["adminPasswordSecretArn"],
            }
            
            const isComplete = index === parametersToUpdate.length

            if (isComplete) {
                await ssmClient.send(new DeleteParameterCommand({"Name": indexParameterName}))
                return {
                    "IsComplete": isComplete,
                    "Data": data
                }
            } else {
                await ssmClient.send(new PutParameterCommand({
                    "Name": indexParameterName,
                    "Type": "String",
                    "Overwrite": true,
                    "Value": `${index}`
                }))

                return {
                    "IsComplete": isComplete
                }
            }
        } else {
            return {
                "IsComplete": false
            }
        }
    } else {
        return {
            "IsComplete": true
        }
    }
}

export const isCompleteHandler = async(event) => {
    return await handleUpdate(event)
}

export const handler = async(event) => {
    const requestType = event["RequestType"]
    const client = new RedshiftServerlessClient()
    const ssmClient = new SSMClient()
    const resourceProperties = event["ResourceProperties"]

    const namespaceParameters = {
        namespaceName: resourceProperties["namespaceName"],
        adminPasswordSecretKmsKeyId: resourceProperties["managedAdminPasswordKeyId"],
        adminUsername: resourceProperties["adminUsername"],
        dbName: resourceProperties["dbName"],
        defaultIamRoleArn: resourceProperties["defaultIamRoleArn"] ?? undefined,
        iamRoles: resourceProperties["iamRoles"] ?? undefined,
        kmsKeyId: resourceProperties["kmsKeyId"],
        manageAdminPassword: true,
        logExports: resourceProperties["logExports"] ?? []
      };

    if (requestType === "Create") {
        const createResp = await client.send(new CreateNamespaceCommand(namespaceParameters))
        const namespace = createResp["namespace"]
        const indexParameterName = resourceProperties["indexParameterName"]
        try {
            //reset parameter to clean up environment
            await ssmClient.send(new DeleteParameterCommand({"Name": indexParameterName}))
        } catch (e) {
            //suppress if the parameter doesn't exists.
        }
        
        return {
            "Data": {
                "namespaceId": namespace["namespaceId"],
                "namespaceArn": namespace["namespaceArn"],
                "adminPasswordSecretArn": namespace["adminPasswordSecretArn"]
            }
        }
    } else if (requestType === "Update") {
        return await handleUpdate(event)
    } else if (requestType === "Delete") {
        await client.send(new DeleteNamespaceCommand({"namespaceName": resourceProperties["namespaceName"]}))

        return
    }
}