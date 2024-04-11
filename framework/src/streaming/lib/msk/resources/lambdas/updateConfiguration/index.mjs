// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KafkaClient, 
  UpdateClusterConfigurationCommand, 
  DescribeClusterCommand, 
  DescribeConfigurationCommand } from "@aws-sdk/client-kafka";

const clientKafka = new KafkaClient();


  // Handler functions
export const onEventHandler = async (event) => {

  console.info('======Recieved for Event=======');
  console.info(event);

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      await onCreate(event);
      break;

    case 'Delete':
      return {
        IsComplete: true
      };

    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}



// Handler functions
export const onCreate = async (event) => {

  console.log(event);

  const inputKafka = {
    ClusterArn: event.ResourceProperties.MskClusterArn,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);

  const currentVersion = responseKafka.ClusterInfo.CurrentVersion;

  const inputConfiguration = { // DescribeConfigurationRequest
    Arn: event.ResourceProperties.MskConfigurationArn, // required
  };

  commandKafka = new DescribeConfigurationCommand(inputConfiguration);


  const input = { // UpdateClusterConfigurationRequest
    ClusterArn: event.ResourceProperties.MskClusterArn, // required
    ConfigurationInfo: { // ConfigurationInfo
      Arn: event.ResourceProperties.MskConfigurationArn, // required
      Revision: Number(event.ResourceProperties.MskConfigurationRevision) // required
    },
    CurrentVersion: currentVersion // required
  };

  console.log(input);
  commandKafka = new UpdateClusterConfigurationCommand(input);
  responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);

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
    ClusterArn: event.ResourceProperties.MskClusterArn,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);
  console.log(responseKafka.ClusterInfo.CurrentVersion);

  if(responseKafka.ClusterInfo.State == "UPDATING" ) {
    return {
      IsComplete: false,
    };
  } if(responseKafka.ClusterInfo.State == "ACTIVE" ) {
    return {
      IsComplete: true,
    };
  } else if (responseKafka.ClusterInfo.State == "FAILED") {
    throw new Error("Cluster is in FAIL state");
  } else {
    return {
      IsComplete: false,
    };
  }

}