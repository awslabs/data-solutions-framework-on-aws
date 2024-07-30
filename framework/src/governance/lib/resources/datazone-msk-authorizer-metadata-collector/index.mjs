import { DataZoneClient, ListEnvironmentsCommand, GetAssetCommand } from "@aws-sdk/client-datazone";
import cluster from "cluster";

export const handler = async(event) => {
  const client = new DataZoneClient()
  
  const domainId = event.detail.metadata.domain;  
  const assetId = event.detail.data.asset.id;
  const targetEnvId = event.detail.data.subscriptionTarget.environmentId;
  
  //get asset information
  const asset = await client.send(new GetAssetCommand({
    domainIdentifier: domainId,
    identifier: assetId
  }))
  
  // Get the external identifier in the form of an MSK topic ARN
  // arn:${Partition}:kafka:${Region}:${Account}:topic/${ClusterName}/${ClusterUuid}/${TopicName}
  const externalId = String(asset.externalIdentifier);
  
  const assetArnParts = externalId.split(":");
  const producerAccountId = assetArnParts[4];
  const producerRegion = assetArnParts[3];
  const resourceParts = assetArnParts[5].split("/");
  const clusterName = resourceParts[1];
  const clusterUuid = resourceParts[2];
  const topicName = resourceParts[3];

  //get target environment information
  const targetEnv = await client.send(new GetEnvironmentCommand({
    domainIdentifier: domainId,
    identifier: targetEnvId
  }));

  const targetEnvResources = targetEnv.provisionedResources;
  const userRole = targetEnvResources.find((element) => element.name === "userRoleArn");

  const userRoleArnParts = userRole.value.split(":");
  const consumerAccountId = userRoleArnParts[4];
  const consumerRegion = userRoleArnParts[3];

  return {
    domainId: domainId,
    subscriptionGrantId: event.detail.metadata.id,
    assetId: asset.id,
    producer: {
      region: producerRegion,
      account: producerAccountId,
      clusterName: clusterName,
      clusterUuid: clusterUuid,
      topic: topicName,
    },
    consumer: {
      region: consumerRegion,
      account: consumerAccountId,
      role: userRole.value,
    }
  }
}