import { KafkaClient, PutClusterPolicyCommand } from "@aws-sdk/client-kafka"
import { IAMClient, PutRolePolicyCommand } from "@aws-sdk/client-iam";


function getIamResources(region, account, clusterName, clusterUuid, topic) {
  return [
    `arn:aws:kafka:${region}:${account}:topic/${clusterName}/${clusterUuid}/${topic}`,
    getClusterArn(region, account, clusterName, clusterUuid),
    `arn:aws:kafka:${region}:${account}:group/${clusterName}/${clusterUuid}/*`
  ]
}

function getClusterArn(region, account, clusterName, clusterUuid) {
  return `arn:aws:kafka:${region}:${account}:cluster/${clusterName}/${clusterUuid}`
}

const readActions = [
  'kafka-cluster:Connect',
  'kafka-cluster:DescribeTopic',
  'kafka-cluster:DescribeGroup',
  'kafka-cluster:AlterGroup',
  'kafka-cluster:ReadData'
];

export const handler = async(event) => {
  const topic = event.detail.value.Metadata.Producer.Topic;
  const clusterName = event.detail.value.Metadata.Producer.ClusterName;
  const clusterUuid = event.detail.value.Metadata.Producer.ClusterUuid;
  const region = event.detail.value.Metadata.Producer.Region;
  const account = event.detail.value.Metadata.Producer.Account;

  const consumerAccount = event.detail.value.Metadata.Consumer.Account;
  const consumerRole = event.detail.value.Metadata.Consumer.Role;
  
  if (event['detail-type'] === "producerGrant") {

    if (consumerAccount !== account) {
      
      const kafkaClusterPolicy = JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "AWS": consumerRole
            },
            "Action": readActions,
            "Resource": getIamResources(region, account, clusterName, clusterUuid, topic)
          }
        ]
      }, null, 2)
    
      const client = new KafkaClient()
      
      await client.send(new PutClusterPolicyCommand({
        ClusterArn: getClusterArn(region, account, clusterName, clusterUuid),
        Policy: kafkaClusterPolicy
      }))

    } else {
      console.log("Producer and consumer are in the same account, skipping cluster policy")
    }
  } else if (event['detail-type'] === 'consumerGrant') {

    const iamRolePolicy = JSON.stringify({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": readActions,
          "Resource": getIamResources(region, account, clusterName, clusterUuid, topic)
        }
      ]
    }, null, 2)

    const client = new IAMClient();

    await client.send(new PutRolePolicyCommand({
      RoleName: event.detail.value.Metadata.Consumer.Role.split(':')[5].split('/')[1],
      PolicyName: event.detail.value.Metadata.Producer.ClusterName + event.detail.value.Metadata.Producer.Topic,
      PolicyDocument: iamRolePolicy
    }))

  } else {

    throw new Error("Unsupported grant action")

  }
  
  return {}
}
