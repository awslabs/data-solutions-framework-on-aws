// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    Kafka,
    logLevel
} from "kafkajs"
import { readFileSync } from "fs";

import { KafkaClient, GetBootstrapBrokersCommand } from "@aws-sdk/client-kafka";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";


// Handler functions
export const onEventHandler = async (event) => {

    console.log(event);

    const logLevelProp = event.ResourceProperties.logLevel == 'DEBUG' ? logLevel.DEBUG : logLevel.INFO;

    console.log(event.ResourceProperties.logLevel);
    console.log(logLevelProp);

    const clientSecretManager = new SecretsManagerClient();

    const responseSecretManager = await clientSecretManager.send(
        new GetSecretValueCommand({
            SecretId: event.ResourceProperties.secretArn,
        }),
    );

    const secret = JSON.parse(responseSecretManager.SecretString);

    console.log(secret.key);
    console.log(secret.cert);

    const client = new KafkaClient();
    const input = {
        ClusterArn: event.ResourceProperties.mskClusterArn,
    };

    const command = new GetBootstrapBrokersCommand(input);
    const response = await client.send(command);

    console.log(response);
    const brokerUrls = response.BootstrapBrokerStringTls.split(',');

    let clusterName = event.ResourceProperties.mskClusterArn.split('/')[1];

    const kafka = new Kafka({
        clientId: `client-CR-${clusterName}`,
        brokers: brokerUrls,
        ssl: {
            rejectUnauthorized: true,
            key: readFileSync('client-private.pem', 'utf-8'),
            cert: readFileSync('client-certificate.pem', 'utf-8')
        },
        logLevel: logLevelProp,
    });

    const admin = kafka.admin();

    console.info('======Recieved Event=======');

    // If the principal is set to REPLACE-WITH-BOOTSTRAP, 
    // we need to replace it with the broker FQDN prefix with a wildcard

    if (event.ResourceProperties.principal === "REPLACE-WITH-BOOTSTRAP") {
        const pattern = /^[^.]+\.(.+)$/;
        const match = brokerUrls[0].match(pattern);

        event.ResourceProperties.principal = '*.' + match[1];

    }

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

                throw new Error(`Error updating ACL: ${event.ResourceProperties}. Error ${error}`);
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

                throw new Error(`Error deleting ACL: ${event.ResourceProperties}. Error ${error}`);
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

                await admin.disconnect();
                return {
                    "Data": {
                        "kafkaResponse": kafkaResponse
                    }
                };
            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error appliying ACL: ${event.ResourceProperties}. Error ${error}`);
            }

        default:
            throw new Error(`invalid request type: ${event.RequestType}`);
    }
}


export const isCompleteHandler = async (event) => {
    console.info('isCompleteHandler Invocation');
    console.info(event);

    if (event["Data"]["kafkaResponse"]) {
        return { IsComplete: true };
    }
    else {
        throw new Error('Error during resource creation or deletion');
    }

}