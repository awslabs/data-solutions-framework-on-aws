// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  KafkaClient,
  CreateClusterV2Command,
  DescribeClusterCommand,
  DeleteClusterCommand
} from "@aws-sdk/client-kafka";


const clientKafka = new KafkaClient();


// Handler functions
export const onEventHandler = async (event) => {

  console.info('======Recieved for Event=======');
  console.info(event);

  switch (event.RequestType) {
    case 'Create':
      console.log(JSON.stringify(event, null, 2));
      console.log(JSON.stringify(event.ResourceProperties, null, 2));
      let result = await onCreate(event);
      return {
        PhysicalResourceId: result.ClusterArn,
      };
    case 'Update':

    case 'Delete':

      const inputKafka = {
        ClusterArn: event.PhysicalResourceId,
      };


      let commandKafka = new DescribeClusterCommand(inputKafka);
      let responseKafka = await clientKafka.send(commandKafka);

      const input = { // DeleteClusterRequest
        ClusterArn: event.PhysicalResourceId, // required
        CurrentVersion: responseKafka.ClusterInfo.CurrentVersion,
      };
      const command = new DeleteClusterCommand(input);
      const response = await clientKafka.send(command);
      console.log(response);

      return {
        PhysicalResourceId: response.ClusterArn,
      }



    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}

// Handler functions
const onCreate = async (event) => {

  const input = {
    ClusterName: event.ResourceProperties.clusterName,
    Provisioned: {
      BrokerNodeGroupInfo: {
        SecurityGroups: event.ResourceProperties.brokerNodeGroupInfo.SecurityGroups,
        ClientSubnets: event.ResourceProperties.brokerNodeGroupInfo.ClientSubnets,
        StorageInfo: {
          EbsStorageInfo: {
            VolumeSize: Number(event.ResourceProperties.brokerNodeGroupInfo.StorageInfo.EbsStorageInfo.VolumeSize)
          }
        },
        BrokerAZDistribution: "DEFAULT",
        InstanceType: event.ResourceProperties.brokerNodeGroupInfo.InstanceType,
      },
      ClientAuthentication: {
        Sasl: {
          Iam: {
            Enabled: event.ResourceProperties.clientAuthentication.Sasl.Iam.Enabled == "true" ? true : false,
          },
          Scram: {
            Enabled: event.ResourceProperties.clientAuthentication.Sasl.Scram.Enabled == "true" ? true : false,
          }
        },
        Tls: {
          CertificateAuthorityArnList: event.ResourceProperties.clientAuthentication.Tls.CertificateAuthorityArnList,
          Enabled: event.ResourceProperties.clientAuthentication.Tls.Enabled == "true" ? true : false,
        }
      },
      EncryptionInfo: {
        EncryptionAtRest: {
          DataVolumeKMSKeyId: event.ResourceProperties.encryptionInfo.EncryptionAtRest.DataVolumeKmsKeyId,
        },
        EncryptionInTransit: {
          ClientBroker: "TLS",
          InCluster: true
        }
      },
      EnhancedMonitoring: event.ResourceProperties.enhancedMonitoring,
      OpenMonitoring: {
        Prometheus: {
          JmxExporter: {
            EnabledInBroker: event.ResourceProperties.openMonitoring.Prometheus.JmxExporter.EnabledInBroker == "true" ? true : false,
          },
          NodeExporter: {
            EnabledInBroker: event.ResourceProperties.openMonitoring.Prometheus.NodeExporter.EnabledInBroker == "true" ? true : false,
          }
        }
      },
      KafkaVersion: event.ResourceProperties.kafkaVersion,
      LoggingInfo: {
        BrokerLogs: {
          S3: {
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.S3.Enabled == "true" ? true : false,
          },
          Firehose: {
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.Firehose.Enabled == "true" ? true : false,
          },
          CloudWatchLogs: {
            LogGroup: event.ResourceProperties.loggingInfo.BrokerLogs.CloudWatchLogs.LogGroup,
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.CloudWatchLogs.Enabled == "true" ? true : false,
          }
        }
      },
      NumberOfBrokerNodes: Number(event.ResourceProperties.numberOfBrokerNodes),
      StorageMode: event.ResourceProperties.storageMode,
    }
  };

  console.log(input);
  console.log(JSON.stringify(input, null, 2));
  const commandKafka = new CreateClusterV2Command(input);
  const responseKafka = await clientKafka.send(commandKafka);

  console.log(responseKafka);

  return responseKafka;
}

export const isCompleteHandler = async (event) => {
  console.info('isCompleteHandler Invocation');
  console.info(event);

  const inputKafka = {
    ClusterArn: event.PhysicalResourceId,
  };

  try {

    let commandKafka = new DescribeClusterCommand(inputKafka);
    let responseKafka = await clientKafka.send(commandKafka);

    if (responseKafka.ClusterInfo.State == "ACTIVE") {
      return {
        IsComplete: true,
        Data: {
          Arn: responseKafka.ClusterInfo.ClusterArn,
          ClusterName: responseKafka.ClusterInfo.ClusterName,
        }
      }
    } else if (responseKafka.ClusterInfo.State == "FAILED") {
      throw new Error("Cluster in failed state");
    } else {
      return {
        IsComplete: false,
      }
    }

  } catch (err) {
    console.log(err);
    if (err.name === "NotFoundException") {
      return {
        IsComplete: true,
      }
    }
    else {
      throw new Error(`Error ${err}`);
    }
  }

}
