import { CodeBuildClient, StartBuildCommand, BatchGetBuildsCommand } from "@aws-sdk/client-codebuild"

const client = new CodeBuildClient()

export const onEventHandler = async(event) => {
    const requestType = event['RequestType']

    if (requestType === 'Create' || requestType === 'Update') {
        const projectName = event["ResourceProperties"]["projectName"]
        const startBuildResp = await client.send(new StartBuildCommand({projectName}))
    
        return {
            "Data": {
                "buildId": startBuildResp.build.id
            }
        }
    } else {
        return {}
    }
}

export const isCompleteHandler = async(event) => {
    const requestType = event['RequestType']

    if (requestType === "Delete") {
        return {
            "IsComplete": true
        }
    }

    const buildId = event["Data"]["buildId"]

    const resp = await client.send(new BatchGetBuildsCommand({ids: [buildId]}))
    const builds = resp.builds

    let isComplete = false

    if (builds && builds.length > 0) {
        const build = builds[0]
        const {buildStatus} = build

        if (buildStatus === "SUCCEEDED" || buildStatus === "STOPPED") {
            isComplete = true
        } else if (buildStatus === "FAILED" || buildStatus === "FAULT" || buildStatus === "TIMED_OUT") {
            const phases = build.phases

            for (let phase of phases) {
                if (phase.phaseStatus === buildStatus) {
                    throw new Error(phase.context[0].message)
                }
            }
        }
    } else {
        throw new Error(`Build with ID (${buildId}) not found`)
    }

    return {
        "IsComplete": isComplete,
        buildId
    }
}