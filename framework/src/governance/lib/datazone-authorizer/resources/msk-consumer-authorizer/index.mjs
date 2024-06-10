import { KafkaClient, CreateVpcConnectionCommand } from "@aws-sdk/client-kafka";

export const handler = async(event) => {
    const client = new KafkaClient()
    const detail = event.detail

    if (detail.eventType === "SUBSCRIBED") {
        const asset = detail.asset
        const kafkaForm = asset.formOutput.find((form) => form.typeName === "KafkaForm" )
        const { clusterArn } = JSON.parse(kafkaForm.content)

        const vpcId = process.env.VPC_ID
        const subnetIds = process.env.SUBNET_IDS.split(",")
        const securityGroupIds = process.env.SECURITY_GROUP_IDS.split(",")

        await client.send(new CreateVpcConnectionCommand({
            TargetClusterArn: clusterArn,
            Authentication: "iam",
            VpcId: vpcId,
            ClientSubnets: subnetIds,
            SecurityGroups: securityGroupIds
        }))
    }   

    return {}
}