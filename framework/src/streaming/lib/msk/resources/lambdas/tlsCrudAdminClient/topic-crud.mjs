// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

async function parseTopic(topic) {
  const numPartitions = topic.numPartitions ?
  parseInt(topic.numPartitions) : undefined;

  const replicationFactor = topic.replicationFactor ?
    parseInt(topic.replicationFactor) : undefined;

  return {
    topic: topic.topic,
    numPartitions,
    replicationFactor,
    replicaAssignment: topic.replicaAssignment,
    configEntries: topic.configEntries
  }
}

export async function topicCrudOnEvent (event, admin) {
  switch (event.RequestType) {
    case 'Create':
    
      console.log(event.ResourceProperties.topic);
      
      try {
        
        const result = await admin.createTopics({
          validateOnly: false,
          waitForLeaders: event.ResourceProperties.waitForLeaders,
          timeout: event.ResourceProperties.timeout,
          topics: [parseTopic(event.ResourceProperties.topic)],
        });
        
        await admin.disconnect();
        console.log(`Topic created: ${result}`);
        break;
        
      }
      catch (error) {
        await admin.disconnect();
        console.log(`Error creating topic: ${error}`);
        throw new Error(`Error creating topic: ${event.ResourceProperties.topic}. Error ${error}`);
      }
    
    case 'Update':
    
      console.info(event.ResourceProperties.topic);
      
      const oldTopic = parseTopic(event.oldResourceProperties.topic);
      const newTopic = parseTopic(event.ResourceProperties.topic);

      try {
        
        const result = await admin.createPartitions({
          validateOnly: false,
          timeout: event.ResourceProperties.timeout,
          topicPartitions: [{
            topic: newTopic.topic,
            count: newTopic.numPartitions,
            assignments: undefined
          }],
        });
        
        await admin.disconnect();
        console.log(`Topic updated: ${result}`);
        break;
        
      }
      catch (error) {
        await admin.disconnect();
        console.log(`Error updating topic: ${error}`);
        throw new Error(`Error updating topics: ${event.ResourceProperties.topic}. Error ${error}`);
      }
      
    case 'Delete':
        
      console.log(event.ResourceProperties.topic);
      
      try {
        const result = await admin.deleteTopics({
          timeout: event.ResourceProperties.timeout,
          topics: [event.ResourceProperties.topic.topic],
        });
        
        await admin.disconnect();
        console.log(`Topic deleted: ${result}`);
        break;
      }
      catch (error) {
        await admin.disconnect();
        console.log(`Error deleting topic: ${error}`);
        throw new Error(`Error deleting topics: ${topics}. Error ${error}`);
        
      }
      
    default:
    throw new Error(`invalid request type: ${event.RequestType}`);
  }
}