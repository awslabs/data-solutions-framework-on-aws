import _, { result } from 'lodash';
import {
  DescribeClusterCommand,
  UpdateSecurityCommand,
  UpdateBrokerCountCommand,
  UpdateBrokerTypeCommand,
  UpdateMonitoringCommand,
  UpdateStorageCommand
} from "@aws-sdk/client-kafka";

function compareOldNewObject(oldObject, newObject, attribute) {

  if (
    _.get(oldObject, attribute) &&
    _.get(newObject, attribute)
  ) {

    // Compare ClientAuthentication properties
    const oldObjectAttribute = _.get(oldObject, attribute);
    const newObjectAttribute = _.get(newObject, attribute);

    // Check if there were any changes to ClientAuthentication
    const objectAttributeChanged = _.isEqual(oldObjectAttribute, newObjectAttribute);

    // If there were changes, return the ClientAuthentication of the new object
    if (!objectAttributeChanged) {
      console.log(`Change detected in ${attribute}`);
      return { attribute: attribute, newObjectAttribute: newObjectAttribute };
    }
  } else {
    console.log(`The attibute "${attribute}" is not in object`);
  }

  // Return null if no changes or if ClientAuthentication properties don't exist in both objects
  return null;
};

async function describeCluster(clientKafka, clusterArn) {
  console.log('getCurrentVersion');

  const input = {
    ClusterArn: clusterArn,
  };

  const command = new DescribeClusterCommand(input);
  const response = await clientKafka.send(command);

  console.log(response);

  return response;
}

async function getCurrentVersion(clientKafka, event) {
  let clusterDescribeResponse = await describeCluster(clientKafka, event.PhysicalResourceId);

  return clusterDescribeResponse.ClusterInfo.CurrentVersion;


}

export async function onUpdate(clientKafka, event) {

  const clusterAttributeList = [
    'clientAuthentication',
    'numberOfBrokerNodes',
    'storageMode',
    'brokerNodeGroupInfo.StorageInfo.EbsStorageInfo',
    'brokerNodeGroupInfo.InstanceType',
    'loggingInfo',
    'openMonitoring',
    'enhancedMonitoring'];

  // We need to find the attributes that were changed in the update
  let updatedAttributes = clusterAttributeList.map((clusterAttribute) => compareOldNewObject(event.OldResourceProperties, event.ResourceProperties, clusterAttribute));
  
  // We need to find how many attribute were changed
  // if its more than one change we need to fail
  // MSK does not support updating more than one attribute at a time
  const numberOfChanges = updatedAttributes.filter(updatedAttribute => typeof updatedAttribute === 'object' && updatedAttribute !== null).length;
  
  if (numberOfChanges == 0) {
    console.log('No change detected');
    return null;
  }
  else if (numberOfChanges > 1) {
    console.log('More than one change detected');
    return null;
  }

  // if only one attribute was changed, we need to find its index
  // the index is then used to select the attribute and access its values. 
  const indexObject = updatedAttributes.findIndex(updatedAttribute => typeof updatedAttribute === 'object' && updatedAttribute !== null);

  console.log(updatedAttributes);

  console.log(indexObject);

  console.log(updatedAttributes[indexObject]);
  console.log(updatedAttributes[indexObject].attribute);
  console.log(updatedAttributes[indexObject].newObjectAttribute);

  const currentVersion = await getCurrentVersion(clientKafka, event);
  const clusterArn = event.PhysicalResourceId;

  //We need to use attribute to call the MSK API responsible for applying the changes
  if (updatedAttributes[indexObject].attribute == 'clientAuthentication') {

    let result = updatedAttributes[indexObject].newObjectAttribute;

    const input = { // UpdateSecurityRequest
      ClientAuthentication: {
        Sasl: {
          Iam: {
            Enabled: result.Sasl?.Iam?.Enabled == "true" ? true : false,
          },
          Scram: {
            Enabled: result.Sasl?.Scram?.Enabled == "true" ? true : false,
          }
        },
        Tls: {
          CertificateAuthorityArnList: result.Tls.CertificateAuthorityArnList,
          Enabled: result.Tls?.Enabled == "true" ? true : false,
        }
      },
      ClusterArn: clusterArn, // required
      CurrentVersion: currentVersion, // required
    };

    const command = new UpdateSecurityCommand(input);

    console.log(JSON.stringify(input, null, 2));
    response = await clientKafka.send(command);

  } else if (updatedAttributes[indexObject].attribute == 'numberOfBrokerNodes') {

    const targetNumberOfBrokerNodes = parseInt(updatedAttributes[indexObject].newObjectAttribute);

    const input = { // UpdateBrokerCountRequest
      ClusterArn: clusterArn, // required
      CurrentVersion: currentVersion, // required
      TargetNumberOfBrokerNodes: targetNumberOfBrokerNodes, // required
    };

    console.log(input);

    const command = new UpdateBrokerCountCommand(input);
    const response = await clientKafka.send(command);

    console.log(response);
  } else if (updatedAttributes[indexObject].attribute == 'brokerNodeGroupInfo.InstanceType') {

    let newObjectAttribute = updatedAttributes[indexObject].newObjectAttribute;

    const input = { // UpdateBrokerTypeRequest
      ClusterArn: clusterArn, // required
      CurrentVersion: currentVersion, // required
      TargetInstanceType: newObjectAttribute, // required
    };
    const command = new UpdateBrokerTypeCommand(input);
    const response = await clientKafka.send(command);

  } else if (
    updatedAttributes[indexObject].attribute == 'openMonitoring' ||
    updatedAttributes[indexObject].attribute == 'enhancedMonitoring' ||
    updatedAttributes[indexObject].attribute == 'loggingInfo') {

    const input = { // UpdateMonitoringRequest
      ClusterArn: clusterArn, // required
      CurrentVersion: currentVersion, // required
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
      LoggingInfo: {
        BrokerLogs: {
          S3: {
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.S3?.Enabled == "true" ? true : false,
            Bucket: event.ResourceProperties.loggingInfo.BrokerLogs.S3?.Bucket == undefined ? undefined : event.ResourceProperties.loggingInfo.BrokerLogs.S3.Bucket,
            Prefix: event.ResourceProperties.loggingInfo.BrokerLogs.S3?.Prefix == undefined ? undefined : event.ResourceProperties.loggingInfo.BrokerLogs.S3.Prefix,
          },
          Firehose: {
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.Firehose?.Enabled == "true" ? true : false,
            DeliveryStream: event.ResourceProperties.loggingInfo.BrokerLogs?.Firehose.DeliveryStream == undefined ? undefined : event.ResourceProperties.loggingInfo.BrokerLogs.Firehose.DeliveryStream,
          },
          CloudWatchLogs: {
            LogGroup: event.ResourceProperties.loggingInfo.BrokerLogs.CloudWatchLogs.LogGroup,
            Enabled: event.ResourceProperties.loggingInfo.BrokerLogs.CloudWatchLogs.Enabled == "true" ? true : false,
          }
        }
      },
    };
    const command = new UpdateMonitoringCommand(input);
    const response = await clientKafka.send(command);

  } else if ( 
    updatedAttributes[indexObject].attribute == 'storageMode') {

      const input = { // UpdateStorageRequest
        ClusterArn: clusterArn, // required
        CurrentVersion: currentVersion, // required
        StorageMode:  updatedAttributes[indexObject].newObjectAttribute //"LOCAL" || "TIERED",
      };
      const command = new UpdateStorageCommand(input);
      const response = await clientKafka.send(command);
    
  } else if ( updatedAttributes[indexObject].attribute == 'brokerNodeGroupInfo.StorageInfo.EbsStorageInfo') {
    const input = { // UpdateStorageRequest
      ClusterArn: clusterArn, // required
      CurrentVersion: currentVersion, // required
      VolumeSizeGB: parseInt(updatedAttributes[indexObject].newObjectAttribute.VolumeSize),
    };
    const command = new UpdateStorageCommand(input);
    const response = await clientKafka.send(command);
  }

}