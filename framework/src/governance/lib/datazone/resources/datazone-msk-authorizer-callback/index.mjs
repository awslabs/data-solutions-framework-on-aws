// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataZoneClient, UpdateSubscriptionGrantStatusCommand, SubscriptionGrantStatus } from "@aws-sdk/client-datazone";


const client = new DataZoneClient()

export const handler = async(event) => {

  console.log(`event received: ${JSON.stringify({ event }, null, 2)}`);

  const  status = event.Status;
  const requestType = event.Metadata.RequestType;
  
  if (status === 'failure') {

    const results = await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.Metadata.DomainId,
      identifier: event.Metadata.SubscriptionGrantId,
      assetIdentifier: event.Metadata.AssetId,
      status: requestType === 'GRANT' ? SubscriptionGrantStatus.GRANT_FAILED : SubscriptionGrantStatus.REVOKE_FAILED,
      failureCause: {
        message: event.Cause
      }
    }))
    console.log(`failure callback results: ${JSON.stringify({ results }, null, 2)}`);
    
    return {}

  } else if (status === 'success') {

    const results = await client.send(new UpdateSubscriptionGrantStatusCommand({
      domainIdentifier: event.Metadata.DomainId,
      identifier: event.Metadata.SubscriptionGrantId,
      assetIdentifier: event.Metadata.AssetId,
      status: requestType === 'GRANT' ? SubscriptionGrantStatus.GRANTED : SubscriptionGrantStatus.REVOKED,
    }))

    console.log(`success callback results: ${JSON.stringify({ results }, null, 2)}`);

    return {}

  } else {
    
    throw new Error('Invalid status')
  
  }
}