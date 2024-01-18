const aws = require('aws-sdk');
const emrcontainers = new aws.EMRContainers({region: process.env.AWS_REGION});
const log = console;

// Handler functions
exports.handler = async (event) => {
  log.info(event);
  
  let requestType = event.RequestType.toLowerCase();
  
  if(requestType === 'create') {
    return onCreate(event);
  } else if(requestType === 'update') {
    return onUpdate(event);  
  } else if(requestType === 'delete') {
    return onDelete(event);
  } else {
    throw new Error(`Invalid request type: ${requestType}`);  
  }
}

const onCreate = async (event) => {

  let response = await emrcontainers.createManagedEndpoint({
    name: event.ResourceProperties.endpointName,    
    virtualClusterId: event.ResourceProperties.clusterId,
    //Will need to add more parameters here
  }).promise();

  log.info(response);

  return { 
    PhysicalResourceId: response.id
  };

}

const onUpdate = async (event) => {
  return onCreate(event);
}

const onDelete = async (event) => {
  
  let response = await emrcontainers.deleteManagedEndpoint({
    virtualClusterId: event.ResourceProperties.clusterId,
    id: event.PhysicalResourceId    
  }).promise();

  log.info(response);

  return {
    PhysicalResourceId: response.id
  };

}