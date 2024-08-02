import { DataZoneClient, CreateFormTypeCommand, CreateAssetTypeCommand, DeleteAssetTypeCommand, DeleteFormTypeCommand } from "@aws-sdk/client-datazone";

export const handler = async(event) => {
    const client = new DataZoneClient()
    const properties = event["ResourceProperties"]
    const domainId = properties["domainId"]
    const projectId = properties["projectId"]
    const formTypes = properties["formTypes"]
    if (event["RequestType"] === "Create") {
        const formsInput = {}
        for (let formType of formTypes) {
            const crFormTypeResp = await client.send(new CreateFormTypeCommand({
                domainIdentifier: domainId,
                name: formType.name,
                model: {
                    smithy: formType.model
                },
                owningProjectIdentifier: projectId,
                status: "ENABLED"
            }))

            const {revision} = crFormTypeResp
            formsInput[formType.name] = {
                typeIdentifier: formType.name,
                typeRevision: revision,
                required: formType.required
            }
        }

        const crAssetTypeResp = await client.send(new CreateAssetTypeCommand({
            domainIdentifier: domainId,
            name: properties["assetTypeName"],
            description: properties["assetTypeDescription"],
            formsInput,
            owningProjectIdentifier: projectId
        }))

        return {
            "Data": crAssetTypeResp
        }
    } else if (event["RequestType"] === "Delete") {
        for (let formType of formTypes) {
            await client.send(new DeleteFormTypeCommand({
                domainIdentifier: domainId,
                formTypeIdentifier: formType.name
            }))
        }

        await client.send(new DeleteAssetTypeCommand({
            domainIdentifier: domainId,
            identifier: properties["assetTypeName"]
        }))



        return 
    }
}