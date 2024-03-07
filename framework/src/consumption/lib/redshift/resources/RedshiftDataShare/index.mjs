// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {RedshiftDataClient, BatchExecuteStatementCommand, DescribeStatementCommand, GetStatementResultCommand} from "@aws-sdk/client-redshift-data"
import { randomBytes } from "crypto"

const targetType = process.env.TARGET_TYPE
const targetArn = process.env.TARGET_ARN
const targetId = process.env.TARGET_ID
const secretName = process.env.SECRET_NAME
const region = process.env.REGION
const client = new RedshiftDataClient()

const onCreateHandler = async(event) => {
    const resourceProperties = event["ResourceProperties"]
    const {dataShareName, schema, tables} = resourceProperties
    const statements = [
        `CREATE DATASHARE ${dataShareName}`,
        `ALTER DATASHARE ${dataShareName} ADD SCHEMA ${schema}`
    ]

    for (let table of tables) {
        statements.push(`ALTER DATASHARE ${dataShareName} ADD TABLE ${table}`)
    }

    return statements
}

const onUpdateHandler = async(event) => {
    const resourceProperties = event["ResourceProperties"]
    const oldResourceProperties = event["OldResourceProperties"]
    const {dataShareName, schema, tables} = resourceProperties

    const oldDataShareName = oldResourceProperties["dataShareName"]
    const oldSchema = oldResourceProperties["schema"]
    const oldTables = oldResourceProperties["tables"]

    let statements = []

    //drop and recreate datashare with the new name
    if (dataShareName != oldDataShareName) {
        statements.push(`DROP DATASHARE ${oldDataShareName}`)
        const newDataShare = await onCreateHandler(event)
        statements.concat(newDataShare)
    } else if (schema != oldSchema) {
        //need to remove the old schema/tables then add the new ones
        for (let table of oldTables) {
            statements.push(`ALTER DATASHARE ${dataShareName} REMOVE TABLE ${table}`)
        }

        statements.push(`ALTER DATASHARE ${dataShareName} REMOVE SCHEMA ${oldSchema}`)

        statements.push(`ALTER DATASHARE ${dataShareName} ADD SCHEMA ${schema}`)

        for (let table of tables) {
            statements.push(`ALTER DATASHARE ${dataShareName} ADD TABLE ${table}`)
        }
    } else {
        //check if there are any differences in the list of tables
        const tablesToAdd = tables.filter((newTable) => !oldTables.includes(newTable))
        const tablesToRemove = oldTables.filter((oldTable) => !tables.includes(oldTable))

        if (tablesToRemove.length > 0) {
            for (let tableToRemove of tablesToRemove) {
                statements.push(`ALTER DATASHARE ${dataShareName} REMOVE TABLE ${tableToRemove}`)
            }
        }

        if (tablesToAdd.length > 0) {
            for (let tableToAdd of tablesToAdd) {
                statements.push(`ALTER DATASHARE ${dataShareName} ADD TABLE ${tableToAdd}`)
            }
        }
    }

    return statements
}

const onDeleteHandler = async(event) => {
    const resourceProperties = event["ResourceProperties"]
    const {dataShareName} = resourceProperties

    const statements = [
        `DROP DATASHARE ${dataShareName}`
    ]

    return statements
}

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

    const requestType = event["RequestType"]
    let statements = []
    let retrieveNamespace = false
    if (requestType === "Create") {
        statements = await onCreateHandler(event)
    } else if (requestType === "Update") {
        statements = await onUpdateHandler(event)
    } else if (requestType === "Delete") {
        statements = await onDeleteHandler(event)
    }

    if (requestType === "Create" || requestType === "Update") {
        statements.push(`SHOW DATASHARES LIKE '${event["ResourceProperties"]['dataShareName']}'`)
        retrieveNamespace = true
    }

    let execId = null
    let statementSize = 0
    if (statements && statements.length > 0) {
        execInput['ClientToken'] = `${requestType}-${randomBytes(12).toString('hex')}`
        execInput['Sqls'] = statements
    
        const execResp = await client.send(new BatchExecuteStatementCommand(execInput))

        execId = execResp.Id
        statementSize = statements.length
    }

    return {
        "Data": {
            execId,
            statementSize,
            retrieveNamespace
        }
    }
}

export const isCompleteHandler = async(event) => {
    let isComplete = false
    let execId = null
    const data = {}
    const resp = {}
    if (event["Data"] && event["Data"]["execId"]) {
        execId = event["Data"]["execId"]

        const resp = await client.send(new DescribeStatementCommand({Id: execId}))
        const status = resp.Status
    
        if (status === "FAILED") {
            throw new Error(resp.Error)
        } else if (status === "ABORTED") {
            throw new Error(`Query aborted: ${execId}`)
        }
    
        isComplete = (status === "FINISHED")

        if (isComplete && event["Data"]["retrieveNamespace"]) {
            const dataShareResp = await client.send(new GetStatementResultCommand({
                Id: `${execId}:${event['Data']['statementSize']}`
            }))

            const dataShareRow = dataShareResp.Records[0]
            const dataShareAccount = dataShareRow[dataShareRow.length - 2]['stringValue']
            const dataShareNamespace = dataShareRow[dataShareRow.length - 1]['stringValue']

            data['dataShareNamespace'] = dataShareNamespace
            data['dataShareArn'] = `arn:aws:redshift:${region}:${dataShareAccount}:datashare:${dataShareNamespace}/${event["ResourceProperties"]['dataShareName']}`
            data['producerArn'] = `arn:aws:redshift-serverless:${region}:${dataShareAccount}:namespace/${dataShareNamespace}`
        }
    } else {
        isComplete = true
    }

    resp["IsComplete"] = isComplete

    if (isComplete) {
        resp["Data"] = data
    }

    return resp
}