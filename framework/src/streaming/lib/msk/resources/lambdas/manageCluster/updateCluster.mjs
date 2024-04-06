import _ from 'lodash';
import {
    DescribeClusterCommand,
    UpdateSecurityCommand,
  } from "@aws-sdk/client-kafka"; 

function compareOldNewObject (oldObject, newObject, attribute) {
    // Check if ClientAuthentication properties exist in both objects
    if (
        _.get(oldObject, attribute) &&
        _.get(newObject, attribute)
    ) {
        
        // Compare ClientAuthentication properties
        const oldClientAuth = _.get(oldObject, attribute);
        const newClientAuth = _.get(newObject, attribute);

        // Check if there were any changes to ClientAuthentication
        const clientAuthChanged = _.isEqual(oldClientAuth, newClientAuth);

        // If there were changes, return the ClientAuthentication of the new object
        if (!clientAuthChanged) {
            console.log(`Change detected in ${attribute}`);
            return newClientAuth;
        }
    }

    // Return null if no changes or if ClientAuthentication properties don't exist in both objects
    return null;
};

async function describeCluster (clientKafka, clusterArn) {
    console.log('getCurrentVersion');

    const input = {
        ClusterArn: clusterArn,
    };

    const command = new DescribeClusterCommand(input);
    const response = await clientKafka.send(command);

    console.log(response);

    return response;
}

export async function onUpdate (clientKafka, event) {

    let result = compareOldNewObject(event.OldResourceProperties, event.ResourceProperties, 'clientAuthentication');

    console.log('=====result======');
    console.log(result);

    let response;

    if (result) {

        let clusterDescribeResponse = await describeCluster(clientKafka, event.PhysicalResourceId);

        let currentVersion = clusterDescribeResponse.ClusterInfo.CurrentVersion;

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
            ClusterArn: event.PhysicalResourceId, // required
            CurrentVersion: currentVersion, // required
          };
          
          const command = new UpdateSecurityCommand(input);

          console.log(JSON.stringify(input, null, 2));
          response = await clientKafka.send(command);
    }

    return response;
    
}