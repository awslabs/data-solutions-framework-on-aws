// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  UpdateConnectivityCommand,
  DescribeClusterCommand,
  ListClusterOperationsV2Command
} from "@aws-sdk/client-kafka";


const clientKafka = new KafkaClient();


// Handler functions
export const onEventHandler = async (event) => {

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

  if (event.RequestType == 'Delete') {
    return {
      IsComplete: true,
    }
  }

  const inputKafka = {
    ClusterArn: process.env.MSK_CLUSTER_ARN,
  };

  const response = await clientKafka.send(new ListClusterOperationsV2Command(inputKafka));

  // Filter operations that have completed successfully
  const completedOperations = response.ClusterOperationInfoList.filter(operation => operation.OperationState === 'UPDATE_COMPLETE');

  // Sort completed operations by completion time
  const sortedOperations = completedOperations.sort((a, b) => {
    return new Date(b.OperationEndTime).getTime() - new Date(a.OperationEndTime).getTime();
  });

  // Retrieve the latest completed operation
  const latestCompletedOperation = sortedOperations[0];

  let updateConnectivityCompleted = false;

  console.log(latestCompletedOperation);

  if (latestCompletedOperation?.OperationType == 'UPDATE_CONNECTIVITY') {
    updateConnectivityCompleted = true;
  }

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);
  console.log(responseKafka.ClusterInfo.CurrentVersion);

  if (responseKafka.ClusterInfo.State == "FAILED") {
    throw new Error("Cluster is in FAIL state");
  } else if (responseKafka.ClusterInfo.State !== "ACTIVE") {
    return {
      IsComplete: false,
    };
  } else if (responseKafka.ClusterInfo.State == "ACTIVE" && updateConnectivityCompleted) {
    console.log("=====Cluster Connectivity Update Completed =====");

    return {
      IsComplete: true
    };
  } else if (responseKafka.ClusterInfo.State == "ACTIVE" && !updateConnectivityCompleted) {
    const currentVersion = responseKafka.ClusterInfo.CurrentVersion;

    await updateCluster(currentVersion, event);
    console.log("=====Cluster Connectivity Update Started=====");
    console.log(currentVersion);
    return {
      IsComplete: false,
    };
  }

}

async function updateCluster(currentVersion, event) {

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
