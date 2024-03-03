// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KafkaClient, 
  UpdateClusterConfigurationCommand, 
  DescribeClusterCommand, 
  DescribeConfigurationCommand } from "@aws-sdk/client-kafka";

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


  const inputConfiguration = { // DescribeConfigurationRequest
    Arn: process.env.MSK_CONFIGURATION_ARN, // required
  };

  commandKafka = new DescribeConfigurationCommand(inputConfiguration);
  
  responseKafka = await clientKafka.send(commandKafka);

  const latestRevision = responseKafka.LatestRevision.Revision;

  const input = { // UpdateClusterConfigurationRequest
    ClusterArn: process.env.MSK_CLUSTER_ARN, // required
    ConfigurationInfo: { // ConfigurationInfo
      Arn: process.env.MSK_CONFIGURATION_ARN, // required
      Revision: latestRevision // required
    },
    CurrentVersion: currentVersion // required
  };

  console.log(input);
  commandKafka = new UpdateClusterConfigurationCommand(input);
  responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);

}