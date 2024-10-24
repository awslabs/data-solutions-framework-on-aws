// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { 
  DataZoneClient, 
  GetEnvironmentCommand, 
  GetListingCommand, 
  UpdateSubscriptionGrantStatusCommand, 
  SubscriptionGrantStatus ,
  GetSubscriptionTargetCommand
} from "@aws-sdk/client-datazone";


export const handler = async(event) => {

  console.log(`event received: ${JSON.stringify({ event }, null, 2)}`);

  const client = new DataZoneClient()
  
  const domainId = event.detail.metadata.domain;  
  const listingId = event.detail.data.asset.listingId;
  const listingVersion = event.detail.data.asset.listingVersion;
  const targetEnvId = event.detail.data.subscriptionTarget.environmentId;
  const subscriptionTargetId = event.detail.data.subscriptionTarget.id;
  const detailType = event['detail-type'];
  const subscriptionGrantId = event.detail.metadata.id;

  // test if it's a GRANT or REVOKE request
  const requestType = detailType.includes('Revoke') ? 'REVOKE' : 'GRANT';

  //get asset information
  const asset = await client.send(new GetListingCommand({
    domainIdentifier: domainId,
    identifier: listingId,
    listingRevision: listingVersion,
  }))
  
  console.log(`GetListing result: ${JSON.stringify({ asset }, null, 2)}`);

  // Update the status in DataZone
  const updateStatus = await client.send(new UpdateSubscriptionGrantStatusCommand({
    domainIdentifier: domainId,
    identifier: subscriptionGrantId,
    assetIdentifier: asset.item.assetListing.assetId,
    status: requestType === 'GRANT' ? SubscriptionGrantStatus.GRANT_IN_PROGRESS : SubscriptionGrantStatus.REVOKE_IN_PROGRESS,
  }))

  console.log(`UpdateSubscriptionGrant result: ${JSON.stringify({ updateStatus }, null, 2)}`);

  // Get the cluster ARN from the MskSourceReferenceFormType
  const forms = JSON.parse(asset.item.assetListing.forms);
  const clusterArn = forms.MskSourceReferenceFormType.cluster_arn;
  const clusterType = forms.MskSourceReferenceFormType.cluster_type;
  const topicName = forms.KafkaSchemaFormType.kafka_topic;

  let registryArn='', schemaArn='';
  try {
    registryArn = forms.KafkaSchemaFormType.registry_arn;
    schemaArn = forms.KafkaSchemaFormType.schema_arn;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined")) {
      console.log("RegistryArn and SchemaArn not found in forms, skipping...");
    } else {
      throw error;
    }
  }
  const assetArnParts = clusterArn.split(":");
  const partition = assetArnParts[1];
  const producerAccountId = assetArnParts[4];
  const producerRegion = assetArnParts[3];
  const clusterParts = assetArnParts[5].split('/');
  const cluster = `${clusterParts[1]}/${clusterParts[2]}`;

  const topicArn = `arn:${partition}:kafka:${producerRegion}:${producerAccountId}:topic/${cluster}/${topicName}`;

  // get target environment information
  const targetEnv = await client.send(new GetEnvironmentCommand({
    domainIdentifier: domainId,
    identifier: targetEnvId
  }));

  console.log(`GetEnvironment result: ${JSON.stringify({ targetEnv }, null, 2)}`);

  // const targetEnvResources = targetEnv.provisionedResources;
  // const userRole = targetEnvResources.find((element) => element.name === "userRoleArn");
  const consumerAccountId = targetEnv.awsAccountId;
  const consumerRegion = targetEnv.awsAccountRegion;

  const targetSubscription = await client.send(new GetSubscriptionTargetCommand({
    domainIdentifier: domainId,
    environmentIdentifier: targetEnvId,
    identifier: subscriptionTargetId,
  }));

  console.log(`GetSubscriptionTarget result: ${JSON.stringify({ targetSubscription }, null, 2)}`);

  const consumerRolesArn = targetSubscription.authorizedPrincipals;

  const results = {
    DomainId: domainId,
    SubscriptionGrantId: subscriptionGrantId,
    AssetId: asset.item.assetListing.assetId,
    RequestType: requestType,
    //TODO field version
    Producer: {
      ClusterArn: clusterArn,
      ClusterType: clusterType,
      TopicArn: topicArn,
      RegistryArn: registryArn,
      SchemaArn: schemaArn,
      Partition: partition,
      Region: producerRegion,
      Account: producerAccountId,
    },
    Consumer: {
      Partition: partition,
      Region: consumerRegion,
      Account: consumerAccountId,
      RolesArn: consumerRolesArn,
    }
  };

  console.log(`Metadata collection results: ${JSON.stringify({ results }, null, 2)}`);

  return results;
}