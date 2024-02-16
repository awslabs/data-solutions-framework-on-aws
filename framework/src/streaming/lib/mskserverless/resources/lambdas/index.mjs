// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kafka } from "kafkajs";
import { generateAuthToken } from "aws-msk-iam-sasl-signer-js";
import { KafkaClient, GetBootstrapBrokersCommand } from "@aws-sdk/client-kafka"; 

async function oauthBearerTokenProvider(region) {
    // Uses AWS Default Credentials Provider Chain to fetch credentials
    const authTokenResponse = await generateAuthToken({ region });
    return {
        value: authTokenResponse.token
    }
}

// Handler functions
export const onEventHandler = async (event) => {

    const client = new KafkaClient(config);
    const input = {
        ClusterArn: event.ResourceProperties.mskClusterArn,
      };
    
    const command = new GetBootstrapBrokersCommand(input);
    const response = await client.send(command).promise();

    const brokerUrl = response.BootstrapBrokerStringSaslIam;

    const kafka = new Kafka({
        clientId: 'my-app',
        brokers: [brokerUrl],
        ssl: true,
        sasl: {
            mechanism: 'oauthbearer',
            oauthBearerProvider: () => oauthBearerTokenProvider(event.ResourceProperties.region)
        }
    });

    const admin = kafka.admin()

    console.info('======Recieved for Event=======');
    console.info(event);

    switch (event.RequestType) {
        case 'Create':

            await admin.createTopics({
                validateOnly: false,
                waitForLeaders: event.ResourceProperties.waitForLeaders,
                timeout: event.ResourceProperties.timeout,
                topics: event.ResourceProperties.topics,
            });

            await admin.disconnect();

            return undefined;

        case 'Update':
            console.info(event.RequestType);
            physicalResourceId = (await onCreate(event)).PhysicalResourceId;

            return undefined;

        case 'Delete':

            await admin.deleteTopics({
                timeout: event.ResourceProperties.timeout,
                topics: event.ResourceProperties.topics,
            });

            return undefined;

        default:
            throw new Error(`invalid request type: ${event.RequestType}`);
    }
}


export const isCompleteHandler = async (event) => {
    console.info('isCompleteHandler Invocation');
    console.info(event);

    return { IsComplete: true };

}