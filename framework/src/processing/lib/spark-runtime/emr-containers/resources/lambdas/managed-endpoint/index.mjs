import { 
  EMRContainersClient, 
  CreateManagedEndpointCommand, 
  DescribeJobRunCommand,
  DeleteManagedEndpointCommand } from "@aws-sdk/client-emr-containers";


const client = new EMRContainersClient()

// Handler functions
exports.handler = async (event) => {

  console.info(event);

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      await onCreate(event);
      break;
    case 'Delete':
      await onDelete(event);
      break;
    default:
      throw new Error(`invalid request type: ${event.RequestType}`);
  }
}

const onCreate = async (event) => {

  const command = new CreateManagedEndpointCommand({
    name: event.ResourceProperties.endpointName,    
    virtualClusterId: event.ResourceProperties.clusterId,
    type: 'JUPYTER_ENTERPRISE_GATEWAY',
    releaseLabel: event.ResourceProperties.releaseLabel, 
    executionRoleArn: event.ResourceProperties.roleArn,
    tags: {
      'data-solutions-fwk:owned' : 'true'
    }
  });


  let response = await client.send(command);

  console.info(response);

  return { 
    PhysicalResourceId: response.id
  };

}

const onDelete = async (event) => {

  const command = new DeleteManagedEndpointCommand({
    virtualClusterId: event.ResourceProperties.clusterId,
    id: event.PhysicalResourceId
  });
  
  let response = await client.send(command);

  console.info(response);

  return {
    PhysicalResourceId: response.id
  };

}

exports.isComplete = async (event) => {
  console.info(event);

  let requestType = event.RequestType.toLowerCase();

  if(requestType === 'delete') {
    requestType = '_DELETE';
  } else {
    requestType = '_CREATEUPDATE';
  }

  console.info(requestType);

  const endpointId = event.PhysicalResourceId;

  const command = new DescribeJobRunCommand({
    id: endpointId,
    virtualClusterId: event.ResourceProperties.clusterId
  });

  const response = await client.send(command);

  console.info(response);
  console.info(response.endpoint);

  if(!response.endpoint) {
    return { IsComplete: false };
  }

  console.info(`current endpoint ${endpointId}`);

  let state = response.endpoint.state + requestType;

  console.info(state);

  response.endpoint.createdAt = '';

  console.info(response.endpoint.createdAt);

  if(state === 'ACTIVE_CREATEUPDATE') {
    const data = {
      securityGroup: response.endpoint.securityGroup,
      id: response.endpoint.id,
      arn: response.endpoint.arn
    };

    console.info({ IsComplete: true, Data: data });
    return { IsComplete: true, Data: data };
  } else if(state === 'TERMINATED_DELETE') {
    return { IsComplete: true };
  } else if(state === 'TERMINATED_CREATEUPDATE' || state === 'TERMINATED_WITH_ERRORS_CREATEUPDATE' || state === 'TERMINATED_WITH_ERRORS_DELETE' || state === 'TERMINATING_CREATEUPDATE') {
    throw new Error('managed endpoint failed.');
  } else {
    return { IsComplete: false };
  }
}
