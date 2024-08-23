// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { 
  DataZoneClient, 
  GetEnvironmentCommand, 
  GetListingCommand, 
  UpdateSubscriptionGrantStatusCommand, 
  SubscriptionGrantStatus 
} from "@aws-sdk/client-datazone";


export const handler = async(event) => {

  console.log(`event received: ${JSON.stringify({ event }, null, 2)}`);

  const client = new DataZoneClient()
  
  const domainId = event.detail.metadata.domain;  
  const listingId = event.detail.data.asset.listingId;
  const listingVersion = event.detail.data.asset.listingVersion;
  const targetEnvId = event.detail.data.subscriptionTarget.environmentId;
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
  await client.send(new UpdateSubscriptionGrantStatusCommand({
    domainIdentifier: domainId,
    identifier: subscriptionGrantId,
    assetIdentifier: asset.item.assetListing.assetId,
    status: requestType === 'GRANT' ? SubscriptionGrantStatus.GRANT_IN_PROGRESS : SubscriptionGrantStatus.REVOKE_IN_PROGRESS,
  }))

  // Get the cluster ARN from the MskSourceReferenceFormType
  // arn:${Partition}:kafka:${Region}:${Account}:cluster/${ClusterName}/${ClusterUuid}
  const forms = JSON.parse(asset.item.assetListing.forms);
  const clusterArn = forms.MskSourceReferenceFormType.cluster_arn;
  const clusterType = forms.MskSourceReferenceFormType.cluster_type;
  const topicName = forms.KafkaSchemaFormType.kafka_topic;

  const assetArnParts = clusterArn.split(":");
  const producerAccountId = assetArnParts[4];
  const producerRegion = assetArnParts[3];
  const resourceParts = assetArnParts[5].split("/");
  const clusterName = resourceParts[1];
  const clusterUuid = resourceParts[2];

  //get target environment information
  const targetEnv = await client.send(new GetEnvironmentCommand({
    domainIdentifier: domainId,
    identifier: targetEnvId
  }));

  console.log(`GetEnvironment result: ${JSON.stringify({ targetEnv }, null, 2)}`);

  console.log(JSON.stringify(targetEnv, null, 2))
  const targetEnvResources = targetEnv.provisionedResources;
  const userRole = targetEnvResources.find((element) => element.name === "userRoleArn");
  const consumerAccountId = targetEnv.awsAccountId;
  const consumerRegion = targetEnv.awsAccountRegion;

  const results = {
    DomainId: domainId,
    SubscriptionGrantId: subscriptionGrantId,
    AssetId: asset.item.assetListing.assetId,
    RequestType: requestType,
    Producer: {
      Region: producerRegion,
      Account: producerAccountId,
      ClusterName: clusterName,
      ClusterType: clusterType,
      ClusterUuid: clusterUuid,
      Topic: topicName,
    },
    Consumer: {
      Region: consumerRegion,
      Account: consumerAccountId,
      Role: userRole.value,
    }
  };

  console.log(`Metadata collection results: ${JSON.stringify({ results }, null, 2)}`);

  return results;
}