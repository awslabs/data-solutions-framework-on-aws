import { DataZoneClient, UpdateSubscriptionGrantStatusCommand } from "@aws-sdk/client-datazone";

export const handler = async(event) => {
    const client = new DataZoneClient()
    const  {assetId, domainId, grantId, grantStatus} = event

    let newGrantStatus = "GRANTED"
    let failureCause = null

    if (!grantStatus) {
        newGrantStatus = "GRANT_FAILED"

        if (event.failureCause) {
            failureCause = event.failureCause
        }
    }

    await client.send(new UpdateSubscriptionGrantStatusCommand({
        domainIdentifier: domainId,
        identifier: grantId,
        assetIdentifier: assetId,
        status: newGrantStatus,
        failureCause: {
            message: failureCause
        }
    }))

    return {}

    // const eventData = detail.data
    // const domainId = detail.metadata.domain
    // const projectId = detail.metadata.owningProjectId
    
    // const assetId = eventData.subscribedListings[0].item.assetListing.entityId
    // const environments = []

    // //get asset information
    // const asset = await client.send(new GetAssetCommand({
    //     domainIdentifier: domainId,
    //     identifier: assetId
    // }))

    // const assetTypeIdentifier = asset.typeIdentifier

    // //collect environments
    // let nextToken = null
    // do {
    //     const environmentsPayload = await client.send(new ListEnvironmentsCommand({
    //         domainIdentifier: domainId,
    //         projectIdentifier: projectId,
    //         status: "ACTIVE",
    //         maxResults: 20,
    //         nextToken
    //     }))     

    //     environments = environments.concat(environmentsPayload.items)

    //     nextToken = environmentsPayload.nextToken
    // } while (nextToken);

    // return {}
}