import { KafkaClient, PutClusterPolicyCommand } from "@aws-sdk/client-kafka"
import { IAMClient, PutRolePolicyCommand } from "@aws-sdk/client-iam";



function getIamResources(region, account, clusterName, clusterUuid, topic) {
  return [
    `arn:aws:kafka:${region}:${account}:topic/${clusterName}/${clusterUuid}/${topic}`,
    `arn:aws:kafka:${region}:${account}:cluster/${clusterName}/${clusterUuid}`,
    `arn:aws:kafka:${region}:${account}:group/${clusterName}/${clusterUuid}/*`
  ]
}

const iamActions = [
  'kafka-cluster:Connect',
  'kafka-cluster:DescribeTopic',
  'kafka-cluster:DescribeGroup',
  'kafka-cluster:AlterGroup',
  'kafka-cluster:ReadData',
];

export const handler = async(event) => {
  
  if (event.DetailType === "producerGrant") {

    const topic = detail.metadata.producer.topic;
    const clusterName = detail.metadata.producer.clusterName;
    const clusterUuid = detail.metadata.producer.clusterUuid;
    const region = detail.metadata.producer.region;
    const account = detail.metadata.producer.account;

    const consumerAccount = detail.metadata.consumer.account;

    if (consumerAccount !== account) {
      
      const kafkaClusterPolicy = JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "AWS": consumerAccount,
            },
            "Action": iamActions,
            "Resource": getIamResources(region, account, clusterName, clusterUuid, topic)
          }
        ]
      })
    
      const client = new KafkaClient()
      
      await client.send(new PutClusterPolicyCommand({
        ClusterArn: clusterArn,
        Policy: kafkaClusterPolicy
      }))

    } else {
      console.log("Producer and consumer are in the same account, skipping cluster policy")
    }
  } else if (event.DetailType === 'consumerGrant') {

    const iamRolePolicy = JSON.stringify({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": iamActions,
          "Resource": getIamResources(region, account, clusterName, clusterUuid, topic)
        }
      ]
    })

    const client = new IAMClient(config);

    await client.send(new PutRolePolicyCommand({
      RoleName: event.metadata.consumer.role,
      PolicyName: event.metadata.producer.clusterName + event.metadata.producer.topic,
      PolicyDocument: iamRolePolicy
    }))

  } else {

    throw new Error("Unsupported grant action")

  }
  
  return {}
}
