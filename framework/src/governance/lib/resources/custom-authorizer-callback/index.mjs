import StepFunctions from 'aws-sdk/clients/stepfunctions';

export const handler = async(event) => {
  
  console.log(JSON.stringify({ event }, null, 2));
  
  const status = event.status;
  const stepFunctions = new StepFunctions();
  const taskToken = event.taskToken;
  
  if (status === 'succeed') {
    const taskSuccessResponse = await stepFunctions
    .sendTaskSuccess({
      taskToken,
      output: JSON.stringify(valuationResponse),
    })
    .promise();
    console.log(JSON.stringify({ taskSuccessResponse }, null, 2));

  } else if (status === 'fail') {

    const taskFailureResponse = await stepFunctions
    .sendTaskFailure({
      taskToken,
      cause: `${event.error}: ${event.cause}`,
      error: 'grant failed',
    })
    .promise();
    console.log(JSON.stringify({ taskFailureResponse }, null, 2));
  }  
  return {}
}