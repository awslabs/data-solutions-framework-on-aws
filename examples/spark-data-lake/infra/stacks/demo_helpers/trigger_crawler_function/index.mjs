import { GlueClient, StartCrawlerCommand } from "@aws-sdk/client-glue"

export const handler = async(event) => {
    const crawlerName = process.env.TARGET_CRAWLER_NAME

    const client = new GlueClient()

    await client.send(new StartCrawlerCommand({Name: crawlerName}))

    return {}
}