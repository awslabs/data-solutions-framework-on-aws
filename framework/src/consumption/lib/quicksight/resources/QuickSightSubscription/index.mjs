// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {QuickSightClient, CreateAccountSubscriptionCommand, DescribeAccountSubscriptionCommand, UpdateAccountSettingsCommand, DeleteAccountSubscriptionCommand  } from "@aws-sdk/client-quicksight"

 
const AuthenticationMethod = process.env.AUTHENTICATION_METHOD
const AwsAccountId = process.env.AWS_ACCOUNT_ID
const Edition = process.env.EDITION
const config = { region: process.env.IDENTITY_REGION }
const client = new QuickSightClient(config)

export const onEventHandler = async(event) => {
    const accountName = event["ResourceProperties"]["accountName"]
    const notificationEmail = event["ResourceProperties"]["notificationEmail"]
    const authorGroup = event["ResourceProperties"]["authorGroup"]
    const adminGroup = event["ResourceProperties"]["adminGroup"]
    const readerGroup = event["ResourceProperties"]["readerGroup"]

    if (event["RequestType"] === "Create") {
        
        const input = { // CreateAccountSubscriptionRequest
            Edition: Edition,
            AuthenticationMethod: AuthenticationMethod, // required
            AwsAccountId: AwsAccountId, // required
            AccountName: accountName, // required
            NotificationEmail: notificationEmail // required
          };
        
        if (AuthenticationMethod === "IAM_IDENTITY_CENTER") {
            input.AdminGroup = adminGroup
            input.AuthorGroup = authorGroup
            input.ReaderGroup = readerGroup
        }
        const execResult = await client.send(new CreateAccountSubscriptionCommand(input))

        return {
            "Data": {
                "status": execResult.Status,
                "requestId": execResult.RequestId
            }
        }    
    } else if (event["RequestType"] === "Delete") {
        const execResult = await client.send(new UpdateAccountSettingsCommand({AwsAccountId: AwsAccountId, TerminationProtectionEnabled: false}))   

        if (execResult.Status >= 400) {
            throw new Error(`Failed to disable termination protection for account ${AwsAccountId}`)
        }
        const responseDelete = await client.send(new DeleteAccountSubscriptionCommand({AwsAccountId: AwsAccountId}))

        return {
            "Data": {
                "status": responseDelete.Status,
                "requestId": responseDelete.RequestId
            }
        }
    }

    
}

export const isCompleteHandler = async(event) => {
    let isComplete = false


    
    const resp = await client.send(new DescribeAccountSubscriptionCommand({AwsAccountId: AwsAccountId}))
    const subscriptionStatus = resp.AccountInfo.AccountSubscriptionStatus
    const status = resp.Status

    if (event["RequestType"] === "Create"){
        if (status >= 400) {
            throw new Error(`Account subscription failed with status ${subscriptionStatus}`)
        } else if (status > 300 && status < 400){
            isComplete = false
        } 
    
        isComplete = (status === 200 && subscriptionStatus === "ACCOUNT_CREATED")
    } else if (event["RequestType"] === "Delete") {
        if (status >= 400) {
            throw new Error(`Account deletion failed with status ${subscriptionStatus}`)
        } else if (status > 300 && status < 400){
            isComplete = false
        }
        isComplete = (status === 200 && subscriptionStatus === "UNSUBSCRIBED")
    }

    
    
    return {
        "IsComplete": isComplete
    }
}