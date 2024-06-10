import { KafkaClient, UpdateConnectivityCommand, PutClusterPolicyCommand } from "@aws-sdk/client-kafka"
export const handler = async(event) => {
    const client = new KafkaClient()
    const detail = event.detail

    if (detail.eventType === "SUBSCRIBED") {
        const asset = detail.asset
        const environments = detail.environments

        const kafkaForm = asset.formOutput.find((form) => form.typeName === "KafkaForm" )
        const { clusterArn } = JSON.parse(kafkaForm.content)

        await client.send(new UpdateConnectivityCommand({
            ClusterArn: clusterArn,
            ConnectivityInfo: {
                VpcConnectivity: {
                    ClientAuthentication: {
                        Sasl: {
                            Iam: {
                                Enabled: true
                            }
                        }
                    }
                }
            }
        }))

        const environmentAccountIds = environments.map((e) => e.awsAccountId)
        const kafkaClusterPolicy = JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": environmentAccountIds
                    },
                    "Action": [
                        "kafka:CreateVpcConnection",
                        "kafka:GetBootstrapBrokers",
                        "kafka:DescribeCluster",
                        "kafka:DescribeClusterV2"
                    ],
                    "Resource": clusterArn
                }
            ]
        })

        await client.send(new PutClusterPolicyCommand({
            ClusterArn: clusterArn,
            Policy: kafkaClusterPolicy
        }))
    } 

    return {}
}