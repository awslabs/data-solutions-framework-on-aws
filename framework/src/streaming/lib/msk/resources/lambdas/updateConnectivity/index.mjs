// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  UpdateConnectivityCommand,
  DescribeClusterCommand,
  DescribeClusterOperationV2Command
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

  const currentVersion = responseKafka.ClusterInfo.CurrentVersion;

  if (responseKafka.ClusterInfo.State !== "ACTIVE") {
    console.log(currentVersion);
    return {};
  } else {
    console.log(currentVersion);
    await updateCluster(currentVersion, event);

    return {};
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
  console.log(responseKafka.ClusterInfo.CurrentVersion);

  let lastTriggeredClusterOperation = "NO_RUNNING_OPERATION";

  if (responseKafka.ClusterInfo?.ActiveOperationArn) {
    const inputClusterOperation = { // DescribeClusterOperationV2Request
      ClusterOperationArn: responseKafka.ClusterInfo.ActiveOperationArn, // required
    };
    const command = new DescribeClusterOperationV2Command(inputClusterOperation);
    
    const responseDescribeClusterOperation = await clientKafka.send(command);
  
    lastTriggeredClusterOperation = responseDescribeClusterOperation.ClusterOperationInfo.OperationType;
  }
  

  if (responseKafka.ClusterInfo.State !== "ACTIVE") {
    return {
      IsComplete: false,
    };
  } else if (responseKafka.ClusterInfo.State == "ACTIVE" && lastTriggeredClusterOperation == "UPDATE_CONNECTIVITY") {
    console.log("=====Cluster Connectivity Update Completed =====");
    
    return {
      IsComplete : true
    };
  } else if (responseKafka.ClusterInfo.State == "ACTIVE" && lastTriggeredClusterOperation != "UPDATE_CONNECTIVITY") {
    const currentVersion = responseKafka.ClusterInfo.CurrentVersion;
    
    await updateCluster(currentVersion, event);
    console.log("=====Cluster Connectivity Update Started=====");
    console.log(currentVersion);
    return {
      IsComplete : false,
    };
  } else if (responseKafka.ClusterInfo.State == "FAILED") {
    throw new Error("Cluster is in FAIL state");
  }
  else {
    return {
      IsComplete : false,
    };
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
