import {RedshiftDataClient, ExecuteStatementCommand, DescribeStatementCommand} from "@aws-sdk/client-redshift-data"

const targetType = process.env.TARGET_TYPE
const targetArn = process.env.TARGET_ARN
const targetId = process.env.TARGET_ID
const secretName = process.env.SECRET_NAME
const client = new RedshiftDataClient()

export const onEventHandler = async(event) => {
    const databaseName = event["ResourceProperties"]["databaseName"]
    const execInput = {
        SecretArn: secretName,
        Database: databaseName
    }

    if (targetType === "provisioned") {
        execInput["ClusterIdentifier"] = targetId
    } else if (targetType == "serverless") {
        execInput["WorkgroupName"] = targetArn
    }

    if (event["RequestType"] === "Create" || event["RequestType"] === "Update") {
        const sql = event["ResourceProperties"]["sql"]

        if (!sql) {
            throw new Error("Missing required parameters")
        } else {
            execInput["Sql"] = sql
        }
    } else if (event["RequestType"] === "Delete") {
        const sql = event["ResourceProperties"]["deleteSql"]

        if (sql) {
            execInput["Sql"] = sql
        } else {
            return {}
        }
    }

    const execResult = await client.send(new ExecuteStatementCommand(execInput))

    return {
        "Data": {
            "execId": execResult.Id
        }
    }
}

export const isCompleteHandler = async(event) => {
    let isComplete = false
    let execId = null
    
    if (event["Data"] && event["Data"]["execId"] && event["RequestType"] !== "Delete") {
        execId = event["Data"]["execId"]

        const resp = await client.send(new DescribeStatementCommand({Id: execId}))
        const status = resp.Status
    
        if (status === "FAILED") {
            throw new Error(resp.Error)
        }
    
        isComplete = (status === "FINISHED")
    } else {
        isComplete = true
    }

    return {
        "IsComplete": isComplete,
        execId
    }
}