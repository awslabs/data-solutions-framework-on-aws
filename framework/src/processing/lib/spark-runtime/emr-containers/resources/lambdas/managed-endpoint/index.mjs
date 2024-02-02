import { 
  EMRContainersClient, 
  CreateManagedEndpointCommand, 
  DescribeManagedEndpointCommand,
  DeleteManagedEndpointCommand } from "@aws-sdk/client-emr-containers";

const region = 'eu-west-1';

const client = new EMRContainersClient( { region });

// Handler functions
export const onEventHandler =  async (event) => {

  console.info('======Recieved for Event=======');
  console.info(event);

  let physicalResourceId

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      console.info(event.RequestType);
      physicalResourceId = (await onCreate(event)).PhysicalResourceId;

      console.info( {
        PhysicalResourceId : physicalResourceId,
      });

      return {
        PhysicalResourceId : physicalResourceId,
      };

    case 'Delete':
      console.info(event.RequestType);
      physicalResourceId =  (await onDelete(event)).PhysicalResourceId;
      return { 
        PhysicalResourceId : physicalResourceId,
      };

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
    executionRoleArn: event.ResourceProperties.executionRoleArn,
    tags: {
      'data-solutions-fwk:owned' : 'true'
    }
  });

  let response = await client.send(command);

  console.info(response);

  console.info(response.id);

  const physicalResourceId = response.id

  return { 
    PhysicalResourceId : physicalResourceId,
  };

}

const onDelete = async (event) => {

  console.info('======Recieved for delete=======');
  console.info(event);

  const command = new DeleteManagedEndpointCommand({
    virtualClusterId: event.ResourceProperties.clusterId,
    id: event.PhysicalResourceId
  });
  
  let response = await client.send(command);

  console.info(response);
  console.info(response.id);

  return {
    PhysicalResourceId: event.PhysicalResourceId,
  };

}

export const isCompleteHandler = async (event) => {
  console.info('isCompleteHandler Invocation');
  console.info(event);

  let requestType = event.RequestType.toLowerCase();

  if(requestType === 'delete') {
    requestType = '_DELETE';
  } else {
    requestType = '_CREATEUPDATE';
  }

  console.info(requestType);

  const endpointId = event.PhysicalResourceId;

  const command = new DescribeManagedEndpointCommand({
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
      securityGroup : response.endpoint.securityGroup,
      id: response.endpoint.id,
      arn: response.endpoint.arn
    };

    console.info({ IsComplete: true, Data: data });
    return { IsComplete : true, Data: data };
  } else if(state === 'TERMINATED_DELETE') {
    return { IsComplete: true };
  } else if(state === 'TERMINATED_CREATEUPDATE' || state === 'TERMINATED_WITH_ERRORS_CREATEUPDATE' || state === 'TERMINATED_WITH_ERRORS_DELETE' || state === 'TERMINATING_CREATEUPDATE') {
    throw new Error('managed endpoint failed.');
  } else {
    return { IsComplete: false };
  }
}
