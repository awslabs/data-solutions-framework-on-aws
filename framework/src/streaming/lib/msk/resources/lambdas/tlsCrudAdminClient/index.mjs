// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kafka, logLevel } from "kafkajs"
import { KafkaClient, GetBootstrapBrokersCommand } from "@aws-sdk/client-kafka";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { aclCrudOnEvent } from "./acl-crud.mjs";
import { topicCrudOnEvent } from "./topic-crud.mjs";

// Handler functions
export const onEventHandler = async (event) => {
  
  console.log(event);
  
  const clientSecretManager = new SecretsManagerClient();
  
  const responseSecretManager = await clientSecretManager.send(
    new GetSecretValueCommand({
      SecretId: event.ResourceProperties.secretArn,
    }),
  );
  
  const secret = JSON.parse(responseSecretManager.SecretString);
  
  
  //Cleaning the private key and cert and put them in PEM format
  //This is to avoid having malformed certificate and keys passed by the user
  //Error can be like "error:0480006C:PEM routines::no start line"
  
  const certificates = extractCertificatesFromSecretCertObject(secret.cert);
  
  let formatedCertPem;
  
  for (let cert in certificates) {
    let appendNewLine = cert < certificates.length-1 ? true : false;
    
    if (!formatedCertPem) {
      formatedCertPem = formatToPEM(certificates[cert], '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', appendNewLine);
    } else {
      formatedCertPem += formatToPEM(certificates[cert], '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', appendNewLine);
    }
  }
  
  let cleanedStringKey = removeSpacesAndNewlines(secret.key);
  
  const regexKey = /(?<=BEGINRSAPRIVATEKEY-----)(.*?)(?=-----ENDRSAPRIVATEKEY-----)/gs;
  const matchKey = cleanedStringKey.match(regexKey);
  
  cleanedStringKey = matchKey[0].trim(); // Trim any leading/trailing spaces
  const privateKey = formatToPEM(cleanedStringKey, '-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----');
  
  
  const client = new KafkaClient();
  const input = {
    ClusterArn: event.ResourceProperties.mskClusterArn,
  };
  
  const command = new GetBootstrapBrokersCommand(input);
  const response = await client.send(command);
  
  console.log(response);
  const brokerUrls = response.BootstrapBrokerStringTls.split(',');
  
  let clusterName = event.ResourceProperties.mskClusterArn.split('/')[1];
  
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
  
  const kafka = new Kafka({
    clientId: `client-CR-${clusterName}`,
    brokers: brokerUrls,
    ssl: {
      rejectUnauthorized: true,
      key: privateKey,
      cert: formatedCertPem
    },
    logLevel: level,
  });
  
  const admin = kafka.admin();
  
  console.info('======Received Event=======');
  console.info(event);
  
  // If the principal is set to REPLACE-WITH-BOOTSTRAP, 
  // we need to replace it with the broker FQDN prefix with a wildcard
  
  if (event.ResourceProperties.principal === "REPLACE-WITH-BOOTSTRAP") {
    const pattern = /^[^.]+\.(.+)$/;
    const match = brokerUrls[0].match(pattern);
    
    event.ResourceProperties.principal = '*.' + match[1];
    
  }
  
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


function formatToPEM(certData, begin, end, appendNewLine) {
  
  const maxLength = 64;
  
  let pemCert = begin + '\n';
  for (let i = 0; i < certData.length; i += maxLength) {
    pemCert += certData.substring(i, i + maxLength) + '\n';
  }
  if(appendNewLine) {
    pemCert += end +'\n';
  } else {
    pemCert += end;
  }
  
  return pemCert;
}

function removeSpacesAndNewlines(inputString) {
  // Using regular expressions to remove spaces and newline characters
  return inputString.replace(/[\s\n]/g, '');
}

function extractCertificatesFromSecretCertObject(pemData) {
  
  const cleanedPemData = removeSpacesAndNewlines(pemData);
  const regex = /-----BEGINCERTIFICATE-----(.*?)-----ENDCERTIFICATE-----/gs;
  const certificates = [];
  let match;
  while ((match = regex.exec(cleanedPemData)) !== null) {
    certificates.push(match[1].trim());
  }
  return certificates;
}