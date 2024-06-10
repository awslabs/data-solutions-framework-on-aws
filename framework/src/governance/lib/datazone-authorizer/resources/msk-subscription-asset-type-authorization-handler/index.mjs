import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

export const handler = async(event) => {
    const ebClient = new EventBridgeClient()    
}