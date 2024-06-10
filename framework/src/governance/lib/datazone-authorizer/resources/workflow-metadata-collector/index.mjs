import { DataZoneClient, ListEnvironmentsCommand, GetAssetCommand } from "@aws-sdk/client-datazone";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

export const handler = async(event) => {
    const client = new DataZoneClient()
    const ebClient = new EventBridgeClient()
    const detail = event.detail

    const eventData = detail.data
    const domainId = detail.metadata.domain
    const projectId = detail.metadata.owningProjectId
    
    const assetId = eventData.subscribedListings[0].item.assetListing.entityId
    const environments = []

    //get asset information
    const asset = await client.send(new GetAssetCommand({
        domainIdentifier: domainId,
        identifier: assetId
    }))

    const assetTypeIdentifier = asset.typeIdentifier

    //collect environments
    let nextToken = null
    do {
        const environmentsPayload = await client.send(new ListEnvironmentsCommand({
            domainIdentifier: domainId,
            projectIdentifier: projectId,
            status: "ACTIVE",
            maxResults: 20,
            nextToken
        }))     

        environments = environments.concat(environmentsPayload.items)

        nextToken = environmentsPayload.nextToken
    } while (nextToken);


    const eventDetailPayload = {
        domainId,
        projectId,
        assetId,
        environments,
        asset
    }

    await ebClient.send(new PutEventsCommand({
        Entries: [
            {
                Source: "dsf.datazone-authorizer",
                DetailType: `Subscription ${assetTypeIdentifier} Authorization`,
                Detail: JSON.stringify(eventDetailPayload),
                EventBusName: process.env.AUTHORIZER_EVENT_BUS
            }
        ]
    }))

    return {}
}