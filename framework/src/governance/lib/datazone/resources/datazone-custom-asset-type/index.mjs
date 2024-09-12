// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataZoneClient, GetFormTypeCommand, CreateFormTypeCommand, CreateAssetTypeCommand, DeleteAssetTypeCommand, DeleteFormTypeCommand, ResourceNotFoundException } from "@aws-sdk/client-datazone";

const client = new DataZoneClient()

export const handler = async(event) => {

  console.log(`event received: ${JSON.stringify({ event }, null, 2)}`)

  const properties = event["ResourceProperties"]
  const domainId = properties["domainId"]
  const projectId = properties["projectId"]
  const formTypes = properties["formTypes"]
  const assetTypeName = properties["assetTypeName"];

  if (["Create", "Update"].includes(event["RequestType"])) {
    const formsInput = {}

    // iterate on creating or updating form types required by the custom asset type
    for (let formType of formTypes) {

      let crFormTypeResp;
      // if the form type has a model, that means we are creating a custom form type
      if(formType.model !== undefined) {
        crFormTypeResp = await client.send(new CreateFormTypeCommand({
          domainIdentifier: domainId,
          name: formType.name,
          model: {
            smithy: formType.model
          },
          owningProjectIdentifier: projectId,
          status: "ENABLED"
        }))

        console.log(`${formType.name} form type created`)

      } else {
        // if there is no model attached, that means we are reusing an existing form type
        // and need to get the latest revision
        crFormTypeResp = await client.send(new GetFormTypeCommand({
          domainIdentifier: domainId,
          formTypeIdentifier: formType.name,
        }))
        console.log(`${formType.name} form type already exists... reusing it`)
      }
      
      const {revision} = crFormTypeResp
      // extract the last part of the formType name
      // mandatory for native formTypes like amazon.datazone.GlueTableFormType
      formsInput[formType.name.split('.').slice(-1)[0]]= {
        typeIdentifier: formType.name,
        typeRevision: revision,
        required: formType.required
      }
    }
    
    const crAssetTypeResp = await client.send(new CreateAssetTypeCommand({
      domainIdentifier: domainId,
      name: assetTypeName,
      description: properties["assetTypeDescription"],
      formsInput,
      owningProjectIdentifier: projectId
    }))

    console.log(`${properties["assetTypeName"]} asset type created`)
    
    return {
      "Data": crAssetTypeResp
    }
  } else if (event["RequestType"] === "Delete") {

    try {
      await client.send(new DeleteAssetTypeCommand({
        domainIdentifier: domainId,
        identifier: assetTypeName
      }))
    } catch (e) {
      if (e instanceof ResourceNotFoundException){
        console.log(`${assetTypeName} asset type doesn't exist`)
      } else throw new Error(`${assetTypeName} failed to delete: ${JSON.stringify(error)}`);
    } 

    console.log(`${assetTypeName} asset type deleted`)

    // cleanup the form types created with the custom asset type
    for (let formType of formTypes) {
      // We only delete form types having models, the others are shared across multiple asset types
      if(formType.model !== undefined) {

        try {
          // disable the form type first
          await client.send(new CreateFormTypeCommand({
            domainIdentifier: domainId,
            name: formType.name,
            model: {
              smithy: formType.model
            },
            owningProjectIdentifier: projectId,
            status: "DISABLED"
          }))

          console.log(`${formType.name} form type disabled`)

          // then delete the form type
          await client.send(new DeleteFormTypeCommand({
            domainIdentifier: domainId,
            formTypeIdentifier: formType.name
          }))

          console.log(`${formType.name} form type deleted`)
        } catch (e) {
          if (e instanceof ResourceNotFoundException){
            console.log(`${formType.name} form type doesn't exist`)
          } else throw new Error(`${formType.name} failed to delete: ${JSON.stringify(error)}`);
        } 
      }
    }    
  }
}