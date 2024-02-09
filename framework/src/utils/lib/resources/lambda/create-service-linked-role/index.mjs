// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {IAMClient, CreateServiceLinkedRoleCommand} from "@aws-sdk/client-iam"

export const handler = async(event) => {
    const requestType = event['RequestType']

    if (requestType == "Create") {
        const client = new IAMClient()
        const serviceName = event["ResourceProperties"]["serviceName"]
        
        try {
            await client.send(new CreateServiceLinkedRoleCommand({
                AWSServiceName: serviceName
            }))
        } catch (e) {
            console.log(`Error: ${JSON.stringify(e)}`)
        }
    }

    return {}
}