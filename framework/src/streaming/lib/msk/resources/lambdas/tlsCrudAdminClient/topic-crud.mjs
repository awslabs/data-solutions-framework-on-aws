// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export async function topicCrudOnEvent (event, admin) {
  switch (event.RequestType) {
    case 'Create':
    
      console.log(event.ResourceProperties.topic);
      
      try {
        
        const result = await admin.createTopics({
          validateOnly: false,
          waitForLeaders: event.ResourceProperties.waitForLeaders,
          timeout: event.ResourceProperties.timeout,
          topics: [event.ResourceProperties.topic],
        });
        
        await admin.disconnect();
        console.log(`Topic created: ${result}`);
        if ( result == false ) {
          throw new Error(`Error creating topic: ${event.ResourceProperties.topic}`);
        }
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

      if ( newTopic.numPartitions > oldTopic.numPartitions ) {
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
          console.log(`Topic partition count updated: ${result}`);
          break;
          
        }
        catch (error) {
          await admin.disconnect();
          console.log(`Error updating topic number of partitions: ${error}`);
          throw new Error(`Error updating topic number of partitions: ${event.ResourceProperties.topic}. Error ${error}`);
        }
      } else if ( newTopic.numPartitions < oldTopic.numPartitions ) {
        throw new Error(`Error updating topics: number of partitions can't be decreased`);
      }
      
      if (newTopic.replicationFactor > oldTopic.replicationFactor) {
        if (newTopic.replicaAssignment === oldTopic.replicaAssignment) {
          throw new Error(`Error updating topics: replication can only be increased by providing replicas assignment`);
        } else {
          try {
            const result = await admin.alterPartitionReassignments({
              validateOnly: false,
              timeout: event.ResourceProperties.timeout,
              topics: [{
                topic: newTopic.topic,
                partitions: newTopic.replicaAssignment,
              }],
            });
  
            console.log(`Topic replication factor updated: ${result}`);
            break;
          }
          catch (error) {
            await admin.disconnect();
            console.log(`Error updating topic replication factor: ${error}`);
            throw new Error(`Error updating topic replication factor: ${event.ResourceProperties.topic}. Error ${error}`);
          }
        }
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