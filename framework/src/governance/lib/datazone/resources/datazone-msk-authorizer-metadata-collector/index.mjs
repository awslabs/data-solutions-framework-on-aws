import { DataZoneClient, GetEnvironmentCommand, GetAssetCommand } from "@aws-sdk/client-datazone";


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

  console.log(JSON.stringify(targetEnv, null, 2))
  const targetEnvResources = targetEnv.provisionedResources;
  const userRole = targetEnvResources.find((element) => element.name === "userRoleArn");
  const consumerAccountId = targetEnv.awsAccountId;
  const consumerRegion = targetEnv.awsAccountRegion;

  return {
    DomainId: domainId,
    SubscriptionGrantId: event.detail.metadata.id,
    AssetId: asset.id,
    Producer: {
      Region: producerRegion,
      Account: producerAccountId,
      ClusterName: clusterName,
      ClusterUuid: clusterUuid,
      Topic: topicName,
    },
    Consumer: {
      Region: consumerRegion,
      Account: consumerAccountId,
      Role: userRole.value,
    }
  }
}