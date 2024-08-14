import { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand} from '@aws-sdk/client-sfn';

export const handler = async(event) => {
  
  console.log(JSON.stringify({ event }, null, 2));
  
  const status = event.Status;
  const client = new SFNClient();
  const taskToken = event.TaskToken;
  
  if (status === 'success') {
    const taskSuccessResponse = await client.send(new SendTaskSuccessCommand({
      taskToken,
      output: JSON.stringify({ Status: 'success' }),
    }));

    console.log(JSON.stringify({ taskSuccessResponse }, null, 2));

  } else if (status === 'failure') { 

    const taskFailureResponse = await client.send(SendTaskFailureCommand({
      taskToken,
      cause: `${event.Error}: ${event.Cause}`,
      error: 'grant failed',
    }));

    console.log(JSON.stringify({ taskFailureResponse }, null, 2));
  }  
  return {}
}