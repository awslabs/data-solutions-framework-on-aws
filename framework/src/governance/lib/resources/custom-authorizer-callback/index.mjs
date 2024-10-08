// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand} from '@aws-sdk/client-sfn';


export const handler = async(event) => {
  
  console.log(JSON.stringify({ event }, null, 2));
  
  const status = event.detail.Status;
  const client = new SFNClient();
  const taskToken = event.detail.TaskToken;
  
  if (status === 'success') {
    const taskSuccessResponse = await client.send(new SendTaskSuccessCommand({
      taskToken,
      output: JSON.stringify({ Status: 'success' }),
    }));

    console.log(JSON.stringify({ taskSuccessResponse }, null, 2));

  } else if (status === 'failure') { 

    const taskFailureResponse = await client.send(new SendTaskFailureCommand({
      taskToken,
      cause: `${event.detail.Error}: ${event.detail.Cause}`,
      error: 'grant failed',
    }));

    console.log(JSON.stringify({ taskFailureResponse }, null, 2));
  }  
  return {}
}