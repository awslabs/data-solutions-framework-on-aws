// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KafkaClient, DescribeClusterCommand } from "@aws-sdk/client-kafka";
import { promises } from "dns";
import { EC2Client, DescribeNetworkInterfacesCommand, ModifyNetworkInterfaceAttributeCommand } from "@aws-sdk/client-ec2";

// Handler functions
export const onEventHandler = async (event) => {

    console.log(event);

    const clientKafka = new KafkaClient();
    const inputKafka = {
        ClusterArn: process.env.MSK_CLUSTER_ARN,
    };

    const commandKafka = new DescribeClusterCommand(inputKafka);
    const responseKafka = await clientKafka.send(commandKafka);

    console.log(responseKafka);

    const brokerUrls = responseKafka.ClusterInfo.ZookeeperConnectStringTls.split(',');

    console.log(brokerUrls);


    let listIps = [];

    for (const brokerUrl of brokerUrls) {
        let address = await promises.lookup(brokerUrl.split(':')[0]);
        listIps.push(address.address);
    }

    console.log(listIps);

    let eniIds = [];

    const clientEc2 = new EC2Client();
    const inputEc2 = { // DescribeNetworkInterfacesRequest
        Filters: [ // FilterList
            { // Filter
                Name: "private-ip-address",
                Values: listIps,
            },
            {
                Name: "vpc-id",
                Values: [process.env.VPC_ID],
            }
        ],
    };


    const commandEc2 = new DescribeNetworkInterfacesCommand(inputEc2);
    const responseEni = await clientEc2.send(commandEc2);

    responseEni['NetworkInterfaces'].forEach(eni => {
        eniIds.push(eni.NetworkInterfaceId);

    });

    console.log(eniIds);

    for (let eniId of eniIds) {

        let input = { // ModifyNetworkInterfaceAttributeRequest
            Groups: [ // SecurityGroupIdStringList
                process.env.SECURITY_GROUP_ID,
            ],
            NetworkInterfaceId: eniId, // required
        };

        let command = new ModifyNetworkInterfaceAttributeCommand(input);

        let responseEni = await clientEc2.send(command);

        console.log(responseEni);
    }

}