import { DataZoneClient, UpdateSubscriptionGrantStatusCommand, SubscriptionGrantStatus } from "@aws-sdk/client-datazone";

export const handler = async(event) => {
  const client = new DataZoneClient()
  const  status = event.Status;
  
  if (status === 'failure') {

    await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.Metadata.DomainId,
      identifier: event.Metadata.SubscriptionGranId,
      assetIdentifier: event.Metadata.AssetId,
      status: SubscriptionGrantStatus.GRANT_FAILED,
      failureCause: {
        message: event.Cause
      }
    }))
    
    return {}

  } else if (status === 'success') {

    await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.Metadata.DomainId,
      identifier: event.Metadata.SubscriptionGrantId,
      assetIdentifier: event.Metadata.AssetId,
      status: SubscriptionGrantStatus.GRANTED,
    }))

    return {}

  } else {
    
    throw new Error('Invalid status')
  
  }
}