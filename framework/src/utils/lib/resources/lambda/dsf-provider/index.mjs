// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EC2Client, DescribeNetworkInterfacesCommand, DeleteNetworkInterfaceCommand } from "@aws-sdk/client-ec2";
import path from "node:path"

export const handler = async(event) => {
  if (event.RequestType == "Delete") {
    const securityGroups = process.env.SECURITY_GROUPS.split(",")
    console.log(securityGroups)
    const subnets = process.env.SUBNETS.split(",")
    console.log(subnets)
    
    const client = new EC2Client()
    
    const list = await client.send(new DescribeNetworkInterfacesCommand({
      Filters: [
        {
          Name: 'group-id',
          Values: securityGroups,
        },
        {
          Name: 'subnet-id',
          Values: subnets,
        },
        {
          Name: 'interface-type',
          Values: ['lambda']
        }
      ]
    }))
    
    console.log(`List of ENIs to delete: ${list}`)
    
    const collectedPromises = []
      
    for(const eni of list.NetworkInterfaces) {
      const eniId = path.basename(eni.NetworkInterfaceId)
      
      console.log(`deleting ENI: ${eniId}`)
      collectedPromises.push(
        client.send(new DeleteNetworkInterfaceCommand({
          NetworkInterfaceId: eniId,
        })).catch(
          err => {
            if (err.name === 'InvalidNetworkInterfaceID.NotFound') {
              console.log(`ENI ${eni.NetworkInterfaceId} not found, skipping delete`);
            } else {
              throw err;
            }
          }
        )
      )
    }
    await Promise.all(collectedPromises)
    console.log("Cleanup done")
  }
  return {}
}