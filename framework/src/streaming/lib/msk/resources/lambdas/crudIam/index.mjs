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

    console.log(event);

    const client = new KafkaClient();
    const input = {
        ClusterArn: event.ResourceProperties.mskClusterArn,
      };
    
    const command = new GetBootstrapBrokersCommand(input);
    const response = await client.send(command);

    const brokerUrl = response.BootstrapBrokerStringSaslIam.split(',');

    let clusterName = event.ResourceProperties.mskClusterArn.split('/')[1];

    const kafka = new Kafka({
        clientId: `client-CR-${clusterName}`,
        brokers: brokerUrl,
        ssl: true,
        sasl: {
            mechanism: 'oauthbearer',
            oauthBearerProvider: () => oauthBearerTokenProvider(event.ResourceProperties.region)
        }
    });

    const admin = kafka.admin();

    console.info('======Recieved Event=======');
    console.info(event);

    switch (event.RequestType) {
        case 'Create':

            console.log(event.ResourceProperties.topics);

            try {

                let kafkaResponse = await admin.createTopics({
                    validateOnly: false,
                    waitForLeaders: event.ResourceProperties.waitForLeaders,
                    timeout: event.ResourceProperties.timeout,
                    topics: event.ResourceProperties.topics,
                });
    
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

                throw new Error(`Error creating topics: ${event.ResourceProperties.topics}. Error ${error}`);
            }

        case 'Update':

            console.info(event.RequestType);
            console.info(event.ResourceProperties.topics);

            try {
                
                let updatedTopics = []; 

                event.ResourceProperties.topics.forEach (topic => {
                    updatedTopics.push({
                        topic: topic.topic,
                        count: topic.numPartitions,
                        assignments: undefined
                    });
                });

                await admin.createPartitions({
                    validateOnly: false,
                    timeout: event.ResourceProperties.timeout,
                    topicPartitions: updatedTopics,
                });
    
                await admin.disconnect();
                
                return { 
                    "Data": {
                        "kafkaResponse": true
                    }
                  };

            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error updating topics: ${event.ResourceProperties.topics}. Error ${error}`);
            }

        case 'Delete':

            console.info('======Received for Event Delete Topic=======');
            
            console.log(event.ResourceProperties.topics);

            let topics = []; 
            
            event.ResourceProperties.topics.forEach (topic => {
                topics.push(topic.topic);
            });

            
            try {
                await admin.deleteTopics({
                    timeout: event.ResourceProperties.timeout,
                    topics: topics,
                });

                await admin.disconnect();

                return { 
                    "Data": {
                        "kafkaResponse": true
                    }
                  };
            }
            catch (error) {
                await admin.disconnect();

                throw new Error(`Error deleting topics: ${topics}. Error ${error}`);

            }

        default:
            throw new Error(`invalid request type: ${event.RequestType}`);
    }
}