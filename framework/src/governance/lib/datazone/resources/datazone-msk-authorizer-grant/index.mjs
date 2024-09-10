// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KafkaClient, PutClusterPolicyCommand, GetClusterPolicyCommand, BadRequestException } from "@aws-sdk/client-kafka"
import { IAMClient, PutRolePolicyCommand, DeleteRolePolicyCommand, NoSuchEntityException } from "@aws-sdk/client-iam";


// Retry mechanism with exponential backoff configuration
const MAX_RETRIES = 20; // Maximum number of retries
const INITIAL_DELAY_MS = 100; // Initial delay in milliseconds
const MAX_DELAY_MS = 30000; // Maximum delay in milliseconds

function getMskIamResources(topicArn, clusterArn) {
  return [
    topicArn,
    clusterArn,
    getGroupArn(clusterArn),
  ]
}

function getGroupArn(clusterArn) {
  const assetArnParts = clusterArn.split(":");
  const partition = assetArnParts[1];
  const account = assetArnParts[4];
  const region = assetArnParts[3];
  const cluster = assetArnParts[5];

  return `arn:${partition}:kafka:${region}:${account}:group/${cluster}/*`
}

function calculateExponentialBackoff(retryCount, initialDelay, maxDelay) {
  const delay = initialDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateClusterPolicyWithRetry(client, grantStatement, requestType, clusterArn, retryCount = 0) {
  try {
    
    const result = await client.send(
      new GetClusterPolicyCommand({
        ClusterArn: clusterArn,
      })
    )
    console.log(`Current policy: ${result.Policy}`);
    let policy = JSON.parse(result.Policy);

    if (requestType === 'GRANT') {
      // Merge policies
      policy.Statement.push(grantStatement);
    } else if (requestType === 'REVOKE') {
      // Substract policy
      policy.Statement = policy.Statement.filter(statement => JSON.stringify(statement) !== JSON.stringify(grantStatement));
    } else {
      throw new Error(`Invalid request type: ${requestType}`);
    }
    console.log(`New policy: ${JSON.stringify({ policy }, null, 2)}`);

    // push the new policy with MVCC
    const putResult  = await client.send(
      new PutClusterPolicyCommand({
        ClusterArn: clusterArn,
        Policy: JSON.stringify(policy),
        CurrentVersion: result.CurrentVersion,
      })
    );
    console.log(`Policy updated: ${JSON.stringify({putResult}, null, 2)}`);

  } catch (error) {
    // MVCC retry mechanism
    if (error instanceof BadRequestException && error.message.includes("The version of the cluster policy isn't current")) {

      if (retryCount < MAX_RETRIES) {

        const delayMs = calculateExponentialBackoff(retryCount, INITIAL_DELAY_MS, MAX_DELAY_MS);
        console.log(`Retrying in ${delayMs} ms...`);
        await delay(delayMs);
        await updateClusterPolicyWithRetry(client, kafkaClusterPolicy, requestType, clusterArn, retryCount + 1);

      } else {
        throw new Error("Error updating MSK cluster policy: concurrent modifications failure and maximum retries exceeded.");
      }
    } else if (error instanceof BadRequestException && error.message.includes("The Statement Ids in the policy are not unique")) {
        console.log("Cluster policy already exists, skipping...");
    } else {
      throw error;
    }
  }
}

const mskReadActions = [
  'kafka-cluster:Connect',
  'kafka-cluster:DescribeTopic',
  'kafka-cluster:DescribeGroup',
  'kafka-cluster:AlterGroup',
  'kafka-cluster:ReadData'
];

const mskVpcConsumerActions = [
  "kafka:CreateVpcConnection",
  "ec2:CreateTags",
  "ec2:CreateVPCEndpoint"
];

const mskVpcClusterActions = [
  "kafka:CreateVpcConnection",
  "kafka:GetBootstrapBrokers",
  "kafka:DescribeCluster",
  "kafka:DescribeClusterV2"
];

const gsrReadActions = [
  "glue:GetRegistry",
  "glue:ListRegistries",
  "glue:GetSchema",
  "glue:ListSchemas",
  "glue:GetSchemaByDefinition",
  "glue:GetSchemaVersion",
  "glue:ListSchemaVersions",
  "glue:GetSchemaVersionsDiff",
  "glue:CheckSchemaVersionValidity",
  "glue:QuerySchemaVersionMetadata",
  "glue:GetTags"
];

export const handler = async(event) => {

  console.log(`event received: ${JSON.stringify({ event }, null, 2)}`);
  const grantManagedVpc = process.env.GRANT_VPC;

  const topicArn = event.detail.value.Metadata.Producer.TopicArn;
  const clusterArn = event.detail.value.Metadata.Producer.ClusterArn;
  const clusterType = event.detail.value.Metadata.Producer.ClusterType;
  const producerAccount = event.detail.value.Metadata.Producer.Account;
  const consumerAccount = event.detail.value.Metadata.Consumer.Account;
  const consumerRolesArn = event.detail.value.Metadata.Consumer.RolesArn;
  const subscriptionGrantId = event.detail.value.Metadata.SubscriptionGrantId;
  const assetId = event.detail.value.Metadata.AssetId;
  const requestType = event.detail.value.Metadata.RequestType;

  const iamMskResources = getMskIamResources(topicArn, clusterArn);
  
  if (event['detail-type'] === "producerGrant") {

    if (consumerAccount !== producerAccount) {

      if (clusterType === 'PROVISIONED') {
      
        const grantStatement = {
          "Sid": `${subscriptionGrantId}DSF${assetId}`,
          "Effect": "Allow",
          "Principal": {
            "AWS": consumerRolesArn,
          },
          "Action": mskReadActions.concat(mskVpcClusterActions),
          "Resource": iamMskResources,
        };
        const client = new KafkaClient();

        await updateClusterPolicyWithRetry(client, grantStatement, requestType, clusterArn);

      } else if (clusterType === 'SERVERLESS') {
        throw new Error("Cross account access is not supported for Serverless cluster");
      } else {
        throw new Error("Unsupported cluster type")
      }

    } else {
      console.log("Producer and consumer are in the same account, skipping cluster policy")
    }
  } else if (event['detail-type'] === 'consumerGrant') {

    let iamActions = mskReadActions;
    let iamResources = iamMskResources;
    // Test if we need to grant permissions on the Glue Schema Registry
    const schemaArn = event.detail.value.Metadata.Producer.SchemaArn;
    if ( schemaArn !== '' && producerAccount === consumerAccount) {
      iamActions = mskReadActions.concat(gsrReadActions);
      iamResources = iamMskResources.concat([schemaArn, event.detail.value.Metadata.Producer.RegistryArn]);
    }

    let statements = [
      {
        "Effect": "Allow",
        "Action": iamActions,
        "Resource": iamResources,
      }
    ]

    if (consumerAccount !== producerAccount) {

      if (clusterType === 'PROVISIONED') {
      
        statements = statements.concat([
          {
            "Effect": "Allow",
            "Action": mskVpcConsumerActions,
            "Resource": "*",
          }
        ]);

      } else if (clusterType === 'SERVERLESS') {
        throw new Error("Cross account access is not supported for Serverless cluster");
      } else {
        throw new Error("Unsupported cluster type")
      }
    } 

    const iamRolePolicy = JSON.stringify({
      "Version": "2012-10-17",
      "Statement": statements
    }, null, 2);

    const client = new IAMClient();

    for (var role of consumerRolesArn) {
      console.log(`Processing role: ${role}`);

      const roleName = role.split(':')[5].split('/')[1];
      const policyName = `${subscriptionGrantId}_${assetId}`;

      if (requestType === 'GRANT') {

        const result = await client.send(new PutRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
          PolicyDocument: iamRolePolicy
        }));
        console.log(`PutRolePolicy result: ${JSON.stringify({ result }, null, 2)}`);

      } else if (requestType === 'REVOKE') {

        try {
          const result = await client.send(new DeleteRolePolicyCommand({
            RoleName: roleName,
            PolicyName: policyName
          }));
          console.log(`DeleteRolePolicy result: ${JSON.stringify({ result }, null, 2)}`);
        } catch (error) {
          if (error instanceof NoSuchEntityException) {
            console.log(`Policy ${policyName} doesn't exist... passing`);
          } else {
            throw error;
          }
        }

      } else {
        throw new Error(`Invalid request type: ${requestType}`);
      }
    }
  } else {
    throw new Error("Unsupported grant action")
  }
  return {}
}
