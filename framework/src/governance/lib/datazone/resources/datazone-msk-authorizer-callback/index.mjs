import { DataZoneClient, UpdateSubscriptionGrantStatusCommand } from "@aws-sdk/client-datazone";

export const handler = async(event) => {
  const client = new DataZoneClient()
  const  status = event.status;
  
  if (status == 'fail') {
    
    await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.metadata.domainId,
      identifier: event.metadata.subscriptionGranId,
      assetIdentifier: event.metadata.assetId,
      status: 'GRANT_FAILED',
      failureCause: {
        message: event.cause
      }
    }))
    
    return {}

  } else if (status == 'success') {

    await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.metadata.domainId,
      identifier: event.metadata.subscriptionGranId,
      assetIdentifier: event.metadata.assetId,
      status: 'COMPLETED',
    }))

    return {}

  } else {
    
    throw new Error('Invalid status')
  
  }
}