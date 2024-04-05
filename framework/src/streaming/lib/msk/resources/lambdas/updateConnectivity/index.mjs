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
    case 'Update':
      let createResult = await onCreate(event);
      return createResult;

    case 'Delete':
      return {};

    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}

// Handler functions
const onCreate = async (event) => {

  console.log(event);

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
    await updateCluster(currentVersion, event);

    return {
      Data : {
        clusterState: responseKafka.ClusterInfo.State,
        IsComplete : true,
      }
    }
  }

}

// Handler functions
const onDelete = async (event) => {

  console.log(event);

  const inputKafka = {
    ClusterArn: process.env.MSK_CLUSTER_ARN,
  };

  let commandKafka = new DeleteVpcConnectionCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);

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
    await updateCluster(currentVersion, event);

    return {
      IsComplete : true
    }
  }

}

async function updateCluster (currentVersion, event) {
  
  console.log(event.ResourceProperties.Iam);
  console.log(event.ResourceProperties.Tls);

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
              Enabled: event.ResourceProperties.Iam == "true" ? true : false,
            },
          },
          Tls: { // VpcConnectivityTls
            Enabled: event.ResourceProperties.Tls == "true" ? true : false,
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
