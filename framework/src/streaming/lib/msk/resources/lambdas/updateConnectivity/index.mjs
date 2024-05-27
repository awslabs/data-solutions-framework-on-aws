// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  UpdateConnectivityCommand,
  DescribeClusterCommand,
} from "@aws-sdk/client-kafka";


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
        IsComplete: true,
      };

    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}

// Handler functions
const onCreate = async (event) => {

  const inputKafka = {
    ClusterArn: event.ResourceProperties.MskClusterArn,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);
  

  const input = { // UpdateClusterConfigurationRequest
    ClusterArn: event.ResourceProperties.MskClusterArn, // required
    CurrentVersion: responseKafka.ClusterInfo.CurrentVersion, // required
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
  commandKafka = new UpdateConnectivityCommand(input);
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
