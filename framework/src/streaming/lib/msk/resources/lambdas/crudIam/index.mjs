// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kafka, logLevel } from "kafkajs";
import { generateAuthToken } from "aws-msk-iam-sasl-signer-js";
import { KafkaClient, GetBootstrapBrokersCommand } from "@aws-sdk/client-kafka"; 
import { aclCrudOnEvent } from "../../shared/acl-crud.mjs";
import { topicCrudOnEvent } from "../../shared/topic-crud.mjs";

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
  
  let level;
  switch (event.ResourceProperties.logLevel) {
    case 'INFO':
      level = logLevel.INFO;
      break;
    case 'WARN':
      level = logLevel.WARN;
      break;
    case 'ERROR':
      level = logLevel.ERROR;
      break;
    case 'DEBUG':
      level = logLevel.DEBUG;
      break;
    default:
      console.log("Unknown Log Level");
      throw new Error(`invalid log level: ${event.ResourceProperties.logLevel}`);
  }

  console.log('loglevel: '+ level);
  
  const client = new KafkaClient();
  const input = {
    ClusterArn: event.ResourceProperties.mskClusterArn,
  };
  
  const command = new GetBootstrapBrokersCommand(input);
  const response = await client.send(command);
  
  const brokerUrl = response.BootstrapBrokerStringSaslIam.split(',');
  
  let clusterName = event.ResourceProperties.mskClusterArn.split('/')[1];
  const mskClusterType = event.ResourceProperties.mskClusterType;
  
  const kafka = new Kafka({
    clientId: `client-CR-${clusterName}`,
    brokers: brokerUrl,
    ssl: true,
    sasl: {
      mechanism: 'oauthbearer',
      oauthBearerProvider: () => oauthBearerTokenProvider(event.ResourceProperties.region)
    },
    logLevel: level,
  });
  
  const admin = kafka.admin();
  
  console.info('======Received Event=======');
  console.info(event);
  
  switch(event.ResourceType) {
    case "Custom::MskAcl":
      console.log("Event for ACL received");
      const responseAcl = await aclCrudOnEvent(event, admin);
      console.log(responseAcl);
      break;
    case "Custom::MskTopic":
      console.log("Event for Topic received");
      const responseTopic = await topicCrudOnEvent(event, admin);
      console.log(responseTopic);
      break;
    default:
      console.log("Unknown Resource Type");
      throw new Error(`invalid resource type: ${event.ResourceType}`);
  }
  
}