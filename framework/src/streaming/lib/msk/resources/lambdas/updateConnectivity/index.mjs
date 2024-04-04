// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  UpdateConnectivityCommand,
  DescribeClusterCommand
} from "@aws-sdk/client-kafka";

// Handler functions
export const onEventHandler = async (event) => {

  console.log(event);

  const clientKafka = new KafkaClient();

  const inputKafka = {
    ClusterArn: process.env.MSK_CLUSTER_ARN,
  };

  let commandKafka = new DescribeClusterCommand(inputKafka);
  let responseKafka = await clientKafka.send(commandKafka);

  const currentVersion = responseKafka.ClusterInfo.CurrentVersion;

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
  commandKafka = new UpdateClusterConfigurationCommand(input);
  responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);

}