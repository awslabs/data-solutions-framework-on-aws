//Create a lambda function that will trigger the creation of table statistics at the level of a glue database
//Use AWS SDK V3 for Javascript
//Use ECMAsript module syntax

//Import the required AWS SDK clients and commands for Node.js

import { GlueClient, StartColumnStatisticsTaskRunCommand } from '@aws-sdk/client-glue';

//lambda handler

export const handler = async (event) => {
    
    const glueClient = new GlueClient();

    const tables = event.tables;
    
    //Loop over tables and trigger the columns statistics
    for (const table of tables) {

        //set the parameters
        const params = {
            DatabaseName: event.databaseName,
            TableName: table
        };

        try {
            //Send the request to start the column statistics task run
            const data = await glueClient.send(new StartColumnStatisticsTaskRunCommand(params));
            console.log("Success", data);
        } catch (err) {
            console.log("Error", err);
        }
    }
};