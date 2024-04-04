// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  UpdateConnectivityCommand,
  DescribeClusterCommand
} from "@aws-sdk/client-kafka";


const clientKafka = new KafkaClient();


// Handler functions
export const onEventHandler =  async (event) => {

  console.info('======Recieved for Event=======');
  console.info(event);

  switch (event.RequestType) {
    case 'Create':
      let result = await onCreate(event);
      return result;

    case 'Update':
    case 'Delete':
      return {}

    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}

// Handler functions
const onCreate = async (event) => {

  console.log(event);

  if (event.RequestType == 'Delete'){
      return {
        IsComplete : true,
      }
  }

  const inputKafka = {
    ClusterArn: process.env.MSK_CLUSTER_ARN,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);

  if (responseKafka.ClusterInfo.State !== "ACTIVE") {
    return {
      Data : {
        clusterState: responseKafka.ClusterInfo.State,
        IsComplete : false,
      }
    }
  } else {
    const currentVersion = responseKafka.ClusterInfo.CurrentVersion;
    await updateCluster(currentVersion);

    return {
      Data : {
        clusterState: responseKafka.ClusterInfo.State,
        IsComplete : true,
      }
    }
  }

}

export const isCompleteHandler = async (event) => {
  console.info('isCompleteHandler Invocation');
  console.info(event);

  if (event.RequestType == 'Delete'){
    return {
      IsComplete : true,
    }
}

  const inputKafka = {
    ClusterArn: process.env.MSK_CLUSTER_ARN,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);

  if (responseKafka.ClusterInfo.State !== "ACTIVE") {
    return {
      IsComplete: false,
    }
  } else {
    const currentVersion = responseKafka.ClusterInfo.CurrentVersion;
    await updateCluster(currentVersion);

    return {
      IsComplete : true
    }
  }

}

async function updateCluster (currentVersion) {
  

  const input = { // UpdateClusterConfigurationRequest
    ClusterArn: process.env.MSK_CLUSTER_ARN, // required
    CurrentVersion: currentVersion, // required
    ConnectivityInfo: { // ConnectivityInfo
      PublicAccess: { // PublicAccess
        Type: "DISABLED",
      },
      VpcConnectivity: { // VpcConnectivity
        ClientAuthentication: { // VpcConnectivityClientAuthentication
          Sasl: { // VpcConnectivitySasl
            Scram: { // VpcConnectivityScram
              Enabled: false,
            },
            Iam: { // VpcConnectivityIam
              Enabled: process.env.IAM === "undefined" ? false : true,
            },
          },
          Tls: { // VpcConnectivityTls
            Enabled: process.env.TLS === "undefined" ? false : true,
          },
        },
      },
    }
  };

  console.log(input);
  const commandKafka = new UpdateConnectivityCommand(input);
  const responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);
}