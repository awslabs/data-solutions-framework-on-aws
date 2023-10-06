import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3"
import path from "node:path"

export const handler = async(event) => {
    if (event.RequestType == "Create") {
        const sourceBucketName = process.env.SOURCE_BUCKET_NAME
        const sourceBucketPrefix = process.env.SOURCE_BUCKET_PREFIX
        const sourceBucketRegion = process.env.SOURCE_BUCKET_REGION
        const targetBucketName = process.env.TARGET_BUCKET_NAME
        const targetBucketPrefix = process.env.TARGET_BUCKET_PREFIX
    
        const sourceClient = new S3Client({region: sourceBucketRegion})
        const client = new S3Client()
        let nextToken = null
    
        do {
            const list = await sourceClient.send(new ListObjectsV2Command({
                Bucket: sourceBucketName,
                Prefix: sourceBucketPrefix,
                ContinuationToken: nextToken,
                MaxKeys: 1000
            }))
    
            const collectedPromises = []
    
            for(const obj of list.Contents) {
                const newKey = path.basename(obj.Key)
    
                if (!obj.Key.endsWith("/")) {
                    collectedPromises.push(client.send(new CopyObjectCommand({
                        Bucket: targetBucketName,
                        Key: `${targetBucketPrefix}${newKey}`,
                        CopySource: `${sourceBucketName}/${obj.Key}`
                    })))
                }
            }
    
            await Promise.all(collectedPromises)
            console.log("Copy done")
            if (list.IsTruncated) {
                nextToken = list.NextContinuationToken
                console.log("Next batch")
            } else {
                console.log("Exit")
                break;
            }
    
            
        } while (nextToken !== null)
    }

    return {}
}